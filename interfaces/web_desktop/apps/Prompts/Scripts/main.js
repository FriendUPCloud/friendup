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
    	title: 'Prompts',
    	width: 800,
    	height: 440,
    	quitOnClose: true,
    	assets: [ 
    		'Progdir:Scripts/inside.js', 
    		'Progdir:Markup/main.css',
    		'Progdir:Markup/main.html' 
		],
		transparent: true
    } );
}
