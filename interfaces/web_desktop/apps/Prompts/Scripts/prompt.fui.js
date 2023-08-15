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
        this.buffer = [ 'Welcome to Friend DOS v1.3', '1>' ]; // Buffer
        this.mode = 'w'; // w = write, r = read_only, l = locked
        this.fw = 9;  // cell width
        this.fh = 18; // cell height
        this.frames = 0;
        
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
        this.refreshDom();
        this.brain();
    }
    brain()
    {
    	let self = this;
    	function br()
    	{
    		if( self.ctx )
    		{
    			self.drawCursor();
			}
    		window.requestAnimationFrame( br );
    		self.frames++;
    	}
    	br();
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
			self._keydownFunction = function()
			{
				
			}
    		this.eventListener = true;
    		window.addEventListener( 'resize', this._resizeFunction );
    		window.addEventListener( 'keydown', this._keydownFunction );
    		self._resizeFunction();
    	}
    }
    destroy()
    {
    	window.removeEventListener( 'resize', this._resizeFunction );
    	window.removeEventListener( 'keydown', this._keydownFunction );
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
		if( !this.buffer ) return;
        super.refreshDom();
        
        // Do something with properties on dom
		this.domElement.classList.add( 'FUIPrompt' );
		
		let pb = new Color( 0, 0, 0 );
		let pc = new Color( 255, 255, 255 );
		
		if( this.ctx )
		{
			this.ctx.font = '14px monospace';
			let fw = this.fw;
			let fh = this.fh;
			let lc = 0, lr = 0;

			for( let y = 0, r = 0; y < this.getHeight(); y += fh, r++ )
			{
				if( r < this.buffer.length )
				{
					let buf = this.buffer[ r ];
					lr = r;
					for( let x = 0, c = 0; x < this.getWidth(); x += fw, c++ )
					{
						if( c < buf.length )
						{
							let ta = Math.floor( Math.random() * 64 );
							ta = 'rgb(' + ta + ',0,25)';
							this.ctx.fillStyle = ta; //pb.getRGB();
							this.ctx.fillRect( x, y, fw, fh );
							this.ctx.fillStyle = pc.getRGB();
							this.ctx.fillText( buf[c], x, y + fh - 4 );
							lc = c;
						}
						// Just fill with empty
						else
						{
							this.ctx.fillStyle = pb.getRGB();
							this.ctx.fillRect( x, y, this.getWidth() - x, fh );
						}
					}
				}
				// Just fill with empty
				else
				{
					this.ctx.fillStyle = pb.getRGB();
					this.ctx.fillRect( 0, y, this.getWidth(), fh );
				}
			}
			if( !this.cursorPosition )
			{
				this.cursorPosition = [ lc + 1, lr ];
			}
		}
    }
    drawCursor()
    {
    	let a = Math.floor( ( new Date() ).getTime() / 2 ) % 512;
    	let b = a < 256 ? a : ( 512 - a ) / 255 * 128 + 30;
    	let c = a < 256 ? a : ( 512 - a ) / 255 * 58 + 20;
    	this.ctx.fillStyle = 'rgb(' + b + ',' + c + ',40)';
    	this.ctx.fillRect( this.cursorPosition[ 0 ] * this.fw, this.cursorPosition[ 1 ] * this.fh, this.fw, this.fh );
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

