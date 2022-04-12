/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Check if it does not already exist
if( !FUI.classExists( 'moduleview' ) )
{
	class FUIModuleview extends FUIElement
	{
		constructor( options )
		{
		    super( options );
		    
		    // Set some vars
		    this.currentModule = false;
		    
		}
		attachDomElement()
		{
		    super.attachDomElement();
		    
		    let self = this;
		    
		    // Set stuff on this.domElement.innerHTML
		    this.domElement.classList.add( 'FUIModuleView' );
		}
		grabAttributes( domElement )
		{
		    super.grabAttributes( domElement );
		    
		    let self = this;
		    
		    // Grab main attributes
		    let mattrs = [ 'onload' ];
		    
		    for( let a = 0; a < mattrs.length; a++ )
		    {
		    	let mat = domElement.getAttribute( 'onload' );
		    	if( mat )
		    	{
		    		this.options[ mattrs[ a ] ] = mat;
		    		
		    		switch( mattrs[ a ] )
		    		{
		    			case 'onload':
		    				this.onload = function()
		    				{
								// Trigger callback
						        if( FUI.callbacks[ mat ] )
						        {
						            // Add structure with current element flags
						            FUI.callbacks[ mat ]( self );
						        }
						    }
		    				break;
		    		}
		    	}
		    }
		    
		    let modulelist = domElement.getElementsByTagName( 'modulelist' );
		    this.moduleList = false;
		    if( modulelist.length )
		    {	
		    	modulelist = modulelist[0];
		    	this.moduleList = {};
		    	// Get some attributes
		    	let attrs = [ 'onload' ];
		    	for( let a = 0; a < attrs.length; a++ )
		    	{
		    		let attr = modulelist.getAttribute( attrs[a] );
		    		if( attr )
		    		{
		    			this.moduleList[ attrs[ a ] ] = attr;
		    		}
					switch( attrs[ a ] )
					{
						case 'onload':
							this.modulelistonload = function()
							{
								// Trigger callback
							    if( FUI.callbacks[ attr ] )
							    {
							        // Add structure with current element flags
							        FUI.callbacks[ attr ]( self );
							    }
							}
							break;
					}
		   		}
		   		let mc = document.createElement( 'div' );
		   		mc.className = 'FUIModuleList';
		   		this.domElement.appendChild( mc );
		   		this.moduleList.domNode = mc;
		    }
		    
		    let modulecontainer = domElement.getElementsByTagName( 'modulelist' );
		    this.moduleContainer = false;
		    if( modulecontainer.length )
		    {	
		    	modulecontainer = modulecontainer[0];
		    	this.moduleContainer = {};
		    	// Get some attributes
		    	/*let attrs = [ 'onload' ];
		    	for( let a = 0; a < attrs.length; a++ )
		    	{
		    		let attr = modulecontainer.getAttribute( attrs[a] );
		    		if( attr )
		    		{
		    			this.modulecontainer[ attrs[ a ] ] = attr;
		    		}
		   		}*/
		   		let mc = document.createElement( 'div' );
		   		mc.className = 'FUIModuleContainer';
		   		this.domElement.appendChild( mc );
		   		this.moduleContainer.domNode = mc;
		    }
		    
		    this.refreshDom();
		    
		    // Mani object has loaded
		    if( this.onload ) this.onload();
		    // Modulelist ready to load
		    if( this.modulelistonload ) this.modulelistonload();
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
		
		// Activates a module, and renders it's root cards, if any
		activateModule( mod )
		{
			let self = this;
			
			// Only do this once
			if( this.currentActiveModule == mod ) return;
			this.currentActiveModule = mod;
			
			let cont = self.moduleList.domNode;
			for( let a = 0; a < cont.childNodes.length; a++ )
			{
				let ch = cont.childNodes[a];
				if( !ch.module ) continue;
				
				// Found active module
				if( ch.module == mod )
				{
					ch.classList.add( 'Clicked' );
					this.currentModule = mod;
					
					// We got cards on this module
					if( this.cards && this.cards[ mod ] )
					{
						// Blank out container
					    this.moduleContainer.domNode.innerHTML = '';
					    
					    let cardsContainer = document.createElement( 'div' );
					    cardsContainer.className = 'FUICardsContainer';
					    this.moduleContainer.domNode.appendChild( cardsContainer );
					    
					    // Render each card on module content container
					    for( let c = 0; c < this.cards[ mod ].length; c++ )
					    {
					        let card = this.cards[ mod ][ c ];
					        if( typeof( card.visible ) == 'undefined' || card.visible )
					        {
					        	this.renderCard( card, cardsContainer );
					        }
					    }
					}
				}
				// Found inactive module
				else
				{
					ch.classList.remove( 'Clicked' );
				}
			}
		}
		
		// Return a card object by module name and card name
		getCard( moduleName, cardName )
		{
			let self = this;
			
			for( let a in this.cards )
			{
				if( a != moduleName ) continue;
				
				// Find card by name on this module
				for( let b = 0; b < this.cards[ a ].length; b++ )
				{
					if( this.cards[ a ][ b ].name == cardName ) 
					{
						let o = {};
						o.card = this.cards[ a ][ b ];
						// Render children function
						o.renderChildren = function( data )
						{
							if( this.card.cards )
							{
								for( let a = 0; a < this.card.cards.length; a++ )
								{
									// Render this cards on the parent card's sibling node
									self.renderCard( this.card.cards[ a ], this.card.childrenDomNode );
								}
							}
							return true;
						}
						return o;
					}
				}
			}
			return false;
		}
		
		// Render a card in position
		renderCard( card, parentElement )
		{
		    let self = this;
		    
		    let d = document.createElement( 'div' );
		    d.className = 'ModuleCard';
		    
		    // If we added a card title
		    let ct = false;
		    if( card.title )
		    {
		    	ct = document.createElement( 'div' );
		    	ct.className = 'CardName';
		    	ct.innerHTML = card.title;
		    	d.appendChild( ct );
		    }
		    
		    // Add card buttons
		    if( card.buttons && ct )
		    {
		    	let btns = document.createElement( 'div' );
		    	btns.className = 'CardButtons';
		    	d.appendChild( btns );
		    	
		    	for( let a = 0; a < card.buttons.length; a++ )
		    	{
		    		let btn = document.createElement( 'div' );
		    		btn.className = 'CardButton';
		    		if( card.buttons[ a ].icon )
		    		{
		    			btn.classList.add( 'IconSmall', 'fa-' + card.buttons[ a ].icon );
		    		}
		    		if( card.buttons[ a ].label )
		    		{
		    			btn.innerHTML = card.buttons[ a ].label;
		    		}
		    		if( card.buttons[ a ].onclick )
		    		{
						btn.onclick = function()
						{
							if( window.FUI.callbacks[ card.buttons[ a ].onclick ] )
							{
								// Add structure with current element flags
								window.FUI.callbacks[ card.buttons[ a ].onclick ]( card.buttons[ a ] );
							}
						}
					}
					btns.appendChild( btn );
		    	}
				ct.appendChild( btns );
		    }
		    
		    // Where card content goes
		    let cnt = document.createElement( 'div' );
		    cnt.className = 'CardContent';
		    d.appendChild( cnt );
		    
		    function attachCardAndGo()
		    {
		    	card.domNode = parentElement;
		        parentElement.appendChild( d );
		        
		        // If we have child-cards, add container (sibling)
		        if( card.cards )
		        {
		        	card.uniqueId = md5( card.name + ( Math.random() + Math.random() ) );
		        	let cardsColumn = document.createElement( 'div' );
		        	cardsColumn.className = 'FUICardContainerSibling';
		        	card.childrenDomNode = cardsColumn; // This is set on parent card for reference
		        	parentElement.parentNode.appendChild( cardsColumn );
		        }
		        FUI.initialize();
		    }
		    
		    // Using a template url
		    if( d.templateUrl )
		    {
		        let f = new File( d.templateUrl );
		        f.onLoad = function( data )
		        {
		        	let nd = document.createElement( 'div' );
		            nd.innerHTML = data;
		            cnt.appendChild( nd );
		            attachCardAndGo();
		        }
		        f.load();
		        return;
		    }
		    // Using a fragment
		    else if( card.fragmentId )
		    {
		        let f = FUI.getFragment( card.fragmentId );
		        if( f )
		        {
		            let nd = document.createElement( 'div' );
		            nd.innerHTML = f;
		            cnt.appendChild( nd );
		            attachCardAndGo();
		            return;
		        }
		    }
		    
	        attachCardAndGo();
		}
		
		// Import module list from JSON structure
		setModules( moduleList )
		{
			let self = this;
			
			// Holds the first module to activate
			let firstClick = false;
			
			// Set up parentNode for HTML rendering
			let par = this.moduleList.domNode;
			par.innerHTML = '';
			
			// Process all modules
			for( let a = 0; a < moduleList.length; a++ )
			{
				let d = document.createElement( 'div' );
				d.className = 'FUIModulelistModule';
				if( moduleList[ a ].icon )
				{
					d.classList.add( 'IconSmall', 'fa-' + moduleList[ a ].icon );
				}
				d.innerHTML = '<div><h2>' + moduleList[a].name + '</h2><p>' + moduleList[a].leadin + '</p></div>';
				d.module = moduleList[ a ].module;
				
				if( !self.cards )
				    self.cards = {};
				self.cards[ d.module ] = moduleList[ a ].cards ? moduleList[ a ].cards : false;
				
				// Onclick override
				if( typeof( moduleList[a].onclick ) == 'function' )
				{
				    ( function( mod, onc ){
					    d.onclick = function( e )
					    {
						    self.activateModule( mod );
						    
						    // Override
						    if( onc )
						    {
							    onc( self );
							    return;
						    }
						    // TODO: Create default functionality
					    }
				    } )( moduleList[a].module, moduleList[a].onclick );
				}
				// String based callbacks
				else if( typeof( moduleList[a].onclick ) == 'string' )
				{
				    ( function( cbk, el )
				    {
				        el.onclick = function()
				        {
				            if( typeof( FUI.callbacks[ cbk ] ) )
				                FUI.callbacks[ cbk ]( self );
				        }
				    } )( moduleList[a].onclick, d );
				}
				// Default operation
				else
				{
				    ( function( mod )
				    {
				        d.onclick = function( m )
				        {
				            self.activateModule( mod );
				        }
				    } )( moduleList[ a ].module );
				}
				par.appendChild( d );
				if( moduleList[a].active )
				{
					firstClick = function(){ self.activateModule( moduleList[a].module ); d.onclick( self ); };
				}
			}
			
			if( firstClick ) firstClick();
		}
		
		setModuleContent( module, content )
		{
			// We can cache the module content for transitions?
			if( typeof( content ) == 'undefined' )
			    content = '';
			this.moduleContainer.domNode.innerHTML = content;
			FUI.initialize();
		}
		
		// TODO: Animate both module tab as well as content
		setSubModuleContent( module, submodule, content, callback )
		{
			this.activateModule( module );
			// submodule...
			
			this.moduleContainer.domNode.innerHTML = content;
			FUI.initialize();
			if( callback ) callback();
		}
	}
	
	FUI.registerClass( 'moduleview', FUIModuleview );
}

