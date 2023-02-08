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
    
    show()
    {
    	this.domElement.classList.toggle( 'hidden', false );
    }
    
    hide()
    {
    	this.domElement.classList.toggle( 'hidden', true );
    }
    
    
    attachDomElement()
    {
        super.attachDomElement();
        
        this.domElement.classList.add( 'FUI', 'FUIListview' );
    }
    
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        
        const self = this;
        
        let header = domElement.getElementsByTagName( 'listviewhead' );
        let headers = domElement.getElementsByTagName( 'listviewheaders' );
        let rows = domElement.getElementsByTagName( 'listviewrows' );
        
        if( header && header[0] )
        {
        	header = header[0];
            this.options.hasHeader = true;
            
            let d = document.createElement( 'div' );
            d.className = 'FUIListviewHeader';
            
            // check for navigation
            const headNavigationCollection = header.getElementsByTagName( 'listviewnavigation' );
            if ( headNavigationCollection[0] )
	        {
	        	const headNavigationElement = headNavigationCollection[0];
	        	this.options.hasNavigation = true;
	        	d.classList.add( 'NavPad' );
	        	const headNavigationContainer = document.createElement( 'div' );
	        	headNavigationContainer.classList.add( 'HeadNav' );
	        	for ( let i = 0; i < headNavigationElement.children.length; i++ )
	        	{
	        		const headNavBtn = headNavigationElement.children[ 0 ];
	        		if ( 'listviewbutton' == headNavBtn.localName )
	        		{
	        			const navButton = document.createElement( 'div' );
	        			navButton.classList.add( 'HeaderButton', 'IconSmall', 'MousePointer' );
	        			const icon = headNavBtn.getAttribute( 'icon' );
	        			if ( icon )
	        			{
	        				navButton.classList.add( 'fa-' + icon ); 
	        			}
	        			
	        			const onc = headNavBtn.getAttribute( 'onclick' )
	        			if ( onc )
	        			{
	        				navButton.addEventListener( 'click', e => {
	        					if ( window.FUI.callbacks[ onc ])
	        						window.FUI.callbacks[ onc ]( self );
	        				}, true );
	        			}
	        			
	        			headNavigationContainer.appendChild( navButton );
	        		}
	        	}
	        	
	        	d.appendChild( headNavigationContainer );
	        }
            
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
		        	t.className = 'FUIListviewToolbar Left';
		        	
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
		        	
		        	self.filters = [];
		        	let filterEls = null;
		        	if ( ( filterEls = toolbar.getElementsByTagName( 'listviewfilter' ) ) )
		        	{
		        		for( let a = 0; a < filterEls.length; a++ )
		        		{
		        			const f = document.createElement( 'input' );
		        			//f.classList.add( 'MousePointer' );
		        			self.filters.push( f );
		        			
		        			let cb = false;
		        			if( ( cb = filterEls[a].getAttribute( 'onchange' ) ) )
		        			{
				    			( function( ele, cbk )
				    			{
				    				ele.onchange = function( e )
				    				{
										// Trigger callback
						                if( window.FUI.callbacks[ cbk ] )
						                {
						                    // Add structure with current element flags
						                    window.FUI.callbacks[ cbk ]( self, ele.value );
						                }
						            }
								} )( f, cb );
							}
		        			t.appendChild( f );
		        		}
		        	}
		        	d.appendChild( t );
		    	}
            }
            
            this.domElement.appendChild( d );
        }
        
        self.headerElements = [];
        self.cols = {
        	'_list'    : [],
        	'_current' : null,
        };
        
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
            	self.headerElements[ a ].id = friendUP.tool.uid( 'h' );
            	if ( headerelements[ a ].getAttribute( 'sortDefault' ) )
            	{
            		const so = headerelements[ a ].getAttribute( 'sortOrder' );
            		if ( 'ZA' == so )
            			self.sortInvert = true;
            		self.sortDefault = self.headerElements[ a ].name;
            	}
            	self.cols[ self.headerElements[ a ].name ] = [];
            	self.cols._list[ a ] = self.headerElements[ a ].name;
            	if( !self.headerElements[ a ].align ) self.headerElements[ a ].align = 'left';
            	let h = document.createElement( 'div' );
            	let alignment = self.headerElements[ a ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
            	h.id = self.headerElements[ a ].id;
            	h.className = 'HContent' + self.headerElements[ a ].width + ' PaddingSmall Ellipsis FloatLeft' + alignment;
            	h.innerHTML = headerelements[ a ].innerHTML;
            	row.appendChild( h );
            	
            	const hname = self.headerElements[a].name;
            	const hidx = a;
            	h.addEventListener( 'click', e => {
            		let header = null;
            		if ( e.keepCurrent && ( self.cols._current != null ))
            		{
            			const parts = self.cols._current.split( '_' );
            			header = parts[0];
            			if ( null != parts[ 1 ])
            				self.cols._current = header;
            			else
            				self.cols._current = header + '_inverted';
            		}
            		else
            		{
            			if ( e.sortBy )
            				header = e.sortBy;
            			else
            				header = hname;
            			
            			if ( self.cols._current == null && self.sortInvert )
            				self.cols._current = header;
            		}
            		
            		if ( !self.cols[ header ].length )
            			return;
            		
            		const hIdx = self.cols._list.indexOf( header );
            		const headId = self.headerElements[ hIdx ].id;
            		const hEl = ge( headId );
            		
            		if ( 'string' == self.cols[header][0].type )
            		{
            			self.cols[header].sort(( ra, rb ) =>
            			{
            				
            				if ( ra.value == null || rb.value == null )
            				{
            					if ( self.cols._current == header )
            					{
            						if ( null == ra.value )
            							return -1;
            						else
            							return 1;
            					}
            					else
            					{
            						if ( null == ra.value )
            							return 1;
            						else
            							return -1;
            					}
            				}
            				
            				if ( String( ra.value ).toLowerCase() == String( rb.value ).toLowerCase() )
            					return 0;
            				
            				if ( self.cols._current == header )
            				{
            					if ( String( ra.value ).toLowerCase() < String( rb.value ).toLowerCase() )
            						return 1;
            					else
            						return -1;
            				}
            				else
            				{
            					if ( String( ra.value ).toLowerCase() < String( rb.value ).toLowerCase() )
            						return -1;
            					else
            						return 1;
            				}
            			});
            			
            			
            			const p = ge( self.cols[ header ][ 0 ].rowId ).parentNode;
            			for( let i = 0; i < self.cols[ header ].length; i++ )
            			{
            				p.appendChild( ge( self.cols[ header ][ i ].rowId ));
            			}
            			
            			if ( null == self.cols._current )
            			{
            				self.cols._current = header;
            				hEl.classList.toggle( 'ListDirectionAZ', true );
            			}
            			else
            			{
            				const cP = self.cols._current.split( '_' );
            				const curr = cP[0];
            				const inv = !!cP[1];
            				const cIdx = self.cols._list.indexOf( curr );
            				const cHeadId = self.headerElements[ cIdx ].id;
            				const cHEl = ge( cHeadId );
            				if ( inv )
            					cHEl.classList.toggle( 'ListDirectionZA', false );
            				else
            					cHEl.classList.toggle( 'ListDirectionAZ', false );
            				
            				
            				
	            			if ( self.cols._current == header )
	            			{
	            				self.cols._current = header + '_inverted';
	            				hEl.classList.toggle( 'ListDirectionZA', true );
	            			}
	            			else
	            			{
	            				self.cols._current = header;
	            				hEl.classList.toggle( 'ListDirectionAZ', true );
	            			}
            			}
            			
            			return;
            		}
            	}, false );
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
        		this.onload = function( e )
        		{
        			
        			// Trigger callback
	                if( window.FUI.callbacks[ onload ] )
	                {
	                    // Add structure with current element flags
	                    window.FUI.callbacks[ onload ]( self );
	                }
	                else
	                	console.log( 'no callback found for', {
	                		callback_id   : onload,
	                		FUI_callbacks : JSON.parse( JSON.stringify( FUI.callbacks )),
	                	});
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
    	const self = this;
    	let json = this.rowData;
    
    	this.clearRows();
    	
    	for( let b = 0; b < json.length; b++ )
    	{
    		let row = document.createElement( 'div' );
    		row.className = 'HRow EditRow';
    		row.id = friendUP.tool.uid( 'r' );
    		if ( json[b].onclick )
    		{
    			const oc = json[b].onclick;
    			const rd = json[b];
    			row.addEventListener( 'click', e =>
    			{
    				if ( window.FUI.callbacks[ oc ])
    					window.FUI.callbacks[ oc ]( rd, self, e );
    			}, false );
    		}
    		
    		let baseWidth = parseInt( 100 / json[b].length );

			for( let z = 0; z < json[b].length; z++ )
			{
				// Not enough headers for json
				if( z >= this.headerElements.length ) break;
				
				let col = document.createElement( 'div' );
				
				let w = this.headerElements && this.headerElements.length ? 
					this.headerElements[ z ].width : baseWidth;
				
				let alignment = this.headerElements[ z ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
				
				col.className = 'HContent' + w + ' Ellipsis FloatLeft' + alignment;
				
				json[b][z].rowId = row.id;
				self.cols[ self.cols._list[ z ]][ b ] = json[b][z];
				
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
				    ( function( data, index, column )
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
	                            	let nam = data[ d ].name;
	                            	if( !nam )
	                            		nam = d;
	                                obj[ nam ] = {};
	                                for( let p in data[ d ] )
	                                {
	                                    if( p == 'name' ) continue;
	                                    obj[ nam ][ p ] = data[ d ][ p ];
	                                }
	                            }
	                            window.FUI.callbacks[ onclick ]( obj, data[ index ] );
	                        }
				        }
				    } )( json[b], z, col );
				    col.classList.add( 'FUIListviewOnclick' );
				}
				
				const onchange = json[b][z].onchange;
				if ( onchange )
				{
					const data = json[b];
					const cnf = json[b][z];
					const el = col;
					el.onchange = e =>
					{
				
						if ( window.FUI.callbacks[ onchange ] )
						{
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
                            if( e.target && e.target.value )
                            {
                            	obj.value = e.target.value;
                            }
							window.FUI.callbacks[ onchange ]( obj, self, e );
						}
					}
					
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
    					if( window.FUI.callbacks[ set.onchange ] )
    					{
    						window.FUI.callbacks[ set.onchange ]( set, self );
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

FUI.registerClass( 'listview', FUIListview );

