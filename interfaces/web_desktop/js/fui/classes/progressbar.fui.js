/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( !FUI.classExists( 'progressbar' ) )
{

	// Checkbox element
	class FUIProgressbar extends FUIElement
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
		    this.domElement.classList.add( 'FUIProgressbar' );
		    
		    let d = document.createElement( 'div' );
		    d.className = 'FUIProgressGroove';
		    this.domElement.appendChild( d );
		    
		    let b = document.createElement( 'div' );
		    b.className = 'FUIProgressBar';
		    d.appendChild( b );
		    
		    let pc = document.createElement( 'div' );
		    pc.className = 'FUIProgressBarText';
		    d.appendChild( pc );
		    
		    this.indicator = pc;
		    
		    this.bar = b;
		    
		    this.refreshDom();
		}
		grabAttributes( domElement )
		{
		    super.grabAttributes( domElement );
		    
		    let pct = domElement.getAttribute( 'progress' );
		    if( pct )
		    {
		    	this.options.percent = parseInt( pct );
		    }
		    
		    this.refreshDom();
		}
		refreshDom()
		{
		    super.refreshDom();
		    
		    // Do something with properties on dom
		    if( this.bar )
		    {
			    this.bar.style.width = this.options.percent ? ( parseInt( this.options.percent ) + '%' ) : '0%';
			    this.indicator.innerHTML = '<span>' + ( this.options.percent ? ( parseInt( this.options.percent ) + '%' ) : '0%' ) + '</span>';
			    let progressClasses = [ 'FUIPG0', 'FUIPG20', 'FUIPG40', 'FUIPG60', 'FUIPG80', 'FUIPG100' ];
			    for( let a = 0, b = 0; a < 100; a += 20, b++ )
			    {
			    	if( parseInt( this.options.percent ) >= a && parseInt( this.options.percent ) < a + 20 )
			    	{
			    		this.bar.classList.add( progressClasses[ b ] );
			    	}
			    	else
			    	{
			    		this.bar.classList.remove( progressClasses[ b ] );
			    	}
			    }
			}
		}
		getMarkup( data )
		{
			// Return meta-markup for class instantiation later
			return '<progressbar progress="' + ( this.options.progress ? this.options.progress : '0%' ) + '"/>';
		}
	}
	FUI.registerClass( 'progressbar', FUIProgressbar );
}


