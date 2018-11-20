/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
* Running Friend Unifying Platform in NODE on a server                         *
*******************************************************************************/


// Get sessionId

var sessionId = false;              // Session ID for user
var looper = false;                 // Loop mainloop until quit
var counter = 0;                    // A counter
var hunt = [ 'sessionid' ];

// Get command line args
process.argv.forEach( function( val, index, arr )
{
	// Check for sessionid
	if( index >= 2 )
	{
		for( var b in hunt )
		{
			var word = hunt[b];
			if( val.length >= word.length && val.substr( 0, word.length ) == word )
			{
				var end = val.split( '=' )[0];
				end = val.substr( end.length + 1, val.length - end.length - 1 );
				switch( word )
				{
					case 'sessionid': sessionId = end; break;
				}
			}
		}
	}
} );

// Tell
console.log( 'Friend Client Server Node is up and running.' );

// Our mainloop
function mainLoop()
{
	counter++;
	if( counter >= 50 ) 
		clearInterval( looper );
}

// Run mainloop every 25 milliseconds
if( sessionId )
{
	looper = setInterval( mainLoop, 25 );
}
else
{
	console.log( 'Server Node terminated. Missing sessionId!' );
}








