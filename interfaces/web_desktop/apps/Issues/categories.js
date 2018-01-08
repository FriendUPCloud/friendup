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
	refreshCategories();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return false;
	switch( msg.command )
	{
		case 'refreshcategories':
			refreshCategories();
			break;
	}
}

function issueAdd()
{
	var c = new View( {
		title: 'Add category',
		width: 320,
		height: 200
	} );
	
	var f = new File( 'Progdir:Templates/category.html' );
	f.onLoad = function( data )
	{
		c.setContent( data );
	}
	f.load();
}

function refreshCategories()
{
	var m = new Module( 'issues' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var entries = JSON.parse( d );
			var str = '';
			for( var a in entries )
			{
				var e = entries[a];
				str += '<div class="Box MarginBottom"><p class="Layout"><strong>' + e.Category + '</strong></p><p class="Layout">' + e.Description + '</p></div>';
			}
			ge( 'Categories' ).innerHTML = str;
		}
	}
	m.execute( 'categories' );
}

