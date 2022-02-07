/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Base namespace
fui = {
	mode: 'html5',
	theme: false,
	options: {
		View: {
			solidMoving: true,
			offscreenMove: false,
			gadgets: { depth: true, minimize: true, zoom: true },
			animations: { minimize: true, close: true },
			windowSnap: 5,
			screenSnap: 5,
			perspective: true
		},
		Screen: {
			move: { vertical: true }
		}
	},
	events: {},
	addEvent: function( k, v )
	{
		if( typeof( this.events[ k ] ) == 'undefined' )
		{
			this.events[ k ] = [];
		}
		this.events[ k ].push( v );
	},
	// Call events on key - with optional event structure supplied
	// Returns how many events were called
	executeEvents: function( k, e )
	{
		if( typeof( this.events[ k ] ) == 'undefined' ) return false;
		for( var a = 0; a < this.events[ k ].length; a++ )
		{
			this.events[ k ][ a ]( e );
		}
		return this.events[ k ].length;
	}
};

// Globals

// Release all objects
document.addEventListener( 'mouseup', function( e )
{
	fui.mouseObject = false;
	fui.mouseObjectInfo = false;
} );

// Moving elements
document.addEventListener( 'mousemove', function( e )
{
	if( fui.mouseObject && fui.mouseObjectInfo )
	{
		var x = fui.mouseObjectInfo.ox + ( e.clientX - fui.mouseObjectInfo.x );
		var y = fui.mouseObjectInfo.oy + ( e.clientY - fui.mouseObjectInfo.y );
		var coords = { x: x, y: y };
		if( fui.mouseObjectInfo.ondrag )
		{
			if( fui.mouseObjectInfo.ondrag( coords ) === false )
				return;
		}
		fui.mouseObject.style.left = coords.x + 'px';
		fui.mouseObject.style.top = coords.y + 'px';
	}
} );

