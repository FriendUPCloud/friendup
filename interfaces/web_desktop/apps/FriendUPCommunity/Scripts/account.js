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

var library = window.library || {};
library.system = library.system || {};

(function( ns, undefined )
{
	ns.Account = function( conf )
	{
		if ( !( this instanceof ns.Account ))
			return new ns.Account( conf );
		
		var self = this;
		self.host = conf.host,
		self.user = conf.user;
		self.pass = conf.md5Pass;
		
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
		if ( !self.user || !self.pass ) {
			reject( i18n('i18n_missing_user') );
			return;
		}
		
		// get uniqueId 
		var url = self.host + self.authPath;
		var uIdReq = {
			url : url,
			Username : self.user,
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
			reject( i18n('i18n_failed_to_get') );
		}
		
		// setup crypto
		function setupCrypto( uniqueId )
		{
			self.uniqueId = uniqueId;
			var seed = self.uniqueId + ':' + self.pass;
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
				reject( i18n('i18n_failed_to_decrypt'));
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
		if ( self.sessionId )
			req[ 'SessionID' ] = self.sessionId;
		
		return new window.Promise( makeRequest );
		function makeRequest( resolve, reject )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
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
	
})( library.system );
