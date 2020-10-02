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
	var wflags = {
		title: i18n( 'i18n_account' ),
		width: 720,
		height: 600
	};

	if( msg.args == 'addstorage' )
	{
		wflags.invisible = true;
		wflags.hidden = true;
	}
	
	var v = new View( wflags );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = v;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var s = JSON.parse( d );
		var f = new File( 'Progdir:Templates/main.html' );
		
		// Inject available languages in template
		var availLangs = {
			'en': 'English',
			'fr': 'French',
			'no': 'Norwegian',
			'fi': 'Finnish',
			'pl': 'Polish'
		};
		var languages = '';
		for( var a in availLangs )
		{
			var sel = a == Application.language ? ' selected="selected"' : '';
			languages += '<option value="' + a + '"' + sel + '>' + availLangs[ a ] + '</option>';
		}
		
		// Inject possible Workspace modes
		var modes = {
			normal: i18n( 'i18n_mode_normal' ),
			developer: i18n( 'i18n_mode_developer' ),
			gamified: i18n( 'i18n_mode_gamified' )
		};
		var modeOut = '';
		for( var a in modes )
		{
			var sel = a == Application.workspaceMode ? ' selected="selected"' : '';
			modeOut += '<option value="' + a + '"' + sel + '>' + modes[a] + '</option>';
		}
		
		f.replacements = 
		{
			languages: languages,
			modes: modeOut
		};

		// If FriendNetwork is enabled, add the options		
		var m = new Module('system');
		m.onExecuted = function( e,d )
		{
			if ( e == 'ok' && parseInt( d ) == 1 )
			{
				f.replacements.friendNetwork1 = '\
<div class="Tab IconSmall fa-institution">' + i18n( 'i18n_friendNetwork' ) + '</div>\
<div class="Tab IconSmall fa-institution">' + i18n( 'i18n_friendNetworkPowerSharing' ) + '</div>';

				f.replacements.friendNetwork3 = '\
<div class="Tab IconSmall fa-laptop">' + i18n( 'i18n_device_information' ) + '</div>';

				var ff = new File( 'Progdir:Templates/friendnetwork1.html' );
				ff.onLoad = function( data )
				{
					f.replacements.friendNetwork2 = data;

					var fff = new File( 'Progdir:Templates/friendnetwork2.html' );
					fff.onLoad = function( data )
					{
						f.replacements.friendNetwork4 = data;
						finish();
					};
					fff.load();
				};
				ff.load();
			}				
			else
			{
				f.replacements.friendNetwork1 = '';
				f.replacements.friendNetwork2 = '';
				f.replacements.friendNetwork3 = '';
				f.replacements.friendNetwork4 = '';
				finish();
			}
		};
		m.execute( 'checkfriendnetwork' );

		function finish()
		{
			//f.replacements = {
			//	'username' : s.Name,
			//	'fullname' : s.FullName,
			//	'email'    : s.Email
			//};
			f.i18n();
			f.onLoad = function( data )
			{
				v.setContent( data );
				s.command = 'userinfo';
				v.sendMessage( s );
				
				if( msg.args == 'addstorage' )
				{
					v.sendMessage( { command: 'addstorage' } );
				}				
				
				//Authenticate.load( 'publickey', displayPublicKey );
				
				Application.sendMessage( { type: 'encryption', command: 'publickey', args: { encoded: false } }, function( res, data )
				{	
					if( res && data && data.publickey )
					{
						displayPublicKey( data.publickey );
					}
				} );
			};
			f.load();
		}
	};
	m.execute( 'userinfoget', { id: msg.userId } );	
	
	// Set app in single mode
	this.setSingleInstance( true );
		
}

function displayPublicKey( data )
{
	Application.mainView.sendMessage( { command : 'setkey', data : data } );
}

// Receive messages
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	//console.log( 'Application.receiveMessage: ', msg );
	
	if( msg.command == 'saveresult' )
	{
		this.mainView.setFlag( 'title', i18n( 'i18n_account' ) + ( msg.result == 'ok' ? ' (saved)' : ' (failed to save)' ) );
		setTimeout( function()
		{
			Application.mainView.setFlag( 'title', i18n( 'i18n_account' ) );
		}, 1000 );
		
		// Update login in Workspace!
		if( msg.result == 'ok' )
		{
			Notify({'title':i18n('i18_account2'),'text':i18n('i18n_settings_saved')});
			Application.sendMessage( {
				type: 'system',
				command: 'updatelogin',
				username: msg.data.Name,
				password: msg.data.Password
			} );
		}
	}
	
	switch( msg.command )
	{
		case 'publickey': 
			Application.sendMessage( { type: 'encryption', command: 'publickey', args: { encoded: false } }, function( res, data )
			{
				if( res && data && data.publickey )
				{
					displayPublicKey( data.publickey );
				}
			} );
			break;
			
		case 'encrypt':
			if( msg.key )
			{
				//console.log( 'encrypt msg: ', msg );
				
				Authenticate.encrypt( {
					
					destinationViewId: msg.viewId,
					data: msg.key 
					
				}, function( item ){
					
					console.log( 'encrypt item: ', item );
					
					Application.sendMessage( {
						
						command: 'updatekey', 
						destinationViewId: item.destinationViewId, 
						data: item.data 
						
					} );
					
				} );
			}
			break;
		
		case 'decrypt':
			if( msg.key )
			{
				//console.log( 'decrypt msg: ', msg );
				
				Authenticate.decrypt( {
					
					destinationViewId: msg.viewId,
					data: msg.key 
					
				}, function( item ){
					
					console.log( 'decrypt item: ', item );
					
					Application.sendMessage( {
						
						command: 'updatekey', 
						destinationViewId: item.destinationViewId, 
						data: item.data 
						
					} );
					
				} );
			}
			break;
		
		default:
			return;
	}
}

