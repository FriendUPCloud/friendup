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

var lib = window.lib || {};

(function( ns, undefined )
{
	ns.Main = function( conf, view )
	{
		var self = this;
		self.conf = conf;
		self.view = view;
		
		self.users = {};
		self.username = null;
		self.hostname = null;
		
		self.init();
	}
	
	ns.Main.prototype.send = function( msg )
	{
		var self = this;
		self.view.send( msg );
	}
	
	ns.Main.prototype.init = function()
	{
		var self = this;
		self.bind();
		var fragments = document.getElementById( 'fragments' );
		self.template = new friendUP.gui.TemplateManager( fragments );
		
		self.view.loaded( 'mainView' );
		self.view.on( 'initialize', initialize );
		function initialize( e ) { self.initialize( e ); }
	}
	
	ns.Main.prototype.bind = function()
	{
		var self = this;
		self.usersList = document.getElementById( 'users-container' );
		self.messages = document.getElementById( 'message-container' );
		
		var notifyForm = document.getElementById( 'send-notification' );
		var chatForm = document.getElementById( 'chat-form' );
		
		notifyForm.addEventListener( 'submit', notifySubmit, false );
		chatForm.addEventListener( 'submit', chatSubmit, false );
		
		function notifySubmit( e ) {
			e.preventDefault();
			e.stopPropagation();
			var input = e.target[ 0 ];
			var note = input.value;
			input.value = '';
			if ( !note.length )
				return;
			
			var noteMsg = {
				type : 'notie',
				data : note,
			}
			self.send( noteMsg );
		}
		
		function chatSubmit( e ) {
			e.preventDefault();
			e.stopPropagation();
			var input = e.target[ 0 ];
			var message = input.value;
			input.value = '';
			if ( !message.length )
				return;
			
			var msg = {
				type : 'message',
				data : message,
			};
			self.send( msg );
		}
	}
	
	ns.Main.prototype.initialize = function( conf )
	{
		var self = this;
		self.isHost = conf.isHost;
		if ( self.isHost )
			showNotie();
		
		self.view.on( 'set-self', setSelf );
		self.view.on( 'set-host', setHost );
		self.view.on( 'user-add', addUser );
		self.view.on( 'user-update', updateUser );
		self.view.on( 'user-remove', userRemoved );
		self.view.on( 'invite-add', addInvitedUser );
		self.view.on( 'invite-remove', removeInvitedUser );
		self.view.on( 'message', handleMessage );
		self.view.on( 'assid-close', handleAssClosed );
		
		var ready = {
			type : 'ready',
		};
		self.send( ready );
		
		function showNotie() {
			var notieEl = document.getElementById( 'notification' );
			notieEl.classList.toggle( 'hidden', false );
		}
		
		function setSelf( e ) { self.setSelf( e ); }
		function setHost( e ) { self.setHost( e ); }
		function addUser( e ) { self.addUser( e ); }
		function updateUser( e ) { self.updateUser( e ); }
		function userRemoved( e ) { self.userRemoved( e ); }
		function addInvitedUser( e ) { self.addInvitedUser( e ); }
		function removeInvitedUser( e ) { self.removeInvitedUser( e ); }
		function handleMessage( e ) { self.handleMessage( e ); }
		function handleAssClosed( e ) { self.handleAssClosed( e ); }
	}
	
	ns.Main.prototype.setSelf = function( username )
	{
		var self = this;
		self.username = username;
		if ( self.isHost )
			self.hostname = username;
		
		var id = self.getUserId( username );
		var user = {
			id       : id,
			username : username,
			isSelf   : true,
			isHost   : self.isHost,
		};
		self.addUser( user );
	}
	
	ns.Main.prototype.setHost = function( username )
	{
		var self = this;
		self.hostname = username;
		var user = {
			id       : self.getUserId( username ),
			username : username,
			isHost   : true,
		}
		self.addUser( user );
	}
	
	ns.Main.prototype.addUser = function( data )
	{
		var self = this;
		if ( !data.id )
			data.id = self.getUserId( data.username );
		
		data.isActive = true;
		self.setUser( data );
	}
	
	ns.Main.prototype.userRemoved = function( name )
	{
		var self = this;
		var id = self.getUserId( name );
		delete self.users[ id ]
		var el = document.getElementById( id );
		if ( el )
			el.parentNode.removeChild( el );
		
	}
	
	ns.Main.prototype.addInvitedUser = function( users )
	{
		var self = this;
		users.forEach( add );
		function add( user ) {
			user.id        = self.getUserId( user.username );
			user.isActive = false;
			self.setUser( user );
		}
	}
	
	ns.Main.prototype.removeInvitedUser = function( data )
	{
		var self = this;
		console.log( 'removeInvitedUser', data )
	}
	
	ns.Main.prototype.updateUser = function( update )
	{
		var self = this;
		var id = self.getUserId( update.username );
		var user = self.users[ id ];
		if ( !user )
			user = add( update );
		
		for ( var key in update ) {
			var uptd = update[ key ];
			var curr = user[ key ];
			if ( curr !== uptd )
				user[ key ] = uptd;
		}
		
		self.setUserIcon( user );
		
		function add( update ) {
			self.addUser( update );
			var user = self.users[ id ];
			return user;
		}
	}
	
	ns.Main.prototype.handleMessage = function( event )
	{
		var self = this;
		event.time = friendUP.tool.getChatTime( event.time );
		var msgEl = self.template.getElement( 'message-tmpl', event );
		self.messages.appendChild( msgEl );
		var sh = self.messages.scrollHeight;
		self.messages.scrollTop = sh;
	}
	
	ns.Main.prototype.handleAssClosed = function( event )
	{
		var self = this;
		console.log( 'view.main.handleAssClsoed', event );
		var closedEl = document.getElementById( 'session-closed' );
		var closeClosedEl = document.getElementById( 'close-session-closed' );
		closedEl.classList.toggle( 'hidden', false );
		closeClosedEl.addEventListener( 'click', closeClick, false );
		function closeClick( e ) {
			closedEl.classList.toggle( 'hidden', true );
		}
	}
	
	ns.Main.prototype.setUser = function( user )
	{
		var self = this;
		var exists = !!self.users[ user.id ];
		if ( exists ) {
			self.updateUser( user );
			return;
		}
		
		self.users[ user.id ] = user;
		var el = self.template.getElement( 'user-tmpl', user );
		self.usersList.appendChild( el );
		self.setUserIcon( user );
		self.bindUser( el );
	}
	
	ns.Main.prototype.bindUser = function( el )
	{
		var self = this;
		var user = self.users[ el.id ];
		// remove is only available to the host, and only on other than self
		if ( !self.isHost || user.isSelf )
			return;
		
		var remEl = el.querySelector( '.user-remove' );
		remEl.classList.toggle( 'hidden', false )
		remEl.addEventListener( 'click', removeClick, false );
		function removeClick( e ) {
			self.removeUser( user.id );
		}
	}
	
	ns.Main.prototype.removeUser = function( userId )
	{
		var self = this;
		var user = self.users[ userId ];
		var rem = {
			type : 'remove',
			data : user.username,
		};
		self.send( rem );
		self.userRemoved( user.username );
	}
	
	ns.Main.prototype.userIconBase = 'fa fa-fw ';
	ns.Main.prototype.userIcons = {
		'host'    : 'fa-star',
		'self'    : 'fa-user',
		'invited' : 'fa-spinner fa-pulse',
	};
	
	ns.Main.prototype.setUserIcon = function( user )
	{
		var self = this;
		var el = document.getElementById( user.id );
		iconEl = el.querySelector( '.user-state i' );
		var cStr = self.userIconBase;
		if ( user.isHost ) {
			cStr += self.userIcons[ 'host' ];
			set( cStr );
			return;
		}
		
		if ( user.isSelf ) {
			cStr += self.userIcons[ 'self' ];
			set( cStr );
			return;
		}
		
		if ( !user.isActive ) {
			cStr += self.userIcons[ 'invited' ];
			set( cStr );
		} else
			set( cStr ); // no icon, we just need the base for the fixed width
		
		function set( str ) { iconEl.className = str; }
	}
	
	ns.Main.prototype.getUserId = function( name ) {
		var self = this;
		var normName = name.replace( /[^a-zA-Z0-9]/g, "x" );
		var id = 'user-' + normName + '-id';
		return id;
	}
	
	
})( lib );

Application.run = function( conf, iface )
{
	if ( iface )
		console.log( 'mainView run - what is iface???', { conf : conf, iface : iface });
	
	window.view = new lib.View( Application );
	window.main = new lib.Main( conf, window.view );
}
