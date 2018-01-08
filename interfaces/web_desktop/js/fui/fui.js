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
fui.init = function( step )
{
	if( !step )
	{
		var classList = [
			'group', 'silly', 'button', 'input', 'list', 
			'screen', 'view', 'desklet', 'workspaces', 'windowlist'
		];
		var head = document.getElementsByTagName( 'head' )[0];
		var count = classList.length;
		for( var a = 0; a < classList.length; a++ )
		{
			var s = document.createElement( 'script' );
			// Friend mode
			if( typeof friendup != 'undefined' )
				s.src = '/webclient/js/fui/' + this.mode + '/' + classList[a] + '.js';
			// index.html test mode
			else s.src = this.mode + '/' + classList[a] + '.js';
			s.onload = function()
			{
				if( --count == 0 )
					fui.init( 'done' );
			}
			head.appendChild( s );
		}
		return;
	}
	else if( step == 'done' )
	{
		// Screens list - populates views - has default screen with views container
		fui.screens = [ new fui.Screen().create( {
			marginBottom: 100,
			show: true
		} ) ];

		// Default to first screen
		fui.currentScreen = fui.screens[ 0 ];
	
		// Ready to start FUI!
		if( fui.onready ) fui.onready();
	}
}
// Builds a gui on json structures
fui.build = function( elements, structure, surface )
{
	var pObject = surface;
	if( !surface )
	{
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
	for( var a in elements )
	{
		if( !elements[a].type ) continue;
		var flags = { surface: surface };
		for( var b in elements[ a ] )
		{
			// These are special flags
			if( elements[ a ][ b ] == 'type' ) continue;
			if( elements[ a ][ b ] == 'children' ) continue;
			flags[ b ] = elements[ a ][ b ];
		}
		
		// Build the ui
		var ele = new fui[ elements[ a ].type ]().create( flags );
		ele.parentObject = pObject;
		if( elements[ a ].children )
		{
			this.build( elements[ a ].children, structure, ele );
		}
		structure.children.push( ele );
	}
	return structure;
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
		switch( desc.type )
		{
			case 'div':
				var d = document.createElement( 'div' );
				if( desc.className )
					d.className = desc.className;
				if( desc.content )
					d.innerHTML = desc.content;
				if( desc.children )
					this.build( desc.children, d );
				if( desc.label ) d.setAttribute( 'label', desc.label );
				if( desc.name ) d.setAttribute( 'name', desc.name );
				if( desc.above === true )
				{
					d.style.zIndex = 2147483647 - 100; // 100 for overlays
				}
				if( desc.below === true )
				{
					d.style.zIndex = 1;
				}
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

