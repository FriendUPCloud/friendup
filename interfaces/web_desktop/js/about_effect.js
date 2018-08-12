var p = 0;
var dir = 'down';
var sint = false;

function doScroll()
{
	var clr = 0;
	// Wait!
	if( !document.getElementById( 'contributors' ) ) 
	{
		return setTimeout( function(){ doScroll(); }, 1000 );
	}
	
	// Cleanup!
	if( !document.getElementById( 'contributors' ) && sint )
	{
		return clearInterval( sint );
	}
		
	if( !sint )
		sint = setInterval( function(){ doScroll(); }, 2000 );
		
	// Move
	if( dir == 'down' )
		p -= 10;
	else p += 10;
			
	var hh = document.getElementById( 'contributors' ).offsetHeight;
	var sh = document.getElementById( 'contributors_inside' ).offsetHeight;
	var st = document.getElementById( 'contributors_inside' ).offsetTop;

	if( p <= -( sh - hh + 80 ) )
	{
		p = 0;
		dir = 'up';
		clr = 1;
	}
	else if( p > 0 )
	{
		p = 0;
		dir = 'down';
		clr = 1;
	}
	
	document.getElementById( 'contributors_inside' ).style.top = p + 'px';

	if( clr )
	{
		clearInterval( sint );
		sint = null;
		return setTimeout( function(){ doScroll(); }, 1500 );
	}	
}

doScroll();
