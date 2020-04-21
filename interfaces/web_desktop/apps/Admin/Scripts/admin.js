/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var AdminViews = {};

Application.run = function( msg )
{
		
	this.sendMessage( { type: 'system', command: 'setsingleinstance', value: true } );
	
	var v = new View( {
		title: 'Friend Admin',
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

// Available functions
messageFunctions = {

	about( msg )
	{
		console.log( msg );
		
		if( !AdminViews[ 'about' ] )
		{
			
			var d = new File( 'Progdir:Config.conf' );
			d.onLoad = function( conf )
			{
				var obj = {
					title: 'About Friend Admin',
					width: 400,
					height: 288
				};
				
				var f = new File( 'Progdir:Templates/about.html' );
				
				try
				{
					var json = JSON.parse( conf ); 
					
					console.log( json );
					
					obj.title += ( ' (v' + json.Version + ')' );
					
					f.replacements = { content: /*JSON.stringify( */conf/*, null, 2 )*/ };
				}
				catch( e ){  }
				
				AdminViews[ 'about' ] = new View( obj );
				
				f.onLoad = function( data )
				{
					AdminViews[ 'about' ].setContent( data );
				}
				f.load();
				
				AdminViews[ 'about' ].onClose = function()
				{
					AdminViews[ 'about' ] = false;
				}
				
			}
			d.load();
			
		}
		
		return Application.mainView.sendMessage( {
			command: 'about'
		} );
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

