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

Application.run = function()
{
	this.saving = false;
}


// Close window!!!!!!!
function cancel()
{
	Application.sendMessage( { type: 'view', method: 'close' } );
}

function saveKey()
{
	Application.saving = true;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Alert( i18n( 'i18n_success_title' ), i18n( 'i18n_success_desc' ) );
			Application.sendMessage( { command: 'updatesettings' } );
			Application.sendMessage( {
				type:   'view',
				method: 'close'
			} );
		}
		else
		{
			Alert( i18n( 'i18n_failed_title' ), i18n( 'i18n_failed_desc' ) );
			Application.saving = false;
		}
	}
	m.execute( 'saveserversetting', {
		key:  ge( 'Key' ).value,
		type: ge( 'Type' ).value
	} );
}

