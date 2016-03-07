/*******************************************************************************
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
*******************************************************************************/
function searchFor()
{
	var keys = ge( 'SearchId' ).value;
	
	Application.sendMessage( {
		command: 'search',
		keywords: keys
	} );
}

function replaceNum( what )
{
	var keys = ge( 'SearchId' ).value;
	var whar = ge( 'SearchReplace' ).value;
	
	if( ge( 'replaceall' ).checked )
	{
		Application.sendMessage( {
			command: 'replace',
			all: true,
			keywords: keys,
			replacement: whar
		} );
	}
	else
	{
		Application.sendMessage( {
			command: 'replace',
			all: false,
			keywords: keys,
			replacement: whar
		} );
	}
}

ge( 'SearchId' ).focus();
ge( 'SearchId' ).onkeydown = function( e )
{
	var w = e.which ? e.which : e.keyCode;
	if( w == 13 )
	{
		searchFor();
		ge( 'SearchId' ).blur();
		ge( 'searchFor' ).focus();
	}
}

