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

var friendUP = window.friendUP || {};
friendUP.component = friendUP.component || {};
friendUP.tool = friendUP.tool || {};

(function()
{
	var baseElement = document.createElement( 'base' );
	baseElement.href = '/webclient/';
	document.head.appendChild( baseElement );
	
	var jsPath = 'js/';
	var scripts = [
		'utils/tool.js'
	];
	
	scripts.forEach( addScript );
	function addScript( scriptPath )
	{
		var script = document.createElement( 'script' );
		script.type = 'text/javascript';
		script.src = jsPath + scriptPath;
		document.head.appendChild( script );
	}
})();


// ClosureHandler
(function( ns, undefined ) {
	ns.ClosureHandler = function() {
		if ( !( this instanceof ns.ClosureHandler ))
			return new ns.CLosureHandler();
		
		var self = this;
		self.init();
	}
	
	ns.ClosureHandler.prototype.init = function() {
		var self = this;
		self.ready = false;
		
		window.addEventListener( 'message', receiveEvent, false );
		function receiveEvent( e ) { self.receiveEvent( e ); }
	}
	
	ns.ClosureHandler.prototype.receiveEvent = function( e ) {
		var self = this;
		var msg = friendUP.tool.objectify( e.data );
		msg = msg.data;
		
		if ( msg.type !== 'initialize' ) {
			console.log( 'ClosureHandler.receiveEvent - unknow event', msg );
			return;
		}
		
		self.initialize( msg.data );
	}
	
	ns.ClosureHandler.prototype.initialize = function( data )
	{
		var self = this;
		
		self.receiveEvent = self.routeMessage;
		
		self.id = data.id;
		self.event = data.event;
		
		self.initContent( data.content, done );
		
		function done()
		{
			self.ready = true;
			self.sendToParent({
				type : 'ready'
			});
		}
	}
	
	ns.ClosureHandler.prototype.initContent = function( content, doneCallback ) {
		var self = this;
		var tmplContainer = document.createElement( 'div' );
		tmplContainer.innerHTML = content.frame;
		self.frame = tmplContainer.firstChild;
		self.frame.onload = doneCallback;
		if ( content.url )
			self.frame.src = content.url;
		
		document.body.appendChild( self.frame );
	}
	
	ns.ClosureHandler.prototype.routeMessage = function( e ) {
		var self = this;
		var msg = friendUP.tool.objectify( e.data );
		
		if ( msg.id === self.id )
			self.sendToContent( msg.data );
		else
			self.sendToParent( msg );
	}
	
	ns.ClosureHandler.prototype.sendToParent = function( msg ) {
		var self = this;
		var wrap = {
			type : self.event,
			id : self.id,
			data : msg
		};
		
		var msgString = friendUP.tool.stringify( wrap );
		window.parent.postMessage( msgString, '*' );
	}
	
	ns.ClosureHandler.prototype.sendToContent = function( msgString ) {
		var self = this;
		self.frame.contentWindow.postMessage( msgString, '*' );
	}
	
	ns.ClosureHandler.prototype.setContent = function( htmlString ) {
		var self = this;
	}
	
})( friendUP.component );

var closure = new friendUP.component.ClosureHandler();
