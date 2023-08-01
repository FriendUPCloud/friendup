/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIPopwidget extends FUIElement
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
        
        this.domElement.className = 'FUIPopwidget';
        this.domElement.innerHTML = '';
        
        if( this.options.blocker )
        {
        	let blocker = document.createElement( 'div' );
        	blocker.className = 'FUIPopwidgetBlocker';
	        this.domElement.parentNode.appendChild( blocker );
	        this.blocker = blocker;
	        blocker.onclick = function(){ self.destroy(); }
        }
        
        // Get left position
        let leftO = this.options.originElement;
        let left = 0;
        while( leftO != document.body )
        {
            left += leftO.offsetLeft;
            leftO = leftO.parentNode;
        }
        
        // Dims and position and constraints
        left += ( this.options.originElement.offsetWidth / 2 );
        let top  = GetElementTop(  this.options.originElement );
        let w = this.options.width;
        let h = this.options.height;
        left -= w / 2;
        top -= h;
        if( top < 0 ) top = 0;
        if( left < 0 ) left = 0;
        if( left + w >= document.body.offsetWidth )
        {
            left -= ( left + w ) - document.body.offsetWidth;
            if( left < 0 )
            {
                left = 0;
                w = document.body.offsetWidth;
            }
        }
        if( top + h >= document.body.offsetHeight )
        {
            top -= ( top + h ) - document.body.offsetHeight;
            if( top < 0 )
            {
                top = 0;
                h = document.body.offsetHeight;
            }
        }
        
        this.domElement.style.left = left + 'px';
        this.domElement.style.top = top + 'px';
        this.domElement.style.width = w + 'px';
        this.domElement.style.height = h + 'px';
        this.domElement.innerHTML = '<div class="Content">' + this.options.content + '</div>';
        this.domElement.addEventListener( 'click', function( e )
        {
            if( self.options.clickCallback )
            {
                self.options.clickCallback( e );
            }
        } );
        
        setTimeout( function(){ self.domElement.classList.add( 'Showing' ); }, 2 );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
    }
    destroy()
    {
        let self = this;
        if( this.onDestroy )
        {
        	this.onDestroy();
        }
        this.domElement.classList.remove( 'Showing' );
        if( this.blocker )
        {
        	if( this.blocker.parentNode )
	        	this.blocker.parentNode.removeChild( this.blocker );
    	}
        setTimeout( function()
        {
            if( self.domElement.parentNode )
                self.domElement.parentNode.removeChild( self.domElement );
        }, 250 );
    }
    // Get markup for object
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let props = '';
    	let n = 0;
    	for( let a in this.options )
    	{
    	    if( n++ > 0 ) props += ' ';
    	    props += a + '="' + props[ a ] + '"';
    	}
    	return '<fui-popwidget' + props + '></fui-popwidget>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
}
FUI.registerClass( 'popwidget', FUIPopwidget );

