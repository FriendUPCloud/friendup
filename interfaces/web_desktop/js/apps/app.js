/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

var friendUP = window.friendUP || {};
var api = window.api || {}; // use stuff on this object
var fupLocal = {}; // internals
var Doors = window.Doors || {}; // ???

// add friendUP api
(function()
{
	var scripts = [
		'utils/engine.js',
		'utils/tool.js',
		'io/request.js',
	];
	
	scripts.forEach( addScript );
	function addScript( scriptPath ) {
		var script = document.createElement( 'script' );
		script.type = 'text/javascript';
		script.src = '/webclient/js/' + scriptPath;
		document.head.appendChild( script );
	}
})();

// MessageHandler
// fup component
(function( ns, undefined )
{
	ns.MessageHandler = function( conf )
	{
		if ( !( this instanceof ns.MessageHandler ))
			return new ns.MessageHandler( conf );
		
		var self = this;
		self.onloaded = conf.loaded || null;
		self.onready = conf.ready || null;
		self.messageHandlerMap = {};
	}
	
	ns.MessageHandler.prototype.on = function( event, handler )
	{
		var self = this;
		if ( self.messageHandlerMap[ event ])
			throw new Error( 'api.appView.MessageHandler.on - event already bound', event );
		
		self.messageHandlerMap[ event ] = handler;
	}
	
	ns.MessageHandler.prototype.off = function( event )
	{
		var self = this;
		console.log( 'api.appView.off', event );
		if ( !self.messageHandlerMap[ event ]) {
			//throw new Error( 'api.appView.MessageHandler.off - event not bound', event );
			console.log( 'api.appView.MessageHandler.off - event not bound', event );
			return;
		}
		
		delete self.messageHandlerMap[ event ];
	}
	
	ns.MessageHandler.prototype.allOff = function()
	{
		var self = this;
		self.messageHandlerMap = {};
	}
	
	ns.MessageHandler.prototype.handleMessage = function( msg )
	{
		var self = this;
		console.log( 'handleMessage', msg );
		var handler = self.messageHandlerMap[ msg.type ];
		if ( !handler ) {
			self.unhandledMessage( msg );
			return;
		}
		
		handler( msg.data || {} );
	}
	
	ns.MessageHandler.prototype.unhandledMessage = function( msg )
	{
		var self = this;
		if ( msg.type == 'loaded' && self.onload ) {
			self.onload( msg.data );
			return;
		}
		
		if ( msg.type == 'ready' && self.onready ) {
			self.onready( msg.data );
			return;
		}
		
		console.log( 'api.appView.MessageHandler - no handler for', msg );
	}
	
})( fupLocal );


