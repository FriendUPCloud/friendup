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

