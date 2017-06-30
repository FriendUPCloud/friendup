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

(function( ns, undefined ) {
	ns.Connect = function( fupConf, view )
	{
		var self = this;
		self.fupConf = fupConf;
		self.view = view;
		self.users = {};
		
		self.init();
	}
	
	ns.Connect.prototype.send = function( msg )
	{
		var self = this;
		self.view.send( msg );
	}
	
	ns.Connect.prototype.sendInvite = function( userlist )
	{
		var self = this;
		var invMsg = {
			type : 'invite',
			data : userlist,
		};
		self.send( invMsg );
	}
	
	ns.Connect.prototype.init = function()
	{
		var self = this;
		var fragments = document.getElementById( 'fragments' );
		self.template = new friendUP.gui.TemplateManager( fragments );
		self.view.loaded( 'connectView' );
		
		self.view.on( 'user-list', userList );
		function userList( e ) { self.setUsers( e ); }
		
		self.bind();
	}
	
	ns.Connect.prototype.bind = function()
	{
		var self = this;
		var form = document.getElementById( 'inv-form' );
		var refreshBtn = document.getElementById( 'refresh-list' );
		var selectAllBtn = document.getElementById( 'select-all' );
		var groupInviteBtn = document.getElementById( 'group-invite' );
		
		form.addEventListener( 'submit', submit, false );
		refreshBtn.addEventListener( 'click', refreshClick, false );
		selectAllBtn.addEventListener( 'click', selectClick, false );
		groupInviteBtn.addEventListener( 'click', inviteClick, false );
		
		function submit( e ) {
			e.preventDefault();
			e.stopPropagation();
			self.invite( e );
		}
		
		function refreshClick( e ) { self.refreshUsers(); }
		function selectClick( e ) { self.selectAll(); }
		function inviteClick( e ) { self.groupInvite(); }
	}
	
	ns.Connect.prototype.invite = function( e )
	{
		var self = this;
		var input = e.target[0];
		var value = input.value;
		var users = value.split( ',' );
		users = users.map( trim );
		self.sendInvite( users );
		input.value = '';
		
		function trim( user ) { return user.trim(); }
	}
	
	ns.Connect.prototype.refreshUsers = function( e )
	{
		var self = this;
		var re = {
			type : 'user-refresh',
		};
		self.send( re );
	}
	ns.Connect.prototype.selectAll = function( e )
	{
		var self = this;
		self.workChildren( setCheck );
		function setCheck( el ) {
			var input = el.querySelector( 'input' );
			input.checked = true;
		}
	}
	ns.Connect.prototype.groupInvite = function( e )
	{
		var self = this;
		var users = self.workChildren( getName );
		users = users.filter( notNull );
		self.sendInvite( users );
		
		function getName( el ) {
			var input = el.children[ 0 ];
			if ( !input.checked )
				return null;
			
			var id = el.children[ 0 ].id;
			return self.users[ id ];
		}
		
		function notNull( name ) {
			return !!name;
		}
	}
	
	ns.Connect.prototype.workChildren = function( fn )
	{
		var self = this;
		var container = document.getElementById( 'users-list' );
		var users = container.children;
		return Array.prototype.map.call( users, fn );
	}
	
	ns.Connect.prototype.setUsers = function( users )
	{
		var self = this;
		var container = document.getElementById( 'users-list' );
		container.innerHTML = '';
		users.forEach( build );
		function build( username ) {
			var id = self.getUserId( username );
			var conf = {
				id       : id,
				username : username,
			};
			self.users[ id ] = username;
			var el = self.template.getElement( 'user-tmpl', conf );
			container.appendChild( el );
		}
	}
	
	ns.Connect.prototype.getUserId = function( username )
	{
		var self = this;
		var id = username.replace( /\W/g, 'x' );
		return 'id-' + id;
	}
	
})( lib );


Application.run = function( conf, iface )
{
	if ( iface )
		console.log( 'connectView run - what is iface???', { conf : conf, iface : iface });
	
	window.view = new lib.View( Application );
	window.main = new lib.Connect( conf, window.view );
}
