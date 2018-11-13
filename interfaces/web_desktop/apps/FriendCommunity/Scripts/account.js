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
		self.recoverykey = conf.recoverykey;
		
		self.uniqueId = conf.uniqueId;
		self.privatekey = conf.privatekey;
		self.publickey = conf.publickey;
		
		self.source = 'friendup';
		self.encoding = 'json';
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
	
	ns.Account.prototype.tryLogin = function( resolve, reject )
	{
		
		var self = this;
		console.log( 'checking account data: ', self );
		if ( !self.publickey && ( !self.username || !self.password ) )
		{
			reject( 'missing user / pass, check your inputs' );
			return;
		}
		
		var url = self.host + self.authPath;
		
		// have uniqueid
		if( self.uniqueId )
		{
			console.log( 'have uniqueid: ' + self.uniqueId );
			
			setupCrypto( self.uniqueId, self.privatekey );
		}
		// get uniqueId 
		else
		{
			var uIdReq = {
				url : url,
				Username : self.username,
				Source : self.source,
				Encoding : self.encoding
			}
			
			console.log( 'self.request( uIdReq ) ', uIdReq );
			
			self.request( uIdReq )
				.then( haveUniqueId )
				.catch( uniqueIdFailed );
		}
		
		function haveUniqueId( data )
		{
			setupCrypto( data.uniqueid );
		}
		
		function uniqueIdFailed( err )
		{
			console.log( 'uniqueIdFailed', err );
			reject( 'failed to get uniqueId' );
		}
		
		function returnBrowserStorage( e )
		{
			console.log( '--- running returnBrowserStorage:' );
			console.log( e );
		}
		
		// setup crypto
		function setupCrypto( uniqueId, privatekey )
		{
			self.uniqueId = uniqueId;
			
			if( privatekey )
			{
				var conf = {
					privateKey : privatekey
				};
			}
			else
			{
				var seed = self.uniqueId + ':' + self.password;
				var conf = {
					seed : seed
				};
			}
			
			self.crypt = new library.component.FCrypto( conf );
			self.keys = self.crypt.getKeys();
			
			// TODO: Make support for checking session and if logged out reauth, find out how to add localstorage to a friend app.
			console.log( 'storing keys and uniqueid to localstorage' );
			// TODO: Might not be nessasary to store keys because they are set somewhere else ask espen ...
			setBrowserStorage( 'privatekey', self.crypt.getCleanKey( self.keys.priv ) );
			setBrowserStorage( 'publickey', self.crypt.getCleanKey( self.keys.pub ) );
			setBrowserStorage( 'uniqueid', self.uniqueId );
			
			//console.log( getBrowserStorage( 'uniqueid', returnBrowserStorage ) );
			
			getTempPass( self.keys.pub );
		}
		
		// send public key to get temporary pass
		function getTempPass( pubKey )
		{
			var url = self.host + self.authPath;
			
			var tmpPassReq = {
				url : url,
				UniqueID : self.uniqueId,
				PublicKey : pubKey,
				Source : self.source,
				Encoding : self.encoding
			}
			
			if ( self.recoverykey )
			{
				tmpPassReq[ 'RecoveryKey' ] = self.recoverykey;
			}
			
			console.log( 'self.request( tmpPassReq ) ', tmpPassReq );
			
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
				reject( 'fetching temp pass failed' );
			}
		}
		
		// sign temp pass
		function signPass( tmpPass )
		{
			var dePass = self.crypt.deRSA( tmpPass );
			if ( !dePass ) {
				reject( 'failed to decrypt temp pass');
				return;
			}
			var signedPass = self.crypt.sign( dePass );
			var url = self.host + self.authPath;
			var signedPassReq = {
				url : url,
				UniqueID : self.uniqueId,
				Signature : signedPass,
				Source : self.source,
				Encoding : self.encoding
			};
			
			console.log( 'self.request( signedPassReq ) ', signedPassReq );
			
			self.request( signedPassReq )
				.then( authSuccess )
				.catch( authFailed );
				
			function authSuccess( data )
			{
				console.log( 'authSuccess( data ) ', data );
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
		
		function getBrowserStorage ( Name, callback )
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
		
		function setBrowserStorage ( Name, Data )
		{
			// TODO: remove domain reg for localStorage it connects to the url anyways no need for double stuff
			
			if ( !Name ) return;
			
			Name = Name.toLowerCase();
			
			// Put data into storage
			ApplicationStorage.set( Name, Data );
		}
	}
	
	ns.Account.prototype.request = function( req )
	{
		var self = this;
		console.log( 'request ...', req );
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

