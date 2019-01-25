Friend.GUI.ColorPickers = [];

// Create a new color picker!
Friend.GUI.ColorPicker = function( successcbk, failcbk )
{
	Friend.GUI.ColorPickers.push( this );
	this.init( successcbk, failcbk );
}

// Initialize the color picker gui
Friend.GUI.ColorPicker.prototype.init = function( successcbk, failcbk )
{
	var self = this;
	
	var v = new View( {
		title: i18n( 'i18n_color_picker' ),
		width: 400,
		height: 300
	} );
	
	v.addEvent( 'resize', function()
	{
		// Resize
		if( self.elColorPickerCanvas )
		{
			self.refresh();
		}
	} );
	
	// Clean up!
	v.onClose = function()
	{
		var out = [];
		for( var a = 0; a < Friend.GUI.ColorPickers.length; a++ )
		{
			if( Friend.GUI.ColorPickers[ a ] != self )
				out.push( Friend.GUI.ColorPickers[ a ] );
		}
		Friend.GUI.ColorPickers = out;
		if( self.onClose )
			self.onClose();
		delete self;
	}
	
	// Register the view
	self.view = v;
	
	// Load template and populate
	var f = new File( 'System:templates/colorpicker.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		
		// Get all elements
		self.elHexCode = null;
		self.elDiaColors = null;
		self.elColorPickerCanvas = null;
		self.elCancel = null;
		self.elAccept = null;
		
		var eles = v.content.getElementsByTagName( '*' );
		
		for( var a = 0; a < eles.length; a++ )
		{
			if( !eles[a].classList ) continue;
			if( eles[a].classList.contains( 'HexCode' ) )
				self.elHexCode = eles[a];
			else if( eles[a].classList.contains( 'DiaColors' ) )
				self.elDiaColors = eles[a];
			else if( eles[a].classList.contains( 'ColorPickerCanvas' ) )
				self.elColorPickerCanvas = eles[a];
			else if( eles[a].classList.contains( 'Accept' ) )
				self.elAccept = eles[a];
			else if( eles[a].classList.contains( 'Cancel' ) )
				self.elCancel = eles[a];
		}
		
		// Total fail!
		if( !self.elHexCode || !self.elDiaColors )
		{
			if( failcbk )
				failcbk();
			v.close();
		}
		
		self.elCancel.onclick = function()
		{
			if( failcbk )
				failcbk();
			v.close();
		}
		
		self.elAccept.onclick = function()
		{
			if( successcbk )
				successcbk( self.elHexCode.value );
			v.close();
		}
	
		// Draw stuff
		self.refresh();
	
		var dia = self.elDiaColors;
	
		// And now add some nice controllers
		var colCtrl = document.createElement( 'div' );
		colCtrl.className = 'ColorPickerController MousePointer';
		colCtrl[ isMobile ? 'ontouchstart' : 'onmousedown' ] = function( e )
		{
			var px = e.clientX;
			var py = e.clientY;
			if( e.touches && e.touches[0] )
			{
				px = e.touches[0].clientX;
				py = e.touches[0].clientY;
			}
			
			colCtrl.offx = px - colCtrl.offsetLeft;
			colCtrl.offy = py - colCtrl.offsetTop;
			
			
			mousePointer.candidate = {
				el: colCtrl,
				condition: function( e )
				{
					var s = colCtrl;
					var x = e.clientX;
					var y = e.clientY;
					
					if( e.touches && e.touches[0] )
					{
						x = e.touches[0].clientX;
						y = e.touches[0].clientY;
					}
					
					var candx = x - s.offx;
					var candy = y - s.offy;
		
					var limw = 17 + 30;
		
					if( candx < -17 ) candx = -17;
					if( candy < -17 ) candy = -17;
					if( candx > GetElementWidth( dia ) - limw )
						candx = GetElementWidth( dia ) - limw;
					if( candy > GetElementHeight( dia ) - 17 )
						candy = GetElementHeight( dia ) - 17;
		
					s.style.left = candx + 'px';
					s.style.top = candy + 'px';
		
					self.getColorPickerHex();
				}
			};	
		}
		dia.appendChild( colCtrl );
	
		// Shadow control
		var shaCtrl = document.createElement( 'div' );
		shaCtrl.className = 'ColorPickerShadeControl MousePointer';
		shaCtrl[ isMobile ? 'ontouchstart' : 'onmousedown' ] = function( e )
		{
			var py = e.clientY;
			if( e.touches && e.touches[0] )
			{
				py = e.touches[0].clientY;
			}
			
			shaCtrl.offy = py - shaCtrl.offsetTop;
			
			mousePointer.candidate = {
				el: colCtrl,
				condition: function( e )
				{
					var s = shaCtrl;
					var x = e.clientX;
					var y = e.clientY;
					
					if( e.touches && e.touches[0] )
					{
						x = e.touches[0].clientX;
						y = e.touches[0].clientY;
					}
					
					var candy = y - s.offy;
					if( candy < 0 ) candy = 0;
					if( candy + shaCtrl.offsetHeight > GetElementHeight( dia ) )
						candy = GetElementHeight( dia ) - shaCtrl.offsetHeight;
		
					s.style.top = candy + 'px';
		
					self.getColorPickerHex();
				}
			};
		}
		dia.appendChild( shaCtrl );
	
		dia.sha = shaCtrl;
		dia.col = colCtrl;
	}
	f.load();
}

