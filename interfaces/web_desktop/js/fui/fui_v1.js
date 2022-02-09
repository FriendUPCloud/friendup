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
    // Create meta markup for a class instance
	create( data )
	{
		switch( data.type )
		{
			case 'string':
				let str = data.value;
				// Extras are things that prepend the value
				if( data.extras )
					str = data.extras + str;
				// Additions are things that appear after the value
				if( data.additions )
					str += data.additions;
				return str;
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
	registerClass( type )
	{
	    for( let a = 0; a < this.classTypes.length; a++ )
	    {
	        if( this.classTypes[ a ] == type ) return false;
	    }
	    this.classTypes.push( type );
	},
	// Initialize all gui elements on body
	initialize()
	{
		let types = this.classTypes;
		
		for( let b = 0; b < types.length; b++ )
		{
		    ( function( domtype )
		    {
		        // Convert markup into classes
		        let ch = document.getElementsByTagName( domtype );
		        let out = [];
		        for( let a = 0; a < ch.length; a++ )
		        {
		            out.push( ch[a] );
		        }
		        for( let a = 0; a < out.length; a++ )
		        {
		            let classStr = 'FUI' + domtype.substr( 0, 1 ).toUpperCase() + domtype.substr( 1, domtype.length - 1 );
		            let classObj = eval( classStr );
		            new classObj( { placeholderElement: out[a] } );
		        }
		    } )( types[b] );
		}
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
	}
	// Add a callback
	addCallback( callbackId, callbackFunc )
	{
		window.FUI.callbacks[ callbackId ] = callbackFunc;
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

