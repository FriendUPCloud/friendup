/*©agpl*************************************************************************
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