// Sample the hex color
Friend.GUI.ColorPicker.prototype.getColorPickerHex = function()
{
	var self = this;
	
	var cnv = self.elColorPickerCanvas;
	var dia = self.elDiaColors;
	var sha = self.elDiaColors.sha;
	var col = self.elDiaColors.col;
	var ctx = cnv.getContext( '2d' );
	
	var brightness = 255 - Math.floor( sha.offsetTop / ( cnv.offsetHeight - sha.offsetHeight ) * 255 );
	var colx = col.offsetLeft + 17;
	var coly = col.offsetTop + 17;
	if( colx >= cnv.offsetWidth - 30 )
		colx = cnv.offsetWidth - 31;
	if( coly >= cnv.offsetHeight )
		coly = cnv.offsetHeight - 1;
	
	var imgd = ctx.getImageData( colx, coly, 1, 1 );
	var r = imgd.data[ 0 ];
	var g = imgd.data[ 1 ];
	var b = imgd.data[ 2 ];
	
	r *= brightness / 255;
	g *= brightness / 255;
	b *= brightness / 255;
	
	r = Math.floor( r ).toString( 16 ); if( r.length % 2 ) r = '0' + r;
	g = Math.floor( g ).toString( 16 ); if( g.length % 2 ) g = '0' + g;
	b = Math.floor( b ).toString( 16 ); if( b.length % 2 ) b = '0' + b;

	self.elHexCode.value = '#' + r + g + b;
}

// Refresh the colors of the color picker
Friend.GUI.ColorPicker.prototype.refresh = function()
{
	var self = this;
	var c = self.elColorPickerCanvas;
	if( c )
	{
		var w = c.parentNode.offsetWidth;
		var h = c.parentNode.offsetHeight;
	
		c.setAttribute( 'width', w );
		c.setAttribute( 'height', h );
		
		var ctx = c.getContext( '2d' );
		
		var imageData = ctx.createImageData( w, h );
		var idata = imageData.data;
		
		var r = 0;
		var g = 0;
		var b = 0;
		var c = 0;
		var p, x, y;
		
		for( y = 0; y < idata.length; y++ )
		{
			idata[ y ] = 0xff00ffff;
		}
		
		// Make rainbow
		var mixcolor = 0; // to blend up and down
		
		var pw = w - 30;
		var hw = pw / 2;
		for( y = 0; y < h; y++ )
		{
			p = y * ( w * 4 );
			var ymu = y / h;
			var ymul = 1 - ymu;
			for( x = 0; x < pw; x++ )
			{
				// From red to green
				if( x < hw )
				{
					var x255 = Math.floor( ( x / hw * 255 ) );
					r = ( 255 - x255 ) * ( ymul );
					g = x255;
					b = ( 1 - ymul ) * 255;
					
				}
				// From green to blue
				else
				{
					var x255 = Math.floor( ( x - hw ) / hw * 255 );
					var corner = x255 / 255;
					r = ( x255 * ymul ) + ( x255 * ( 1 - ymul ) );
					b = 255 * ymu;
					g = 255;
					
				}
				// Set pixels
				idata[ p     ] = r;
				idata[ p + 1 ] = g;
				idata[ p + 2 ] = b;
				p += 4;
			}
			// Make brightness gradient
			for( x = pw; x < w; x++ )
			{
				idata[ p ] = 255-b;
				idata[ p + 1 ] = 255-b;
				idata[ p + 2 ] = 255-b;
				p += 4;
			}
		}
		
		// Draw
		ctx.putImageData( imageData, 0, 0 );
	}
}

