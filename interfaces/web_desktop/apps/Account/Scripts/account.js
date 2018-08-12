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
			var sel = a == Application.useMode ? ' selected="selected"' : '';
			modeOut += '<option value="' + a + '"' + sel + '>' + modes[a] + '</option>';
		}
		
		f.replacements = {
			languages: languages,
			modes: modeOut
		};
		
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
			
			Application.sendMessage( { type: 'encryption', command: 'publickey', args: { encoded: false } }, function( data )
			{
				if( data && data.publickey )
				{
					displayPublicKey( data.publickey );
				}
			} );
		}
		f.load();
	}
	m.execute( 'userinfoget', { id: msg.userId } );	
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

