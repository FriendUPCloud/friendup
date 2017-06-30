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

// View
(function( ns, undefined )
{
	ns.View = function( app )
	{
		var self = this;
		self.app = app;
		self.subs = {};
		self.init();
	}
	
	// PUBLIC
	
	ns.View.prototype.loaded = function( id )
	{
		var self = this;
		console.log( 'view.loaded', id );
		self.id = id;
		var loaded = {
			type : 'loaded',
			data : {
				id : id,
				viewId : self.app.viewId,
			},
		};
		self.send( loaded );
	}
	
	ns.View.prototype.on = function( event, handler )
	{
		var self = this;
		self.subs[ event ] = handler;
	}
	
	ns.View.prototype.send = function( data )
	{
		var self = this;
		var msg = {
			robotUnicorns : self.app.viewId,
			data : data,
		};
		self.app.sendMessage( msg );
	}
	
	// PRIVATE
	
	ns.View.prototype.init = function()
	{
		var self = this;
		console.log( 'hi! im just here to annoy you =^.^=' );
		self.app.receiveMessage = function( e ) { self.receiveMessage( e ); }
	}
	
	ns.View.prototype.receiveMessage = function( msg )
	{
		var self = this;
		if ( msg.checkDefaultMethod )
			return;
		
		if ( !msg.robotUnicorns )
			return;
		
		var event = msg.data;
		var handler = self.subs[ event.type ];
		if ( handler ) {
			handler( event.data );
			return;
		}
		
		console.log( 'mainView - no handler for view message', msg );
	}
	
})( lib );
