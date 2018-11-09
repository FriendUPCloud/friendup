/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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

