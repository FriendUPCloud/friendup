
var colordia = null;
function showColorPicker( elementid, value )
{
	if( colordia )
	{
		document.body.removeChild( colordia );
	}
	var d = document.createElement( 'div' );
	d.className = 'AuthFullscreenDialog';
	
	colordia = d;
	
	var box = document.createElement( 'div' );
	box.className = 'AuthDiaBox Box Rounded Padding BackgroundDefault';
	
	var f = new File( 'Progdir:Templates/colorpicker.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		box.innerHTML = data;
		d.appendChild( box );
		document.body.appendChild( d );
		
		var btns = d.getElementsByTagName( 'button' );
		for( var a = 0; a < btns.length; a++ )
		{
			if( btns[a].id == 'Close' )
			{
				btns[a].onclick = function()
				{
					document.body.removeChild( d );
					colordia = null;
				}
			}
			if( btns[a].id == 'Accept' )
			{
				btns[a].onclick = function()
				{
					ge( elementid ).value = ge( 'HexCode' ).value;
					document.body.removeChild( d );
					colordia = null;
					
				}
			}
		}
		
		// Draw stuff
		redrawColorPickerCanvas();
		
		var dia = ge( 'DiaColors' );
		
		// And now add some nice controllers
		var colCtrl = document.createElement( 'div' );
		colCtrl.className = 'ColorPickerController MousePointer';
		colCtrl.onmousedown = function( e )
		{
			colCtrl.offx = e.clientX - colCtrl.offsetLeft;
			colCtrl.offy = e.clientY - colCtrl.offsetTop;
			mouseElement.candidate = colCtrl;
		}
		colCtrl.think = function( x, y )
		{
			var candx = x - this.offx;
			var candy = y - this.offy;
			
			var limw = 17 + 30;
			
			if( candx < -17 ) candx = -17;
			if( candy < -17 ) candy = -17;
			if( candx > GetElementWidth( dia ) - limw )
				candx = GetElementWidth( dia ) - limw;
			if( candy > GetElementHeight( dia ) - 17 )
				candy = GetElementHeight( dia ) - 17;
			
			this.style.left = candx + 'px';
			this.style.top = candy + 'px';
			
			getColorPickerHex();
		}
		dia.appendChild( colCtrl );
		
		// Shadw control
		var shaCtrl = document.createElement( 'div' );
		shaCtrl.className = 'ColorPickerShadeControl MousePointer';
		shaCtrl.onmousedown = function( e )
		{
			shaCtrl.offy = e.clientY - shaCtrl.offsetTop;
			mouseElement.candidate = shaCtrl;
		}
		shaCtrl.think = function( x, y )
		{
			var candy = y - this.offy;
			if( candy < 0 ) candy = 0;
			if( candy + shaCtrl.offsetHeight > GetElementHeight( dia ) )
				candy = GetElementHeight( dia ) - shaCtrl.offsetHeight;
			
			this.style.top = candy + 'px';
			
			getColorPickerHex();
		}
		dia.appendChild( shaCtrl );
		
		dia.sha = shaCtrl;
		dia.col = colCtrl;
	}
	f.load();
}

function getColorPickerHex()
{
	var cnv = ge( 'ColorPickerCanvas' );
	var dia = ge( 'DiaColors' );
	var sha = dia.sha;
	var col = dia.col;
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

	ge( 'HexCode' ).value = '#' + r + g + b;
}

function redrawColorPickerCanvas()
{
	var c = ge( 'ColorPickerCanvas' );
	if( c )
	{
		var w = ge( 'ColorPickerCanvas' ).parentNode.offsetWidth;
		var h = ge( 'ColorPickerCanvas' ).parentNode.offsetHeight;
	
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

window.addEventListener( 'resize', function()
{
	// Resize
	if( ge( 'ColorPickerCanvas' ) )
	{
		redrawColorPickerCanvas();
	}
} );

function _mouseMove( e )
{
	if( mouseElement.candidate )
	{
		mouseElement.candidate.think( e.clientX, e.clientY );
	}
}

function _mouseUp( e )
{
	mouseElement.candidate = null;
}

window.addEventListener( 'mousemove', _mouseMove );
window.addEventListener( 'touchmove', _mouseMove );
window.addEventListener( 'mouseup', _mouseUp );
window.addEventListener( 'touchend', _mouseUp );
