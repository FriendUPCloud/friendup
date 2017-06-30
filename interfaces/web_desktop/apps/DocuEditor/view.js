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

document.title = 'A topic viewed';

Application.run = function( msg )
{
	// ..
}

function closeView()
{
	Application.sendMessage( { command: 'closeView' } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'loadtopic':
			ge( 'Cover' ).style.position = 'absolute';
			ge( 'Cover' ).style.zIndex = 999;
			ge( 'Cover' ).style.width = '100%';
			ge( 'Cover' ).style.height = '100%';
			ge( 'Cover' ).style.backgroundColor = 'white';
			ge( 'Cover' ).style.opacity = 0.6;
			var m = new Module( 'friendreference' )
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var i = JSON.parse( d );
					ge( 'pSubject' ).innerHTML = i.Subject;
					ge( 'pShortDesc' ).innerHTML = i.ShortDesc;
					ge( 'pDescription' ).innerHTML = i.Description;
					ge( 'pExamples' ).innerHTML = i.Examples;
					ge( 'Cover' ).style.width = '0%';
					ge( 'Cover' ).style.height = '0%';
					
					// Status
					var stypes = { 
						'0' : 'Pending',
						'1' : 'Verified',
						'2' : 'Fixed'
					};
					for( var a in stypes )
					{
						if( i.Status == a )
						{
							ge( 'pStatus' ).innerHTML = stypes[a];
						}
					}
					
					
				}
				else
				{
					Application.sendMessage( { command: 'closeTopic' } );
				}
			}
			m.execute( 'loadtopic', { topicid: msg.ID } );
			
			// Keep id in mind
			Application.ID = msg.ID;
			
			// Refresh the comments too
			Application.receiveMessage( { command: 'getcomments' } );
			break;
		case 'getcomments':
			var m = new Module( 'friendreference' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					ge( 'Comments' ).innerHTML = '';
					ge( 'CommentCount' ).innerHTML = '';
					return;
				}
				var j = JSON.parse( d );
				if( !j.length ) return;
				var str = [];
				for( var a = 0; a < j.length; a++ )
				{
					var dts = j[a].Date.split( ' ' );
					var d = dts[0].split( '-' ).join( '/' );
					d += ' at ' + dts[1];
					str.push(
						'<p class="Padding Layout"><strong>' + j[a].Username + 
						' commented, ' + d + '</strong><br/>' + 
						j[a].Description + '</p>' 
					);
				}
				ge( 'Comments' ).innerHTML = str.length ? ( '<p class="Padding Layout"><strong>Comments:</strong></p>' + str.join( '<hr/>' ) ) : '';
				ge( 'CommentCount' ).innerHTML = str.length > 0 ? ( ' (' + str.length + ( str.length == 1 ? ' comment)' : ' comments)' ) ) : '';
			}
			m.execute( 'getcomments', { topicid: Application.ID } );
			break;
	}
}

