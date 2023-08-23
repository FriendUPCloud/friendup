/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.setApplicationName( 'Software' );
	var v = new View( {
		title: i18n( 'i18n_software' ),
		width: 1024,
		height: 600,
		id: 'software_administration',
		loadingAnimation: true
	} );
	this.setSingleInstance( true );

	this.mainView = v;
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	// Check if you're already a merchant
	var m = new Module( 'system' )
	m.onExecuted = function( e, d )
	{
		var itm = [];
		itm.push( {
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		} );
		
		// Get your user info (even profile picture)
		var m2 = new Module( 'system' );
		m2.onExecuted = function( e, d )
		{
			var level = false;
			if( e == 'ok' )
			{
				var info = JSON.parse( d );
				level = info.Level;
			}
			
			v.setMenuItems( itm );
			
			var f = new File( 'Progdir:Templates/main.html' );
			f.replacements = { 'buttons' : '' };
			f.i18n();
			f.onLoad = function( data )
			{
				console.log( 'Set content' );
				v.setContent( data );
			}
			f.load();
		}
		m2.execute( 'userinfoget', { uid: Application.userId } );
	}
	m.execute( 'merchantinfo' );
};

// Handle messages
var merchGUI = false; // Merchant gui
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( Application.commands[ msg.command ] )
	{
		Application.commands[ msg.command ]( msg );
	}
};

Application.commands = {
	// Registration of merchants
	registermerchant( msg )
	{
		if( merchGUI )
			return;
		merchGUI = new View( {
			title: i18n( 'i18n_register_as_merchant' ),
			width: 700,
			height: 600
		} );
		merchGUI.onClose = function()
		{
			merchGUI = null;
		}
		var m = new File( 'Progdir:Templates/merchant.html' );
		m.i18n();
		m.onLoad = function( data )
		{
			merchGUI.setContent( data );
		}
		m.load();
	}
};

