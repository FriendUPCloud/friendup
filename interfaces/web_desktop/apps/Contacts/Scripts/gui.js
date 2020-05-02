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
		
		let conta = JSON.parse( d );
		let str = '<div class="List">';
		let sw = 2;
		for( var a = 0; a < conta.length; a++ )
		{
			sw = sw == 2 ? 1 : 2;
			
			str += '<div class="HRow PaddingSmall sw' + sw + '" onclick="EditContact(' + conta[ a ].ID + ')">';
			str += '<div class="PaddingLeft HContent25 Ellipsis FloatLeft">' + conta[ a ].Firstname + '</div>';
			str += '<div class="HContent25 Ellipsis FloatLeft">' + conta[ a ].Lastname + '</div>';
			str += '<div class="HContent25 Ellipsis FloatLeft">' + conta[ a ].Mobile + '</div>';
			str += '<div class="HContent25 Ellipsis FloatLeft">' + conta[ a ].Email + '</div>';
			str += '</div>';
		}
		str += '</div>';
		ge( 'List' ).innerHTML = str;
		
	};
	m.execute( 'getcontacts' );
};

function EditContact( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, b )
	{
		if( e != 'ok' ) return;
		var contact = JSON.parse( b );
		
		let cnt = new View( {
			title: i18n( 'i18n_edit_contact' ),
			width: 400,
			height: 400
		} );
	
		let d = new File( 'Progdir:Templates/contact.html' );
		d.replacements = {
			deletevisibility: '',
			inpID: contact.ID,
			inpFirstname: contact.Firstname,
			inpLastname: contact.Lastname,
			inpMobile: contact.Mobile,
			inpTelephone: contact.Telephone,
			inpAddress1: contact.Address1,
			inpAddress2: contact.Address2,
			inpPostcode: contact.Postcode,
			inpCity: contact.City,
			inpCounty: contact.County,
			inpCountry: contact.Country,
			inpComment: contact.Comment,
			inpSex: contact.Sex,
			inpAvatar: contact.Avatar,
			inpCompany: contact.Company,
			inpEmail: contact.Email
		};
		d.i18n();
		d.onLoad = function( data )
		{
			cnt.setContent( data );
		}
		d.load();
	}
	m.execute( 'getcontact', { contactid: id } );
}

function AddContact()
{
	let cnt = new View( {
		title: i18n( 'i18n_add_contact' ),
		width: 400,
		height: 400
	} );
	
	
	let d = new File( 'Progdir:Templates/contact.html' );
	d.replacements = {
		deletevisibility: 'visibility: hidden; pointer-events: none',
		inpID: '',
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

