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

// Nothing to do
Application.run = function( msg )
{
	//
	//console.log( 'Initialized' );
	
	// Read our locale
	Locale.getLocale( function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			Locale.importTranslations( d );
		}
		m.execute( 'getlocale', { type: 'DOSDrivers', locale: data.locale } );
	} );
}
Application.receiveMessage = function( msg )
{
	if( msg.command == 'setmountlist' )
	{
		ge( 'Disks' ).innerHTML = '\
			<div class="Mountlist">\
				' + msg.data + '\
			</div>';
	}
	if( msg.command == 'setsoftware' )
	{
		ge( 'Catalog' ).innerHTML = '\
			<div class="Software">\
				' + msg.data + '\
			</div>';
	}
}
