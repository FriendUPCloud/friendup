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

var system = window.system || {};

Application.run = function( msg, iface )
{	
	this.sources = [];
	
	this.setApplicationName( 'Friend Calendar' );
	
	var v = new View( {
		title: i18n('i18n_your_calendar'),
		width: 960,
		height: 720
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	v.setMenuItems( [
		{
			name: i18n( 'menu_file' ),
			items: [
				{
					name: i18n( 'menu_refresh_calendar' ),
					command: 'refresh_calendar'
				},
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'menu_settings' ),
			items: [
				{
					name: i18n( 'menu_sources' ),
					command: 'sources'
				}
			]
		},
		{
			name: i18n( 'menu_view' ),
			items: [
				{
					name: i18n( 'menu_view_month' ),
					command: 'view_month'
				},
				{
					name: i18n( 'menu_view_week' ),
					command: 'view_week'
				},
				{
					name: i18n( 'menu_view_day' ),
					command: 'view_day'
				}
			]
		}
	] );
	
	// Load main template
	var t = new File( 'Progdir:Templates/main.html' );
	t.i18n();
	t.onLoad = function( data )
	{
		v.setContent( data );
		Application.receiveMessage ( { command: 'refresh_calendar' } );
	}
	t.load();
	
	this.mainView = v;
}

// Message matrix
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return false;
	switch( msg.command )
	{
		case 'quit':
			Application.quit();
			break;
		case 'view_month':
		case 'view_week':
		case 'view_day':
			break;
		case 'sources':
			// TODO: activate window
			if( this.sourcesWindow )
				return;
			var w = new View( {
				title: i18n('i18n_calendar_sources'),
				width: 700,
				height: 500
			} );
			w.onClose = function()
			{
				Application.sourcesWindow = false;
			}
			this.sourcesWindow = w;
			var f = new File( 'Progdir:Templates/sources.html' );
			f.replacements = {
				'add_source'        : i18n( 'i18n_add_source' ),
				'close'             : i18n( 'i18n_close' )
			};
			f.onLoad = function( data )
			{
				w.setContent( data );
			}
			f.load();
			break;
		case 'refresh_calendar':
			this.getSources( executeRefresh );
			break;
		case 'closesources':
			if( this.sourcesWindow )
				this.sourcesWindow.close();
			break;
	}
}

// Gets all sources anew
Application.getSources = function( callback )
{
	// Get an existing one!
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var sources = false;
			
			try
			{
				sources = JSON.parse( d );
			}
			catch( e )
			{
				sources = false;
			}
			
			// Refreshed
			if( sources )
			{
				Application.sources = sources.calendarsources;
			}
			else
			{
				Application.sources = false;
			}
			
			if( callback )
			{
				callback();
			}
		}
	}
	m.execute( 'getsetting', {
		setting: 'calendarsources'
	} );
}

// Login to all accounts!
function login( src, callback )
{
	if ( !src.Type || !src.Server || !src.Username || !src.Password )
	{
		console.log( 'login - missing data', src );
		return false;
	}
	
	if ( !window.MD5 )
	{
		console.log( 'login - window.MD5 not found, can not proceed' );
		return false;
	}
	
	var md5Pass = window.MD5( src.Password );
	
	var conf = {
		host : src.Server,
		user : src.Username,
		md5Pass : md5Pass
	};
	
	new system.Account( conf )
		.then( loggedIn )
		.catch( loginFailed );
		
	function loggedIn( account )
	{
		// account contains sessionId, among other things
		src.account = {
			username : account.username,
			password : account.password,
		};
		
		// Yes, continue!
		callback();
	}
	
	function loginFailed( err )
	{
		console.log( 'loginFailed', err );
		//self.main.showLogin();
	}
}

