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
    // Create meta markup for a class instance
	create( data )
	{
		switch( data.Type )
		{
			case 'string':
				return data.Value;
				break;
			default:
			{
    			let classStr = 'FUI' + data.Type.substr( 0, 1 ).toUpperCase() + data.Type.substr( 1, data.Type.length - 1 );
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
    }
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}

