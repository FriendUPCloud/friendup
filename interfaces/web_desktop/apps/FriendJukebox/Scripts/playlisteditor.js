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

Application.run = function( msg, iface )
{
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'drop':
			if( msg.data )
			{
				var items = [];
				for( var a in msg.data )
				{
					items.push( {
						Path: msg.data[a].Path, 
						Filename: msg.data[a].Filename
					} );
				}
				Application.sendMessage( {
					command: 'append_to_playlist_and_play',
					items: items
				} );
			}
			break;
		case 'load_playlist':
			Application.sendMessage( { command: 'load_playlist' } );
			break;
		case 'save_playlist':
			Application.sendMessage( { command: 'save_playlist' } );
			break;
		case 'save_playlist_as':
			Application.sendMessage( { command: 'save_playlist_as' } );
			break;
		case 'refresh':
			if( !msg.items || !msg.items.length )
			{
				return false;
			}
			ge( 'items' ).innerHTML = '';
			for( var a = 0; a < msg.items.length; a++ )
			{
				ge( 'items' ).innerHTML += '\
				<div class="Box MarginBottom Padding">\
					<div class="HRow">\
						' + msg.items[a].Filename + '\
						<button type="button" class="FloatRight IconSmall fa-remove" onclick="RemoveFromPlaylist(' + a + ')">\
							Remove\
						</button>\
					</div>\
				</div>\
				';
			}
			break;
	}
}

function RemoveFromPlaylist( item )
{
	Application.sendMessage( { command: 'remove_from_playlist', item: item } );
}

