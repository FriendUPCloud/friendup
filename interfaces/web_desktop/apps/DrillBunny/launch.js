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
	var s = new View({
		title: 'Drill Bunny',
		width: 350,
		height: 560
	});
	this.screen = s;
	s.setRichContentUrl( 'Progdir:index.html' );
	/*var f = new File( 'Progdir:index.html' );
	f.onLoad = function( data )
	{
		s.setContent( data );
	}
	f.load();*/
}

