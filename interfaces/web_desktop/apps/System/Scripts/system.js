/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var SystemViews = {};

var Config = { data: {}, raw: '' };

Application.run = function( msg )
{
	
	this.sendMessage( { type: 'system', command: 'setsingleinstance', value: true } );
	
	var d = new File( 'Progdir:Config.conf' );
	d.onLoad = function( conf )
	{
		
		try
		{
			Config.raw  = conf;
			Config.data = JSON.parse( conf ); 
			
			console.log( Config.data );
		}
		catch( e ){  }
		
		var v = new View( {
			title: 'System' + ( Config.data.Version ? ' (v' + Config.data.Version + ')' : '' ),
			width: 1280,
			height: 960
		} );
	
		this.mainView = v;
		
		var f = new File( 'Progdir:Templates/main.html' );
		f.onLoad = function( data )
		{
			v.setContent( data );
		}
		f.load();
		
		v.onClose = function()
		{
			Application.quit();
		}
		
		v.setMenuItems( [
			{
				name: i18n( 'i18n_file' ),
				items: [
					{
						name: i18n( 'i18n_about' ),
						command: 'about'
					}
				]
			}
		] );
		
	}
	d.load();
	
}

// Available functions
messageFunctions = {

	about( msg )
	{
		
		if( !SystemViews[ 'about' ] )
		{
			
			SystemViews[ 'about' ] = new View( {
				title: 'About Friend System' + ( Config.data.Version ? ' (v' + Config.data.Version + ')' : '' ),
				width: 400,
				height: 288
			} );
			
			var f = new File( 'Progdir:Templates/about.html' );
			f.replacements = { 
				content: Config.raw 
			};
			f.onLoad = function( data )
			{
				SystemViews[ 'about' ].setContent( data );
			}
			f.load();
			
			AdminViews[ 'about' ].onClose = function()
			{
				AdminViews[ 'about' ] = false;
			}
				
		}
		
	}
	
};

// Execute on received message
Application.receiveMessage = function( msg )
{	
	if( !msg.command ) return;
	if( messageFunctions[ msg.command ] )
	{
		return messageFunctions[ msg.command ]( msg );
	}
	return false;
}

