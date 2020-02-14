
function strtotime( str )
{
	if( !str ) return false;
	
	if( str.split( '-' )[1] )
	{
		str = str.split( ' ' );
		
		// Convert 'Y-m-d H:i:s' to 'D, d M Y H:i:s'
		var Y = str[0].split( '-' )[0];
		var m = str[0].split( '-' )[1];
		var d = str[0].split( '-' )[2];
		var H = str[1].split( ':' )[0];
		var i = str[1].split( ':' )[1];
		var s = str[1].split( ':' )[2];
		
		var D = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
		var M = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
		
		var date = new Date( Y, (m-1), d, H, i, s );
		var Y = date.getFullYear();
		var m = str_pad( ( date.getMonth() + 1 ), 2, 'STR_PAD_LEFT' );
		var d = str_pad( date.getDate(), 2, 'STR_PAD_LEFT' );
		var H = str_pad( date.getHours(), 2, 'STR_PAD_LEFT' );
		var i = str_pad( date.getMinutes(), 2, 'STR_PAD_LEFT' );
		var s = str_pad( date.getSeconds(), 2, 'STR_PAD_LEFT' );
		var D = D[date.getDay()];
		var M = M[date.getMonth()];
		
		var pattern = '|D|, |d| |M| |Y| |H|:|i|:|s|';
		
		pattern = pattern.split( '|d|' ).join( d );
		pattern = pattern.split( '|Y|' ).join( Y );
		pattern = pattern.split( '|H|' ).join( H );
		pattern = pattern.split( '|i|' ).join( i );
		pattern = pattern.split( '|s|' ).join( s );
		pattern = pattern.split( '|D|' ).join( D );
		pattern = pattern.split( '|M|' ).join( M );
		
		str = pattern;
	}
	
	var timezone;
	
	// Set default server timezone
	//timezone = ' +0200';
	
	str = str + ( timezone ? timezone : '' );
	
	//var d = Date.parse( str ) / 1000;
	
	var d = str;
	
	return d;
}

function str_pad( str, num, type )
{
	var pad = '0'; var out = '';
	for( i = 0; i < num; i++ )
	{
		out = out + pad;
	}
	if( !type || type == 'STR_PAD_LEFT' )
	{
		return ( out + str ).slice(-num);
	}
	else if( type == 'STR_PAD_RIGHT' )
	{
		return ( str + out ).slice(0,num);
	}
	return false;
}

function jsdate( pattern, str )
{	
	// Y-m-d H:i:s
	var date = ( str ? new Date( parseInt( str ) ) : new Date() );
	var Y = date.getFullYear();
	var m = str_pad( ( date.getMonth() + 1 ), 2, 'STR_PAD_LEFT' );
	var d = str_pad( date.getDate(), 2, 'STR_PAD_LEFT' );
	var H = str_pad( date.getHours(), 2, 'STR_PAD_LEFT' );
	var i = str_pad( date.getMinutes(), 2, 'STR_PAD_LEFT' );
	var s = str_pad( date.getSeconds(), 2, 'STR_PAD_LEFT' );
	
	var w = date.getDay();
	var W = 'W'/*date.getWeek()*/;
	var n = date.getMonth();
	var y = str_pad( Y, 2, 'STR_PAD_LEFT' );
	var g = date.getHours();
	var u = date.getMilliseconds();
	
	var l = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
	var D = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	var N = [ '7', '1', '2', '3', '4', '5', '6' ];
	var F = [ 'January', 'Febuary', 'Mars', 'April', 'May', 'June', 'July', 'August', 'September', 'Octover', 'November', 'December' ];
	var M = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	
	var j = date.getDate();
	var l = l[date.getDay()];
	var L = l[date.getDay()].toLowerCase();
	var N = N[date.getDay()];
	var D = D[date.getDay()];
	var F = F[date.getMonth()];
	var M = M[date.getMonth()];
	
	var obj = {
		'Y' : Y, 'm' : m, 'd' : d, 'H' : H, 
		'i' : i, 's' : s, 'w' : w, 'W' : W,
		'n' : n, 'y' : y, 'g' : g, 'u' : u,
		'j' : j, 'l' : l, 'L' : L, 'N' : N,
		'F' : F, 'M' : M, 'D' : D
	};
	
	var array = pattern.split( '' );
	
	if( array )
	{
		for ( var k in array )
		{
			if( array[k] && obj[array[k]] )
			{
				array[k] = obj[array[k]];
			}
		}
		
		pattern = array.join( '' );
	}
	
	return pattern;
}

