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

var system = window.system || {};

// TODO -> js file
window.config = {
	defaultHost : 'treeroot.org',
	protocol : 'https://',
	display : '1',
	module : 'main',
	foo : 'bar',
	mode : 'view',
	closeall : true
};


(function( ns, undefined )
{
	ns.Treeroot = function( app, config )
	{
		console.log( 'Treeroot' );
		var self = this;
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
		if ( !msg.data || !msg.data.username || !msg.data.password ) {
			console.log( 'login - missing data', msg );
			return;
		}
		
		if ( !window.MD5 ) {
			console.log( 'login - window.MD5 not found, can not proceed' );
			return;
		}
		
		var md5Pass = window.MD5( msg.data.password );
		self.authenticate( msg.data.username, md5Pass );
	}
	
	ns.Treeroot.prototype.logout = function()
	{
		var self = this;
		console.log( 'treeroot.logout' );
		self.saveAccount( null, {} );
		self.main.logout();
	}
	
	ns.Treeroot.prototype.fullscreen = function()
	{
		var self = this;
		console.log( 'treeroot.fullscreen' );
		window.config.module = '';
		window.config.mode = 'screen';
		window.config.display = '0';
		window.config.closeall = false;
		
		self.main.view.close();
		
		window.config.closeall = true;
		
		self.run();
	}
	
	ns.Treeroot.prototype.authenticate = function( username, password )
	{
		var self = this;
		console.log( 'treeroot.authenticate' );
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
		};
		console.log( 'authenticate - conf', conf );
		new system.Account( conf )
			.then( loggedIn )
			.catch( loginFailed );
			
		function loggedIn( account ) {
			// account contains sessionId, among other things
			self.account = {
				username : account.username,
				password : account.password,
			};
			
			self.saveAccount();
			self.setLastHost();
			self.main.open( self.host, account );
		}
		
		function loginFailed( err ) {
			console.log( 'loginFailed', err );
			self.main.showLogin();
		}
	}
	
	ns.Treeroot.prototype.init = function()
	{
		var self = this;
		self.commandMap = {
			'fullscreen' : fullscreen,
			'login' : login,
			'logout' : logout,
			'bm_showadd' : showAddHost,
			'bm_manage' : manageHosts,
		};
		
		function fullscreen( e ) { self.fullscreen(); }
		function login( e ) { self.login( e ); }
		function logout( e ) { self.logout( e ); }
		function showAddHost( e ) { self.main.showAddHost(); }
		function manageHosts( e ) { self.manageHosts(); }
		
		self.app.run = fun;
		function fun( fupConf )
		{
			self.run( fupConf );
		}
		
		Application.receiveMessage = receiveMessage;
		function receiveMessage( e ) { self.receiveMessage( e ); }
		
		if ( !window.library.component.FCrypto )
			throw new Error( 'FCrypto component not found' );
		
	}
	
	ns.Treeroot.prototype.run = function( fupConf )
	{
		var self = this;
		console.log( 'Treeroot.run', fupConf );
		self.loadLastHost(  hostBack );
		function hostBack( data ) {
			console.log( 'lasthostbackback', data );
			if ( !data )
				data = 'treeroot.org';
			
			self.host = data;
			loadAccount();
		}
		
		function loadAccount() { self.loadAccount( accBack ); }
		function accBack( data ) {
			console.log( 'accountBack', data );
			self.account = data || null;
			initMain();
		}
		
		function initMain() {
			self.main = new system.Main();
			if ( self.account )
				self.authenticate();
			else
				self.main.showLogin();
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
		self.loadSetting( 'hosts', callback );
	}
	
	ns.Treeroot.prototype.saveHosts = function( hosts, callback )
	{
		var self = this;
		self.saveSetting( 'hosts', hosts, callback );
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
		self.saveSetting( 'lastHost', host, callback );
	}
	
	ns.Treeroot.prototype.loadLastHost = function( callback )
	{
		var self = this;
		self.loadSetting( 'lastHost', lastBack );
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
			data: dataStr,
		});
		
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
			setting: setting,
		});
		
		function result( e, d )
		{
			console.log( 'load result', { e : e, d : d, s : setting });
			if( e !== 'ok' )
			{
				done( false );
				return;
			}
			
			d = objectify( d );
			console.log( 'loadBack', d );
			var data = d[ setting ];
			
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
		
		if( window.config.mode == 'screen' )
		{
			console.log( 'mode: screen' );
			
			self.view = new Screen( { 
				title: 'Treeroot', 
				width: 960, 
				height: 600,
				id: 'Treeroot'
			} );
			
			self.view.onClose = function() { self.quit(); }
			
			self.setMenuItems();
		}
		else
		{
			console.log( 'mode: view' );
			
			self.view = new View( { 
				title: 'Treeroot', 
				width: 960, 
				height: 600,
				id: 'Treeroot'
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
		var pubKey = getPubKey( account );
		
		self.loadedEvent = {
			type : 'open',
			data : {
				host : host,
				uniqueId : account.uniqueId,
				pubKey : pubKey,
				sessionId : account.sessionId,
				config : window.config
			},
		};
		
		self.showMain();
		
		function getPubKey()
		{
			var keys = self.account.crypt.getKeys();
			var pubKey = keys.pub;
			// removes whitespace and grabs the pub key
			pubKey = pubKey.split( /\s/ ).join( '' ).split('-----')[2];
			pubKey = window.encodeURIComponent( pubKey );
			return pubKey;
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
							name: i18n( 'i18n_fullscreen' ),
							command: 'fullscreen'
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