// View
// an interface for views, new it
(function( ns, undefined )
{
	ns.View = function( conf )
	{
		if ( !( this instanceof ns.View ))
			return new ns.View( conf );
		
		fupLocal.MessageHandler.call( this, conf );
		
		var self = this;
		self.onclose = conf.onclose;
		self.id = conf.id || friendUP.tool.uid( 'view' );
		self.app = window.Application;
		
		self.init( conf );
	}
	
	ns.View.prototype = Object.create( fupLocal.MessageHandler.prototype );
	
	ns.View.prototype.init = function( conf )
	{
		var self = this;
		var callbackId = self.app.setCallback( viewCreate )
		self.app.on( self.id, viewMessage );
		self.app.sendMessage({
			type : 'view',
			windowId : self.id,
			id : callbackId,
			data : conf.windowConf,
		});
		
		function viewCreate( msg )
		{
			if ( msg.data.toUpperCase() !== 'OK' ) {
				console.log( 'app.View.viewCreate - window setup failed', msg );
				self.handleMessage({
					type : 'closed',
					data : msg,
				});
				self.app.removeView( self.id );
				return;
			}
			
			self.app.addView( self );
			
			if ( conf.filepath )
			{
				self.setContentUrl( conf.filepath );
				return;
			}
			if ( conf.content )
			{
				self.setContent( conf.content );
				return;
			}
			
			// neidaså
			console.log( 'view.init.viewCreate - no filepath or content!?', conf );
		}
		
		function viewMessage( msg ) { self.handleMessage( msg ); }
	}
	
	ns.View.prototype.setContent = function( content )
	{
		var self = this;
		console.log( 'app.View.setContent - NYI', content );
	}
	
	ns.View.prototype.setContentUrl = function( filePath )
	{
		var self = this;
		var callbackId = self.app.setCallback( self.emit );
		var msg = {
			method : 'setSandboxedUrl',
			filePath : filePath,
			//callback : callbackId
		};
		self.send( msg );
	}
	
	ns.View.prototype.setMenuItems = function( data )
	{
		var self = this;
		var msg = {
			method : 'setMenuItems',
			data : data,
		};
		self.send( msg );
	}
	
	ns.View.prototype.close = function()
	{
		var self = this;
		console.log( 'App.View.close' );
		var onclose = self.onclose || self.messageHandlerMap[ 'close' ];
		var msg = {
			method : 'close',
		};
		self.send( msg );
		self.app.removeView( self.id );
		self = null;
		
		if ( onclose ) {
			console.log( 'app.view.close - found onclose', onclose );
			onclose( true );
		}
	}
	
	ns.View.prototype.sendMessage = function( msg )
	{
		var self = this;
		var wrap = {
			method : 'sendMessage',
			data : msg
		};
		
		self.send( wrap );
	}
	
	ns.View.prototype.send = function( msg )
	{
		var self = this;
		
		msg.type = 'view';
		msg.windowId = self.id;
		
		self.app.sendMessage( msg );
	}
	
})( api );


// MODULE
(function( ns, undefined )
{
	ns.Module = function( conf )
	{
		var self = this;
		self.success = conf.success;
		self.error = conf.error;
		
		self.id = friendUP.tool.uid;
		self.app = window.Application;
		
		self.init( conf );
	}
	
	ns.Module.prototype.init = function( conf )
	{
		var self = this;
		var callbackId = self.app.setCallback( result );
		var msg = {
			module : conf.module,
			method : conf.method,
			args : conf.args,
			vars : conf.vars,
			fileId : callbackId,
		};
		self.send( msg );
		
		function result( data ) {
			if ( !data )
				self.error();
			else
				self.success( data );
		}
	}
	
	ns.Module.prototype.send = function( msg )
	{
		var self = this;
		msg.type = 'module';
		self.app.sendMessage( msg );
	}
})( api );