// Refresh calendar events from servers
function executeRefresh( index )
{
	// Authenticate with source
	if( !Application.sources.length )	
		return false;
	
	var sourceCount = 0;
	
	// Count how many sources we have
	// TODO: Skip faulty / disabled ones
	for( var a = 0; a < Application.sources.length; a++ )
	{
		sourceCount++;
	}
	
	var finalEvents = [];
	
	// Connect
	for( var a = 0; a < Application.sources.length; a++ )
	{
		if( !Application.sources[a].account )
		{
			login( Application.sources[a], function(){ executeRefresh( a ); } );
			continue;
		}
		var src = Application.sources[a];	
		switch( src.Type )
		{
			case 'treeroot':
			default:
				var pubKey = GetPubKey( src.account );
				console.log( 'The pub key!!', pubKey );
				continue;
				
				var m = new Module( 'system' );
				m.index = a;
				var args = {
					url: 'https://treeroot.org/authenticate/',
					Username: src.Username,
					Password: src.Password,
					Source: 'FriendUP'
				};
				
				m.onExecuted = function( e, d )
				{
					var o = JSON.parse( d );
					if( o.response == 'ok' )
					{
						var mm = new Module( 'system' );
						var args = {
							url:      'https://treeroot.org/components/events/',
							SessionID: o.sessionid
						};
						mm.index = this.index;
						mm.onExecuted = function( e2, d2 )
						{
							if( e2 == 'ok' )
							{
								// Go through the items object
								var data = JSON.parse( d2 );
								var events = [];
								for( var a in data.items )
								{
									// Go throug the month by weeks
									for( var b = 0; b < data.items.object.weeks.array.length; b++ )
									{
										var week = data.items.object.weeks.array[b];
										if( !week.days || !week.days.array )
											continue;
										for( c = 0; c < week.days.array.length; c++ )
										{
											if( !week.days.array[c].events ) continue;
											if( !week.days.array[c].events.array ) continue;
											var ev = week.days.array[c].events.array;
											// Go through events list for this day
											for( var a = 0; a < ev.length; a++ )
											{
												if( ev[a].EventName.length )
												{
													var o = {
														DateStart: ev[a].EventDateStart,
														DateEnd:   ev[a].EventDateEnd,
														Name:      ev[a].EventName
													};
													events.push( o );
												}
											}
										}
									}
								}
								if( events.length )
								{
									finalEvents[this.index] = events;	
								}
							}
							CheckSourceCount( --sourceCount, finalEvents );
						}
						mm.execute( 'proxyget', args );
					}
					else
					{
						CheckSourceCount( --sourceCount, finalEvents );
					}
				}
				m.execute( 'proxyget', args );
				break;
		}
	}
}

// Finally check the source count
function CheckSourceCount( count, events )
{
	if( count == 0 )
	{
		var fe = [];
		for( var a = 0; a < events.length; a++ )
		{
			for( var b = 0; b < events[a].length; b++ )
			{
				fe.push( events[a][b] );
			}
		}
		if( fe.length )
		{
			Application.mainView.sendMessage( {
				command: 'updateEvents',
				events: fe
			} );
		}
	}
}

function GetPubKey( account )
{
	var keys = account.crypt.getKeys();
	var pubKey = keys.pub;
	// removes whitespace and grabs the pub key
	pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
	pubKey = window.encodeURIComponent( pubKey );
	console.log( 'This is they pub key!: ', pubKey );
	return pubKey;
}

/* Account object.. --------------------------------------------------------- */

