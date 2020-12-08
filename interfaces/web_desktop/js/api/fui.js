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

FUI.initialize = function( flags, callback )
{
	let self = this;
	this.flags = {};
	
	if( flags && flags.classList )
	{
		let str = document.location.protocol + '//' + document.location.host + '/';
	
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
	
		if( callback )
			return callback( { result: true } );
		return;
	}
}

FUI.build = function( description )
{
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
	
	self.addEvent = function( type, callback )
	{
		if( !self.events ) self.events = {};
		if( !self.events[ 'on' + type ] )
			self.events[ 'on' + type ] = [];
		self.events[ 'on' + type ].push( callback );
		return [ type, callback ];
	}
	
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
	self.setProperty = function( propertyName, value )
	{
		this.properties[ propertyName ] = value;
		// TODO: Check if we need to send to source destination
		if( this.onPropertySet )
			this.onPropertySet( propertyName );
	}
	
	// Get a property
	self.getProperty = function ( propertyName )
	{
		// TODO: Check if we need to send to source destination
		if( this.property[ propertyName ] )
			return this.properties[ propertyName ];
		return null;
	}
	// Execute a property
	self.doMethod = function( method, args, callback )
	{
		if( typeof( this[ method ] ) == 'function' )
		{
			this[ method ]( args, callback );
			return true;
		}
		return false;
	}
	// Anchor object to scope
	self.setIdentity = function()
	{
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
		else
		{
			this.identity = 'projection';
			this.identityType = 'viewId';
			this.identityId = '3940873098479038';
		}
		return false;
	}
	
	self.renderer = new FUI[ className ].Renderers[ FUI.flags.renderer ]( self );
}



