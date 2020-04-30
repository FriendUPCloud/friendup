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
	
};

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	if( msg.command == 'setdata' )
	{
		for( let a in msg.data )
		{
			// Value element
			if( ge( 'inp' + a ) )
			{
				ge( 'inp' + a ).value = msg.data[ a ];
			}
			// Need to search for it
			else
			{
				var inps = ge( 'Form' ).getElementsByTagName( 'input' );
				for( let v = 0; v < inps.length; v++ )
				{
					if( inps[ v ].type == 'radio' && inps[ v ].name == 'inp' + a && inps[ v ].getAttribute( 'key' ) == msg.data[ a ] )
					{
						inps[ v ].click();
						break;
					}
				} 
			}
		}
	}
};

function SaveForm()
{
	// TODO: Control form!
	let data = {
		Firstname:    ge( 'Firstname' ).value,
		Lastname:     ge( 'Lastname' ).value,
		Mobile:       ge( 'Mobile' ).value,
		Address1:     ge( 'Address1' ).value,
		Address2:     ge( 'Address2' ).value,
		Postcode:     ge( 'Postcode' ).value,
		City:         ge( 'City' ).value,
		County:       ge( 'County' ).value,
		Country:      ge( 'Country' ).value,
		Comment:      ge( 'Comment' ).value,
		Sex:          false,
		Avatar:       ge( 'Avatar' ).value,
		Company:      ge( 'Company' ).value,
		Email:        ge( 'Email' ).value
	};
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.sendMessage( {
				command: 'refreshcontacts'
			} );
			CloseView();
		}
		else
		{
			Alert( 
				i18n( 'i18n_problem_saving_contact' ), 
				i18n( 'i18n_problem_saving_contact_desc' ) 
			);
		}
	}
	m.execute( 'setcontact', data );
};
