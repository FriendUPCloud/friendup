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
    		'Progdir:Scripts/prompt.fui.js',
    		'Progdir:Scripts/prompt.fui.css',
    		'Progdir:Scripts/inside.js', 
    		'Progdir:Markup/main.css',
    		'Progdir:Markup/main.html' 
		],
		menu: [ {
			name: i18n( 'menu_file' ),
			items: [ {
				name: i18n( 'menu_quit' ),
				command: 'quit'
			} ]
		},
		{	
			name: i18n( 'menu_server' ),
			items: [ {
				name: i18n( 'menu_add_server' ),
				command: 'add_server'
			} ]
		} ],
		transparent: true
    } );
}
