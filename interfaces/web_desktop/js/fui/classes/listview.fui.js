/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIListview extends FUIElement
{
    constructor( options )
    {
    	super( options );
        if( !this.options.hasHeader )
	        this.options.hasHeader = false;
	    if( !this.options.hasHeader )
	        this.options.hasHeaders = false;
	    if( !this.options.hasRows )
	        this.options.hasRows = false;
    }
    
    attachDomElement()
    {
        super.attachDomElement();
        
        this.domElement.classList.add( 'FUI', 'FUIListview' );
    }
    
    grabAttributes( domElement )
    {
        let self = this;
        
        let header = domElement.getElementsByTagName( 'listviewhead' );
        let headers = domElement.getElementsByTagName( 'listviewheaders' );
        let rows = domElement.getElementsByTagName( 'listviewrows' );
        
        if( header )
        {
        	header = header[0];
            this.options.hasHeader = true;
            
            let d = document.createElement( 'div' );
            d.className = 'FUIListviewHeader';
            
            // Add the heading
            let heading = false;
            if( ( heading = header.getElementsByTagName( 'listviewheading' ) ) )
            {
            	heading = heading[0];
            	let h = document.createElement( 'h2' );
            	h.innerHTML = heading.innerHTML;
            	d.appendChild( h );
            }
            
            let toolbar = false;
            if( ( toolbar = header.getElementsByTagName( 'listviewtoolbar' ) ) )
            {
            	toolbar = toolbar[0];
            	if( toolbar )
            	{
		        	let t = document.createElement( 'div' );
		        	t.className = 'Left';
		        	
		        	let buttons = false;
		        	if( ( buttons = toolbar.getElementsByTagName( 'listviewbutton' ) ) )
		        	{
		        		for( let a = 0; a < buttons.length; a++ )
		        		{
		        			let b = document.createElement( 'div' );
		        			b.classList.add( 'HeaderButton', 'IconSmall', 'MousePointer' );
		        			let icon = '';
		        			if( ( icon = buttons[a].getAttribute( 'icon' ) ) )
		        			{
		        				b.classList.add( 'fa-' + icon );
		        			}
		        			let cb = false;
		        			if( ( cb = buttons[a].getAttribute( 'onclick' ) ) )
		        			{
				    			( function( ele, cbk )
				    			{
				    				ele.onclick = function()
				    				{
										// Trigger callback
						                if( window.FUI.callbacks[ cbk ] )
						                {
						                    // Add structure with current element flags
						                    window.FUI.callbacks[ cbk ]( self );
						                }
						            }
								} )( b, cb );
							}
		        			t.appendChild( b );
		        		}
		        	}
		        	d.appendChild( t );
		    	}
            }
            
            this.domElement.appendChild( d );
        }
        
        self.headerElements = [];
        
        if( headers )
        {
        	headers = headers[0];
            this.options.hasHeaders = true;
            
            let d = document.createElement( 'div' );
            d.className = 'FUIListviewHeaders BorderTop';
            
            let headerelements = headers.getElementsByTagName( 'listviewheader' );
            let row = document.createElement( 'div' );
            row.className = 'HRow';
            
            for( let a = 0; a < headerelements.length; a++ )
            {
            	self.headerElements[ a ] = {};
            	self.headerElements[ a ].width = parseInt( headerelements[a].getAttribute( 'width' ) );
            	self.headerElements[ a ].align = headerelements[a].getAttribute( 'align' );
            	self.headerElements[ a ].name = headerelements[a].getAttribute( 'name' ) ? headerelements[a].getAttribute( 'name' ) : headerelements[a].innerText;
            	self.headerElements[ a ].text = headerelements[a].innerText;
            	if( !self.headerElements[ a ].align ) self.headerElements[ a ].align = 'left';
            	let h = document.createElement( 'div' );
            	let alignment = self.headerElements[ a ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
            	h.className = 'HContent' + self.headerElements[ a ].width + ' PaddingSmall Ellipsis FloatLeft' + alignment;
            	h.innerHTML = headerelements[ a ].innerHTML;
            	row.appendChild( h );
            }
            
            d.appendChild( row );
            this.domElement.appendChild( d );
        }
        
        if( rows )
        {
        	rows = rows[0];
            this.options.hasRows = true;
            
            let container = document.createElement( 'div' );
            container.className = 'FUIListviewContent';
            this.rowContainer = container;
            this.domElement.appendChild( container );
            
            let onload = rows.getAttribute( 'onload' );
        	if( onload )
        	{
        		this.onload = function()
        		{
        			// Trigger callback
	                if( window.FUI.callbacks[ onload ] )
	                {
	                    // Add structure with current element flags
	                    window.FUI.callbacks[ onload ]( self );
	                }
        		}
        	}
        }
        
        if( this.onload )
        {
        	this.onload();
        }
    }
    
    setRowData( json )
    {
    	// Contains references to data
	    this.dataset = {};
	    this.rowData = json;
    	this.refreshRows();
    }
    
    refreshRows()
    {
    	let json = this.rowData;
    
    	this.clearRows();
    	
    	for( let b = 0; b < json.length; b++ )
    	{
    		let row = document.createElement( 'div' );
    		row.className = 'HRow EditRow';
    		let baseWidth = parseInt( 100 / json[b].length );
    		
			for( let z = 0; z < json[b].length; z++ )
			{
				let col = document.createElement( 'div' );
				
				let w = this.headerElements && this.headerElements.length ? 
					this.headerElements[ z ].width : baseWidth;
				
				let alignment = this.headerElements[ z ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
				
				col.className = 'HContent' + w + ' Ellipsis FloatLeft' + alignment;
				
				// Identify column dataset
				if( json[b][z].uniqueid )
				{
					this.dataset[ json[b][z].uniqueid ] = json[b][z];
					this.dataset[ json[b][z].uniqueid ].domNode = col;
				}
				
				let str = FUI.create( json[b][z] );
				
				json[b][z].Name = this.headerElements[z].name;
				let onclick = json[b][z].onclick;
				
				if( onclick )
				{
				    ( function( data, column )
				    {
				        column.onclick = function( e )
				        {
				        	if( e.target && e.target.nodeName == 'INPUT' ) return;
				            if( window.FUI.callbacks[ onclick ] )
	                        {
	                            // Add structure with current element attributes
	                            let obj = {};
	                            for( let d = 0; d < data.length; d++ )
	                            {
	                                obj[ data[ d ].name ] = {};
	                                for( let p in data[ d ] )
	                                {
	                                    if( p == 'name' ) continue;
	                                    obj[ data[ d ].name ][ p ] = data[ d ][ p ];
	                                }
	                            }
	                            window.FUI.callbacks[ onclick ]( obj );
	                        }
				        }
				    } )( json[b], col );
				    col.classList.add( 'FUIListviewOnclick' );
				}
				
				col.innerHTML = str;					
				row.appendChild( col );
			}
			
			this.rowContainer.appendChild( row );
		}
		
		FUI.initialize();
    }
    
    // Edit a row / column by id
    editColumnById( uid )
    {
    	let self = this;
    	let set = this.dataset[ uid ];
    	// We need to handle editing many different types of columns
    	if( set.type == 'string' )
    	{
    		if( set.domNode && set.domNode.parentNode )
    		{
    			set.domNode.innerHTML = '<input type="text" class="InputHeight FullWidth" value="' + set.value + '"/>';
    			let nod = set.domNode.getElementsByTagName( 'input' )[0];
    			nod.addEventListener( 'blur', function( e )
    			{
    				set.value = this.value;
    				
    				// If there's an onchange event, execute it and provide the dataset as well as listview object
    				if( set.onchange )
    				{
    					if( window.ccGUI.callbacks[ set.onchange ] )
    					{
    						window.ccGUI.callbacks[ set.onchange ]( set, self );
    						return;
    					}
    				}
    				self.refreshRows();
    			} );
    			nod.addEventListener( 'change', function( e )
    			{
    				this.blur();
    			} );
    			nod.focus();
    			nod.select();
    		}
    		else
    		{
    			console.log( 'FUI: No supported dom node: ', set );
    		}
    	}
    	else
    	{
    		console.log( 'FUI: Unsupported type: ' + set.type );
    	}
    }
    
    clearRows()
    {
    	this.rowContainer.innerHTML = '';
    }
}

FUI.registerClass( 'listview' );

