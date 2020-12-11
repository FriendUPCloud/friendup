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
var Friend = window.Friend ? window.Friend : {};

FUI.children = [];
FUI.objectIndex = {};
FUI.initialized = false;

FUI.initialize = function( flags, callback )
{
	let self = this;
	this.flags = {};
	
	if( flags && flags.classList )
	{
		Friend.totalLoadingResources++;
		
		let str = document.location.origin + '/';
	
		for( let a = 0; a < flags.classList.length; a++ )
		{
			if( a > 0 ) str += ';';
			str += 'webclient/js/api/fui/' + flags.classList[ a ].toLowerCase() + '.class.js';
		}
		
		// TODO: Overwrite depending on theme
		str += ';webclient/js/api/fui/theme.js';
		
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
		
		// From api.js
		Friend.doneLoading();
		
		if( callback )
			return callback( { result: true } );
		return;
	}
}

FUI.build = function( description, callback )
{
	if( !this.initialized ) return setTimeout( function(){ FUI.build( description ); }, 5 );
	return FUI.addChild( new FUI[ description.rootClass ]( description.flags ), callback );
}

FUI.addChild = function( element, callback )
{
	if( element && element.refresh )
	{
		element.parentNode = this.dom;
		this.children.push( element );
		this.refresh( element );
		if( callback ) callback( true );
		return this.children.length;
	}
	return false;
}


FUI.getThemeIcon = function( keyWord )
{
	if( typeof( FUI.theme.icons[ keyWord ] ) != 'undefined' )
		return FUI.theme.icons[ keyWord ];
	return false;
}

