/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
console.log( 'sysdiag.js' );

var lib = window.lib || {};
lib.system = lib.system || {};

// Info
( function( ns, undefined )
{
	ns.Info = function( fupConf )
	{
		if ( !( this instanceof ns.Info ))
			return new ns.Info( fupConf );
		
		var self = this;
		self.fupConf = fupConf;
		self.pathBase = 'system.library/admin/';
		
		self.views = {};
		
		self.init();
	}
	
	ns.Info.prototype.getInfo = function()
	{
		var self = this;
		var msg = {
			path : self.pathBase + 'info',
		};
		self.fconn.request( msg, listBack );
		function listBack( res ) {
			console.log( 'information.get - listBack', res );
			self.mainView.sendMessage({
				notType : 'populate',
				data : res,
			});
		}
	}
	
	// implementation
	ns.Info.prototype.init = function()
	{
		var self = this;
		// open main view
		self.openMainView();
		
		// register for application events
		window.Application.receiveMessage = function( e ) { self.receiveMessage( e ); }
		
		// connect to FC over ws
		self.fconn = new window.FConn();
		console.log( 'Friend.conn', {
			fc : Friend.conn,
			sc : self.fconn
		});
		
		// lets get
		self.getInfo();
	}
	
	ns.Info.prototype.receiveMessage = function( msg )
	{
		var self = this;
		if ( msg.checkDefaultMethod )
			return;
		
		if ( msg.robotUnicorns ) {
			self.handleInternal( msg );
			return;
		}
		
		console.log( 'SysDiag.receiveMessage - unhandled', msg );
	}
	
	ns.Info.prototype.handleInternal = function( msg )
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
	
	ns.Info.prototype.openMainView = function()
	{
		var self = this;
		// load html for view
		console.log( 'openMainView' );
		self.mainView = new View({
			title : 'SysDiag',
			width : 400,
			height : 300,
		});
		
		self.mainView.onClose = function() { Application.quit(); }
		
		var html = new File( 'Progdir:Templates/main.html' );
		html.onLoad = setupMainView;
		html.load();
		function setupMainView( data ) {
			console.log( 'sysdiag.fileBack', data );
			self.mainView.setContent( data, doneBack );
			function doneBack( res ) {
				console.log( 'mainview setup back', res );
			}
		}
	}
	
	ns.Info.prototype.send = function( msg ) {
		var self = this;
		return;
		
		// ???
		msg.authId = Application.authId;
		self.fconn.send( msg );
	}
	
	ns.Info.prototype.quit = function() {
		var self = this;
		self.fconn.close();
		Application.quit();
	}
	
})( lib.system );

Application.run = fun;
function fun( conf )
{
	console.log( 'application.Sysdiag' );
	window.info = new lib.system.Info( conf );
}