// Fui
fui.rootObjects = [];
fui.parameters = [];
fui.loadJSON = function( jsonPath )
{
	fui.init();
	var cbk = false;
	if( fui.onready )
		cbk = fui.onready;
	fui.onready = function()
	{
		var f = new File( jsonPath );
		f.onLoad = function( data )
		{
			try
			{
				// Get JSON data
				var JSONdata = JSON.parse( data );
				// Do we have a callback?
				try
				{
					if( cbk ) cbk( fui.build( JSONdata ) );
					// No callback
					else
					{
						// Look for a member on the root stucture of type Init
						for( var a in JSONdata )
						{
							if( JSONdata[ a ].type == 'Init' )
							{
								var d = JSONdata[ a ];
								if( d.functionName )
								{
									// Let's find the function in the window scope
									if( window[ d.functionName ] )
									{
										return window[ d.functionName ]( fui.build( JSONdata ) );
									}
								}
								// We're done
								break;
							}
						}
					}
				}
				catch( e )
				{
					document.body.innerHTML = '<div class="Error Box">Could not build FUI based on JSON.</div>';
				}
			}
			catch( e )
			{
				document.body.innerHTML = '<div class="Error Box">Could not initialize JSON data.</div>';
			}
		}
		f.load();
	}
}
fui.init = function( params, step )
{
	if( params )
	{
		this.parameters = params;
	}
	if( !step )
	{
		var head = document.getElementsByTagName( 'head' )[0];
		
		this.classList = []; // To execute them
		
		// Add theme
		var th = document.createElement( 'script' );
		th.src = '/webclient/js/fui/themes/friendup/theme.js';
		th.onload = function()
		{
			if( --count == 0 )
				fui.init( false, 'done' );
		}
		head.appendChild( th );
		
		// The ones to load
		var classList = [
			'group', 'silly', 'button', 'input', 'list', 
			'screen', 'view', 'desklet', 'workspaces', 'windowlist',
			'tabs', 'htmltemplate', 'text', 'progressbar'
		];
		
		var count = classList.length + 1; // Plus theme
		for( var a = 0; a < classList.length; a++ )
		{
			var s = document.createElement( 'script' );
			// Friend mode
			if( typeof friendup != 'undefined' )
				s.src = '/webclient/js/fui/' + this.mode + '/' + classList[a] + '.js';
			else if( typeof friend != 'undefined' )
			{
				s.src = '/webclient/js/fui/' + this.mode + '/' + classList[a] + '.js';
			}
			// index.html test mode
			else s.src = this.mode + '/' + classList[a] + '.js';
			s.onload = function()
			{
				if( --count == 0 )
					fui.init( false, 'done' );
			}
			head.appendChild( s );
		}
		return;
	}
	else if( step == 'done' )
	{
		// Load class list now (but respect dependencies)!
		var initializedLength = 0;
		while( initializedLength < this.classList.length )
		{
			for( var a = 0; a < this.classList.length; a++ )
			{
				var cb = this.classList[a].init;
				if( !cb ) continue;
				var deps = this.classList[a].dependencies.split( ',' );
				var hasDeps = true;
				for( var b = 0; b < deps.length; b++ )
				{
					deps[b] = Trim( deps[b] );
					if( !fui[deps[b]] )
					{
						hasDeps = false;
						break;
					}
				}
				if( hasDeps )
				{
					cb();
					this.classList[a].init = false;
					initializedLength++;
				}
			}
		}
		this.classList = [];
		
		// Screens list - populates views - has default screen with views container
		if( this.parameters.initWorkspace )
		{
			fui.screens = [ new fui.Screen().create( {
				marginBottom: 100,
				show: true
			} ) ];

			// Default to first screen
			fui.currentScreen = fui.screens[ 0 ];
		}
	
		this.addCSS( `
.FUIBorderSolid
{
	border: ${fui.theme.border.solidSize} solid ${fui.theme.border.solidColor};
	box-sizing: border-box;
}
.FUIBorderLeft
{
	border-left: ${fui.theme.border.solidSize} solid ${fui.theme.border.solidColor};
	box-sizing: border-box;
}
.FUIBorderTop
{
	border-top: ${fui.theme.border.solidSize} solid ${fui.theme.border.solidColor};
	box-sizing: border-box;
}
.FUIBorderRight
{
	border-right: ${fui.theme.border.solidSize} solid ${fui.theme.border.solidColor};
	box-sizing: border-box;
}
.FUIBorderBottom
{
	border-bottom: ${fui.theme.border.solidSize} solid ${fui.theme.border.solidColor};
	box-sizing: border-box;
}
		` );
	
		// Ready to start FUI!
		if( !fui.iterated ) fui.iterated = 0;
		if( fui.onready ) fui.onready();
	}
}
// Add static CSS to the environment
fui.addCSS = function( css )
{
	var d = document.createElement( 'style' );
	d.type = 'text/css';
	d.innerHTML = css;
	document.getElementsByTagName( 'head' )[0].appendChild( d );
}
// Async add class, wich string comma separated list of dependencies
fui.addClass = function( cb, dependencies )
{
	this.classList.push( { init: cb, dependencies: dependencies } );
}
// Builds a gui on json structures
fui.build = function( elements, structure, surface )
{
	var pObject = surface;
	if( !surface )
	{
		// Create screen if it doesn't exist
		if( !fui.currentScreen )
		{
			var d = document.createElement( 'div' );
			d.className = 'FUIScreenContainer ContentFull';
			document.body.appendChild( d );
			fui.currentScreen = { dom: d };
		}
		surface = fui.currentScreen.domContent ? fui.currentScreen.domContent : fui.currentScreen.dom;
		pObject = fui.currentScreen;
	}
	if( !structure )
	{
		structure = {
			get: function( name )
			{
				for( var a = 0; a < this.children.length; a++ )
				{
					if( !this.children[ a ].getByName( name ) ) continue;
					return this.children[ a ];
				}
				return false;
			},
			children: []
		};
	}
	// All "JSON" structure elements
	var child = 0;
	for( var a in elements )
	{
		if( !elements[a].type ) continue;
		if( elements[a].type == 'Init' ) continue; // The special init is ignored
		var flags = { surface: surface };
		for( var b in elements[ a ] )
		{
			// These are special flags
			if( elements[ a ][ b ] == 'type' ) continue;
			if( elements[ a ][ b ] == 'children' ) continue;
			flags[ b ] = elements[ a ][ b ];
		}
		
		// Defaults
		if( typeof( flags[ 'show' ] ) == 'undefined' )
			flags.show = true;
		if( typeof( flags.height ) == 'undefined' )
			flags.height = '100%';
		
		// Build the ui
		if( !fui[ elements[ a ].type ] ) 
		{
			console.log( 'FUI: Class not found! (' + elements[a].type + ')' );
			continue;
		}
		var ele = new fui[ elements[ a ].type ]().create( flags );
		ele.parentObject = pObject;
		if( surface && surface.childProcessor )
		{
			surface.childProcessor( ele.dom, child++ );
		}
		if( elements[ a ].children )
		{
			this.build( elements[ a ].children, structure, ele );
		}
		structure.children.push( ele );
	}
	if( structure ) this.rootObjects.push( structure );
	return structure;
}

