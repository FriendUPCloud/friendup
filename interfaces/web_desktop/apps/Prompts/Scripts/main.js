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
    
    this.mainView = v;
    this.initialized = true;
}

Application.receiveMessage = function( msg )
{
	if( !this.initialized ) return;
	switch( msg.command )
	{
		case 'add_server':
			return this.addServer();
		default:
			this.mainView.sendMessage( msg );
			break;
	}
}

Application.addServer = function()
{
	let self = this;
	
	if( this.s ) return this.s.activate();
	this.s = new View( {
		title: i18n( 'i18n_add_server' ),
		width: 320,
		height: 320
	} );
	this.s.onClose = function()
	{
		self.s = null;
	}
}

