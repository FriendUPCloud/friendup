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
	var w = new View( {
		title: i18n( 'i18n_sys_dia' ),
		width: 700,
		height: 400,
		id: 'System_Diagnosis_View'
	} );
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
}

function loadDiagnostics( )
{
	
}

