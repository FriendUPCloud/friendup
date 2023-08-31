/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Empty element
class FUITemplate extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        // if( domElement.getAttribute( 'someattribute' ) )
        //     do something
        
        
        //this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Do something with properties on dom
        /*
        if( this.property )
        {
            this.domElement.classList.add( 'FUIClassName' );
        }
        else
        {
            this.domElement.classList.remove( 'FUIClassName' );
        }*/
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	
    	/*let str = '<checkbox {options}/>';
    	let opts = [];
    	for( let a in data )
    	{
    		if( a == 'OnChange' )
    		{
    			opts.push( 'onchange="' + data[a] + '"' );
    		}
    		if( a == 'Value' && data[a] )
    		{
    			opts.push( 'checked="checked"' );
    		}
    	}
    	if( opts.length )
    	{
    		str = str.split( '{options}' ).join( opts.join( ' ' ) );
    	}
    	else
    	{
    		str = str.split( ' {options}' ).join( '' );
    	}
    	return str;*/
    }
}
FUI.registerClass( 'template', FUITemplate );



