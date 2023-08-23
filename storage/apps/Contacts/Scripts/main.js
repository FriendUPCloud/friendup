/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var cview = null;

Application.run = function( msg )
{
	cview = new View( {
		title: i18n( 'i18n_contacts' ),
		width: 600,
		height: 600
	} );
	
	cview.onClose = function()
	{
		Application.quit();
	}
	
	let f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		cview.setContent( data );
	}
	f.load();
};

// Receive application messages
Application.receiveMessage = function( msg )
{
	if( msg.command && msg.command == 'refreshcontacts' )
	{
		if( cview )
		{
			cview.sendMessage( msg );
		}
	}
}

