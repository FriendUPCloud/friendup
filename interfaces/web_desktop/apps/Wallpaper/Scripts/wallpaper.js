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
	let w = new View ( {
		'title'      : i18n('Wallpaper'), 
		'width'      : 960, 
		'height'     : 600, 
		'id'         : 'wallpaper'
	} );
	
	this.mainView = w;
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	let no_images_in_folder = i18n('i18n_no_images_in_folder');
	
	// Lets load our main settings file
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			// Copy settings in
			if( !Application.settings ) Application.settings = {};
			try
			{ 
				let setar = JSON.parse( d );
				for( let a in setar )
					Application.settings[a] = setar[a];
			}
			catch( e )
			{
			}
		}
		
		// Go on!
		let f = new File( 'Progdir:Templates/main.html' );
		f.replacements = {
			'cancel'           : i18n('i18n_cancel'),
			'close'            : i18n('i18n_close'),
			'use'              : i18n('i18n_use'),
			'save'             : i18n('i18n_save'),
			'windows'          : i18n('i18n_windows'),
			'workbench'        : i18n('i18n_workbench'),
			'add_image'        : i18n('i18n_add_image'),
			'available_images' : i18n('i18n_available_images'),
			'add_desc'         : i18n('i18n_add_desc'),
			'wallpaper_for'    : i18n('i18n_wp_for' ),
			'add_image'        : i18n('i18n_add_image')
		};

		f.i18n();
		f.onLoad = function( data )
		{ 
			w.setContent( data );
		}
		f.load ();
	}
	m.execute( 'getsetting', { settings: [ 'imagesdoors', 'imageswindows' ] } );

	// Set app in single mode
	this.setSingleInstance( true );
}

// Handle messages
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'addimage':
			var f = new Filedialog( this.mainView, function( array ) 
			{	
				var images = [];
				
				if ( array.length )
				{
					for ( var a = 0; a < array.length; a++ )
					{
						images.push( array[a].Path );
					}
			
					// Interactively update path
					// TODO: Get directory from path function
					Application.currentPath = FiledialogPath( array[0] );
					
					// Add the images now
					Application.mainView.sendMessage( {
						command: 'addimages',
						images: images
					} );
				}
			}, Application.currentPath );
			break;
		case 'save':
		case 'abort':
			break;
		// This one "boots up", and starts with backdrop images
		case 'getimages':
			// Send list from settings
			if( this.settings )
			{
				this.mainView.sendMessage ( { command: 'setimages', mode: 'doors', images: Application.settings.imagesdoors } );
			}
			// Just send an empty list
			else
			{
				this.mainView.sendMessage ( { command: 'setimages', mode: 'doors', images: [] } );
			}
			break;
	}
}

