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
	var v = new View( {
		title: i18n( 'i18n_calculator' ),
		width: 198,
		height: 229,
		'min-width': 198,
		'min-height': 229
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:calculator.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

Application.receiveMessage = function( msg )
{
	//console.log( msg );
}

