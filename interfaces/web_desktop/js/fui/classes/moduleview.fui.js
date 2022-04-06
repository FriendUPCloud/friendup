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
		
		activateModule( mod )
		{
			let self = this;
			
			let cont = self.moduleList.domNode;
			for( let a = 0; a < cont.childNodes.length; a++ )
			{
				let ch = cont.childNodes[a];
				if( !ch.module ) continue;
				if( ch.module == mod )
				{
					ch.classList.add( 'Clicked' );
					this.currentModule = mod;
					
					if( this.cards && this.cards[ mod ] )
					{
					    this.moduleContainer.domNode.innerHTML = '';
					    for( let c = 0; c < this.cards[ mod ].length; c++ )
					    {
					        let card = this.cards[ mod ][ c ];
					        this.renderCard( card, this.moduleContainer.domNode );
					    }
					}
				}
				else
				{
					ch.classList.remove( 'Clicked' );
				}
			}
		}
		
		// Render a card in position
		renderCard( card, parentElement )
		{
		    let self = this;
		    
		    let d = document.createElement( 'div' );
		    
		    function attachCardAndGo()
		    {
		        parentElement.appendChild( d );
		    }
		    
		    // Using a template url
		    if( d.templateUrl )
		    {
		        let f = new File( d.templateUrl );
		        f.onLoad = function( data )
		        {
		            d.innerHTML = data;
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
		            d.innerHTML = f;
		            attachCardAndGo();
		            return;
		        }
		    }
		    
	        d.innerHTML = '';
	        attachCardAndGo();
		}
		
		setModules( moduleList )
		{
			let self = this;
			
			let firstClick = false;
			
			let par = this.moduleList.domNode;
			par.innerHTML = '';
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

