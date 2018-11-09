/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var system = window.system || {};

// TODO -> js file
window.config = {
	defaultHost : 'friendup.world',
	protocol : 'https://',
	display : '1',
	module : 'main',
	foo : 'bar',
	mode : 'view',
	//mode : 'screen',
	closeall : true
};


(function( ns, undefined )
{
	ns.Treeroot = function( app, config )
	{
		var self = this;
		
		
		var msg = config;
	
		self.app = app;
		self.config = config;

		self.host = null;
		self.account = null;

		self.view = false;
		
		self.init();
	}
	
	ns.Treeroot.prototype.switchToHost = function( host )
	{
		var self = this;
		console.log( 'switchToHost', host );
		self.host = host;
		self.account = null;
		
		self.loadSetting( host, hostBack );
		function hostBack( data )
		{
			console.log( 'hostBack', data );
			if ( !data || !data.account )
			{
				self.main.showLogin();
				return;
			}
			
			self.authenticate( data.account.username, data.account.password );
		}
	}
	
	ns.Treeroot.prototype.login = function( msg )
	{
		var self = this;
		console.log( 'login', msg );
		
		if( msg.data && msg.data.sessionId )
		{
			var privKey = msg.data.privKey || self.privKey;
			// removes whitespace and grabs the priv key
			privKey = privKey.split( /\s/ ).join( '' ).split('-----')[2];
			privKey = privKey.split( /\n/ ).join( '' );
			privKey = privKey.split( /\rn/ ).join( '' );
			privKey = window.encodeURIComponent( privKey );
			
			var pubKey = msg.data.pubKey || self.pubKey;
			// removes whitespace and grabs the pub key
			pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
			pubKey = pubKey.split( /\n/ ).join( '' );
			pubKey = pubKey.split( /\rn/ ).join( '' );
			pubKey = window.encodeURIComponent( pubKey );
			
			self.getServerSettings( function( param )
			{
			
				self.main.loadedEvent = {
					type : 'open',
					data : {
						host : self.host,
						uniqueId : msg.data.uniqueId || self.uniqueId,
						privKey : privKey,
						pubKey : pubKey,
						sessionId : msg.data.sessionId,
						config : window.config
					},
				};
			
				self.main.showMain();
			
			} );
		}
		else
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
			self.authenticate( msg.data.username, md5Pass, msg.data.key );
		}
		
		return;
	}
	
	ns.Treeroot.prototype.recover = function( msg )
	{
		if( msg.data && msg.data.username )
		{
			// Recover
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var j = JSON.parse( d );
					
					if( j.response == 'ok' && j.data && j.data.length )
					{
						console.log( 'Recovery data sent to: ' + j.data );
					}
					else
					{
						console.log( j.code + ' : ' + j.reason + ' : ' + j.info );
					}
					
					Application.sendMessage( {
						command: 'recover',
						destinationViewId: msg.parentViewId,
						data : j
					} );
				}
				else
				{
					console.log( 'Some error trying to recover account ... ', { e: e, d: d } );
				}
			}
			m.execute( 'proxyget', {
				url: 'https://friendup.world/components/register/recover/',
				Email: msg.data.username,
				Encoding: 'json'
			} );
		}
	}
	
	ns.Treeroot.prototype.signup = function( msg )
	{
		var self = this;
		
		console.log( 'signup', msg );
		
		if ( !msg.data ) {
			console.log( 'signup - missing data', msg );
			return;
		}
		
		if( msg.data.email.length && msg.data.username.length && msg.data.password.length )
		{
			var email = msg.data.email;
			var username = msg.data.username;
			var password = msg.data.password;
			var firstName = msg.data.firstName;
			var lastName = msg.data.lastName;
			
			// Register
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					console.log( 'Got Register data ... ', { e: e, d: d } );
					
					// Lets get uniqueid and create keys!!
					var j = JSON.parse( d );
					if( j.response == 'ok' && j.data && j.data.length )
					{	
						var authKey = j.data;
						
						var mm = new Module( 'system' );
						mm.onExecuted = function( ee, dd )
						{
							var jj = JSON.parse( dd );
							if( ee == 'ok' && jj.response == 'ok' && jj.uniqueid && jj.uniqueid.length )
							{
								console.log( 'Got UniqueID ... ', { e: ee, d: dd } );
								
								var uniqueId = jj.uniqueid;
								
								// create keys
								
								var conf = {
									'uniqueId': uniqueId,
									'password': password
								}
								
								var keys = self.setupCrypto( conf );
								
								if( keys && keys.pub )
								{
									// Lets activate!!
									var mmm = new Module( 'system' );
									mmm.onExecuted = function( eee, ddd )
									{
										var jjj = JSON.parse( ddd );
										if( eee == 'ok' && jjj.response == 'ok' && jjj.data && jjj.data.length )
										{
											console.log( 'Got Activation data ... ', { e: eee, d: ddd } );
											
											var sessionId = jjj.data;
											
											// Received sessionid no need to run double login
											
											console.log( 'sessionId' );
											console.log( sessionId );
											
											self.login( {
												'data': {
													'sessionId': sessionId,
													'uniqueId': uniqueId,
													'privKey': keys.priv,
													'pubKey': keys.pub
												}
											} );
										}
										else if ( jjj.response == 'failed' )
										{
											alert( jjj.code + ' : ' + jjj.reason + ' : ' + jjj.info );
										}
										else
										{
											console.log( 'Some error trying to get sessionId ... ', { e: eee, d: ddd } );
										}
									}
									mmm.execute( 'proxyget', {
										url: 'https://friendup.world/components/register/activate/',
										UniqueID: uniqueId,
										Firstname: firstName,
										Lastname: lastName,
										UserType: '0',
										AuthKey: authKey,
										PublicKey: keys.pub,
										Source: 'friendup',
										Encoding: 'json'
									} );
								}
								else
								{
									console.log( 'problems with keys... ', keys );
								}
							}
							else if ( jjj.response == 'failed' )
							{
								alert( jj.code + ' : ' + jj.reason + ' : ' + jj.info );
							}
							else
							{
								console.log( 'Some error trying to get uniqueId ... ', { e: ee, d: dd } );
							}
						}
						mm.execute( 'proxyget', {
							url: 'https://friendup.world/authenticate/',
							Username: email,
							Source: 'friendup',
							Encoding: 'json'
						} );
					}
					else if ( j.response == 'failed' )
					{
						alert( j.code + ' : ' + j.reason + ' : ' + j.info );
					}
					else
					{
						console.log( 'Some error trying to get authKey ... ', { e: e, d: d } );
					}
				}
				else
				{
					console.log( 'Something went wrong trying to register ... ', { e: e, d: d } );
				}
			}
			m.execute( 'proxyget', {
				url: 'https://friendup.world/components/register/',
				Email: email,
				Username: username,
				Encoding: 'json'
			} );
		}
		
		return;
	}
	
	ns.Treeroot.prototype.logout = function()
	{
		var self = this;
		self.saveAccount( null, {} );
		self.main.logout();
		
		self.setBrowserStorage( 'privatekey', '' );
		self.setBrowserStorage( 'publickey', '' );
		self.setBrowserStorage( 'uniqueid', '' );
	}
	
	ns.Treeroot.prototype.fullscreen = function()
	{
		var self = this;
		window.config.module = '';
		window.config.mode = 'screen';
		window.config.display = '0';
		window.config.closeall = false;
		
		self.main.view.close();
		
		window.config.closeall = true;
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			self.run();
		}
		m.execute( 'setsetting', { 
			'setting' : 'fullscreen', 
			'data' : 'true' 
		} );
	}
	
	ns.Treeroot.prototype.windowmode = function()
	{
		var self = this;
		window.config.module = 'main';
		window.config.mode = 'view';
		window.config.display = '1';
		window.config.closeall = false;
		
		self.main.view.close();
		
		window.config.closeall = true;
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			self.run();
		}
		m.execute( 'setsetting', { 
			'setting' : 'fullscreen', 
			'data' : 'false' 
		} );
	}
	
	ns.Treeroot.prototype.getServerSettings = function( callback )
	{
		//host settings...
		var m2 = new Module( 'system' );
		m2.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var tmp;
			
				try
				{
					 tmp = JSON.parse( d );	
					 tmp = JSON.parse( tmp[0].Data );
				}
				catch(e)
				{
					console.log(d);
				}
			
				if( tmp )
				{
					if( callback ) return callback( tmp );
				}
			}
			else
			{
				console.log( {e:e,d:d} );
			}
		
			if( callback ) return callback( false );
		}
		m2.execute( 'getsystemsetting', {'type':'friendcommunity','key':'parameters'} );
	}
	
	ns.Treeroot.prototype.authenticate = function( username, password, recoverykey )
	{
		var self = this;
		
		if ( !self.host )
			return;
		
		if ( !username && !self.account )
		{
			self.main.showLogin();
			return;
		}
		
		var conf = {
			host : self.config.protocol + self.host,
			user : username || self.account.username,
			md5Pass : password || self.account.password,
			recoverykey : recoverykey
		};
		
		console.log( 'authenticate - conf', conf );
		
		new system.Account( conf )
			.then( loggedIn )
			.catch( loginFailed );
			
		function loggedIn( account )
		{
			// account contains sessionId, among other things
			self.account = {
				username : account.username,
				password : account.password,
				uniqueId : account.uniqueId/*,
				keys	 : account.keys*/
			};
			
			console.log( 'self.saveAccount()' );
			self.saveAccount();
			console.log( 'self.setLastHost()' );
			self.setLastHost();
			console.log( 'self.main.open( self.host, account ) ', { host: self.host, account: account } );
			self.main.open( self.host, account );
		}
		
		function loginFailed( err )
		{
			console.log( 'loginFailed', err );
			self.main.showLogin();
		}
	}
	
	ns.Treeroot.prototype.loginFromStorage = function()
	{
		console.log( 'trying loginFromStorage ...' );
		
		var self = this;
		
		if( !self.host )
			return;
		
		if( !self.account )
		{
			self.main.showLogin();
			return;
		}
		
		console.log( 'self.account: ', self.account );
		
		if( !self.account.publickey || !self.account.privatekey || !self.account.uniqueId )
			return;
		
		var conf = {
			'host' : self.config.protocol + self.host,
			'uniqueId' : self.account.uniqueId,
			'privatekey' : self.account.privatekey,
			'publickey' : self.account.publickey
		};
		
		console.log( 'authenticate - conf', conf );
		
		new system.Account( conf )
			.then( loggedIn )
			.catch( loginFailed );
			
		function loggedIn( account )
		{
			console.log( 'checking account for loggedIn: ', account );
			
			self.login( {
				'data': {
					'sessionId': account.sessionId,
					'uniqueId': account.uniqueId,
					'privKey': account.privatekey,
					'pubKey': account.publickey
				}
			} );
		}
		
		function loginFailed( err )
		{
			console.log( 'loginFailed', err );
			self.main.showLogin();
		}
	}
	
	ns.Treeroot.prototype.init = function()
	{
		var self = this;
		self.commandMap = {
			'fullscreen' : fullscreen,
			'window' : windowmode,
			'login' : login,
			'signup' : signup,
			'recover' : recover,
			'logout' : logout,
			'bm_showadd' : showAddHost,
			'bm_manage' : manageHosts,
		};
		
		function windowmode( e ) { self.windowmode(); }
		function fullscreen( e ) { self.fullscreen(); }
		function login( e ) { self.login( e ); }
		function signup( e ) { self.signup( e ); }
		function recover( e ) { self.recover( e ); }
		function logout( e ) { self.logout( e ); }
		function showAddHost( e ) { self.main.showAddHost(); }
		function manageHosts( e ) { self.manageHosts(); }
		
		self.app.run = fun;
		function fun( fupConf )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var j = {};
					
					try
					{
						j = JSON.parse( d );
					}
					catch ( e ) { console.log( d ) }
					
					window.config.mode = j.fullscreen === true ? 'screen' : 'view';
				}
				self.run( fupConf );
			}
			m.execute( 'getsetting', { 'setting' : 'fullscreen' } );
		}
		
		Application.receiveMessage = receiveMessage;
		function receiveMessage( e ) { self.receiveMessage( e ); }
		
		if ( !window.library.component.FCrypto )
			throw new Error( 'FCrypto component not found' );
		
	}
	
	ns.Treeroot.prototype.run = function( fupConf )
	{
		var self = this;
		self.loadLastHost(  hostBack );
		function hostBack( data )
		{
			console.log( 'lasthostbackback', data );
			if ( !data )
				data = 'friendup.world';
			
			self.host = data;
			loadAccount();
		}
		
		function loadAccount() { self.loadAccount( accBack ); }
		function accBack( data )
		{
			console.log( 'accountBack', data );
			self.account = data || null;
			initMain();
		}
		
		function initMain()
		{
			console.log( 'initMain()' );
			self.main = new system.Main();
			window.mainSystem = self.main; // <- breaks espens back
			if ( self.account )
			{
				self.authenticate();
				// TODO: First find out how to add privatekey to the dings to get it to work ...
				//self.getBrowserStorage( 'privatekey', checkStorage );
				//self.getBrowserStorage( 'publickey', checkStorage );
			}
			else
			{
				self.main.showLogin();
			}
		}
		
		function checkStorage( e )
		{
			console.log( 'checkStorage: ', e );
			
			if( self.account && e && e.data )
			{
				self.account[e.id] = e.data;
				
				self.loginFromStorage();
			}
			else
			{
				self.authenticate();
			}
		}
	}
	
	ns.Treeroot.prototype.receiveMessage = function( msg )
	{
		var self = this;
		console.log( 'treeroot.receiveMessage', msg );
		if ( !msg.command && !msg.derp )
			return;
		
		if ( 'viewmessage' === msg.derp )
		{
			self.receiveViewMessage( msg.data );
			return;
		}
		
		var handler = self.commandMap[ msg.command ];
		if ( handler )
		{
			handler( msg );
			return;
		}
		
		switch( msg.command )
		{
			case 'account_edit_profile':
			case 'account_settings':
			case 'global_settings':
			case 'nav_newsfeed':
			case 'nav_messages':
			case 'nav_calendar':
			case 'nav_library':
			case 'nav_browse':
			case 'nav_bookmarks':
				self.main.view.sendMessage( msg );
				break;
		}
		
		var host = checkForBM( msg.command );
		if ( host )
		{
			self.switchToHost( host );
			return;
		}
		
		console.log( 'receiveMessage - unhandled msg', msg );
		
		function checkForBM( str )
		{
			if ( !str || ( 'string' !== typeof( str )) || !str.length )
				return false;
			
			var parts = str.split( /\\/ );
			var prefix = parts[ 0 ];
			var host = parts[ 1 ];
			if ( 'bm_host' !== prefix || !host )
				return false;
			
			return host;
		}
	}
	
	ns.Treeroot.prototype.receiveViewMessage = function( msg )
	{
		var self = this;
		console.log( 'receiveViewMessage', msg );
		if ( 'main-loaded' === msg.type )
			self.main.loaded();
		
		if ( 'addhost' === msg.type ) {
			var host = msg.data;
			if ( !host || !host.length )
				return;
			
			host = host.split( /http[s]{0,1}:\/\// ).join( '' ); // remove http(s)://
			host = host.replace( /\/$/, '' );
			console.log( 'host after cleanup', host );
			self.addHost( msg.data, added );
			function added()
			{
				self.switchToHost( host );
			}
		}
	}
	
	ns.Treeroot.prototype.addHost = function( host, callback )
	{
		var self = this;
		self.loadHosts( hostsBack );
		function hostsBack( hosts )
		{
			hosts = hosts || [];
			var index = hosts.indexOf( host );
			console.log( 'addHost, index', { a : hosts, i : index, h : host });
			if ( -1 !== index ) // already present
				return;
			
			hosts.push( host );
			self.saveHosts( hosts, saveBack );
			function saveBack()
			{
				self.main.setMenuItems( callback );
			}
			
		}
	}
	
	ns.Treeroot.prototype.loadHosts = function( callback )
	{
		var self = this;
		self.loadSetting( 'fcommunity_hosts', callback );
	}
	
	ns.Treeroot.prototype.saveHosts = function( hosts, callback )
	{
		var self = this;
		self.saveSetting( 'fcommunity_hosts', hosts, callback );
	}
	
	ns.Treeroot.prototype.removeHost = function( host, callback )
	{
		var self = this;
		self.loadHosts( hostsBack );
		function hostsBack( hosts )
		{
			if ( !hosts )
			{
				console.log( 'removeHost, but hosts is empty.. oopsie?', { h : host, arr : hosts });
				done( true );
				return;
			}
			
			var index = hosts.indexOf( host );
			if ( -1 === index )
			{ // no present
				done( true );
				return;
			}
			
			hosts.splice( index, 1 );
			self.saveHosts( hosts, done );
		}
		
		function done( success )
		{
			if ( callback )
				callback( success );
		}
	}
	
	ns.Treeroot.prototype.setLastHost = function( host, callback )
	{
		var self = this;
		host = host || self.host;
		self.saveSetting( 'fcommunity_lastHost', host, callback );
	}
	
	ns.Treeroot.prototype.loadLastHost = function( callback )
	{
		var self = this;
		self.loadSetting( 'fcommunity_lastHost', lastBack );
		function lastBack( lastHost )
		{
			console.log( 'lastBack', lastHost );
			lastHost = lastHost || self.config.defaultHost;
			callback( lastHost );
		}
	}
	
	ns.Treeroot.prototype.saveAccount = function( host, account, callback )
	{
		var self = this;
		host = host || self.host;
		account = account || self.account;
		
		self.loadSetting( host, loadBack );
		function loadBack( data ) {
			console.log( 'saveAccount - loadBack', data );
			if ( !data )
				data = {};
			
			data.account = account;
			self.saveSetting( host, data, done );
		}
		
		function done( success )
		{
			console.log( 'saveAccount', success );
			if ( callback )
				callback( success );
		}
	}
	
	ns.Treeroot.prototype.loadAccount = function( callback )
	{
		var self = this;
		if ( !self.host )
		{
			callback( null );
			return;
		}
		
		var host = self.host;
		self.loadSetting( host, done );
		
		function done( data )
		{
			console.log( 'loadLogin', data );
			if ( !data )
				data = {};
			
			callback( data.account || null );
		}
	}
	
	ns.Treeroot.prototype.saveSetting = function( setting, data, callback )
	{
		var self = this;
		var dataStr = stringify( data );
		var m = new Module( 'system' );
		m.onExecuted = result;
		m.execute( 'setsetting', {
			setting: setting,
			data: dataStr
		} );
		
		function result( e, d )
		{
			console.log( 'save - onExecuted', { e: e, d: d });
			if ( 'ok' === e )
				done( true );
			else
				done( false );
		}
		
		function done( success )
		{
			if ( callback )
				callback( success );
		}
	}
	
	ns.Treeroot.prototype.loadSetting = function( setting, callback )
	{
		var self = this;
		var m = new Module( 'system' );
		m.onExecuted = result;
		m.execute( 'getsetting', {
			setting: setting
		} );
		
		function result( e, d )
		{
			console.log( 'load result', { e : e, d : d, s : setting });
			if( e !== 'ok' || d === 'fail' )
			{
				done( false );
				return;
			}
			
			d = objectify( d );
			var data = false;
			if( d && typeof( d[ setting ] ) != 'undefined' )
			{
				//console.log( 'loadBack', d );
				data = d[ setting ];
			}
			
			if ( !data )
				done( false );
			else
				done( data );
		}
		
		function done( data ) {
			if ( !data )
				data = null;
			
			callback( data );
		}
	}
	
	ns.Treeroot.prototype.setupCrypto = function( data )
	{
		var self = this;
		
		if( data && data.uniqueId && data.password )
		{
			if ( !window.MD5 ) {
				console.log( 'login - window.MD5 not found, can not proceed' );
				return false;
			}
			
			var md5Pass = window.MD5( data.password );
			
			var seed = data.uniqueId + ':' + md5Pass;
			
			var conf = {
				seed : seed
			};
			
			var crypt = new library.component.FCrypto( conf );
			var keys = crypt.getKeys();
			
			console.log( keys );
			
			if( keys )
			{
				var cleanedKeys = {
					'privKey' : crypt.getCleanKey( keys.pub ),
					'pubKey' : crypt.getCleanKey( keys.priv )
				};
				
				if( cleanedKeys )
				{
					self.setBrowserStorage( 'privatekey', cleanedKeys.privKey );
					self.setBrowserStorage( 'publickey', cleanedKeys.pubKey );
					self.setBrowserStorage( 'uniqueid', data.uniqueId );
					
					return keys;
				}
			}
		}
		
		return false;
	}
	
	ns.Treeroot.prototype.getBrowserStorage = function( Name, callback )
	{
		if ( !Name ) return false;
		
		Name = Name.toLowerCase();
		
		// Retrieve Data from storage
		var Data = ApplicationStorage.get( Name, callback );
		
		if ( Data )
		{
			return Data;
		}
		
		return false;
	}
	
	ns.Treeroot.prototype.setBrowserStorage = function( Name, Data )
	{
		if ( !Name ) return;
		
		Name = Name.toLowerCase();
		
		// Put data into storage
		ApplicationStorage.set( Name, Data );
	}
	
	
})( system );