(function( ns, undefined )
{
	ns.Account = function( conf )
	{
		if ( !( this instanceof ns.Account ))
			return new ns.Account( conf );
		
		var self = this;
		self.host = conf.host,
		self.username = conf.user;
		self.password = conf.md5Pass;
		
		self.source = 'friendup';
		return self.init();
	}
	
	// PUBLIC
	
	// example
	ns.Account.prototype.postSomethingMaybe = function( snarkyComment ) {
		var self = this;
		if ( !self.sessionId )
			return false;
		
		var req = {
			url : '*points*',
			foo : snarkyComment,
		}
		self.request( req );
	}
	
	// PRIVATE
	
	ns.Account.prototype.authPath = '/authenticate/';
	//ns.Account.prototype.registerPath = '/components/register/';
	//ns.Account.prototype.registerActivatePath = '/components/register/activate/';
	//ns.Account.prototype.uniqueIdPath = '/authentication/uniqueid/';
	//ns.Account.prototype.logoutPath = '/menu/logout/';
	//ns.Account.prototype.contactPath = '/components/contacts/';
	//ns.Account.prototype.relationsPath = '/components/contacts/relations/';
	//ns.Account.prototype.subscriptionPath = '/components/contacts/requests/';
	//ns.Account.prototype.imagesPath = '/components/library/';
	//ns.Account.prototype.getMessagesPath = '/components/chat/messages/';
	//ns.Account.prototype.getLastMessagePath = '/components/chat/lastmessage/';
	//ns.Account.prototype.postMessagePath = '/components/chat/post/';
	
	ns.Account.prototype.init = function()
	{
		var self = this;
		return new window.Promise( doAuth );
		function doAuth( resolve, reject )
		{
			self.tryLogin( resolve, reject );
		}
	}
	
	ns.Account.prototype.tryLogin = function( resolve, reject ) {
		var self = this;
		if ( !self.username || !self.password ) {
			reject( i18n('i18n_reject' ) );
			return;
		}
		
		// get uniqueId 
		var url = self.host + self.authPath;
		var uIdReq = {
			url : url,
			Username : self.username,
			Source : self.source,
		}
		self.request( uIdReq )
			.then( haveUniqueId )
			.catch( uniqueIdFailed );
		
		function haveUniqueId( data )
		{
			setupCrypto( data.uniqueid );
		}
		
		function uniqueIdFailed( err )
		{
			console.log( 'uniqueIdFailed', err );
			reject( i18n('i18n_failed_to_get_unique_id') );
		}
		
		// setup crypto
		function setupCrypto( uniqueId )
		{
			self.uniqueId = uniqueId;
			var seed = self.uniqueId + ':' + self.password;
			var conf = {
				seed : seed,
			};
			self.crypt = new library.component.FCrypto( conf );
			var keys = self.crypt.getKeys();
			getTempPass( keys.pub );
		}
		
		// send public key to get temporary pass
		function getTempPass( pubKey )
		{
			var url = self.host + self.authPath;
			var tmpPassReq = {
				url : url,
				'Source' : self.source,
				'UniqueID' : self.uniqueId,
				'PublicKey' : pubKey,
			}
			self.request( tmpPassReq )
				.then( gotTmpPass )
				.catch( tmpPassFailed );
				
			function gotTmpPass( data )
			{
				signPass( data.password );
			}
			
			function tmpPassFailed( err )
			{
				console.log( 'tmpPassFailed', err );
				reject( i18n('i18n_fetching_temp_pass') );
			}
		}
		
		// sign temp pass
		function signPass( tmpPass )
		{
			var dePass = self.crypt.deRSA( tmpPass );
			if ( !dePass ) {
				reject( i18n('i18n_failed_to_decrypt') );
				return;
			}
			var signedPass = self.crypt.sign( dePass );
			var url = self.host + self.authPath;
			var signedPassReq = {
				url : url,
				'Source' : self.source,
				'UniqueID' : self.uniqueId,
				'Signature' : signedPass,
			};
			self.request( signedPassReq )
				.then( authSuccess )
				.catch( authFailed );
				
			function authSuccess( data )
			{
				loggedIn( data.sessionid );
			}
			
			function authFailed( err )
			{
				console.log( 'authFailed', err )
				reject( err );
			}
		}
		
		// authentication nominal
		function loggedIn( sessionId )
		{
			self.sessionId = sessionId;
			resolve( self );
		}
	}
	
	ns.Account.prototype.request = function( req )
	{
		var self = this;
		console.log( 'request', req );
		if ( self.sessionId )
			req[ 'SessionID' ] = self.sessionId;
		
		return new window.Promise( makeRequest );
		function makeRequest( resolve, reject )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( 'reqBack', { e : e, d : d });
				if( e == 'ok' )
				{
					d = JSON.parse( d );
					resolve( d );
				}
				else
					reject( e );
			}
			m.execute( 'proxyget', req );
		}
	}
	
})( system );

