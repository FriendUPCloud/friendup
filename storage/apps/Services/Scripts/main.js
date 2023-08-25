/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

document.title = 'Services main';

var lib = window.lib || {};
lib.system = lib.system || {};

// SERVICES
( function( ns, undefined )
{
	ns.Services = function( fupConf )
	{
		if ( !( this instanceof ns.Services ))
			return new ns.Services( fupConf );
		
		var self = this;
		self.fupConf = fupConf;
		self.pathBase = 'system.library/services/';
		
		self.views = {};
		
		self.init();
	}
	
	ns.Services.prototype.get = function()
	{
		var self = this;
		var msg = {
			path : self.pathBase + 'list',
		};
		self.fconn.request( msg, listBack );
		function listBack( res ) {
			console.log( 'services.get - listBack', res );
			self.mainView.send({
				type : 'populate',
				data : res,
			});
		}
	}
	
	ns.Services.prototype.start = function( id )
	{
		var self = this;
		var msg = {
			path : self.pathBase + id + '/start',
		};
		self.fconn.send( msg );
	}
	
	ns.Services.prototype.stop = function( id )
	{
		var self = this;
		var msg = {
			path : self.pathBase + id + '/stop',
		};
		self.fconn.send( msg );
	}
	
	ns.Services.prototype.command = function( id, cmdStr, hosts )
	{
		var self = this;
		var msg = {
			path : self.pathBase + id + '/command',
			data : {
				cmd : cmdStr,
				Hosts : hosts,
			},
		};
		self.fconn.send( msg );
	}
	
	// implementation
	ns.Services.prototype.init = function()
	{
		var self = this;
		window.Application.receiveMessage = function( e ) { self.receiveMessage( e ); }
		self.fconn = new window.FConn();
		self.openMainView();
		self.get();
	}
	
	ns.Services.prototype.receiveMessage = function( msg )
	{
		var self = this;
		if ( msg.checkDefaultMethod )
			return;
		
		if ( msg.robotUnicorns ) {
			self.handleInternal( msg );
			return;
		}
		
		console.log( 'Services.receiveMessage - unhandled', msg );
	}
	
	ns.Services.prototype.handleInternal = function( msg )
	{
		var self = this;
		var event = msg.data;
		console.log( 'handleInternal', msg );
		var handler = self.views[ msg.viewId ];
		if ( handler ) {
			handler( event );
			return;
		}
		
		if ( 'loaded' === event.type ) {
			var view = self.views[ event.data.id ];
			self.views[ event.data.viewId ] = rcvMsg;
			console.log( 'loaded', { e : event, v : view });
			view.loaded();
			
			function rcvMsg( msg ) {
				view.receiveMessage( msg );
			}
			return;
		}
	}
	
	ns.Services.prototype.openMainView = function()
	{
		var self = this;
		var conf = {
			onclose : mainClosed,
		};
		self.mainView = new lib.system.MainView( conf );
		self.views[ 'mainView' ] = self.mainView;
		function mainClosed() {
			console.log( 'mainclosed' );
			self.mainView = null;
			self.quit();
		}
	}
	
	ns.Services.prototype.send = function( msg ) {
		var self = this;
		msg.authId = Application.authId;
		self.fconn.send
	}
	
	ns.Services.prototype.quit = function() {
		var self = this;
		self.fconn.close();
		Application.quit();
	}
	
})( lib.system );