// AppEvent
// part of Application, handles messages from the desktop environment
(function( ns, undefined )
{
	ns.AppEvent = function()
	{
		if ( !( this instanceof ns.AppEvent ))
			return new ns.AppEvent( app );
		
		var self = this;
		self.subscriber = {};
		self.commandMap = null;
		
		self.initAppEvent();
	}
	
	ns.AppEvent.prototype.initAppEvent = function()
	{
		var self = this;
		self.commandMap = {
			'door' : door,
			'fileload' : fileload,
			'initappframe' : initialize,
			'notify' : notify,
			'register' : register,
			'viewresponse' : viewResponse,
			'dormantmaster' : dormantMaster,
			'applicationstorage' : storage,
			'quit' : quit,
		};
		
		function door( e ) { self.receiveMessage( e ); }
		function fileload( e ) { self.fileLoad( e ); }
		function initialize( e ) { self.initialize( e ); }
		function notify( e ) { self.notify( e ); }
		function register( e ) { self.register( e ); }
		function viewResponse( e ) { self.viewResponse( e ); }
		function dormantMaster( e ) { self.dormantMaster( e ); }
		function storage( e ) { self.storage( e ); }
		function quit( e ) { console.log( 'quit?', e ); }
		
		self.notifyMap = {
			'closeview' : closeView,
		}
		
		function closeView( msg ) { self.closeView( msg ); }
		
		window.addEventListener( 'message', receiveEvent, false );
		function receiveEvent( e ) { self.receiveEvent( e ); }
	}
	
	ns.AppEvent.prototype.receiveEvent = function( e )
	{
		var self = this;
		var msg = friendUP.tool.parse( e.data );
		msg.origin = e.origin;
		
		if ( !msg.command ) {
			self.appMessage( msg );
			return;
		}
		
		var handler = self.commandMap[ msg.command ];
		if ( !handler ) {
			console.log( 'Application.event - unknown command', msg );
			self.appMessage( msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.AppEvent.prototype.appMessage = function( msg )
	{
		var self = this;
		var handler = self.subscriber[ msg.command || msg.callback || msg.windowId ];
		
		if ( !handler ) {
			console.log( 'app.AppEvent.appMessage - no handler for', msg );
			return;
		}
		
		handler( msg.data );
	}
	
	ns.AppEvent.prototype.fileLoad = function( msg )
	{
		var self = this;
		var handler = self.getCallback( msg.fileId );
		
		if ( !handler ) {
			console.log( 'appEvent.fileLoad - no handler for event, passing to receiveMessage ', msg );
			self.receiveMessage( msg );
			return;
		}
		
		handler( msg.data || null );
	}
	
	ns.AppEvent.prototype.viewResponse = function( msg )
	{
		var self = this;
		var handler = self.getCallback( msg.windowId );
		
		if ( !handler ) {
			console.log( 'appEvent.viewResponse - no handler for event, passing to receiveMessage', msg );
			self.receiveMessage( msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.AppEvent.prototype.dormantMaster = function( msg )
	{
		var self = this;
		console.log( 'app.js - dormantmaster event', msg );
	}
	
	ns.AppEvent.prototype.storage = function( msg )
	{
		var self = this;
		console.log( 'app.storage event', msg );
		var callback = self.getCallback( msg.callbackId );
		if ( !callback )
			console.log( 'storage - no callback found for', msg );
		
		callback( msg.data );
	}
	
	ns.AppEvent.prototype.register = function( msg )
	{
		var self = this;
		window.origin = msg.origin;
		self.domain = msg.domain;
		self.filePath = msg.filePath;
		self.id = msg.applicationId;
		self.userId = msg.userId;
		self.authId = msg.authId;
		
		self.registered( msg );
		self.initialize( msg );
	}
	
	ns.AppEvent.prototype.registered = function( data )
	{
		var self = this;
		var msg = {
			type : 'notify',
			data : 'registered',
			registerCallback : data.registerCallback,
		};
		self.sendMessage( msg );
	}
	
	ns.AppEvent.prototype.notify = function( msg )
	{
		var self = this;
		var handler = self.notifyMap[ msg.method ];
		
		if ( !handler ) {
			console.log( 'app.AppEvent.notify - no handler for ', msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.AppEvent.prototype.closeView = function( msg )
	{
		var self = this;
		var view = self.getView( msg.windowId );
		if ( !view )
			return;
		
		view.close();
	}
	
	ns.AppEvent.prototype.initialize = function( msg )
	{
		var self = this;
		setBase( msg.base || msg.domain );
		self.run( msg );
		
		function setBase( basePath )
		{
			var base = document.createElement( 'base' );
			base.href = basePath;
			document.head.appendChild( base );
		}
	}
	
	ns.AppEvent.prototype.on = function( event, handler )
	{
		var self = this;
		self.subscriber[ event ] = handler;
	}
	
	ns.AppEvent.prototype.off = function( event )
	{
		var self = this;
		if ( self.subscriber[ event ])
			delete self.subscriber[ event ];
	}
	
})( fupLocal );


// Application
(function( ns, undefined )
{
	ns.Application = function()
	{
		if ( !( this instanceof ns.Application ))
			return new ns.Application();
		
		fupLocal.AppEvent.call( this );
		
		var self = this;
		self.id = null; // set by register event
		self.userId = null; // ^^^
		self.authId = null; // ^^^
		self.callback = {};
		self.views = {};
		
	}
	
	ns.Application.prototype = Object.create( fupLocal.AppEvent.prototype );
	
	ns.Application.prototype.createView = function( conf ) {
		var self = this;
		var view = new api.View( conf );
		return view;
	}
	
	ns.Application.prototype.loadFile = function( path, loadCallback, vars ) {
		var self = this;
		if ( !path || !loadCallback ) {
			console.log( 'Application.loadFile: invalid arguments',
				{ path : path, callback : loadCallback });
			return;
		}
		
		var fid = self.setCallback( loadCallback );
		self.sendMessage({
			type : 'file',
			method : 'load',
			data : { path: path },
			filePath: self.filePath,
			vars : vars || [],
			fileId : fid,
		});
	}
	
	ns.Application.prototype.executeModule = function()
	{
		var self = this;
		console.log( 'Application.executeModule - NYI' );
	}
	
	ns.Application.prototype.sendMessage = function( msg, callback )
	{
		var self = this;
		msg.applicationId = self.id;
		msg.authId = self.authId;
		msg.userId = self.userId;
		
		if ( callback ) {
			var callbackId = self.setCallback( callback );
			msg.callback = callbackId;
		}
		
		var msgString = friendUP.tool.stringify( msg );
		window.parent.postMessage( msgString, window.origin || '*' );
	}
	
	// close all views, does not quit the application
	ns.Application.prototype.close = function()
	{
		var self = this;
		var viewIds = Object.keys( self.views );
		viewIds.forEach( callClose );
		function callClose( viewId ) {
			var view = self.views[ viewId ];
			if ( !view || !view.close )
				return;
				
			view.close();
		}
	}
	
	ns.Application.prototype.quit = function()
	{
		var self = this;
		self.close();
		self.sendMessage({
			type : 'system',
			command : 'quit',
			force : 'true',
		});
	}
	
	ns.Application.prototype.addView = function( view )
	{
		var self = this;
		self.views[ view.id ] = view;
	}
	
	ns.Application.prototype.getView = function( viewId )
	{
		var self = this;
		return self.views[ viewId ] || false;
	}
	
	ns.Application.prototype.removeView = function( viewId )
	{
		var self = this;
		var view = self.views[ viewId ];
		if ( !view )
			return;
		
		delete self.views[ viewId ];
	}
	
	ns.Application.prototype.receiveMessage = function( e )
	{
		var self = this;
		console.log( 'Application.receiveMessage - reimplement this one to receive messages in your application', e );
	}
	
	
	
	ns.Application.prototype.setCallback = function( callback )
	{
		var self = this;
		var id = friendUP.tool.uid();
		self.callback[ id ] = callback;
		
		return id;
	}
	
	ns.Application.prototype.getCallback = function( id )
	{
		var self = this;
		var callback = self.callback[ id ];
		
		if ( !callback )
			return null;
		
		delete self.callback[ id ];
		return callback;
	}
	
})( fupLocal );

window.Application = new fupLocal.Application();


// Storage
(function( ns, undefined )
{
	ns.ApplicationStorage = {
		app : window.Application,
	};
	var self = ns.ApplicationStorage;
	
	ns.ApplicationStorage.setItem = function( id, data, callback )
	{
		var bundle = {
			id : id,
			data : data,
		};
		var msg = {
			method : 'set',
			data : bundle,
		};
		self.send( msg, callback );
	};
	
	ns.ApplicationStorage.getItem = function( id, callback )
	{
		var msg = {
			method : 'get',
			data : {
				id : id,
			},
			
		};
		self.send( msg, callback );
	};
	
	ns.ApplicationStorage.removeItem = function( id, callback )
	{
		var msg = {
			method : 'remove',
			data : {
				id : id,
			},
		};
		self.send( msg, callback );
	}
	
	ns.ApplicationStorage.send = function( msg, callback )
	{
		if ( callback ) {
			var callbackId = self.app.setCallback( callback );
			msg.callbackId = callbackId;
		};
		
		msg.type = 'applicationstorage';
		self.app.sendMessage( msg );
	};
	
})( api );


// TODO : make singleton and set it on api ( like api.Storage )
// DormantMaster
(function( ns, undefined )
{
	ns.DormantMaster = function() {
		var self = this;
		self.doors = {},
		self.doorIds = [],
		self.app = window.Application,
		self.methodMap = {
			'getdirectory' : getDirectory,
			'updatetitle' : updateTitle,
			'execute' : execute,
			'callback' : callback,
		};
		
		function getDirectory( e ) { self.handleGetDirectory( e ); }
		function updateTitle( e ) { self.handleUpdateTitle( e ); }
		function execute( e ) { self.handleExecute( e ); }
		function callback( e ) { self.handleCallback( e ); }
	}
	
	ns.DormantMaster.prototype.addAppDoor = function( dormantDoor )
	{
		var self = this;
		var doorId = self.setDoor( dormantDoor );
		var msg = {
			method : 'addAppDoor',
			title : dormantDoor.title,
			doorId : doorId,
		};
		self.send( msg );
	}
	
	ns.DormantMaster.prototype.setupProxyDoor = function( info )
	{
		var self = this;
	}
	
	ns.DormantMaster.prototype.getDoors = function( callback )
	{
		var self = this;
		var callbackId = self.app.setCallback( whatever );
		self.send({
			method : 'getDoors',
			callbackId : callbackId,
		});
		
		function whatever( msg )
		{
			console.log( 'getDoors.whatever', msg );
			for ( var infoKey in msg )
				self.setupProxyDoor( msg[ infoKey ] );
			if ( callback )
				callback( msg );
		}
	}
	
	ns.DormantMaster.prototype.handleMessage = function( msg )
	{
		var self = this;
		console.log( 'DormantMaster.handleMessage', msg );
		var handler = self.methodMap[ msg.method ];
		if ( !handler ) {
			console.log( 'DormantMaster.handleMessage - no handler for', msg );
			return;
		}
		
		handler( msg );
	}
	
	ns.DormantMaster.prototype.handleGetDirectory = function( msg )
	{
		var self = this;
		console.log( 'handleGetDirectory', msg );
	}
	
	ns.DormantMaster.prototype.handleUpdateTitle = function( msg )
	{
		var self = this;
		console.log( 'handleUpdateTitle', msg );
	}
	
	ns.DormantMaster.prototype.handleExecute = function( msg )
	{
		var self = this;
		console.log( 'handleExecute', msg );
	}
	
	ns.DormantMaster.prototype.handleCallback = function( msg )
	{
		var self = this;
		console.log( 'handleCallback' );
	}
	
	ns.DormantMaster.prototype.setDoor = function( doorObj )
	{
		var self = this;
		console.log( 'setDoor', doorObj );
		var doorId = friendUP.tool.uid( 'door' );
		doorObj.uniqueId = doorId;
		self.doors[ doorId ] = doorObj;
		return doorId;
	}
	
	ns.DormantMaster.prototype.getDoor = function( doorId )
	{
		var self = this;
		console.log( 'getDoor', doorId );
		return self.doors[ doorId ];
	}
	
	ns.DormantMaster.prototype.removeDoor = function( doorId )
	{
		var self = this;
		if ( self.doors[ doorId ])
			delete self.doors[ doorId ];
	}
	
	ns.DormantMaster.prototype.send = function( data )
	{
		var self = this;
		msg.type = 'dormantmaster';
		self.app.sendMessage( msg );
	}
	
})( fupLocal );

window.DormantMaster = new fupLocal.DormantMaster();
