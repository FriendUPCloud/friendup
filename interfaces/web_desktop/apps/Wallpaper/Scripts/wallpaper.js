/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	var w = new View ( {
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
	
	var no_images_in_folder = i18n('i18n_no_images_in_folder');
	
	// Lets load our main settings file
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			// Copy settings in
			if( !Application.settings ) Application.settings = {};
			try
			{ 
				var setar = JSON.parse( d );
				for( var a in setar )
					Application.settings[a] = setar[a];
			}
			catch( e )
			{
			}
		}
		
		// Go on!
		var f = new File( 'Progdir:Templates/main.html' );

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
			if( this.settings )
			{
				this.mainView.sendMessage ( { command: 'setimages', mode: 'doors', images: Application.settings.imagesdoors } );
			}
			break;
	}
}

