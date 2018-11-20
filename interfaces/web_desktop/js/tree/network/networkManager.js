/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Tree engine network elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Network = Friend.Tree.Network || {};
Friend.Tree.Network.RenderItems = Friend.Tree.Network.RenderItems || {};

Friend.Tree.Network.Manager = function ( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.appName = 'My application';
	this.password = 'A_fucking_complex_password_not_in_clear_in_the_code_6545465!';
	this.appInformation = false;
	this.userInformation = false;
    this.userCount = 0;
	this.objects = [ ];
	this.running = false;
	this.onReady = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Network.Manager', flags );
	this.users = {};
	this.ready = false;
	this.hostReady = false;
	this.applicationReady = false;
	this.applicationRunning = false;

	var appInformation = this.appInformation;
	if ( !appInformation )
		appInformation = {};
	if ( !appInformation.name )
		appInformation.name = this.root.name;
	if ( !appInformation.title )
		appInformation.name = 'An application created with the Tree engine!';
	if ( !appInformation.image )
		appInformation.image = this.resources.getApplicationIcon();
	if ( !appInformation.version )
		appInformation.version = this.root.version;
	if ( !appInformation.running )
		appInformation.running = false;
	this.appInformation = appInformation;

	var userInformation = this.userInformation;
	if ( !userInformation )
		userInformation = {};

	FriendNetwork.isReady( function( msg ) 
	{
		if ( msg.ready )
		{
			FriendNetwork.getUserInformation( function( message )
			{
				var userInfos = message.information;
				if ( !userInformation.name )
					userInformation.name = userInfos.name;
				if ( !userInformation.fullName )
					userInformation.fullName = userInfos.fullName;
				if ( !userInformation.description )
					userInformation.description = userInfos.description;
				if ( !userInformation.image )
					userInformation.image = userInfos.image;
				self.userInformation = userInformation;

				// Register the application
				FriendNetworkApps.registerApplication( self.appInformation, self.userInformation, self.password, handleMessages );
			} );
		}
		else
		{
			self.ready = false;
			self.messages.apply( self.caller, [ 'ready', false ] );
		}
	} );

	// All messages from FriendNetworkApps will arrive here
	handleMessages = function ( message )
	{
		var command = message.command;
		var data = message.data;

		switch ( command )
		{
			case 'registerApplicationResponse':
				self.appIdentifier = message.data;
				self.ready = true;
				self.messages.apply( self.caller, [ 'ready', true ] );
				break;

			case 'openHost':	
				self.hostReady = data ? true : false;
				self.messages.apply( self.caller, [ 'openHost', self.hostReady ] );
				break;

			case 'newUser':
				user = 
				{
					identifier: data.identifier,
					name: data.name,
					userInformation: data.userInformation,
					ready: false
				};
				self.users[ data.identifier ] = user;
				self.messages.apply( self.caller, [ 'newUser', user ] );
				break;

			case 'connectToUser':
				if ( data.identifier )
				{
					user =
					{
						identifier: data.identifier,
						isHost: data.isHost,
						userInformation: data.userInformation,
						name: data.name
					};
					self.users[ data.identifier ] = user;
					if ( data.isHost )
						self.messages.apply( self.caller, [ 'connectToHost', { identifier: user.identifier, name: user.name, userInformation: user.userInformation } ] );
					else
						self.messages.apply( self.caller, [ 'connectToUser', { identifier: user.identifier, name: user.name, userInformation: user.userInformation } ] );				
				}
				else
				{
					self.messages.apply( self.caller, [ 'connectToHost', { identifier: false } ] );									
				}
				break;
			
			case 'runningUserDisconnected':
				if ( !self.establishingConnections )
				{
					user = self.usersList[ data.userNumber ];
					if ( user )
					{
						// Clean the arrays
						self.usersList.splice( data.userNumber, 1 );
						self.messages.apply( self.caller, [ 'runningUserDisconnected', { userNumber: data.userNumber, userInformation: data.userInformation } ] );
					}
				}
				break;

			case 'userDisconnected':
				identifier = data.identifier;
				user = self.users[ identifier ];
				if ( user )
				{
					self.users = self.tree.utilities.cleanArray( self.users, user );
					self.messages.apply( self.caller, [ 'userDisconnected', { identifier: identifier, userInformation: user.userInformation } ] );					
				}
				break;

			case 'applicationReady':
				self.establishingConnections = false;
				self.userNumber = data.userNumber;
				self.usersNumber = data.usersNumber;
				self.usersList = data.users;
				self.applicationReady = true;
				self.messages.apply( self.caller, [ command, { userNumber: data.userNumber, usersNumber: data.usersNumber, users: data.users } ] );					
				break;

			case 'applicationStart':
				self.applicationRunning = true;
				self.messages.apply( self.caller, [ command, false ] );
				break;

			case 'create':
				self.itemCreate( data.data );
				break;

			case 'update':
				self.doUpdate( data.data );
				break;

			case 'destroy':
				self.itemDestroy( data.data );
				break;
				
			default:
				// Other message. An error?
				if ( command.substring( 0, 4 ) == 'ERR_' )
				{
					console.log( 'This has not beedn tested, and should be looed at FL!' );
				}
				else
				{
					// Private message
					self.messages.apply( self.caller, [ command, data ] );
				}
				break;
		}
	};
};
Friend.Tree.Network.Manager.closeApplication = function ()
{
	FriendNetworkApps.closeApplication( this.appIdentifier );
	this.objects = [];
	this.ready = false;
};
Friend.Tree.Network.Manager.closeConnections = function ()
{
	FriendNetworkApps.closeConnections( this.appIdentifier );
	this.objects = [];
	this.users = {};
	this.hostReady = false;
};
Friend.Tree.Network.Manager.closeRunningConnections = function ()
{
	FriendNetworkApps.closeRunningConnections( this.appIdentifier );
	this.objects = [];
	this.ready = false;
};
Friend.Tree.Network.Manager.openHost = function()
{
	FriendNetworkApps.openHost( this.appIdentifier );
};
Friend.Tree.Network.Manager.closeHost = function()
{
	if ( this.hostReady )
	{
		FriendNetworkApps.closeHost( this.appIdentifier );
		this.hostReady = false;
	}
};
Friend.Tree.Network.Manager.isReady = function ()
{
	return this.ready;
};
Friend.Tree.Network.Manager.getHosts = function ( filters, callback )
{
	var self = this;
	FriendNetworkApps.getHosts( self.appIdentifier, filters, true, function( message )
	{
		callback.apply( self.caller, [ 'getHostsResponse', message.data ] );
	} );
};
Friend.Tree.Network.Manager.connectToHost = function ( nameHost )
{
	var self = this;
	if ( self.connected )
		return false;

	FriendNetworkApps.connectToUser( this.appIdentifier, nameHost );
};
Friend.Tree.Network.Manager.disconnectFromUser = function( userIdentifier )
{
	if ( this.users[ userIdentifier ] )
	{
		FriendNetworkApps.disconnectFromUser( userIdentifier );
		this.users = Friend.Tree.Utilities.cleanArray( this.users, this.users[ userIdentifier ] );
	}
};
Friend.Tree.Network.Manager.establishConnections = function ()
{
	if ( this.appIdentifier && this.hostReady && this.getNumberOfUsers() > 0 )
	{
		var self = this;
		this.establishingConnections = true;
		FriendNetworkApps.establishConnections( this.appIdentifier );
	}
};
Friend.Tree.Network.Manager.getNumberOfUsers = function ()
{
	var count = 0;
	for ( var u in this.users )
		count++;
	return count;
};
Friend.Tree.Network.Manager.sendMessageToAll = function ( command, message )
{
	var msg;
	if ( typeof message != 'object' )
		msg = { command: command, data: message };
	else
	{
		msg = message;
		msg.command = command;
	}
	FriendNetworkApps.sendMessageToAll( this.appIdentifier, this.userIdentifier, msg );
};
Friend.Tree.Network.Manager.startApplication = function ()
{
	FriendNetworkApps.startApplication( this.appIdentifier );
};
Friend.Tree.Network.Manager.registerItem = function ( item )
{
	this.objects[ item.identifier ] = item;
};
Friend.Tree.Network.Manager.itemCreate = function ( data )
{
	// Turns the names of objects into real objects
	data.creationFlags = this.utilities.replaceNamesByObjects( this.root, data.creationFlags, {} );
	data.creationFlags.fromNetwork = true;
	data.creationFlags.identifier = this.getLocalIdentifier( data.identifier );
	data.creationFlags.currentTree  = this.findItemFromName( data.creationFlags.root, this.root );

	// Have the application create the object
	var item = this.messages.apply( this.caller, [ 'create', data ] );
};
Friend.Tree.Network.Manager.getLocalIdentifier = function ( identifier )
{
	var pos = identifier.indexOf( '<|>' );
	if ( pos )
		return Application.username + identifier.substring( pos );
};
Friend.Tree.Network.Manager.doUpdate = function ( data )
{
	// Turns the names of objects into real objects
	data.flags = this.utilities.replaceNamesByObjects( this.root, data.flags, {} );

	// Update: call the processes of the object with the flags
	var identifier = this.getLocalIdentifier( data.identifier );
	if ( this.objects[ identifier ] )
	{
		data.command = 'network';
		data.subCommand = 'update';
		data.type = 'network';
		data.fromNetwork = true;
	
		this.tree.sendMessageToItem( this.root, this.objects[ identifier ], data );
	}
};
Friend.Tree.Network.Manager.itemDestroy = function ( data )
{
	var identifier = this.getLocalIdentifier( data.identifier );
	if ( this.objects[ identifier ] )
	{
		this.objects[ identifier ].fromNetwork = true;
		this.tree.addToDestroy( this.objects[ identifier ] );
		this.objects[ identifier ] = false;
		this.objects = this.utilities.cleanArray( this.objects );

		// Tell the application about it
		var item = this.messages.apply( this.caller, [ 'destroy', data ] );
	}
};

Friend.Tree.Network.Manager.messageUp = function ( message )
{
	if ( message.command == 'quit' || ( message.command == 'destroy' && message.itemEvent == this ) )
	{
		FriendNetworkApps.closeApplication( this.appIdentifier );
	}
	return this.startProcess( message, [ ] );
};
Friend.Tree.Network.Manager.messageDown = function ( message )
{
	return this.endProcess( message, [ ] );
};
