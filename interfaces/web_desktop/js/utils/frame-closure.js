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
friendUP.component = friendUP.component || {};
// FrameClosure
(function( ns, undefined ) {
	ns.FrameClosure = function( config ) {
		if ( !( this instanceof ns.FrameClosure ))
			return new ns.FrameClosure( config );
		
		var self = this;
		self.id = config.id;
		self.event = config.event;
		self.window = config.window;
		self.content = config.content;
		self.init();
	}
	
	ns.FrameClosure.prototype.init = function() {
		var self = this;
		
		var tmplContainer = document.createElement( 'div' );
		tmplContainer.innerHTML = friendUP.template.get( 'tmpl-component-frameclosure' );
		self.frame = tmplContainer.firstChild;
		self.window.setContent( self.frame );
		self.frame.src = 'templates/frame-closure.html';
		self.frame.onload = loaded;
		
		function loaded( e ) { self.loaded( e ); }
	}
	
	ns.FrameClosure.prototype.loaded = function( e ) {
		var self = this;
		self.sendMessage({
			type : 'initialize',
			data : {
				id : self.id,
				event : self.event,
				content : self.content
			}
		});
	}
	
	ns.FrameClosure.prototype.sendMessage = function( msg, origin ) {
		var self = this;
		var wrap = {
			id : self.id,
			data : msg
		};
		
		var msgString = friendUP.tool.stringify( wrap );
		self.frame.contentWindow.postMessage( msgString, origin || '*' );
	}
	
})( friendUP.component );