// Refresh the UI recursively
FUI.refresh = function( element )
{
	if( element && element.refresh )
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

/* Baseclass ---------------------------------------------------------------- */

FUI.BaseClass = function(){};

FUI.BaseClass.prototype.initialize = function( className )
{
	let self = this;
	self.className = className;
	self.properties = {};
	self.setIdentity();
	self.renderer = new FUI[ className ].Renderers[ FUI.flags.renderer ]( self );
}

FUI.BaseClass.prototype.refresh = function( pnode )
{
	if( !this.renderer || !this.renderer.refresh )
	{
		return false;
	}
	return this.renderer.refresh( pnode );
}

// Add an event
FUI.BaseClass.prototype.addEvent = function( type, callback )
{
	let self = this;
	
	// We are on the right scope (in a view, widget or screen)
	if( this.identity != 'rootId' && !this.identityValue && this[ this.identity ] == Application[ this.identity ] )
	{
		return setProperty();
	}
	// At root
	else if( this.identity == 'rootId' )
	{
		return setProperty();
	}
	// In a proxy object (has identity value set
	else if( this.identity && this.identityValue )
	{
		let msg = {
			command: 'fui',
			fuiCommand: 'setevent',
			id: this.id,
			event: type,
			callback: addPermanentCallback( callback )
		};
		if( this.identity == 'viewId' )
		{
			msg.targetViewId = this.identityValue;
		}
		else if( this.identity == 'screenId' )
		{
			msg.screenId = this.identityValue;
		}
		else if( this.identity == 'widgetId' )
		{
			msg.widgetId = this.identityValue;
		}
		Application.sendMessage( msg );
		return [ type, callback ];
	}
	return false;
	
	
	function setProperty()
	{
		if( !self.events ) self.events = {};
		if( !self.events[ 'on' + type ] )
			self.events[ 'on' + type ] = [];
		self.events[ 'on' + type ].push( callback );
		return [ type, callback ];
	}
}

// Execute an event
FUI.BaseClass.prototype.executeEvent = function( type, eventData )
{
	let self = this;
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
FUI.BaseClass.prototype.removeEvent = function( event )
{
	let self = this;
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
FUI.BaseClass.prototype.setProperty = function( propertyName, value, callback )
{
	let self = this;
	this.properties[ propertyName ] = value;
	
	// We are on the right scope (in a view, widget or screen)
	if( this.identity != 'rootId' && !this.identityValue && this[ this.identity ] == Application[ this.identity ] )
	{
		if( this.onPropertySet )
		{
			this.onPropertySet( propertyName, value, callback );
		}
	}
	// At root
	else if( this.identity == 'rootId' )
	{
		if( this.onPropertySet )
		{
			this.onPropertySet( propertyName, value, callback );
		}
	}
	// In a proxy object (has identity value set
	else if( this.identity && this.identityValue )
	{
		let msg = {
			command: 'fui',
			fuiCommand: 'setproperty',
			id: this.id,
			property: propertyName,
			value: value,
			callback: addCallback( callback )
		};
		if( this.identity == 'viewId' )
		{
			msg.targetViewId = this.identityValue;
		}
		else if( this.identity == 'screenId' )
		{
			msg.screenId = this.identityValue;
		}
		else if( this.identity == 'widgetId' )
		{
			msg.widgetId = this.identityValue;
		}
		Application.sendMessage( msg );
	}
	return;
}

// Get a property
FUI.BaseClass.prototype.getProperty = function ( propertyName )
{
	/*// TODO: Check if we need to send to source destination
	if( this.property[ propertyName ] )
		return this.properties[ propertyName ];
	return null;*/
}
// Execute a property
FUI.BaseClass.prototype.doMethod = function( method, args, callback )
{
	let self = this;
	if( this.identity )
	{
		if( this.onMethod )
			this.onMethod( method, args, callback );
	}
	else
	{
		this.sendMessage( {
			command: 'fui',
			fuiCommand: 'domethod',
			method: method,
			args: args,
			callback: addCallback( callback )
		} );
	}
	return;
}
// Anchor object to scope
FUI.BaseClass.prototype.setIdentity = function()
{
	let self = this;
	
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
		this.identity = 'rootId';
		this.rootId = '0';
		return true;
	}
	return false;
}

// Send a message down the object hierarchy
FUI.BaseClass.prototype.sendMessage = function( msg, callback )
{
	let self = this;
	
	if( !msg ) return false;
	// Messageport has a sendMessage function!
	if( this.messagePort )
	{
		msg.command = 'fui';
		if( callback )
			msg.callback = addCallback( callback );
		
		/*if( this.identity )
		{
			if( this.identity == 'viewId' )
			{
				msg.targetViewId = this.viewId;
			}
			// TODO: check if this works
			else if( this.idendity == 'screenId' )
			{
				msg.screenId = this.screenId;
			}
			// TODO: check if it works
			else if( this.identity == 'widgetId' )
			{
				msg.widgetId = this.widgetId;
			}
			Application.sendMessage( msg );
			console.log( 'Sending away!', this );
			return;
		}*/
		this.messagePort.sendMessage( msg );
		return true;
	}
	return false;
}

// Take simplified prototype and generate usable object
FUI.BaseClass.prototype.importPrototype = function( prototype )
{
	for( let a in prototype )
		this[ a ] = prototype[ a ];
	return true;
}

// Get element
FUI.BaseClass.prototype.getElementById = function( id, callback )
{
	let self = this;
	
	// With no object index, send a message on messageport
	if( !self.objectIndex )
	{
		this.sendMessage( {
			fuiCommand: 'getelementbyid',
			id: id,
			callback: addCallback( function( data )
			{
				if( data && data.response )
				{
					let prototype = JSON.parse( data.response );
					prototype.id = id;
					let btn = new FUI[ prototype.className ]();
					btn.importPrototype( prototype );
					callback( btn );
				}
				else
				{
					callback( false );
				}
			} )
		} );
		return false;
	}
	// Go through object index
	else
	{
		for( let a in self.objectIndex.length )
		{
			let o = self.objectIndex[ a ];
			if( o && o.flags && o.flags.id == id )
			{
				callback( self.objectIndex[ a ] );
				return true;
			}
		}
	}
	return false;
}

FUI.BaseClass.prototype.getChildren = function()
{
	if( this.children )
		return this.children;
	return false;
}

// Convert self to stringified, portable object
FUI.BaseClass.prototype.stringify = function()
{
	return JSON.stringify( {
		className: this.className,
		properties: this.properties,
		identity: this.identity,
		identityValue: this[ this.identity ]
	} );
}

/* Init --------------------------------------------------------------------- */

FUI.preInit = function()
{
	if( typeof( cAjax ) != 'undefined' )
	{
		FUI.initialize( { classList: [ 
			'View', 'Grid', 'Button', 'Input', 'Listview', 'Image', 
			'ImageButton', 'Label', 'TabList'
		] } );
	}
	else return setTimeout( FUI.preInit, 5 );
}

FUI.preInit();

