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
                    return( new classObj().getMarkup( data ) );
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
		let frags = document.getElementsByTagName( 'fui-fragment' );
		if( frags.length > 0 )
		{
			for( let a = 0; a < frags.length; a++ )
			{
				let id = frags[ a ].getAttribute( 'uniqueid' );
				if( !id ) continue;
				this.fragments[ id ] = frags[ a ];
				frags[ a ].parentNode.removeChild( frags[ a ] );
			}
		}
		
		// Convert active class placeholders
		for( let b = 0; b < types.length; b++ )
		{
		    ( function( domtype )
		    {
		        // Convert markup into classes
		        let ch = document.getElementsByTagName( domtype );
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
				        let classStr = 'FUI' + domtype.substr( 0, 1 ).toUpperCase() + domtype.substr( 1, domtype.length - 1 );
				        let classObj = eval( classStr );
				        new classObj( { placeholderElement: out[a] } );
				    }
				}
		    } )( types[b] );
		}
	},
	// Get a fragment for processing
	getFragment( uniqueid )
	{
		if( this.fragments[ uniqueid ] )
			return this.fragments[ uniqueid ].innerHTML;
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
	}
};

// Base class
class FUIElement
{
    // Sets default values etc
    constructor( options )
    {
        this.options = options;
        
        if( options.uniqueid )
        {
        	if( window.FUI.guiElements[ options.uniqueid ] )
        	{
        		console.log( 'ccGUI: Gui element with proposed uniqueId ' + options.uniqueid + ' is taken. Overwriting.' );
        	}
        	window.FUI.guiElements[ options.uniqueid ] = this;
        }
        
        let d = document.createElement( 'div' );
        this.domElement = d;
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
        if( !this.options ) return;
        
        if( !this.domElement.parentNode && this.options.containerElement )
        {
            this.grabAttributes( this.options.containerElement );
            this.options.containerElement.appendChild( this.domElement );
        }
        else if( !this.domElement.parentNode && this.options.placeholderElement )
        {
            this.grabAttributes( this.options.placeholderElement );
            this.options.placeholderElement.parentNode.replaceChild( this.domElement, this.options.placeholderElement );
        }
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

