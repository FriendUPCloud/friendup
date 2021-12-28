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
	
	if( email.indexOf( '@' ) <= 0 || email.indexOf( '.' ) <= 0 || !validateEmail( email ) )
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
			Application.sendMessage( { command: 'closeView' } );	
		}
		else
		{
			Alert( i18n( 'i18n_failed_to_send' ), i18n( 'i18n_unknown_error' ) );
			return false;
		}
	}
	m.execute( 'sendinvite', { workgroups: gid, email: email, fullname: tname } );
}

function validateEmail( email )
{
	const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test( email );
}

