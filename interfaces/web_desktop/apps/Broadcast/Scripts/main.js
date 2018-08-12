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

document.title = 'Broadcast main';

var lib = window.lib || {};
lib.views = lib.views || {};
lib.system = lib.system || {};

( function( ns, undefined )
{
	ns.Broadcast = function( fupConf )
	{
		if ( !( this instanceof ns.Broadcast ))
			return new ns.Broadcast( fupConf );
		
		console.log( 'Broadcast', fupConf );
		
		var self = this;
		self.fupConf = fupConf;
		self.username = fupConf.username;
		self.isHost = false;
		self.views = {};
		self.appEvents = {};
		self.users = {};
		
		self.init();
	}
	
	// implementation
	ns.Broadcast.prototype.init = function()
	{
		var self = this;
		window.Application.receiveMessage = function( e ) { self.receiveMessage( e ); }
		
		self.mainEvents = {
			'notie'   : sendNotification,
			'message' : sendChatMessage,
			'remove'  : doRemove,
		};
		
		function sendNotification( e ) { self.sendNotification( e ); }
		function sendChatMessage( e ) { self.sendChatMessage( e ); }
		function doRemove( e ) { self.removeUser( e ); }
		
		self.connectEvents = {
			'invite'       : sendInvite,
			'user-refresh' : refreshUsers,
		};
		
		function sendInvite( e ) { self.sendInvite( e ); }
		function refreshUsers( e ) { self.refreshUserList( e ); }
		
		self.conn = new FConn();
		
		self.initAssid();
		self.openMainView();
		self.setMenu();
	}
	
	ns.Broadcast.prototype.initAssid = function()
	{
		var self = this;
		var sasid = null;
		if ( self.fupConf.args && self.fupConf.args.sasid )
			sasid = self.fupConf.args.sasid;
		else
			self.isHost = true;
		
		var conf = {
			sasid   : sasid,
			onevent : sasHandler,
		};
		self.sas = new SAS( conf, readyBack );
		function readyBack( res ) {
			console.log( 'sasid readyBack', res );
			self.setSelf();
			if ( res.host )
				self.setHost( res.host );
			
			if ( self.isHost )
				self.bindAssHost();
			else
				self.bindAssClient();
			
			self.bindAssCommon();
		}
		
		function sasHandler( e ) {
			console.log( 'sasHandler', e );
		}
	}
	
	ns.Broadcast.prototype.bindAssHost = function()
	{
		var self = this;
		self.sas.on( 'client-accept', clientAccept );
		self.sas.on( 'client-decline', clientDecline );
		self.sas.on( 'client-close', clientClosed );
		self.sas.on( 'message', clientMessage );
		
		function clientAccept( e, i ) { self.clientAccepted( e, i ); }
		function clientDecline( e, i ) { self.clientDeclined( e , i ); }
		function clientClosed( e, i ) { self.clientClosed( e, i ); }
		function clientMessage( e, i ) { self.clientMessage( e, i ); }
	}
	
	ns.Broadcast.prototype.clientAccepted = function( event, identity )
	{
		var self = this;
		console.log( 'clientAccepted', {
			e : event,
			i : identity,
		});
		identity.isActive = true;
		var addUser = {
			type : 'user-add',
			data : identity,
		}
		
		self.users[ identity.username  ] = identity;
		self.sas.send( addUser );
		self.mainView.updateUser( identity );
		self.updateUser( identity.username );
	}
	
	ns.Broadcast.prototype.clientDeclined = function( event, identity )
	{
		var self = this;
		console.log( 'clientDeclined', {
			e : event,
			i : identity,
		});
		self.mainView.removeUser( identity.username );
	}
	
	ns.Broadcast.prototype.clientClosed = function( event, identity ) {
		var self = this;
		console.log( 'clientClosed', {
			e : event,
			i : identity,
		});
		var rem = {
			type : 'user-remove',
			data : identity,
		};
		
		delete self.users[ identity.username ];
		self.mainView.removeUser( identity.username );
		self.sas.send( rem );
		self.getAssUserlist( usersBack );
		function usersBack( users ) {
			console.log( 'hepp', users );
		}
	}
	
	ns.Broadcast.prototype.clientMessage = function( event, identity )
	{
		var self = this;
		console.log( 'clientMessage', {
			e : event,
			i : identity,
		});
		var msg = {
			type : 'message',
			data : {
				from    : identity.username,
				message : event.message,
				time    : Date.now(),
			},
		};
		
		self.mainView.chatMessage( msg.data );
		self.sas.send( msg );
	}
	
	ns.Broadcast.prototype.updateUser = function( username ) {
		var self = this;
		var userlist = Object.keys( self.users );
		var uptd = {
			type : 'user-list',
			data : userlist,
		};
		console.log( 'updateUser', uptd );
		self.sas.send( uptd );
	}
	
	ns.Broadcast.prototype.bindAssClient = function()
	{
		var self = this;
		self.sas.on( 'message', chatMessage );
		self.sas.on( 'user-add', userAdded );
		self.sas.on( 'user-list', updateUserlist );
		self.sas.on( 'user-remove', userRemoved );
		
		function chatMessage( e, i ) { self.chatMessage( e, i ); }
		function userAdded( e, i ) { self.userAdded( e, i ); }
		function updateUserlist( e, i ) { self.updateUserlist( e, i ); }
		function userRemoved( e, i ) { self.userRemoved( e, i ); }
	}
	
	ns.Broadcast.prototype.chatMessage = function( event, identity )
	{
		var self = this;
		console.log( 'chatMessage', {
			e : event,
			i : identity,
		});
		self.mainView.chatMessage( event );
	}
	
	ns.Broadcast.prototype.userAdded = function( event, identity )
	{
		var self = this;
		console.log( 'userAdded', {
			e : event,
			i : identity,
		});
		if ( event.username === self.username )
			return;
		
		self.mainView.addUser( event );
	}
	
	ns.Broadcast.prototype.updateUserlist = function( event, identity )
	{
		var self = this;
		console.log( 'updateUserlist', {
			e : event,
			i : identity,
		});
		event.forEach( add );
		function add( username ) {
			var user = {
				username : username,
				isActive : true,
			};
			self.mainView.addUser( user );
		}
	}
	
	ns.Broadcast.prototype.userRemoved = function( event, identity )
	{
		var self = this;
		console.log( 'userRemoved', {
			e : event,
			i : identity,
		});
		
		self.mainView.removeUser( event.username );
	}
	
	ns.Broadcast.prototype.bindAssCommon = function() {
		var self = this;
		self.sas.on( 'sasid-close', sasClose );
		
		function sasClose( e, i ) { self.sasClosed( e, i ); }
	}
	
	ns.Broadcast.prototype.sasClosed = function() {
		var self = this;
		if ( self.connectView )
			self.connectView.close();
		
		self.mainView.setAssClosed();
		if ( self.add ) {
			self.sas.close();
			delete self.sas;
		}
	}
	
	ns.Broadcast.prototype.getAssUserlist = function( callback ) {
		var self = this;
		console.log( 'getAssUserlist' );
		self.sas.getUsers( usersBack );
		function usersBack( res ) {
			console.log( 'getAssUserlist - usersBack', res );
			callback( res );
		}
	}
	
	ns.Broadcast.prototype.setSelf = function()
	{
		var self = this;
		self.mainView.setSelf( self.username );
	}
	
	ns.Broadcast.prototype.setHost = function( username )
	{
		var self = this;
		self.mainView.setHost( username );
	}
	
	ns.Broadcast.prototype.setMenu = function()
	{
		var self = this;
		var connect = {
			name    : i18n('i18n_invite'),
			command : 'menu_connect',
		};
		
		var quit = {
			name    : i18n('i18n_quit'),
			command : 'menu_quit',
		};
		
		var file = {
			name  : i18n('i18n_file'),
			items : [
				quit,
			],
		};
		
		if ( self.isHost )
			file.items.unshift( connect );
		
		self.mainView.view.setMenuItems([
			file,
		]);
		
		self.appEvents[ connect.command ] = handleConnect;
		self.appEvents[ quit.command ] = handleQuit;
		
		function handleConnect( e ) { self.showConnect( e ); }
		function handleQuit( e ) { self.quit(); }
	}
	
	ns.Broadcast.prototype.receiveMessage = function( msg )
	{
		var self = this;
		if ( msg.checkDefaultMethod )
			return;
		
		var type = msg.command || msg.robotUnicorns;
		var handler = self.appEvents[ type ];
		if ( handler ) {
			handler( msg );
			return;
		}
		
		if ( msg.robotUnicorns ) {
			self.handleInternal( msg );
			return;
		}
		
		//console.log( 'Broadcast.receiveMessage - no handler for', msg );
	}
	
	ns.Broadcast.prototype.handleInternal = function( msg )
	{
		var self = this;
		console.log( 'handleInternal', msg );
		var event = msg.data;
		if ( 'loaded' !== event.type ) {
			console.log( 'invalid internal event', msg );
			return;
		}
		
		var viewId = event.data.id;
		var view = self.views[ viewId ];
		if ( !view ) {
			console.log( 'invalid internal view id', msg )
			return;
		}
		
		self.appEvents[ event.data.viewId ] = rcvMsg;
		rcvMsg( msg );
		
		function rcvMsg( msg ) {
			view.receiveMessage( msg.data );
		}
	}
	
	ns.Broadcast.prototype.showConnect = function()
	{
		var self = this;
		var vConf = {
			id : 'connectView',
			onmsg : onMsg,
			onclose : onClose,
		};
		var cView = new lib.views.ConnectView( vConf );
		self.views[ cView.id ] = cView;
		self.connectView = cView;
		self.refreshUserList();
		
		function onMsg( e ) { self.handleConnectViewMsg( e ); }
		function onClose() {
			self.connectView = null;
			self.views[ cView.id ] = null;
		}
	}
	
	ns.Broadcast.prototype.getAvailableUsers = function( callback ) {
		var self = this;
		var req = {
			path : 'system.library/user/activewslist/',
			data : {
				usersonly : true,
			}
		};
		self.conn.request( req, reqBack );
		function reqBack( res ) {
			console.log( 'getAvailableUsers - reqBack', res );
			if ( !res.userlist )
				return;
			
			var users = res.userlist.map( getName ).filter( notNull );
			callback( users );
			
			function getName( user ) {
				var name = user.username;
				if ( name === self.username )
					return null;
				
				return user.username;
			}
			
			function notNull( name ) { return !!name; }
		}
	}
	
	ns.Broadcast.prototype.handleConnectViewMsg = function( e )
	{
		var self = this;
		var handler = self.connectEvents[ e.type ];
		if ( handler ) {
			handler( e.data );
			return;
		}
		
		console.log( 'handleConnectViewMsg - unhandled', e );
	}
	
	ns.Broadcast.prototype.sendInvite = function( users )
	{
		var self = this;
		if ( !self.isHost )
			return;
		
		self.sas.invite( users, 'Join server chat', invBack );
		function invBack( res ) {
			console.log( 'invBack', res );
			if ( !res.invited || !res.invited.length )
				return;
			
			self.addInvited( res.invited );
		}
	}
	
	ns.Broadcast.prototype.addInvited = function( invitedNames )
	{
		var self = this;
		var invited = invitedNames.map( buildUser );
		self.mainView.addInvited( invited );
		function buildUser( invitee ) {
			var user = {
				username    : invitee.name,
				timeInvited : Date.now(),
			};
			return user;
		}
	}
	
	ns.Broadcast.prototype.refreshUserList = function()
	{
		var self = this;
		self.getAvailableUsers( usersBack );
		function usersBack( users ) {
			console.log( 'usersBack', users );
			self.connectView.setUsers( users );
		}
	}
	
	ns.Broadcast.prototype.openMainView = function( conf )
	{
		var self = this;
		var mConf = {
			id         : 'mainView',
			onmsg      : onMsg,
			onclose    : onClose,
			initialize : {
				isHost   : self.isHost,
				username : self.user,
			},
		};
		var mView = new lib.views.MainView( mConf );
		self.views[ mView.id ] = mView;
		self.mainView = mView;
		
		function onMsg( e ) { self.handleMainViewMsg( e ); }
		function onClose() {
			console.log( 'mainclosed' );
			self.mainView = null;
			self.quit();
		}
	}
	
	ns.Broadcast.prototype.handleMainViewMsg = function( e )
	{
		var self = this;
		var handler = self.mainEvents[ e.type ];
		if ( handler ) {
			handler( e.data );
			return;
		}
		
		console.log( 'handleMainViewMsg - unhandled', e );
	}
	
	ns.Broadcast.prototype.sendChatMessage = function( message )
	{
		var self = this;
		var msg = {
			type : 'message',
			data : {
				from    : self.username,
				message : message,
				time    : Date.now(),
			},
		};
		
		self.sas.send( msg );
		if ( self.isHost )
			self.mainView.chatMessage( msg.data );
	}
	
	ns.Broadcast.prototype.sendNotification = function( notie )
	{
		var self = this;
		console.log( 'sendNotification', notie );
		var event = {
			path : 'system.library/admin/servermessage',
			data : {
				message : notie,
			},
		};
		self.conn.request( event, notieBack );
		function notieBack( res ) {
			console.log( 'sendNotification notieBack', res );
		}
	}
	
	ns.Broadcast.prototype.removeUser = function( username )
	{
		var self = this;
		console.log( 'removeUser', username );
		self.sas.remove( username, null, removeBack );
		function removeBack( res ){
			console.log( 'removeBack', res );
		}
	}
	
	ns.Broadcast.prototype.send = function( msg )
	{
		var self = this;
		msg.authId = Application.authId;
		//self.fconn.send( msg );
	}
	
	ns.Broadcast.prototype.quit = function()
	{
		console.log( 'Broadcast.quit' );
		var self = this;
		self.sas.close();
		Application.quit();
	}
	
})( lib.system );


