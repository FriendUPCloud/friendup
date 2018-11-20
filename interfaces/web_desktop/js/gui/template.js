/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = friendUP || {};
friendUP.component = friendUP.component || {};
friendUP.gui = friendUP.gui || {};

(function ( ns, undefined ) {
	ns.HTMLBuilder = function() {
		if ( !( this instanceof ns.HTMLBuilder ))
			return new ns.HTMLBuilder();
		
		var self = this;
		self.cache = {};
	}
	
	ns.HTMLBuilder.prototype.build = function( tmpl, id, data )
	{
		var self = this;
		
		// beware: single quotes in your html ( ' ) will crash the parser.
		// Single quotes in variables passed to the tempalte is okay
		// Source : http://ejohn.org/blog/javascript-micro-templating/
		self.cache[ id ] = self.cache[ id ] ||
		new Function('obj',
			"var p = [], print = function() {p.push.apply(p,arguments);};" + 
			"with(obj) {p.push('" + 
			tmpl
				.replace(/[\r\t\n]/g, " ")
				.split("<%").join("\t")
				.replace(/((^|%>)[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%>/g, "',$1,'")
				.split("\t").join("');")
				.split("%>").join("p.push('")
				.split("\r").join("\\")
				+ "');} return p.join('');"
			);
		
		return data ? self.cache[id]( data ) : self.cache[ id ];
	};
	
	ns.HTMLBuilder.prototype.get = function( tmpl, id, data )
	{
		var self = this;
		if ( tmpl.trim )
			tmpl = tmpl.trim();
		
		if ( !tmpl || !id || !data ) {
			console.log( 'friendUP.component.HTMLBuilder.get - missing arguments',
				{ tmpl : tmpl, id : id, data : data } );
			return null;
		}
		
		return self.build( tmpl, id, data );
	}
	
})( friendUP.component );


// html tempalte parsing functions
// feed it a string of html elements. It will grab the id and and inner html of every top element.
(function( ns, undefined )
{
	ns.TemplateManager = function ( fragments )
	{
		if ( !( this instanceof ns.TemplateManager ))
			return new ns.TemplateManager( fragments );
		
		var self = this;
		self.cache = null;
		
		self.init( fragments || '' );
	}
	
	ns.TemplateManager.prototype.init = function( fragments ) {
		var self = this;
		self.fragments = {};
		self.cache = new friendUP.component.HTMLBuilder();
		
		if ( fragments )
			self.addFragments( fragments );
	}
	
	ns.TemplateManager.prototype.get = function( id, data ) {
		var self = this;
		var fragment = self.fragments[ id ];
		
		if ( !fragment )
			throw new Error( 'template.get - invalid template id: ' + id );
		
		data = data || {};
		var html = self.cache.get( fragment, id, data );
		return html;
	}
	
	ns.TemplateManager.prototype.getFragment = function( id, data )
	{
		var self = this;
		var tmpl = self.get( id, data );
		var fragment = document.createElement( 'div' );
		fragment.innerHTML = tmpl;
		return fragment;
	}
	
	ns.TemplateManager.prototype.getElement = function( id, data )
	{
		var self = this;
		var fragment = self.getFragment( id, data );
		if ( fragment.children.length != 1 )
			return fragment;
		else
			return fragment.children[ 0 ];
	}
	
	ns.TemplateManager.prototype.addFragments = function( fragments ) {
		var self = this;
		
		if ( !fragments )
			return;
		
		if ( 'string' === typeof( fragments )) {
			var container = document.createElement( 'div' );
			container.innerHTML = fragments;
			fragments = container;
		}
		
		var fragments = fragments.children;
		if ( !fragments.length ) {
			console.log( 'TemplateManager.addFragments - no fragments found ', fragments );
			return;
		}
		
		Array.prototype.forEach.call( fragments, extractHtml );
		function extractHtml( element )
		{
			if ( !element.id )
				return;
			
			var id = element.id;
			var fragment = element.textContent;
			if ( !fragment || !fragment.length )
				return;
			
			self.fragments[ id ] = fragment.trim();
		}
	}
	
})( friendUP.gui );