// Global get by name
fui.getByName = function( nam )
{
	for( var a = 0; a < this.rootObjects.length; a++ )
	{
		for( var b = 0; b < this.rootObjects[a].children.length; b++ )
		{
			var child = this.rootObjects[a].children[b];
			var el = child.getByName( nam );
			if( el ) return el;
		}
	}
	return false;
}

// Enable element dragging!
fui.initMouseDragging = function( d, e )
{
	this.mouseObject = d;
	this.mouseObjectInfo = {
		x: e.clientX,
		y: e.clientY,
		ox: d.offsetLeft,
		oy: d.offsetTop
	};
}

/**
 * Inheritance with multiple inheritance support
 *
 * synopsis: var func = ( new fui.Base() ).inherit();
 *
 * object {FUI object}
 *
 */
 
fui.inherit = oo.inherit;

/**
 * Base object
 *
 */
fui.Base = function()
{
	this.parent = false;
	this.domChildren = false;
	this.children = [];
	this.flags = [];
}

/**
 * Creates the FUI object
 *
 * flags {FUI flag object}
 *
 */
fui.Base.prototype.create = function( flags )
{
	if( typeof( flags ) == 'object' )
	{
		this.flags = flags;
	}
	return this;
}

/**
 * Creates the FUI object
 *
 * description {multidimensional array}, parent {parent fui container}
 *
 * Note: this class will be overloaded by other toolkit implementations
 */
fui.Base.prototype.build = function( description, parent )
{
	if( !parent ) parent = this.parent;
	if( !parent ) return false;
	var first = false;
	for( var a = 0; a < description.length; a++ )
	{
		var desc = description[ a ];
		
		// Defaults
		if( typeof( desc.show ) == 'undefined' )
			desc.show = true;
		if( typeof( desc.height ) == 'undefined' )
			desc.height = '100%';
		
		switch( desc.type )
		{
			case 'div':
				var d = document.createElement( 'div' );
				if( desc.className )
					d.className = desc.className;
				if( desc.content )
					d.innerHTML = desc.content;
				if( desc.children )
				{
					this.build( desc.children, d );
				}
				if( desc.label ) d.setAttribute( 'label', desc.label );
				if( desc.name )
				{
					d.setAttribute( 'name', desc.name );
				}
				if( desc.above === true )
				{
					d.style.zIndex = 2147483647 - 100; // 100 for overlays
				}
				if( desc.below === true )
				{
					d.style.zIndex = 1;
				}
				if( desc.lineHeight != 'auto' )
					d.style.lineHeight = parseInt( desc.lineHeight ) + 'px';
				if( desc.width >= 0 )
					d.style.width = desc.width + 'px';
				if( desc.height >= 0 )
					d.style.height = desc.height + 'px';
				if( desc.bottom >= 0 )
					d.style.bottom = desc.bottom + 'px';
				if( desc.top >= 0 )
					d.style.top = desc.top + 'px';
				if( desc.left >= 0 )
					d.style.left = desc.left + 'px';
				if( desc.right >= 0 )
					d.style.right = desc.right + 'px';
				if( desc.background )
					d.style.background = desc.background;
				// Add the element
				if( parent.appendChild ) parent.appendChild( d );
				else if( parent.domContent )
					parent.domContent.appendChild( d );
				if( !first ) first = d;
				break;
			case 'input_text':
				var d = document.createElement( 'input' );
				d.setAttribute( 'type', 'text' );
				if( desc.className )
					d.className = desc.className;
				if( desc.children )
					this.build( desc.children, d );
				if( desc.label ) d.setAttribute( 'label', desc.label );
				if( desc.name ) d.setAttribute( 'name', desc.name );
				if( desc.width )
					d.style.width = desc.width + 'px';
				if( desc.height )
					d.style.height = desc.height + 'px';
				// Add the element
				if( parent.appendChild ) parent.appendChild( d );
				else if( parent.domContent ) parent.domContent.appendChild( d );
				if( !first ) first = d;
				if( desc.focus )
				{
					// Setting delayed to win race condition
					setTimeout( function()
					{
						d.focus();
					}, 50 );
				}
				break;
			default:
				break;
		}
	}
	return first;
}

