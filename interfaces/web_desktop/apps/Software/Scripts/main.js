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
    let v = new View( {
    	title: 'Software',
    	width: 960,
    	height: 768,
    	quitOnClose: true,
    	assets: [
    		'Progdir:Markup/main.html',
    		'Progdir:Markup/main.css',
    		'Progdir:Scripts/toolbar.fui.css',
    		'Progdir:Scripts/toolbar.fui.js',
    		'Progdir:Scripts/software.fui.css',
    		'Progdir:Scripts/software.fui.js'
    	]
    } );
}
