/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
Manages PouchDB instances
*/

PouchManager = function()
{
	var self = this;
	self.init();
}

// Public

PouchManager.prototype.handle = function( event, app )
{
	var self = this;
	var authId = !!app ? app.authId : 'workspace';
	console.log( 'PouchManager.handle', {
		event  : event,
		app    : app,
		authid : authId,
	});
	var handler = self.eventMap[ event.type ];
	if ( !handler )
	{
		console.log( 'PouchManager - no handler found for', event );
		return;
	}
	
	handler( event.data, app );
	
}

// Private

PouchManager.prototype.init = function()
{
	var self = this;
	if ( !window.PouchDB )
		throw new Error( 'PouchManager.init - PouchDB not found' );
	
	self.eventMap = {
		'init'      : initNew,
		'close'     : closeDb,
		'replicate' : replicate,
		'crud'      : handleCrud,
	}
	
	function initNew( d, a ) { self.initNewInstance( d, a ); }
	function closeDb( d, a ) { }
	function replicate( d, a ) { self.setupReplication( d, a ); }
	function handleCrud( d, a ) { self.handleCrud( d, a ); }
	
	self.crudMap = {
		'create' : insertItem,
		'read'   : getItem,
		'update' : updateItem,
		'delete' : deleteItem,
	};
	
	function insertItem( data, db, callback ) { self.dbInsertItem( data, db, callback ); }
	function getItem( data, db, callback ) { self.dbGetItem( data, db, callback ); }
	function updateItem( data, db, callback ) { self.dbUpdateItem( data, db, callback ); }
	function deleteItem( data, db, callback ) { self.dbDeleteItem( data, db, callback ); }
	
}

PouchManager.prototype.initNewInstance = function( data, app )
{
	var self = this;
	console.log( 'PouchManager.initNewInstance', {
		data : data,
		app : app,
		pdb : window.PouchDB });
	
	app.pouches = app.pouches || {};
	var conf = data.options;
	var dbName = conf.dbName;
	var id = self.buildId( dbName, app );
	var exists = !!app.pouches[ id ];
	if ( exists ) {
		var err = 'DB already initialized: ' + dbName;
		self.returnError( err, data.cid, app );
		return;
	}
	
	try {
		var pouch = new PouchDB( dbName );
	} catch ( e ) {
		var err = 'Bad things happended while creating PouchDB instance: ' + e;
		self.returnError( err, data.cid, app );
		return;
	}
	
	app.pouches[ id ] = pouch;
	if ( conf.replicationTargets ) {
		var repConf = {
			dbName : dbName,
			data : conf.replicationTargets,
		};
		self.setupReplication( repConf, app );
	}
	
	var msg = {
		success : true,
		data : {
			foo     : 'bar',
			message : 'initalized db: ' + dbName,
			dbName  : dbName,
		},
	};
	self.send( msg, data.cid, app );
}

PouchManager.prototype.setupReplication = function( event, app )
{
	var self = this;
	var db = self.getInstance( event.dbName, app );
	console.log( 'setupReplication', {
		event : event,
		app : app,
		db : db,
	});
	
	var targets = event.data;
	targets.forEach( setRepl );
	function setRepl( item )
	{
		console.log( 'setupReplication - set', item );
		if ( !item.target && !item.source )
			return;
		
		var rep = null;
		if ( !item.target )
			rep = db.replicate.from( item.source, item.options )
		
		if ( !item.source )
			rep = db.replicate.to( item.target, item.options );
		
		console.log( 'rep', rep );
		if ( !rep )
			return;
		
		rep.on( 'change', change );
		rep.on( 'complete', complete );
		rep.on( 'paused', paused );
		rep.on( 'denied', denied );
		rep.on( 'error', error );
		
		function change( e ) { console.log( 'rep.change', e ); }
		function complete( e ) { console.log( 'rep.complete', e ); }
		function paused( e ) { console.log( 'rep.paused', e ); }
		function denied( e ) { console.log( 'rep.denied', e ); }
		function error( e ) { console.log( 'rep.error', e ); }
	}
	
}

PouchManager.prototype.handleCrud = function( event, app )
{
	var self = this;
	console.log( 'handleCrud', {
		event : event,
		app : app,
	});
	if ( !app.pouches )
	{
		var err = 'No db pouch found on app ( no db initialized, or bad things )';
		self.returnError( err, event.cid, app );
		return;
	}
	
	var db = self.getInstance( event.dbName, app );
	if ( !db )
	{
		var err = 'No db found for: ' + event.dbName;
		self.returnError( err, event.cid, app );
		return;
	}
	
	var op = event.data;
	var handler = self.crudMap[ op.type ];
	if ( !handler )
	{
		var err = 'no crud handler for: ' + op.type;
		self.returnError( err, event.cid, app );
		return;
	}
	
	handler( op.data, db, crudBack );
	function crudBack( err, res ) {
		console.log( 'crudBack', {
			err : err,
			res : res,
		});
		var msg = {
			res : res,
			err : err,
		};
		self.send( msg, event.cid, app );
	}
}

PouchManager.prototype.dbInsertItem = function( data, db, callback )
{
	var self = this;
	console.log( 'PouchManager.dbInsertItem', {
		data : data,
		db : db,
		cb : callback,
	});
	
	if ( data[ '_id' ])
		db.put( data, callback );
	else
		db.post( data, callback );
}

PouchManager.prototype.dbGetItem = function( data, db, callback )
{
	var self = this;
	console.log( 'PouchManager.dbGetItem', {
		data : data,
		db : db,
	});
	if ( !!data.id )
		db.get( data.id, callback );
	else
		db.allDocs( callback );
}

PouchManager.prototype.dbUpdateItem = function( data, db, callback )
{
	var self = this;
	console.log( 'PouchManager.dbUpdateItem', {
		data : data,
		db : db,
	});
}

PouchManager.prototype.dbDeleteItem = function( data, db, callback )
{
	var self = this;
	console.log( 'PouchManager.dbDeleteItem', {
		data : data,
		db : db,
	});
}

PouchManager.prototype.getInstance = function( dbName, app ) {
	var self = this;
	if ( !app.pouches ) {
		console.log( 'getInstance - no pouches' );
		return null;
	}
	
	var id = self.buildId( dbName, app );
	var pouch = app.pouches[ id ];
	console.log( 'getInstance', {
		id : id,
		pouch : pouch,
	});
	return pouch || null;
}

PouchManager.prototype.buildId = function( dbName, app )
{
	var self = this;
	var id = 'pdb_' + app.authId + '_' + dbName;
	return id;
}

PouchManager.prototype.returnError = function( err, cid, app ) {
	var self = this;
	var msg = {
		success      : false,
		errorMessage : err,
	};
	console.log( 'PouchManager.initNew - returning error', msg );
	self.send( msg, cid, app );
}

PouchManager.prototype.send = function( msg, cid, app )
{
	var self = this;
	if ( !app.contentWindow || !app.contentWindow.postMessage )
		return;
	
	var wrap = {
		callback : cid,
		data : msg,
	};
	console.log( 'PouchManager.send', msg );
	app.contentWindow.postMessage( wrap, '*' );
}