/**
 * Gets a gui element by name
 *
 * description {multidimensional array}, parent {parent fui container}
 *
 */

/**
 * Gets a gui element by label
 *
 * description {multidimensional array}, parent {parent fui container}
 *
 */
fui.Base.prototype.get = function( label, parent )
{
	if( !parent && this.dom ) parent = this.dom;
	if( !parent ) parent = this.parent;
	if( !parent ) return false;
	
	if( parent.getAttribute && parent.getAttribute( 'label' ) == label )
		return parent;
	
	if( parent.childNodes && parent.childNodes.length )
	{
		for( var a = 0; a < parent.childNodes.length; a++ )
		{
			var nod = parent.childNodes[ a ];
			if( nod.getAttribute && nod.getAttribute( 'label' ) == label )
			{
				return nod;
			}
			var test = this.get( label, nod );
			if( test ) return test;
		}
	}
	return false;
}
fui.Base.prototype.getByName = function( name, parent )
{
	if( !parent && this.dom ) parent = this.dom;
	if( !parent ) parent = this.parent;
	if( !parent ) return false;
	
	if( parent.getAttribute && parent.getAttribute( 'name' ) == name )
		return parent;
	
	if( parent.childNodes && parent.childNodes.length )
	{
		for( var a = 0; a < parent.childNodes.length; a++ )
		{
			var nod = parent.childNodes[ a ];
			if( nod.getAttribute && nod.getAttribute( 'name' ) == name )
			{
				return nod;
			}
			var test = this.get( name, nod );
			if( test ) return test;
		}
	}
	if( parent.children )
	{
		for( var a = 0; a < parent.children.length; a++ )
		{
			var el = this.getByName( name, parent.children[ a ] );
			if( el ) return el;
		}
	}
	return false;
}

/**
 * Adds an event to an object
 *
 * evt {string event}, callback {callback function}
 *
 */
fui.Base.prototype.addEvent = function( evt, callback )
{
	if( this.dom )
	{
		return this.dom.addEventListener( evt, callback );
	}
	return;
}

/**
 * Checks if child exists
 *
 * object {FUI object}
 *
 */
fui.Base.prototype.childExists = function( object )
{
	for( var a = 0; a < this.children.length; a++ )
	{
		if( this.children[a] == object )
			return object;
	}
	return false;
}

/**
 * Adds a child fui object
 *
 * object {FUI object}
 *
 */
fui.Base.prototype.addChild = function( object )
{
	// Check if it exists
	if( !this.childExists( object ) )
	{
		if( this.domChildren )
		{
			this.domChildren.appendChild( object );
			this.children.push( object );
			object.parent = this.domChildren;
			return true;
		}
	}
	return false;
}

/**
 * Sets flags
 */
fui.Base.prototype.setFlag = function( key, value )
{
	switch( key )
	{
		case 'name':
			this.flags.name = value;
			return true;
	}
}


/**
 * Destroys self
 *
 * object {FUI object}
 *
 * callbacks: ondestroy - clean the object!
 *
 */
fui.Base.prototype.destroy = function( object )
{
	if( this.ondestroy )
		this.ondestroy();
	return true;
}

/**
 * Removes a child
 *
 * object {FUI object}
 *
 */
fui.Base.prototype.removeChild = function( object )
{
	// Check if it exists
	if( this.childExists( object ) )
	{
		var out = [];
		for( var a = 0; a < this.children.length; a++ )
		{
			if( this.children[ a ] != object )
				out.push( this.children[ a ] );
		}
		object.destroy();
		this.children = out;
		return true;
	}
	return false;
}

