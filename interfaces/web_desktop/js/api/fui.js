/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var FUI = window.FUI ? window.FUI : {};

FUI.children = [];
FUI.objectIndex = {};
FUI.initialized = false;

FUI.initialize = function( flags, callback )
{
	let self = this;
	this.flags = {};
	
	if( flags && flags.classList )
	{
		let str = document.location.origin + '/';
	
		for( let a = 0; a < flags.classList.length; a++ )
		{
			if( a > 0 ) str += ';';
			str += 'webclient/js/api/fui/' + flags.classList[ a ].toLowerCase() + '.class.js';
		}
		
		// Load includes synchronously
		let c = new cAjax();		
		c.open( 'GET', str, false, false );
		c.onload = function()
		{
			eval( this.responseText() );
			done();
		}
		c.send();
	}
	else
	{
		done();
	}
	
	function done()
	{
		// Set renderer
		if( flags && !flags.renderer )
			flags.renderer = 'html5';
		let ren = flags && flags.renderer ? flags.renderer : false;
		switch( ren )
		{
			case 'html5':
				self.flags.renderer = ren;
				break;
			default:
				self.flags.renderer = 'html5';
				break;
		}
	
		// Set insertion point
		if( flags && flags.parentNode )
		{
			FUI.dom = flags.parentNode;
		}
		else FUI.dom = document.body;
	
		FUI.initialized = true;
		
		if( callback )
			return callback( { result: true } );
		return;
	}
}

FUI.build = function( description )
{
	if( !this.initialized ) return setTimeout( function(){ FUI.build( description ); }, 5 );
	
	let result = new FUI[ description.rootClass ]( description.flags );
	if( result )
	{
		return FUI.addChild( result );
	}
	return false;
}

FUI.addChild = function( element )
{
	if( element && element.refresh )
	{
		element.parentNode = this.dom;
		this.children.push( element );
		this.refresh( element );
		return this.children.length;
	}
	return false;
}

// Refresh the UI recursively
FUI.refresh = function( element )
{
	if( element )
	{
		let children = element.refresh();
		if( children && children.length )
		{
			for( let a = 0; a < children.length; a++ )
			{
				FUI.refresh( children[ a ] );
			}
		}
	}
}

// Load theme by name
FUI.loadTheme = function( name )
{
	
}

/* Event class -------------------------------------------------------------- */

FUI.inherit = function( self, className )
{
	self.properties = {};
	
	// Add an event
	self.addEvent = function( type, callback )
	{
		if( !self.events ) self.events = {};
		if( !self.events[ 'on' + type ] )
			self.events[ 'on' + type ] = [];
		self.events[ 'on' + type ].push( callback );
		return [ type, callback ];
	}
	
	// Execute an event
	self.executeEvent = function( type, eventData )
	{
		if( self.events && typeof( self.events[ 'on' + type ] ) != 'undefined' )
		{
			for( let a = 0; a < self.events[ 'on' + type ].length; a++ )
			{
				self.events[ 'on' + type ][ a ]( eventData );
			}
			return true;
		}
		return false;
	}
	
	// Remove an event
	self.removeEvent = function( event )
	{
		if( self.events[ 'on' + event[ 0 ] ] )
		{
			let out = [];
			let found = false;
			let lst = self.events[ 'on' + event[ 0 ] ];
			for( let a = 0; a < lst.length; a++ )
			{
				if( lst[ a ] != event[ 1 ] )
					out.push( lst[ a ] );
				else found = true;
			}
			if( found )
			{
				self.events[ 'on' + event[ 0 ] ] = out;
				return true;
			}
		}
		return false;
	}
	
	// Set a property
	self.setProperty = function( propertyName, value, callback )
	{
		this.properties[ propertyName ] = value;
		
		if( this.identity )
		{
			if( this.onPropertySet )
				this.onPropertySet( propertyName, value, callback );
		}
		else
		{
			console.log( 'This element is not found here.' );
		}
		return;
	}
	
	// Get a property
	self.getProperty = function ( propertyName )
	{
		/*// TODO: Check if we need to send to source destination
		if( this.property[ propertyName ] )
			return this.properties[ propertyName ];
		return null;*/
	}
	// Execute a property
	self.doMethod = function( method, args, callback )
	{
		if( this.identity )
		{
			if( this.onMethod )
				this.onMethod( method, args, callback );
		}
		else
		{
			console.log( 'This element is not found here.', self );
		}
		return;
	}
	// Anchor object to scope
	self.setIdentity = function()
	{
		this.objectId = md5( "" + Math.random() * 999 + ( Math.random() * 999 ) + new Date().getTime() );
		
		FUI.objectIndex[ this.objectId ] = this;
		
		if( Application.viewId )
		{
			this.identity = 'viewId';
			this.viewId = Application.viewId;
			return true;
		}
		else if( Application.screenId )
		{
			this.identity = 'screenId';
			this.viewId = Application.screenId;
			return true;
		}
		else if( Application.widgetId )
		{
			this.identity = 'widgetId';
			this.viewId = Application.widgetId;
			return true;
		}
		// This is an element without gui identity
		else
		{
			this.identity = true;
			return true;
		}
		return false;
	}
	
	self.setIdentity();
	self.renderer = new FUI[ className ].Renderers[ FUI.flags.renderer ]( self );
}

FUI.preInit = function()
{
	if( typeof( cAjax ) != 'undefined' )
		FUI.initialize( { classList: [ 'View', 'Grid', 'Button', 'Input' ] } );
	else return setTimeout( FUI.preInit, 5 );
}
FUI.preInit();
