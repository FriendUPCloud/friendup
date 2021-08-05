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
	
}

function sendInvite()
{
	let gid = ge( 'groupid' ).value;
	
	let email = ge( 'recipient' ).value;
	let tname = ge( 'recipientname' ).value;
	
	if( email.indexOf( '@' ) <= 0 )
	{
		Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_email_error' ) );
		return false;
	}
	
	if( email.indexOf( '.' ) <= email.indexOf( '@' ) )
	{
		Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_email_error' ) );
		return false;
	}
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		console.log( { e:e, d:d } );
		
		if( e == 'ok' )
		{
			Application.quit( /*true*/ );
		}
		else
		{
			Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_unknown_error' ) );
			return false;
		}
	}
	m.execute( 'sendinvite', { workgroups: gid, email: email, fullname: tname } );
}
