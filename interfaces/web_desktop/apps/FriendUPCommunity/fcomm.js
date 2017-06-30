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

Application.run = function( dataPacket )
{
	if ( !window.library.component.FCrypto )
		throw new Error( i18n('i18n_fcrypto_component') );
	
	// conf
	this.host = 'https://store.openfriendup.net';
	
	// open view
	var w = new Screen ( { 
		title: i18n('i18n_friendup_community'),
		width: 960, 
		height: 600,
		id: 'friendupcommunity'
	} );
	this.mainView = w;
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	// Menus
	w.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_logout' ),
					command: 'logout'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		}
	] );
	
	// Init login and register
	loadLogin()
		.then( doLogin )
		.catch( loadLoginFailed );
		
	function doLogin( data ) { authenticate( data.username, data.password ); }
	function loadLoginFailed( err )
	{
		console.log( 'loading login info failed', err );
		loadLoginScreen( Application.mainView );
	}
}

function loadFriendCommunity( w, account )
{
	// TODO: Fix temporary HACK
	w.setContent( '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; margin: 0" src="' + Application.host + '?logout=1"></iframe>' );
	// Delayed login
	setTimeout( function()
	{
		var keys = account.crypt.getKeys();
		var pubKey = keys.pub;
		// removes whitespace and grabs the pub key
		pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
		pubKey = window.encodeURIComponent( pubKey );
		w.setContent( '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; margin: 0" src="'
			+ Application.host
			+ '?component=authentication&action=login'
			+ '&UniqueID=' + account.uniqueId
			+ '&PublicKey=' + pubKey
			+ '&SessionID=' + account.sessionId
			+ '"></iframe>' );
	}, 500 );
}

function loadLoginScreen( w )
{
	var f = new File( 'Progdir:Templates/login.html' );
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
}

function saveLogin( user, pass )
{
	return new window.Promise( save );
	function save( resolve, reject )
	{
		var data = {
			username : user,
			password : pass,
		};
		var dataStr = JSON.stringify( data );
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( 'setsetting - onExecuted', { e: e, d: d });
			if ( 'ok' === e )
				resolve( d );
			else
				reject( e );
		}
		m.execute( 'setsetting', {
			setting: 'friendommunityLogin',
			data: dataStr,
		} );
	}
}

function loadLogin() {
	return new window.Promise( load );
	function load( resolve, reject )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e === 'ok' )
			{
				var d = JSON.parse( d );
				if ( !d.friendcommunityLogin || !d.friendcommunityLogin.username || !d.friendcommunityLogin.password ) {
					reject( i18n('i18n_missing_data') );
					return;
				}
				
				resolve( d.friendcommunityLogin );
			}
			else
			{
				reject( e );
			}
		}
		m.execute( 'getsetting', { setting: 'friendcommunityLogin' } );
	}
}

function authenticate( user, pass ) {
	var conf = {
		host : Application.host,
		user : user,
		md5Pass : pass,
	};
	new library.system.Account( conf )
		.then( loggedIn )
		.catch( loginFailed );
		
	function loggedIn( account )
	{
		// account contains sessionId, among other things
		Application.account = account;
		saveLogin( account.user, account.pass );
		loadFriendCommunity( Application.mainView, account );
	}
	
	function loginFailed( err )
	{
		console.log( 'loginFailed', err );
		loadLoginScreen( Application.mainView );
	}
}

function logout()
{
	console.log( 'logout' );
	saveLogin( null, null )
		.then( resetDone )
		.catch( resetFailed );
	
	function resetDone( res )
	{
		loadLoginScreen( Application.mainView );
	}
	
	function resetFailed( err )
	{
		console.log( 'resetFailed', err );
	}
}

Application.receiveMessage = function( msg )
{
	console.log( 'friendcommunity.receiveMessage', msg );
	
	if( !msg.command ) return;
	if( msg.command == 'login' )
	{
		if ( !msg.data || !msg.data.username || !msg.data.password ) {
			console.log( 'login - missing data', msg );
			return;
		}
		
		if ( !window.MD5 ) {
			console.log( 'login - window.MD5 not found, can not proceed' );
			return;
		}
		var md5Pass = window.MD5( msg.data.password );
		authenticate( msg.data.username, md5Pass );
	}
	else if( msg.command == 'logout' )
	{
		logout();
	}
}
