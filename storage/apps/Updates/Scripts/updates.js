/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	var v = new View( {
		title: i18n( 'Updates' ),
		width: 600,
		height: 500
	} );
	this.mainView = v;
	
	v.onClose = function(){ Application.quit(); }
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
}
