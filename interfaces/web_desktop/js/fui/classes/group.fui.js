/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIGroup extends FUIElement
{
    constructor( options )
    {
    	super( options );
    }
    
    // Sets options on gui element
    setOptions( options )
    {
        if( options.value )
            this.value = options.value;
        if( options.elements )
            this.elements = options.elements;
    }
    
    // Attaches GUI to dom element if specified
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'FUI', 'FUIGroup' );
        
        this.refreshDom();
    }
    
    // Grabs attributes from the dom element if they are supported
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let self = this;
        
        this.domElement.innerHTML = '';
        
        // Support fixed width
        let width = domElement.getAttribute( 'width' );
        if( width )
        {
        	this.domElement.style.width = width;
        }
        
        // Support fixed height
        let height = domElement.getAttribute( 'height' );
        if( height )
        {
        	this.domElement.style.height = height;
        }
        
        // Support gap
        let gap = domElement.getAttribute( 'gap' );
        if( gap )
        {
        	let int = parseInt( gap );
        	if( isNaN( int ) ) int = 0;
        	this.domElement.style.gap = int + 'px';
        }
        
        // Support margins
        let margin = domElement.getAttribute( 'margin' );
        if( margin )
        {
        	if( margin == 'normal' )
        	{
        		this.domElement.style.padding = 'var(--fui-padding-normal)';
        	}
        	else if( margin == 'small' )
        	{
        		this.domElement.style.padding = 'var(--fui-padding-row)';
        	}
        	else if( margin == 'large' )
        	{
        		this.domElement.style.padding = 'var(--fui-padding-large)';
        	}
        	else
        	{
		    	let int = parseInt( margin );
		    	if( isNaN( int ) ) int = 0;
		    	this.domElement.style.margin = int + 'px';
		    }
        }
        // Left margin
        let marginLeft = domElement.getAttribute( 'margin-left' );
        if( marginLeft )
        {
            if( marginLeft == 'normal' )
        	{
        		this.domElement.style.paddingLeft = 'var(--fui-padding-normal)';
        	}
        	else if( marginLeft == 'small' )
        	{
        		this.domElement.style.paddingLeft = 'var(--fui-padding-row)';
        	}
        	else if( marginLeft == 'large' )
        	{
        		this.domElement.style.paddingLeft = 'var(--fui-padding-large)';
        	}
        	else
        	{
		    	let int = parseInt( marginLeft );
		    	if( isNaN( int ) ) int = 0;
		    	this.domElement.style.marginLeft = int + 'px';
		    }
        }
        // Right margin
        let marginRight = domElement.getAttribute( 'margin-right' );
        if( marginRight )
        {
            if( marginRight == 'normal' )
        	{
        		this.domElement.style.paddingRight = 'var(--fui-padding-normal)';
        	}
        	else if( marginRight == 'small' )
        	{
        		this.domElement.style.paddingRight = 'var(--fui-padding-row)';
        	}
        	else if( marginRight == 'large' )
        	{
        		this.domElement.style.paddingRight = 'var(--fui-padding-large)';
        	}
        	else
        	{
		    	let int = parseInt( marginRight );
		    	if( isNaN( int ) ) int = 0;
		    	this.domElement.style.marginRight = int + 'px';
		    }
        }
        
        // Group containers with rows cannot have columns
        let rowcontainer = domElement.getElementsByTagName( 'rows' );
        if( rowcontainer.length )
        {
            if ( rowcontainer[0].parentNode == domElement )
            {
                rowcontainer = rowcontainer[0];
                
                this.setGroupAttributes( rowcontainer );
                
                let rows = rowcontainer.getElementsByTagName( 'row' );
                for( let a = 0; a < rows.length; a++ )
                {
                    if( rows[a].parentNode != rowcontainer )
                        continue;
                    
                    let d = document.createElement( 'div' );
                    d.className = 'FUIRow';
                    
                    // Is column scrollable?
                    let scrollable = rows[a].getAttribute( 'scrollable' );
                    if( scrollable )
                    {
                        d.style.overflow = 'auto';
                        d.style.scrollBehavior = '';
                        if( scrollable == 'smooth' )
                        {
                            d.style.scrollBehavior = 'smooth';
                        }
                    }
                    
                    // Add padding
                    let padding = rows[a].getAttribute( 'padding' );
                    if( padding )
                    {
                    	switch( padding )
                    	{
                    		case 'row':
                    		case 'small':
                    		case 'normal':
                    		case 'big':
    	                		d.style.padding = 'var(--fui-padding-' + padding + ')';
    	                		break;
                    	}
                    }
                    
                    let uniqueid = rows[a].getAttribute( 'uniqueid' );
                    if( uniqueid )
                    {
                        d.uniqueid = uniqueid;
                    }
                    
                    let children = rows[a].getElementsByTagName( '*' );
                    for( let b = 0; b < children.length; b++ )
                    {
                        if( children[b].parentNode != rows[a] )
                            continue;
                        d.appendChild( children[b] );
                    }
                    this.domElement.appendChild( d );
                }
                this.domElement.classList.remove( 'FUIColumns' );
                this.domElement.classList.add( 'FUIRows' );
                return;
            }
        }  
        
        // Group containers with columns cannot have rows
        let colcontainer = domElement.getElementsByTagName( 'columns' );
        if( colcontainer.length )
        {
            if ( colcontainer[0].parentNode == domElement )
            {
                colcontainer = colcontainer[0];
                
                this.setGroupAttributes( colcontainer );
                
                let columns = colcontainer.getElementsByTagName( 'column' );
                for( let a = 0; a < columns.length; a++ )
                {
                    if( columns[a].parentNode != colcontainer )
                        continue;
                    
                    let d = document.createElement( 'div' );
                    d.className = 'FUIColumn';
                    
                    // Is column scrollable?
                    let scrollable = columns[a].getAttribute( 'scrollable' );
                    if( scrollable )
                    {
                        d.style.overflow = 'auto';
                        d.style.scrollBehavior = '';
                        if( scrollable == 'smooth' )
                        {
                            d.style.scrollBehavior = 'smooth';
                        }
                    }
                    
                    // Add padding
                    let padding = columns[a].getAttribute( 'padding' );
                    if( padding )
                    {
                    	switch( padding )
                    	{
                    		case 'row':
                    		case 'small':
                    		case 'normal':
                    		case 'big':
    	                		d.style.padding = 'var(--fui-padding-' + padding + ')';
    	                		break;
                    	}
                    }
                    
                    if( columns[a].getAttribute( 'id' ) )
                    {
                        d.id = columns[a].getAttribute( 'id' );
                    }
                    let children = columns[a].getElementsByTagName( '*' );
                    for( let b = 0; b < children.length; b++ )
                    {
                        if( children[b].parentNode != columns[a] )
                            continue;
                        d.appendChild( children[b] );
                    }
                    this.domElement.appendChild( d );
                }
                this.domElement.classList.remove( 'FUIRows' );
                this.domElement.classList.add( 'FUIColumns' );
                return;
            }
        }
    }
    
    setGroupAttributes( domElement )
    {
        // Use gap for flex box
        let gap = domElement.getAttribute( 'gap' );
        if( gap )
        {
        	let int = parseInt( gap );
        	if( isNaN( int ) ) int = 0;
        	this.domElement.style.gap = int + 'px';
        }
        
        // Set height based on parent
        let height = domElement.getAttribute( 'height' );
        if( height )
        {
            this.domElement.style.height = height;
        }
        let width = domElement.getAttribute( 'width' );
        if( width )
        {
        	this.domElement.style.width = width;
        }
    }
    
    // Get an element by id
    getElementByUniqueId( id )
    {
    	let eles = this.domElement.childNodes;
    	for( let a = 0; a < eles.length; a++ )
    	{
    		if( eles[ a ].uniqueid == id )
    		{
    		    return {
    		        domElement: eles[ a ],
    		        setContent: function( cnt )
    		        {
    		            this.domElement.innerHTML = cnt;
    		            FUI.initialize();
    		            return true;
    		        }
        		};
        	}
    		let eles2 = eles[ a ].childNodes;
    		if( eles2 )
    		{
    			for( let b = 0; b < eles2.length; b++ )
    			{
		    		if( eles2[ b ].id == id )
		    		{
						return {
							domElement: eles[ b ],
							setContent: function( cnt )
							{
								this.domElement.innerHTML = cnt;
								FUI.initialize();
								return true;
							}
						};
					}
		    	}
		    }
    	}
    	// Fails
    	return false;
    }
    
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}
FUI.registerClass( 'group', FUIGroup );

