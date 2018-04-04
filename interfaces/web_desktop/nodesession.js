/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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








