/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class Color
{
	constructor( r, g, b, a = false )
	{
		const c = { r: r, g: g, b: b, a: a ? a : 255 };
		for( let a in c )
			this[ a ] = c[ a ];
	}
	getRGB()
	{
		return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
	}
	getRGBA()
	{
		return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
	}
}

class FUIPrompt extends FUIElement
{
	constructor( options )
    {
        super( options );
        
        // Initial cursor position
        this.cpos = 0; // Cursor position
        this.cbuf = ''; // Working buffer
        this.bp = 0; // Buffer position
        this.buffer = [ '' ]; // Buffer
        
        // Something that handles keyboard
        let catcher = document.body.querySelector( '.InputCatcher' );
        if( !catcher )
        {
        	catcher = document.createElement( 'input' );
        	catcher.setAttribute( 'type', 'text' );
        	catcher.className = 'InputCatcher';
        	document.body.appendChild( catcher );
        }
        this.catcher = catcher;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        let c = document.createElement( 'canvas' );
        this.canvas = c;
        this.domElement.appendChild( c );
        this.ctx = c.getContext( '2d' );
        this.resize();
        this.refreshDom();
    }
    resize()
    {	
    	let self = this;
    	
    	if( !this.eventListener )
    	{
    		self._resizeFunction = function()
			{
				self.canvas.setAttribute( 'width', self.getWidth() );
				self.canvas.setAttribute( 'height', self.getHeight() );
				self.refreshDom();
			}
    		this.eventListener = window.addEventListener( 'resize', this._resizeFunction );
    		self._resizeFunction();
    	}
    }
    destroy()
    {
    	window.removeEventListener( 'resize', this._resizeFunction );
    }
    getWidth()
    {
    	return this.domElement.offsetWidth;
    }
    getHeight()
    {
    	return this.domElement.offsetHeight;
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        // if( domElement.getAttribute( 'someattribute' ) )
        //     do something
        
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Do something with properties on dom
		this.domElement.classList.add( 'FUIPrompt' );
		
		let pb = new Color( 0, 0, 0 );
		let pc = new Color( 255, 255, 255 );
		
		if( this.ctx )
		{
			let fw = 8; 
			let fh = 12;
			
			for( let y = 0; y < this.getHeight(); y += fh )
			{
				for( let x = 0; x < this.getWidth(); x += fw )
				{
					this.ctx.fillStyle = pb.getRGB();
					this.ctx.fillRect( x, y, fw, fh );
				}
			}
		}
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
FUI.registerClass( 'prompt', FUIPrompt );