// BaseView
(function( ns, undefined ) {
	ns.BaseView = function( conf )
	{
		var self = this;
		self.id = conf.id;
		self.windowConf = conf.windowConf;
		self.initialize = conf.initialize;
		self.onmsg = conf.onmsg;
		self.onclose = conf.onclose;
		
		self.ready = false;
		self.msgQueue = [];
		
		self.baseInit();
	}
	
	ns.BaseView.prototype.baseInit = function()
	{
		var self = this;
		self.view = new View( self.windowConf );
		self.view.onClose = closed;
		function closed() {
			self.view = null;
			var onclose = self.onclose;
			self.close();
			if ( onclose )
				onclose();
		}
		
		var file = self.id + '.html';
		var src = '/webclient/apps/Broadcast/Templates/' + file;
		self.view.setRichContentUrl( src );
		self.viewEvents = {
			'loaded' : loaded,
			'ready'  : ready,
		};
		
		function loaded( e ) { self.loaded( e ); }
		function ready( e ) { self.setReady( e ); }
	}
	
	ns.BaseView.prototype.loaded = function()
	{
		var self = this;
		if ( !self.initialize ) {
			self.setReady();
			return;
		}
		
		var init = {
			type : 'initialize',
			data : self.initialize,
		};
		self.send( init, true );
	}
	
	ns.BaseView.prototype.setReady = function()
	{
		var self = this;
		self.ready = true;
		self.msgQueue.forEach( send );
		function send( msg ) {
			self.send( msg );
		}
	}
	
	ns.BaseView.prototype.send = function( msg, force )
	{
		var self = this;
		if ( !self.ready && !force ) {
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
	
	ns.BaseView.prototype.receiveMessage = function( msg )
	{
		var self = this;
		var handler = self.viewEvents[ msg.type ];
		if ( !handler ) {
			self.onmsg( msg );
			return;
		}
		
		handler( msg.data );
	}
	
	ns.BaseView.prototype.close = function()
	{
		var self = this;
		if ( self.view )
			self.view.close();
		
		delete self.view;
		delete self.onclose;
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
		conf.windowConf = {
			title : 'Broadcast',
			width : 400,
			height : 550,
		};
		lib.system.BaseView.call( self, conf );
		
		self.init();
	}
	
	ns.MainView.prototype = Object.create( lib.system.BaseView.prototype );
	
	// Public
	
	ns.MainView.prototype.setSelf = function( user )
	{
		var self = this;
		var msg = {
			type : 'set-self',
			data : user,
		};
		self.send( msg );
	}
	
	ns.MainView.prototype.setHost = function( user )
	{
		var self = this;
		var msg = {
			type : 'set-host',
			data : user,
		};
		self.send( msg );
	}
	
	ns.MainView.prototype.addInvited = function( users )
	{
		var self = this;
		var add = {
			type : 'invite-add',
			data : users,
		};
		self.send( add );
	}
	
	ns.MainView.prototype.addUser = function( user )
	{
		var self = this;
		var add = {
			type : 'user-add',
			data : user,
		};
		self.send( add );
	}
	
	ns.MainView.prototype.updateUser = function( user )
	{
		var self = this;
		var update = {
			type : 'user-update',
			data : user,
		};
		self.send( update );
	}
	
	ns.MainView.prototype.removeUser = function( username )
	{
		var self = this;
		var rem = {
			type :  'user-remove',
			data : username,
		};
		self.send( rem );
	}
	
	ns.MainView.prototype.chatMessage = function( data )
	{
		var self = this;
		var msg = {
			type : 'message',
			data : data,
		};
		self.send( msg );
	}
	
	ns.MainView.prototype.setAssClosed = function( data )
	{
		var self = this;
		var closed = {
			type : 'sasid-close',
			data : data,
		};
		self.send( closed );
	}
	
	// Private
	
	ns.MainView.prototype.init = function()
	{
		var self = this;
		console.log( 'mainView.init' );
	}
	
	
})( lib.views );

// ConnectView
(function( ns, undefined )
{
	ns.ConnectView = function( conf )
	{
		if ( !( this instanceof ns.ConnectView ))
			return new ns.ConnectView( conf );
		
		var self = this;
		conf.windowConf = {
			title : 'Connect',
			width : 450,
			height : 300,
		};
		lib.system.BaseView.call( self, conf );
		
		self.init();
	}
	
	ns.ConnectView.prototype = Object.create( lib.system.BaseView.prototype );
	
	// "public"
	
	ns.ConnectView.prototype.setUsers = function( users )
	{
		var self = this;
		var yep = {
			type : 'user-list',
			data : users,
		};
		self.send( yep );
	}
	
	// priv
	
	ns.ConnectView.prototype.init = function()
	{
		var self = this;
		console.log( 'Connectview.init' );
	}
})( lib.views );

Application.run = fun;
function fun( conf )
{
	console.log( 'application.fun' );
	window.couch = new lib.system.Broadcast( conf );
}