// MainView
(function( ns, undefined )
{
	ns.MainView = function( conf )
	{
		if ( !( this instanceof ns.MainView ))
			return new ns.MainView( conf );
		
		var self = this;
		self.onstart = conf.onstart;
		self.onstop = conf.onstop;
		self.onclose = conf.onclose;
		self.ready = false;
		self.msgQueue = [];
		self.init();
	}
	
	ns.MainView.prototype.init = function()
	{
		var self = this;
		var conf = {
			title : 'Services',
			width : 500,
			height : 400,
		}
		self.view = new View( conf );
		self.view.setRichContentUrl( '/webclient/apps/Services/Templates/main.html' );
		self.view.onClose = closed;
		function closed() {
			self.view = null;
			self.onclose();
		}
		
		self.viewEvents = {
			start : start,
			stop : stop,
			command : command,
		};
		
		function start( e ) { self.handleStart( e ); }
		function stop( e ) { self.handleStop( e ); }
		function command( e ) { self.handleCommand( e ); }
	}
	
	ns.MainView.prototype.handleStart = function( msg )
	{
		var self = this;
		console.log( 'handleStart', msg );
		services.start( msg );
	}
	
	ns.MainView.prototype.handleStop = function( msg )
	{
		var self = this;
		console.log( 'handleStop', msg );
		services.stop( msg );
	}
	
	ns.MainView.prototype.handleCommand = function( msg )
	{
		var self = this;
		console.log( 'handleCommand', msg );
		services.command( msg.id, msg.cmd, msg.hosts );
	}
	
	ns.MainView.prototype.loaded = function() {
		var self = this;
		self.ready = true;
		self.msgQueue.forEach( send );
		function send( msg ) {
			self.send( msg );
		}
	}
	
	ns.MainView.prototype.send = function( msg )
	{
		var self = this;
		if ( !self.ready ) {
			self.msgQueue.push( msg );
			return;
		}
		
		console.log( 'mainView.send', msg );
		var wrap = {
			robotUnicorns : 'viewMessage',
			data : msg,
		};
		self.view.sendMessage( wrap );
	}
	
	ns.MainView.prototype.receiveMessage = function( msg )
	{
		var self = this;
		console.log( 'mainView.receiveMessage', msg );
		var handler = self.viewEvents[ msg.type ];
		if ( !handler ) {
			console.log( 'app.mainView - no handler for', msg );
			return;
		}
		
		handler( msg.data );
	}
	
})( lib.system );


// Launch application here -----------------------------------------------------
/*
Application.run = function( msg )
{
	var w = new View( {
		title:  'Services',
		width:  500,
		height: 400,
		id:     'mainWindow'
	} );
	
	this.mainView = w;
	
	w.onClose = function() { Application.quit(); }
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			// load entries
			var l = new Library( 'system.library' );
			l.onExecuted = function( data )
			{
				w.sendMessage( {
					command: 'setserviceslist',
					data: data
				} );
			}
			l.execute( 'services', 'list' );
		} );
	}
	f.load();
}
*/

Application.run = fun;
function fun( conf )
{
	console.log( 'application.fun' );
	window.services = new lib.system.Services( conf );
}


// Receive messages from Doors -------------------------------------------------
Application.rM = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'start':
			console.log( 'start service: ' + msg.id );
			// Opening a call to Friend Core
			/*
			var start = {
				path : 'system.library/services/start',
				data : {
					serviceName : msg.id,
					status : 'start',
				},
			};
			window.Conn.send( start );
			*/
			
			var jax = new cAjax ();
			jax.open( 'post', 'system.library/services/start', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.addVar( 'status', 'start' );
			jax.send ();
			
			break;
		
		case 'stop':
			console.log( 'stop service: ' + msg.id );
			// Opening a call to Friend Core
			var jax = new cAjax ();
			jax.open ( 'post', 'system.library/services/stop', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.addVar( 'status', 'stop' );
			jax.send ();
			break;
		
		case 'executeCommand':
			// get service custom GUI
			var jax = new cAjax ();
			jax.open ( 'post', 'system.library/services/runcommand', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.onload = function( lmdata )
			{
				console.log('Run command: ' + lmdata );
			} ;
			jax.send ();
			break;
			
		case 'test':
			this.mainView.setContentById( 'Testing', '<button type="button" onclick="doIt(); Application.sendMessage( { command: \'remove\' } )">Hello</button>' );
			console.log( 'Testing, eh?' );
			break;
		case 'remove':
			this.mainView.setContentById( 'Testing', '' );
			break;
	}
}

