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

Application.run = function( msg )
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		if( d && d.indexOf( '{' ) >= 0 )
		{
			d = JSON.parse( d );
			ge( 'mhostname' ).value = d.databasehost;
			ge( 'musername' ).value = d.databaseuser;
			ge( 'mpassword' ).value = d.databasepass;
			ge( 'mdatabase' ).value = d.databasebase;
		}
	}
	m.execute( 'getpreferences' );
}

function close()
{
	Application.sendMessage( { command: 'closeprefs', destinationViewId: Application.parentViewId } );
}

function savePreferences()
{
	var p = {
		databasehost: ge( 'mhostname' ).value,
		databaseuser: ge( 'musername' ).value,
		databasepass: ge( 'mpassword' ).value,
		databasebase: ge( 'mdatabase' ).value
	};

	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			close();
		}
		else
		{
			Alert( i18n( 'i18n_failed_saving_prefs' ), i18n( 'i18n_failed_saving_prefs_desc' ) );
		}
	}
	m.execute( 'savepreferences', { prefs: p } );
}

