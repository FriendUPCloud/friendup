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
(function( ns, undefined )
{
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 	
	ns.Trello = function( app, config )
	{
		console.log( 'Trello' );
		var self = this;
		self.app = app;
		self.config = config;
		self.account = null;
		self.trellohost = null;
		
		self.init();
	}

	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 	
	ns.Trello.prototype.run = function( fupConf )
	{
		var self = this;
		
		
		//console.log( 'Trello.run', fupConf );
		self.loadSettings();
	}
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.loadSettings = function()
	{

		//user settings
		var m = new Module('system');
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var tmp;
				try
				{
					tmp = JSON.parse( d );
				}
				catch(e)
				{
					window.trello.account = false;
					window.trello.checkSettings();
					return;
				}
				window.trello.account = tmp.trellosettings;
			}
			else
			{
				window.trello.account = false;	
			}
			window.trello.checkSettings();
		}
		m.execute( 'getsetting',{'setting':'trellosettings'} );

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
					window.trello.displayError('System settings were not parsable. Please restart application.');
					console.log(d);
					return;
				}
				window.trello.trellohost = tmp;
				window.trello.checkSettings();
			}
			else
			{
				window.trello.displayError('Settings module did not return expected settings' + e + ' :: ' + d);
			}
		}
		m2.execute( 'getsystemsetting', {'type':'trello','key':'trellohost'} );
	}
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.checkSettings = function()
	{
		console.log('check settings... ',this.account,this.trellohost);
		if( this.account === null || this.trellohost === null ) return;
		if( this.account === false && this.trellohost !== null ) { this.showLogin(); return; }
		
		this.checkAccount();
	};

	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.checkAccount = function()
	{
		this.loginTrelloUser( this.account.username, this.account.password, this.showApp, this.showLogin )
	};
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.showLogin = function()
	{
		var self = this;

		var w = new View( {
			title: i18n('i18n_trello_title'),
			width: 360,
			height: 360
		} );
		
		this.settingsDialogue = w;
		
		w.onClose = function()
		{
			Application.quit();
		}

		var f = new File( 'Progdir:Templates/settings.html' );
		f.replacements = {
			'uname': (this.account && this.account.username ? this.account.username : '' )
		};
		f.onLoad = function( data )
		{
			w.setContent( data, function()
				{
					//nothing to do here right now			
				}
			);
			w.setMenuItems( [
			{
				name: i18n( 'i18n_file' ),
				items: [
					{
						name: i18n( 'i18n_quit' ),
						command: 'quit'
					}
				]
			}
			]);
		}
		f.i18n();
		f.load();
		
	}
		
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.showApp = function()
	{
		var self = this;

		var w = new View( {
			title: i18n('i18n_trello_title'),
			width: 999,
			height: 700
		} );
		
		w.onClose = function()
		{
			Application.quit();
		}
		
		this.w = w;
		
		var f = new File( 'Progdir:Templates/trello.html' );
		f.i18n();
		f.replacements = {

		};			
		f.onLoad = function( data )
		{
			w.setContent( data, function()
			{
				w.sendMessage({
					'command':'launch',
					'trellohost': self.trellohost.url,
					'uname': (self.account.username ),
					'passw': ( self.account.password ),
					'trelloboard' : ( self.trellohost.defaultboard ?  self.trellohost.url + self.trellohost.defaultboard : self.trellohost.url ),
					'code' : self.authcode				
				});
			}
			);
			w.setMenuItems( [
			{
				name: i18n( 'i18n_file' ),
				items: [
					{
						name: i18n( 'i18n_quit' ),
						command: 'quit'
					}
				]
			}
			]);
		}
		f.load();
		
	}

	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.displayError = function( emsg )
	{
		// Make a new window with some flags
		var v = new View( {
			title: 'Trello Error',
			width: 480,
			height: 240
		} );	
		v.onClose = function()
		{
			Application.quit();
		}
		v.setContent('<h1 style="color:#F00; padding:32px; border:4px solid #F00; margin:32px; border-radius:8px;">'+ emsg +'</h1>');
	};
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.init = function()
	{
		var self = this;

		function showSettings( e ) { self.main.showSettings(); }
		
		self.app.run = fun;
		function fun( fupConf )
		{
			self.run( fupConf );
		}
		
		Application.receiveMessage = receiveMessage;
		function receiveMessage( e ) { self.receiveMessage( e ); }
	};	
	
	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 		
	ns.Trello.prototype.receiveMessage = function( msg )
	{
		var self = this;
		//console.log( 'trello.receiveMessage', msg );
		if ( !msg.command && !msg.derp )
			return;

		if( msg.command == 'savecredentials' )
		{
			self.checkAndSaveCredentials( msg );
			return;
		}
		//console.log( 'receiveMessage - unhandled msg', msg );
	};
	
	ns.Trello.prototype.checkAndSaveCredentials = function( msg )
	{
		this.loginTrelloUser( msg.data.username, msg.data.password, this.saveNewUserCredentials )
	};
	
	ns.Trello.prototype.loginTrelloUser = function( uname, passw, successCallback, failCallBack )
	{
		this.loginSuccessCallback = successCallback;
		this.loginFailedCallback = failCallBack;
	
		if( !this.trellohost.url )
		{
			this.showError('Server config invalid. Clsoe application and inform your adminsitrator'); 
			return;
		}
	
		var loginURL = this.trellohost.url + '1/authentication';
		var postdata = 'method=password&factors%5Buser%5D='+ encodeURIComponent( uname ) +'&factors%5Bpassword%5D='+ encodeURIComponent( passw ) +'';
		
		this.account = { 'username':uname, 'password': passw };
		
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			
			console.log('new state 1e',this.readyState,this.status,this.getAllResponseHeaders() );
			
		    if (this.readyState == 4 && this.status == 200) {
				if( window.trello.settingsDialogue )
				{
					window.trello.settingsDialogue.onClose = function() {
						//do nothing
					};
					window.trello.settingsDialogue.close();	
				}
				
				//store for later....
				window.trello.authcode = this.responseText;
				
				if( window.trello.loginSuccessCallback ) window.trello.loginSuccessCallback();
			}
			else if(this.readyState == 4 && this.status == 403)
			{
					if( window.trello.settingsDialogue ) window.trello.settingsDialogue.sendMessage( {'command':'loginresult','loginresult':'negative'} );	
					if( window.trello.loginFailedCallback ) window.trello.loginFailedCallback();
			}
		};
	
		xhttp.open("POST", loginURL, true);
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( postdata );
	};

	ns.Trello.prototype.saveNewUserCredentials = function()
	{
		if( ! this.account )
		{
			console.log('Oh oh. should not happen');
			return;
		}
		
		//user settings
		var m = new Module('system');
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				//console.log('User creds saved');			
				window.trello.showApp();	
			}
			else
			{
				console.log('could not save user credentials',e,d);
			}
		}
		m.execute( 'setsetting',{'setting':'trellosettings','data': this.account } );
	};

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
		
	}
	

	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == --- 
	ns.Main.prototype.setMenuItems = function( callback )
	{
		var self = this;
		var bmMenuItems = [];
		bmMenuItems.push( buildAddItem() );
		window.Trello.loadSettings( setsCallBack  );
		function setsCallBack() {

			setMenu( bmMenuItems );
			done();
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
							name: i18n( 'i18n_quit' ),
							command: 'quit'
						}
					]
				},
			] );
		}
	} // end of ns.Main.prototype.setMenuItems

	// == ---  == ---  == ---  == ---  == ---  == ---  == ---  == ---  == --- == ---  
	ns.Main.prototype.sendMessage = function( msg )
	{
		var self = this;
		if ( !self.view )
		{
			console.log( 'trello.main - no view, cant send message', msg );
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
		var self = this;
		self.logut();
		self.view.close();
		delete self.view;
		delete self.account;
		delete self.host;
	}
	
})( system );

window.trello = new window.system.Trello( window.Application, window.config );