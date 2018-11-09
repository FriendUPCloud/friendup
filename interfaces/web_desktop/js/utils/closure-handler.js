/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
