/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( !FUI.classExists( 'section' ) )
{
	// Checkbox element
	class FUISection extends FUIElement
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
		    this.domElement.classList.add( 'FUISection' );
		    
		    let h = document.createElement( 'div' );
		    h.classList.add( 'FUISectionHeader' );
		    this.domElement.appendChild( h );
		    
		    this.sectionHeader = h;
		    
		    let d = document.createElement( 'div' );
		    d.classList.add( 'FUISectionContent' );
		    this.domElement.appendChild( d );
		    
		    this.sectionContent = d;
		    
		    let b = document.createElement( 'div' );
		    b.classList.add( 'FUISectionFooter' );
		    this.domElement.appendChild( b );
		    
		    this.sectionFooter = b;
		    
		    this.refreshDom();
		}
		grabAttributes( domElement )
		{
		    super.grabAttributes( domElement );
		    
		    let header = domElement.getElementsByTagName( 'sectionheader' );
		    if( header )
		    {
		    	this.options.header = header[0].innerHTML;
		    }
		}
		refreshDom()
		{
		    super.refreshDom();
		    
		    if( this.options.header )
		    {
		    	this.setHeader( this.options.header );
		    }
		}
		
		getMarkup( data )
		{
			
		}
		
		// Set section header
		setHeader( data )
		{
			this.sectionHeader.innerHTML = '<h2>' + data + '</h2>';
		}
		
		// Set section content
		setContent( data )
		{
			this.sectionContent.innerHTML = data;
			FUI.initialize();
		}
		
		// Set section content
		setFooter( data )
		{
			this.sectionFooter.innerHTML = data;
			FUI.initialize();
		}
	}

	FUI.registerClass( 'section', FUISection );

}