(function( ns, undefined )
{
	ns.Main = function()
	{
		var self = this;
		
		self.mainLoaded = false;
		self.loadedEvent = null;
		self.account = null;
		self.host = null;
		
		self.init();
	}
	
	ns.Main.prototype.init = function()
	{
		var self = this;
		
		console.log( 'Opening screen: ' + window.config.mode );
		
		if( window.config.mode == 'screen' )
		{	
			self.view = new Screen( { 
				title: 'Friend Community',
				id: 'Friend Community'
			} );
			
			self.view.onClose = function() { self.quit(); }
			
			self.setMenuItems();
		}
		else
		{
			self.view = new View( { 
				title: 'Friend Community', 
				width: 1280, 
				height: 800,
				id: 'Friend Community'
			} );
			
			self.view.onClose = function() { self.quit(); }
			
			self.setMenuItems();
		}
	}
	
	ns.Main.prototype.quit = function()
	{
		var self = this;
		
		console.log( 'closeall: ' + window.config.closeall );
		
		if( window.config.closeall == true )
		{
			window.treeroot.app.quit();
		}
	}
	
	ns.Main.prototype.open = function( host, account )
	{
		var self = this;
		self.host = host;
		self.account = account;
		var keys = getKeys( account );
		//var pubKey = getPubKey( account );
		
		console.log( 'ns.Main.prototype.open = function( host, account )' );
		
		getServerSettings( function( param )
		{
			
			console.log( 'param: ', param );
			
			self.loadedEvent = {
				type : 'open',
				data : {
					host : host, 
					uniqueId : account.uniqueId, 
					privKey : keys.privKey, 
					pubKey : keys.pubKey, 
					sessionId : account.sessionId, 
					config : window.config, 
					param : ( param ? param : false ) 
				},
			};
			
			console.log( 'self.showMain() ' );
			
			self.showMain();
			
		} );
		
		function getPubKey()
		{
			var keys = self.account.crypt.getKeys();
			var pubKey = keys.pub;
			// removes whitespace and grabs the pub key
			pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
			pubKey = window.encodeURIComponent( pubKey );
			return pubKey;
		}
		
		function getKeys()
		{
			var keys = self.account.crypt.getKeys();
			
			var privKey = keys.priv;
			// removes whitespace and grabs the priv key
			privKey = privKey.split( /\s/ ).join( '' ).split('-----')[2];
			privKey = privKey.split( /\n/ ).join( '' );
			privKey = privKey.split( /\rn/ ).join( '' );
			privKey = window.encodeURIComponent( privKey );
			
			var pubKey = keys.pub;
			// removes whitespace and grabs the pub key
			pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
			pubKey = pubKey.split( /\n/ ).join( '' );
			pubKey = pubKey.split( /\rn/ ).join( '' );
			pubKey = window.encodeURIComponent( pubKey );
			
			return { 'privKey': privKey, 'pubKey': pubKey };
		}
		
		function getServerSettings( callback )
		{
			//console.log( 'getServerSettings( callback ) ', callback );
			
			//console.log( 'bypassing getServerSettings() since there is none ... and it\'s not working ...' );
			
			// Bypassing getting settings somehow it doesn't work ...
			//if( callback ) return callback( false );
			
			var timeout = setTimeout( function()
			{
				if( callback ) return callback( false );
			}, 3000 );
			
			//host settings...
			var m2 = new Module( 'system' );
			m2.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				clearTimeout( timeout );
				
				if( e == 'ok' )
				{
					var tmp;
					
					try
					{
						 tmp = JSON.parse( d );	
						 tmp = JSON.parse( tmp[0].Data );
					}
					catch(e)
					{
						console.log(d);
					}
					
					if( tmp )
					{
						if( callback ) return callback( tmp );
					}
				}
				else
				{
					console.log( {e:e,d:d} );
				}
				
				if( callback ) return callback( false );
			}
			m2.execute( 'getsystemsetting', {'type':'friendcommunity','key':'parameters'} );
			
			//console.log( '... ??? ... ' );
		}
	}
	
	ns.Main.prototype.showLogin = function()
	{
		var self = this;
		self.mainLoaded = false;
		var f = new File( 'Progdir:Templates/login.html' );
		f.onLoad = function( data )
		{
			self.view.setContent( data );
		}
		f.load();
	}
	
	ns.Main.prototype.showMain = function( callback )
	{
		var self = this;
		self.mainLoaded = false;
		var file = new File( 'Progdir:Templates/main.html' );
		file.onLoad = loaded;
		file.load();
		
		function loaded( data )
		{
			self.view.setContent( data );
			if ( callback )
				callback();
		}
	}
	
	ns.Main.prototype.loaded = function()
	{
		var self = this;
		self.mainLoaded = true;
		if ( !self.loadedEvent )
			return;
		
		self.sendMessage( self.loadedEvent );
		self.loadedEvent = null;
	}
	
	ns.Main.prototype.logout = function()
	{
		var self = this;
		self.view.setContent( '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; margin: 0" src="'
		+ 'https://'
		+ self.host
		+ '?logout=1"></iframe>' );
		self.showLogin();
	}
	
	ns.Main.prototype.showAddHost = function()
	{
		var self = this;
		console.log( 'main.showAddHost' );
		var showAdd = {
			type : 'showadd',
		};
		
		if ( !self.mainLoaded ) {
			self.loadedEvent = showAdd;
			self.showMain();
			return;
		}
		
		self.sendMessage( showAdd );
	}
	
	ns.Main.prototype.setMenuItems = function( callback )
	{
		var self = this;
		var bmMenuItems = [];
		bmMenuItems.push( buildAddItem() );
		window.treeroot.loadHosts( booksBack  );
		function booksBack( hosts ) {
			console.log( 'booksBack', hosts );
			hosts = hosts || [];
			var defaultHost = treeroot.config.defaultHost;
			if ( -1 === hosts.indexOf( defaultHost ))
				hosts.push( defaultHost );
			
			hosts.forEach( addBm );
			setMenu( bmMenuItems );
			done();
			
			function addBm( host )
			{
				var item = buildBmItem( host );
				bmMenuItems.push( item );
			}
		}
		
		function done() {
			if ( callback )
				callback( true );
		}
		
		function setMenu( bmMenuItems )
		{
			self.view.setMenuItems( [
				{
					name: i18n( 'i18n_file' ),
					items: [
						{
							name: ( window.config.mode == 'screen' ? i18n( 'i18n_window' ) : i18n( 'i18n_fullscreen' ) ),
							command: ( window.config.mode == 'screen' ? 'window' : 'fullscreen' )
						},
						{
							name: i18n( 'i18n_logout' ),
							command: 'logout'
						},
						{
							name: i18n( 'i18n_quit' ),
							command: 'quit'
						}
					]
				},
				{
					name: i18n( 'i18n_account' ),
					items: [
						{
							name: i18n( 'i18n_edit_profile' ),
							command: 'account_edit_profile'
						},
						{
							name: i18n( 'i18n_account_settings' ),
							command: 'account_settings'
						},
						{
							name: i18n( 'i18n_global_settings' ),
							command: 'global_settings'
						}
					]
				},
				{
					name: i18n( 'i18n_navigation' ),
					items: [
						{
							name: i18n( 'i18n_nav_newsfeed' ),
							command: 'nav_newsfeed'
						},
						{
							name: i18n( 'i18n_nav_messages' ),
							command: 'nav_messages'
						},
						{
							name: i18n( 'i18n_nav_calendar' ),
							command: 'nav_calendar'
						},
						{
							name: i18n( 'i18n_nav_library' ),
							command: 'nav_library'
						},
						{
							name: i18n( 'i18n_nav_browse' ),
							command: 'nav_browse'
						},
						{
							name: i18n( 'i18n_nav_bookmarks' ),
							command: 'nav_bookmarks'
						}
					]
				}/*,
				{
					name: i18n( 'i18n_bookmarks'),
					items: bmMenuItems,
				},*/
			] );
		}
		
		function buildAddItem()
		{
			return {
				name : i18n( 'i18n_bm_add' ),
				command : 'bm_showadd',
			};
		}
		
		function buildBmItem( host )
		{
			var command = 'bm_host\\' + host;
			return {
				name : host,
				command : command,
			};
		}
	}
	
	ns.Main.prototype.sendMessage = function( msg )
	{
		var self = this;
		if ( !self.view )
		{
			console.log( 'treeroot.main - no view, cant send message', msg );
			return;
		}
		
		wrap = {
			derp : 'viewmessage',
			data : msg,
		};
		console.log( 'main.sendMessage', wrap );
		self.view.sendMessage( wrap );
	}
	
	ns.Main.prototype.close = function()
	{
		console.log( 'closing ...' );
		var self = this;
		self.logut();
		self.view.close();
		delete self.view;
		delete self.account;
		delete self.host;
	}
	
})( system );

// TODO: use these from fup.tool
function stringify( obj )
{
	try {
		return JSON.stringify( obj );
	} catch( e ) {
		console.log( 'stringify failed', e );
		return '';
	}
}

function objectify( str )
{
	try {
		return JSON.parse( str );
	} catch( e ) {
		console.log( 'objectify failed', e );
		return null;
	}
}

window.treeroot = new window.system.Treeroot( window.Application, window.config );
