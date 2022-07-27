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
	console.log( 'account run', Application.serverConfig );
	if ( !window.Application.serverConfig )
	{
		const sc = new Module( 'system' );
		sc.onExecuted = ( s, d ) => 
		{
			console.log( 'account sc back', [ s, d ]);
			if ( 'ok' == s )
			{
				try 
				{
					Application.serverConfig = JSON.parse( d );
				}
				catch( ex )
				{
					
				}
			}
			
			start();
		}
	}
	else
	{
		start();
	}
	
	function start()
	{
		console.log( 'start', Application.serverConfig );
		var wflags = {
			title: i18n( 'i18n_account' ),
			width: 720,
			height: 600
		};

		let activeTab = null;
		let args = msg.args.split( ' ' );
		for( let a = 0; a < args.length; a++ )
		{
			if( args[a] == 'addstorage' )
			{
				wflags.invisible = true;
				wflags.hidden = true;
			}
			else if( args[a].substr( 0, 4 ) == 'tab=' )
			{
				let tab = args[a].split( '=' );
				activeTab = tab[1];
			}
		}
		
		let v = new View( wflags );
		
		v.onClose = function()
		{
			Application.quit();
		}
		
		window.Application.mainView = v;
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			let s = JSON.parse( d );
			let f = new File( 'Progdir:Templates/main.html' );
			
			//console.log( 'userinfoget', s );
			
			// Inject available languages in template
			let availLangs = {
				'en': 'English',
				'fr': 'French',
				'no': 'Norwegian',
				'fi': 'Finnish',
				'pl': 'Polish'
			};
			let languages = '';
			for( let a in availLangs )
			{
				let sel = a == Application.language ? ' selected="selected"' : '';
				languages += '<option value="' + a + '"' + sel + '>' + availLangs[ a ] + '</option>';
			}
			
			// Inject possible Workspace modes
			let modes = {
				normal    : i18n( 'i18n_mode_normal' ),
				developer : i18n( 'i18n_mode_developer' ),
				gamified  : i18n( 'i18n_mode_gamified' )
			};
			let modeOut = '';
			for( let a in modes )
			{
				var sel = a == Application.workspaceMode ? ' selected="selected"' : '';
				modeOut += '<option value="' + a + '"' + sel + '>' + modes[a] + '</option>';
			}
			
			f.replacements = 
			{
				languages : languages,
				modes     : modeOut,
				activeTab : activeTab
			};

			// If FriendNetwork is enabled, add the options		
			let m = new Module('system');
			m.onExecuted = function( e,d )
			{
				if ( e == 'ok' && parseInt( d ) == 1 )
				{
					f.replacements.friendNetwork1 = '\
	<div class="Tab IconSmall fa-institution">' + i18n( 'i18n_friendNetwork' ) + '</div>\
	<div class="Tab IconSmall fa-institution">' + i18n( 'i18n_friendNetworkPowerSharing' ) + '</div>';

					f.replacements.friendNetwork3 = '\
	<div class="Tab IconSmall fa-laptop">' + i18n( 'i18n_device_information' ) + '</div>';

					let ff = new File( 'Progdir:Templates/friendnetwork1.html' );
					ff.onLoad = function( data )
					{
						f.replacements.friendNetwork2 = data;

						let fff = new File( 'Progdir:Templates/friendnetwork2.html' );
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
					// remove groups tab from ui when groups feature is turned off
					if ( Application.serverConfig && false === Application.serverConfig.hasGroupsFeature )
					{
						//console.log( 'fonload', data );
						const d = document.createElement( 'div' );
						d.innerHTML = data;
						const tb = d.querySelector( '#MTabs .Tab.fa-group' );
						tb.parentNode.removeChild( tb );
						data = d.innerHTML;
					}
					
					//console.log( 'tb', data );
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
		window.Application.setSingleInstance( true );
	}
		
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
			if( msg.data && msg.data.name )
			{
				if( msg.data.passwordClearText )
				{
					Application.sendMessage( {
						type: 'system',
						command: 'updatelogin',
						username: msg.data.name,
						password: msg.data.passwordClearText
					} );
				}
				else
				{
					Application.sendMessage( {
						type: 'system',
						command: 'userupdate',
						reason: 'poke'
					} );
				}
			}
			else
			{
				Application.sendMessage( {
					type: 'system',
					command: 'userupdate',
					reason: 'poke'
				} );
			}
		}
	}
	
	switch( msg.command )
	{
		case 'closeView':
			CloseView( msg.viewId );
			Application.mainView.sendMessage( { command: 'refreshInvites', parentViewId: msg.parentViewId } );
			break;
		
		case 'resizeGroupWindow':
			Application.mainView.sendMessage( { command: 'resizeGroupWindow', viewId: msg.viewId } );
			break;
		case 'refreshgroups':
			Application.mainView.sendMessage( { command: 'refreshgroups' } );
			break;
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

