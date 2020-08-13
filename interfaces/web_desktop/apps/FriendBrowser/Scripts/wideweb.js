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

Application.proxy = '';
Application.friendsession = '';
Application.run = function( msg )
{
	var v = new View( {
		title:  i18n( 'i18n_wideweb' ),
		width:  1100,
		height: 900
	} );

	v.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_about_wideweb' ),
					command: 'about'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'i18n_navigate' ),
			items: [
				{
					name: i18n( 'i18n_nav_back' ),
					command: 'navback'
				},
				{
					name: i18n( 'i18n_nav_forward' ),
					command: 'navforward'
				},
				{
					name: i18n( 'i18n_nav_reload' ),
					command: 'reload'
				}
			]
		},
		{
			name: i18n( 'i18n_bookmarks' ),
			items: [
				{
					name: 'Friend OS Home',
					command: 'navto:https://friendos.com/'
				},
				{
					name: 'Friend User Docs',
					command: 'navto:https://docs.friendos.com/docs/end-user-documentation/'
				},
				{
					name: 'Friend Nexus Forum',
					command: 'navto:https://friend-nexus.com/'
				},
				{
					name: 'DTube Videos',
					command: 'navto:https://d.tube/'
				}
			]
		}/*,
		{
			name: i18n( 'i18n_edit' ),
			items: [
			]
		}*/
	] );

	this.mainView = v;

	v.onClose = function( data )
	{
		Application.quit();
	}

	Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) );
	var f = new File( 'Progdir:Templates/webinterface.html' );
	f.replacements = {
		startupurl: msg.args ? msg.args : ''
	};
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			if( msg.args )
			{
				Application.receiveMessage( {
					command: 'seturl',
					url: msg.args
				} );
			}
		} );
	}
	f.load();

}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;

	if( msg.command.substr( 0, 6 ) == 'navto:' )
	{
		var url = msg.command.substr( 6, msg.command.length - 6 );
		msg.command = 'seturl';
		msg.url = url;
	}

	switch( msg.command )
	{
		case 'setcontent':
			Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) + ' - ' + msg.url );
			this.currentUrl = msg.url;
			break;
		case 'seturl':
			if( msg.url.indexOf( 'FriendBrowser/Templates/about.html' ) < 0 && msg.url != this.currentUrl )
			{
				this.currentUrl = msg.url;
				Application.mainView.setFlag( 'title', i18n( 'i18n_wideweb' ) + ' - ' + msg.url );
				// Logic calls do not end up back in the browser window..
				if( !msg.logic )
					this.mainView.sendMessage( { command: 'loadfile', filename: this.currentUrl } );
			}
			break;
		case 'updateproxy':
			Application.mainView.sendMessage( { command: 'setproxy', proxy: Application.proxy, friendsession: Application.friendsession } );
			break;
		case 'reload':
			this.receiveMessage( { command: 'seturl', url: this.currentUrl ? this.currentUrl : "" } );
			this.mainView.sendMessage( { command: 'loadfile', filename: this.currentUrl } );
			break;
		case 'forward':
			this.mainView.sendMessage( { command: 'forward' } );
			break;
		case 'backward':
			this.mainView.sendMessage( { command: 'backward' } );
			break;
		case 'activate_now':
			this.mainView.activate();
			break;
		case 'about':
			if( this.ab )
			{
				return this.ab.activate();
			}
			this.ab = new View( {
				title: i18n( 'i18n_about_wideweb' ),
				width: 300,
				height: 300
			} );
			var f = new File( 'Progdir:Templates/about_application.html' );
			f.onLoad = function( data )
			{
				Application.ab.setContent( data );
			}
			f.i18n();
			f.load();
			this.ab.onClose = function()
			{
				Application.ab = false;
			}
			break;
		case 'fnet_connect':
			Application.connectToFriend( msg.url );
			break;
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Application.cleanArray = function( keys )
{
	var out = [ ];
	for ( var key in keys )
	{
		if ( keys[ key ] )
			out[ key ] = keys[ key ];
	}
	return out;
};
Application.connectToFriend = function( url )
{
	// Do we have a / at the end of the url?
	var folder, path;
	var pos = url.indexOf( '/' );
	if ( pos > 0 )
	{
		url = url.substring( 0, pos );
		var command = url.substring( pos + 1 );
		if ( command.indexOf( '/' ) >= 0 )
		{
			folder = command.split( '/' )[ 0 ];
			path = command.split( '/' )[ 1 ];
		}
		else
		{
			folder = command;
			path = '';
		}
	}

	// No path, connects to the public page
	if ( !folder || folder == '' )
	{
		folder = 'public';
		path = '';
	}

	// Get the list from FriendNetworkShare
	var self = this; 
	FriendNetworkFriends.listCommunities( url, function( message )
	{
		if ( message.response )
		{
			// Only one user?
			if ( message.users.length == 1 && message.communities.length == 1 )
			{
				var user = message.users[ 0 ];

				// Find the shared folder
				for ( var s = 0; s < user.sharing.length; s++ )
				{
					var sharing = user.sharing[ s ];
					if ( sharing.name == folder )
					{
						// Disconnect from previous host
						if ( self.hostName && self.appName )
							FriendNetworkDoor.disconnectFromDoor( self.hostName, self.appName );

						// Connects to new one
						FriendNetworkDoor.connectToDoor( user.name, folder, function( msg )
						{
							if ( msg.response == 'connected' )
							{
								self.connecting = false;
								self.hostName = user.name;
								self.appName = folder;
								self.doorName = msg.connection.doorName;
								self.community = message.communities[ 0 ].name;
								self.mainView.sendMessage
								( 
									{ 
										command: 'fnetConnected', 
										hostName: self.hostName, 
										appName: self.appName, 
										doorName: self.doorName, 
										community: self.community, 
										path: path 
									} 
								);
							}
							else
							{
								self.connecting = false;
								self.mainView.sendMessage( { command: 'fnetConnectionFailed' } );
							}
						} );
						return;
					}
				}
			}
			// Other cases-> list!
			self.mainView.sendMessage( { command: 'listCommunities', url: url, communities: message.communities, users: message.users } );
		}
		else
		{
			self.mainView.sendMessage( { command: 'fnetConnectionFailed' } );
		}
	} );
};
