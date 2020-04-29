/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	RefreshContacts();
};

function RefreshContacts( searchkeys )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'List' ).innerHTML = '<div class="List"><div class="HRow PaddingSmall sw1">' + i18n( 'i18n_no_contacts_available' ) + '</div></div>';
			return;
		}
	};
	m.execute( 'getcontacts' );
};

function AddContact()
{
	let cnt = new View( {
		title: i18n( 'i18n_add_contact' ),
		width: 400,
		height: 400
	} );
	
	
	let d = new File( 'Progdir:Templates/contact.html' );
	d.replacements = {
		inpFirstname: '',
		inpLastname: '',
		inpMobile: '',
		inpTelephone: '',
		inpAddress1: '',
		inpAddress2: '',
		inpPostcode: '',
		inpCity: '',
		inpCounty: '',
		inpCountry: '',
		inpComment: '',
		inpSex: 'unknown',
		inpAvatar: '',
		inpCompany: '',
		inpEmail: ''
	};
	d.i18n();
	d.onLoad = function( data )
	{
		cnt.setContent( data );
	}
	d.load();
};

Application.receiveMessage = function( msg )
{
	if( msg.command && msg.command == 'refreshcontacts' )
	{
		RefreshContacts();
	}
}

