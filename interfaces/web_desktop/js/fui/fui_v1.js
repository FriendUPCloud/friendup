/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Global
window.FUI = window.FUI ? window.FUI : {
    // Initial built-in classes
    classTypes: [ 'string' ],
    guiElements: {},
    fragments: {},
    callbacks: {},
    events: {
    	'click': []
    },
    // Create meta markup for a class instance
	create( data )
	{
		switch( data.type )
		{
			case 'string':
			{
				let str = data.value;
				// Extras are things that prepend the value
				if( data.extras )
					str = data.extras + str;
				// Additions are things that appear after the value
				if( data.additions )
					str += data.additions;
				return str;
			}
			default:
			{
    			let classStr = 'FUI' + data.type.substr( 0, 1 ).toUpperCase() + data.type.substr( 1, data.type.length - 1 );
			    try
			    {
                    let classObj = eval( classStr );
                    return( new classObj( data ).getMarkup( data ) );
                }
                catch( e )
                {
                    console.log( 'No such class type ' + classStr );
                }
                return '';
             }   
		}
	},
	// Registers a class to the factory
	registerClass( type, classDefinition )
	{
	    for( let a = 0; a < this.classTypes.length; a++ )
	    {
	        if( this.classTypes[ a ] == type ) return false;
	    }
	    this.classTypes.push( type );
	    
	    // Place class definition on window scope
	    if( classDefinition )
	    {
	    	window[  'FUI' + type.substr( 0, 1 ).toUpperCase() + type.substr( 1, type.length - 1 ) ] = classDefinition;
	    }
	},
	// Checks if a class exists
	classExists( type )
	{
		for( let a = 0; a < this.classTypes.length; a++ )
		{
			if( this.classTypes[ a ] == type ) return true;
		}
		return false;
	},
	// Loads a class and adds it to DOM, supports a callback when loaded
	loadClass( type, callback = false, skipInit = false )
	{
		if( !this.classExists( type ) )
		{
			let cj = document.createElement( 'script' );
			cj.src = '/webclient/js/fui/classes/' + type + '.fui.js';
			let cc = document.createElement( 'link' );
			cc.rel = 'stylesheet';
			cc.href = '/webclient/js/fui/classes/' + type + '.fui.css';
			let head = document.getElementsByTagName( 'head' )[0];
			cj.onload = function()
			{
				if( !skipInit )
					FUI.initialize();
				if( callback ) callback( true );
			}
			head.appendChild( cj );
			head.appendChild( cc );
		}
		else
		{
			if( callback ) callback( false );
		}
	},
	// Loads multiple classes
	loadClasses( typeList, callback = false )
	{
		let classLength = typeList.length;
		function counter( result ){
			if( --classLength == 0 )
			{
				// Done!
				if( callback ) 
					callback( true );
				// Initialize the specified types
				for( let a = 0; a < typeList.length; a++ )
					FUI.initialize( typeList[ a ] );
				// Initialize all the rest
				FUI.initialize();
			}
		};
		for( let a = 0; a < typeList.length; a++ )
		{
			this.loadClass( typeList[ a ], counter, true );
		}
	},
	// Initialize all gui elements on body
	initialize( type = false )
	{
		let types = this.classTypes;
		if( type ) types = [ type ];
		
		// Fetch all fragments
		let ifrags = document.getElementsByTagName( 'fui-fragment' );
		if( ifrags.length > 0 )
		{
			let frags = [];
			for( let a = 0; a < ifrags.length; a++ )
			{
				let id = ifrags[ a ].getAttribute( 'uniqueid' );
				if( !id ) continue;
				frags.push( { id: id, index: a, markup: ifrags[ a ].innerHTML, pnode: ifrags[ a ].parentNode, sourceNode: ifrags[ a ] } );
			}
			for( let a = 0; a < frags.length; a++ )
			{
				let f = frags[ a ];
				this.fragments[ f.id ] = f.markup;
				f.pnode.removeChild( f.sourceNode );
			}
			ifrags = null;
		}
		
		let jailClasses = { 'button': true, 'html': true, 'textarea': true, 'string': true, 'select': true };
		
		// Convert active class placeholders
		for( let b = 0; b < types.length; b++ )
		{
		    ( function( domtype )
		    {
		        // Convert markup into classes
		        let ch = false;
		        if( !jailClasses[ domtype ] )
		        {
		            ch = document.getElementsByTagName( domtype );
		        }
		        // TODO: Extract correct domtype from object
		        // Support fui-*
		        if( !ch || ( ch && !ch.length ) )
		        {
		        	ch = document.getElementsByTagName( 'fui-' + domtype );
		        }
		        if( ch.length > 0 )
		        {
				    let out = [];
				    for( let a = 0; a < ch.length; a++ )
				    {
				    	// Prevent system from reinitializing in a race condition
				    	if( !ch[a].getAttribute( 'initializing' ) )
				    	{
							ch[a].setAttribute( 'initializing', 'true' );
						    out.push( ch[a] );
						}
				    }
				    for( let a = 0; a < out.length; a++ )
				    {
				        ( function( el )
				        {
				            let classStr = 'FUI' + domtype.substr( 0, 1 ).toUpperCase() + domtype.substr( 1, domtype.length - 1 );
				            let opts = {};
				            opts.placeholderElement = el;
				            // Transfer innerHTML to options
				            if( opts.placeholderElement.childNodes.length )
				            {
				            	let els = opts.placeholderElement.getElementsByTagName( '*' );
				            	opts.childNodes = [];
				            	for( let b = 0; b < els.length; b++ )
				            	{
				            		if( els[b].parentNode != opts.placeholderElement ) continue;
				            		opts.childNodes.push( els[ b ] );
				            	}
						        opts.innerHTML = opts.placeholderElement.innerHTML;
				            }
				            eval( 'new ' + classStr + '( opts )' );
				        } )( out[a] );
				    }
				}
		    } )( types[b] );
		}
	},
	// Get a fragment for processing
	getFragment( uniqueid, replacements )
	{
		if( this.fragments[ uniqueid ] )
		{
		    let frag = this.fragments[ uniqueid ];
		    if( replacements )
		    {
		        return this.applyReplacements( frag, replacements );
		    }
			return frag;
		}
		return false;
	},
	// Apply replacements on string
	applyReplacements( string, kvchain )
	{
		string = string + ''; // Make sure it is a string
		for( let a in kvchain )
		{
			string = string.split( '{' + a + '}' ).join( kvchain[ a ] );
		}
		return string;
	},
	// Append child with initializer
	appendChild( parent, child )
	{
		parent.appendChild( child );
		this.initialize();
	},
	// Insert before element, with initializer
	insertBefore( newnode, parent )
	{
		parent.insertBefore( newnode, parent );
		this.initialize();
	},
	// Get that element!
	getElementByUniqueId( id )
	{
		return this.guiElements[ id ] ? this.guiElements[ id ] : false;
	},
	// Add a callback
	addCallback( callbackId, callbackFunc )
	{
		this.callbacks[ callbackId ] = callbackFunc;
	},
	// Simple system to allow stuff to add click on window
	addEvent( name, type, func )
	{
		if( this.events[ type ] )
		{
			this.events[ type ][ name ] = func;
			return true;
		}
		return false;
	},
	// Simple system to remove click event by name
	removeEvent( name, type )
	{
		if( this.events[ type ][ name ] )
		{
			this.events[ type ][ name ] = null;
			return true;
		}
		return false;
	}
};