function TimeToHuman( date, mode, current, timezone )
{
	if( !date ) return false;
	
	var unix = strtotime( date );
	
	if( current ) current = strtotime( current );
	else current = strtotime( jsdate( 'Y-m-d H:i:s' ) );
	
	date = jsdate( 'Y-m-d H:i:s', unix );
	
	var year = jsdate( 'Y', unix );
	var month = jsdate( 'F j', unix );
	//var week = jsdate( 'W', unix );
	var name = jsdate( 'D', unix );
	//var day = jsdate( 'n/j', unix );
	//var time = jsdate( 'g:ia', unix );
	var day = jsdate( 'j/n', unix );
	var time = jsdate( 'H:i', unix );
	
	var y = ( jsdate( 'Y', current ) - jsdate( 'Y', unix ) );
	var m = ( jsdate( 'm', current ) - jsdate( 'm', unix ) );
	var w = ( jsdate( 'W', current ) - jsdate( 'W', unix ) );
	var d = ( jsdate( 'd', current ) - jsdate( 'd', unix ) );
	var h = ( jsdate( 'H', current ) - jsdate( 'H', unix ) );
	var i = ( jsdate( 'i', current ) - jsdate( 'i', unix ) );
	var s = ( jsdate( 's', current ) - jsdate( 's', unix ) );
	
	if( !mode )
	{
		// Years ago
		if( y >= 2 ) return ( month + ', ' + year );
		if( y == 1 ) return ( month + ', ' + year );
		// Months ago
		if( m >= 2 ) return ( month + ' at ' + time );
		if( m == 1 ) return ( month + ' at ' + time );
		// Days ago
		if( d >= 2 ) return ( month + ' at ' + time );
		if( d == 1 ) return ( 'Yesterday at ' + time );
		// Hours ago
		if( h >= 2 ) return ( h + ' hours ago' );
		if( h == 1 ) return ( 'about an hour ago' );
		// Minutes ago
		if( i >= 2 ) return ( i + ' minutes ago' );
		if( i == 1 ) return ( 'about a minute ago' );
		// Seconds ago
		if( s >= 9 ) return ( s + ' seconds ago' );
		if( s >= 0 ) return ( 'a few seconds ago' );
	}
	if( mode == 'mini' )
	{
		// Years ago
		if( y > 0 ) return ( y + 'y' );
		// Months ago
		if( m > 0 ) return ( m + 'm' );
		// Days ago
		if( d > 0 ) return ( d + 'd' );
		// Hours ago
		if( h > 0 ) return ( h + 'h' );
		// Minutes ago
		if( i > 0 ) return ( i + 'm' );
		// Seconds ago
		if( s > 0 ) return ( s + 's' );
	}
	if( mode == 'medium' )
	{
		// Years ago
		if( y > 0 ) return ( jsdate( 'm/d/y H:i', unix ) );
		// Months ago
		if( m > 0 ) return ( day + ', ' + time );
		// Days ago
		if( d > 0 ) return ( day + ', ' + time );
		// Hours ago
		if( h > 0 ) return ( time );
		// Minutes ago
		if( i > 0 ) return ( time );
		// Seconds ago
		if( s > 0 ) return ( time );
	}
	if( mode == 'day' )
	{
		// Years ago
		if( y > 0 ) return ( jsdate( 'm/d/y', unix ) );
		// Months ago
		if( m > 0 ) return ( month );
		// Weeks ago
		if( w > 0 ) return ( name );
		// Days ago
		if( d > 0 ) return ( name );
		// Hours ago
		if( h > 0 ) return ( name );
		// Minutes ago
		if( i > 0 ) return ( name );
		// Seconds ago
		if( s > 0 ) return ( name );
	}
	
	return date;
}

