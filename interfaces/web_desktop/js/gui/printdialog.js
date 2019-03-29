/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Printdialog = function( flags )
{
	var v = new View( {
		title: 'i18n_print',
		width: 700,
		height: 400
	} );
	
	var f = new File( 'System:templates/print.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
};