// Activate click events
( function()
{
    let eventTypes = [ 'click', 'mouseup', 'mousedown', 'mousemove', 'keyup', 'keydown' ];
    for( let a in eventTypes )
    {
        let event = eventTypes[ a ];
        FUI.events[ event ] = [];
        window.addEventListener( event, function( e )
        {
	        if( FUI.events[ event ] )
	        {
		        for( let a in FUI.events[ event ] )
			        if( FUI.events[ event ][ a ] ) FUI.events[ event ][ a ]( e );
	        }
        } );
    }
} )();

// Base class
class FUIElement
{
    // Sets default values etc
    constructor( options, vars = false )
    {
        this.options = options ? options : false;
        
        if( vars ) for( let a in vars ){ this[ a ] = vars[ a ]; }
        
        if( this.options && typeof( options.uniqueid ) != 'undefined' && options.uniqueid )
        {
        	if( window.FUI.guiElements[ options.uniqueid ] )
        	{
        		console.log( 'FUI: Gui element with proposed uniqueId ' + options.uniqueid + ' is taken. Overwriting.' );
        	}
        	window.FUI.guiElements[ options.uniqueid ] = this;
        }
        
        let d = document.createElement( 'div' );
        this.domElement = d;
        
        if( this.initialize )
        	this.initialize();
        
        this.attachDomElement();
    }
    // Sets options on gui element
    setOptions( options )
    {
        for( let a in options )
        {
            this.options[ a ] = options[ a ];
        }
    }
    // Attaches GUI to dom element if specified
    attachDomElement()
    {
        if( this.options )
        {
		    if( !this.domElement.parentNode && this.options.containerElement )
		    {
		        this.grabAttributes( this.options.containerElement );
		        this.options.containerElement.appendChild( this.domElement );
		        return;
		    }
		    else if( !this.domElement.parentNode && this.options.placeholderElement )
		    {
		        this.grabAttributes( this.options.placeholderElement );
		        this.options.placeholderElement.parentNode.replaceChild( this.domElement, this.options.placeholderElement );
		        return;
		    }
	    }
        // Create placeholder
    	let d = document.createElement( 'div' );
    	document.body.appendChild( d );
    	if( !this.options ) this.options = new Object();
    	this.options.placeholderElement = d;
    	this.grabAttributes( this.options.placeholderElement );
        this.options.placeholderElement.parentNode.replaceChild( this.domElement, this.options.placeholderElement );
    }
    // Grabs attributes from the dom element if they are supported
    grabAttributes( domElement )
    {
    	let uid = domElement.getAttribute( 'uniqueid' );
    	if( uid )
    	{
    		// Set directly
			window.FUI.guiElements[ uid ] = this;
    	}
    }
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}
FUI.registerClass( 'element', FUIElement );


