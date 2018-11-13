/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = window.friendUP || {};

if ( window.ApplicationStorage )
	throw new Error( 'window.ApplicationStorage is already defined' );

var lib = {}; // temp obj
(function( ns, undefined ) {
	ns.ApplicationStorage = function()
	{
		var self = this;
		self.init();
	}
	
	ns.ApplicationStorage.prototype.init = function()
	{
		var self = this;
		self.methodMap = {
			'set' : setItem,
			'get' : getItem,
			'remove' : removeItem,
		};
		
		//console.log( '--- localStorage ---' );
		//console.log( window.localStorage );
		
		function setItem( msg, app ) { self.setItem( msg, app ); }
		function getItem( msg, app ) { self.getItem( msg, app ); }
		function removeItem( msg, app ) { self.removeItem( msg, app ); }
	}
	
	ns.ApplicationStorage.prototype.receiveMsg = function( msg, app )
	{
		var self = this;
		var handler = self.methodMap[ msg.method ];
		if ( !handler ) {
			msg.data.success = false;
			msg.data.message = 'no such handler';
			self.send( msg, app );
			return;
		}
		
		var success = self.checkId( msg );
		if ( !success )
			return;
		
		handler( msg, app );
	}
	
	ns.ApplicationStorage.prototype.setItem = function( msg, app )
	{
		var self = this;
		var bundle = msg.data;
		var appData = self.load( app );
		appData[ bundle.id ] = bundle.data;
		var success = self.save( appData, app );
		bundle.success = success;
		self.send( msg, app );
	}
	
	ns.ApplicationStorage.prototype.getItem = function( msg, app )
	{
		var self = this;
		var bundle = msg.data;
		var appData = self.load( app );
		var data = appData[ bundle.id ];
		bundle.data = data;
		self.send( msg, app );
	}
	
	ns.ApplicationStorage.prototype.removeItem = function( msg, app )
	{
		var self = this;
		var bundle = msg.data;
		var id = bundle.id;
		var appData = self.load( app );
		delete appData[ id ];
		var success = self.save( appData, app );
		bundle.success = success;
		self.send( msg, app );
	}
	
	ns.ApplicationStorage.prototype.send = function( msg, app )
	{
		var self = this;
		msg.command = 'applicationstorage';
		app.contentWindow.postMessage( msg, '*' );
	}
	
	ns.ApplicationStorage.prototype.load = function( app )
	{
		var self = this;
		var appName = app.applicationName;
		var appData = window.localStorage.getItem( appName );
		appData = friendUP.tool.parse( appData );
		if ( !appData )
			appData = {};
		
		return appData;
	}
	
	ns.ApplicationStorage.prototype.save = function( appData, app )
	{
		var self = this;
		var appName = app.applicationName;
		var appData = friendUP.tool.stringify( appData );
		if ( !appData )
			return false;
		
		window.localStorage.setItem( appName, appData );
		return true;
	}
	
	ns.ApplicationStorage.prototype.checkId = function( msg )
	{
		var self = this;
		var bundle = msg.data;
		if ( !bundle.id ) {
			returnError();
			return false;
		}
		
		var cleanId = bundle.id.toString().trim();
		if ( cleanId !== bundle.id ) {
			returnError();
			return false;
		}
		
		return true;
		
		function returnError() {
			console.log( 'applicationstorage - invalid msg', msg );
			bundle.success = false;
			bundle.message = 'invalid id';
			bundle.cleanId = cleanId || null;
			self.send( msg, app );
		}
	}
	
})( lib );

window.ApplicationStorage = new lib.ApplicationStorage();
