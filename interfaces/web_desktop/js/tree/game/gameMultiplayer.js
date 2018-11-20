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
 * Tree game network management
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 30/08/2017
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

/**
 * Process: MultiPlayerEmitter
 *
 * Append this process to an object and it will be reflected on the other user's machines automatically
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 */
Friend.Tree.Game.MultiPlayerHandler = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.Game.MultiPlayerHandler', flags );
	this.network = item.root.network;
	this.network.registerItem( item );
};
Friend.Tree.Game.MultiPlayerHandler.cleanFlags = function ( flags )
{
	var temp = {};
	for ( var p in flags )
	{
		if ( p != 'name' && p != 'className' )
			temp[ p ] = flags[ p ];
	}
	return temp;
};
Friend.Tree.Game.MultiPlayerHandler.processUp = function ( message )
{
	if ( message.itemEvent == this.item )
	{
		switch ( message.command )
		{
			case 'create':
				if ( !message.creationFlags.fromNetwork )
				{
					var creationFlags = Object.assign( {}, message.creationFlags );
					creationFlags = this.cleanFlags( creationFlags );
					var response =
					{
						userNumber: this.network.userNumber,
						userName: Application.username,
						identifier: this.item.identifier,
						name: this.item.name,
						creationFlags: this.utilities.replaceObjectsByNames( this.item.root, {}, creationFlags ) // Transmits the whole item creation flags
					};
					this.network.sendMessageToAll( 'create', response );
				}
				break;
			case 'destroy':
				if ( !this.item.fromNetwork )
				{
					var response =
					{
						userNumber: this.network.userNumber,
						userName: Application.username,
						identifier: this.item.identifier,
						name: this.item.name
					};
					this.network.sendMessageToAll( 'destroy', response );
				}
				break;
		}
	}
	else if ( message.command == 'network' )
	{
		switch (message.subCommand )
		{
			case 'update':
				this.item.x = message.x;
				this.item.y = message.y;
				this.item.z = message.z;
				this.item.rotation = message.rotation;
				this.item.imageName = message.imageName;
				this.item.doRefresh();
				break;
			default:
				break;
		}
	}
	return true;
};
Friend.Tree.Game.MultiPlayerHandler.processDown = function ( message )
{
	var flag = false;
	if ( message.command == 'refresh' && message.refresh )
	{
		var properties = this.utilities.replaceObjectsByNames( this.item.root, {}, message );
		var response = 
		{
			identifier: this.item.identifier,
			x: properties.x,
			y: properties.y,
			z: properties.z,
			rotation: properties.rotation,
			imageName: properties.imageName
		};
		this.network.sendMessageToAll( 'update', response );
	}
	return true;
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * MultiWaitForParticipants
 *
 * Displays a dialog box to host a game, and handles establishement of connection
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * caller: (object) the calling item
 * messages: (function) function of the caller to reroute messages to
 * network: (object) the network object that must have been created before
 */
Friend.Tree.Game.MultiWaitForParticipants = function ( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.MultiWaitForParticipants', flags );
	this.registerEvents( 'refresh' );
	this.network = this.root.network;

	// Branches the network object here
	this.network.caller = this;
	this.network.messages = handleMessages;

	// Opens a dialog with the list of hosts
	this.dialog = new Friend.Tree.UI.Dialog( this.tree, 'dialog',
	{
		root: this.root,
		parent: this,
		x: 0,
		y: 0,
		width: this.width,
		height: this.height,
		title: 'Waiting for participants',
		caller: this,
		onCancel: onCancel,
		OK: 'Start game',
		onOK: onOK,
		theme: this.theme
	} );
	this.list = new Friend.Tree.UI.List( this.tree, 'list',
	{
		root: this.root,
		parent: this.dialog,
		x: 8,
		y: 44,
		width: this.width - 16,
		height: this.height - 108,
		theme: this.theme
	} );
	this.dialog.enable( 'OK', false );
	this.network.openHost();

	function handleMessages( command, data )
	{
		switch ( command )
		{
			case 'openHost':
				self.ready = data ? true : false;
				break;

			case 'newUser':
				self.list.addLine( data.name, data.identifier );
				self.dialog.enable( 'OK', true );
				break;

			case 'userDisconnected':
				self.list.removeLineFromValue( data.identifier );
				if ( self.list.getNumberOfLines() == 0 )
					self.dialog.enable( 'OK', false );
				break;
			
			case 'applicationReady':
				this.starting = false;
				var message =
				{
					userNumber: data.userNumber,
					usersNumber: data.usersNumber,
					users: data.users
				};
				self.messages.apply( self.caller, [ command, message ] );
				break;

			default:
				self.messages.apply( self.caller, [ command, data ] );
				break;
		}
	}
	function onOK()
	{
		this.destroy();

		// Host is always user 0
		this.userNumber = 0;

		// Prevent the network from closing
		this.starting = true;

		// Establish all the connections
		this.network.establishConnections();
	}
	function onCancel()
	{
		this.destroy();
		this.messages.apply( this.caller, [ 'aborted' ] );
	}
};
Friend.Tree.Game.MultiWaitForParticipants.messageUp = function ( message )
{
	if ( self.dialog )									// Not the first time
		self.dialog.enable( 'OK', this.ready );
	
	if ( message.command == 'quit' || ( message.command == 'destroy' && message.itemEvent == this && !this.starting ) )
	{
		this.network.closeHost();
	}
	return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.Game.MultiWaitForParticipants.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * MultiWaitForGame
 *
 * Displays a dialog box to connect to a game, and handles the connection procedures
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * caller: (object) the calling item
 * messages: (function) function of the caller to reroute messages to
 * network: (object) the network object that must have been created before
 */
Friend.Tree.Game.MultiWaitForGame = function ( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.MultiWaitForGame', flags );
	this.registerEvents( 'refresh' );
	this.network = this.root.network;

	this.updateSpeed = 1 * 1000;
	this.updateCount = this.updateSpeed;
	this.hosts = [ ];

	// Branches the network object here
	this.network.caller = this;
	this.network.messages = this.handleUserConnection;

	// Open the connection dialog
	this.ready = false;
	this.openDialog();

	// Get the hosts
	this.getHosts();
};
Friend.Tree.Game.MultiWaitForGame.handleUserConnection = function ( command, data )
{
	switch ( command )
	{	
		// Reponse when new users are connecting
		case 'connectToUser':
			this.ready = data.identifier != false;
			if ( !this.ready )
			{
				// In the middle of connections: better reset all
				this.dialog.destroy();

				// Reopen the main dialog
				this.openDialog();
			}
			else
			{
				// Displays a message box 'Waiting game'
				this.dialog.destroy();
				this.state = 'waitForGame';
				this.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
				{
					root: this.root,
					parent: this,
					title: this.network.appName,
					text: 'Waiting for start of game...',
					caller: this,
					onCancel: onCancelWaitingForStartOfGame,
					theme: this.theme
				} );
			}
			break;

		// The host has started the application
		case 'applicationLaunched':
			this.dialog.destroy();
			this.state = 'waitForInitialization';
			this.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
			{
				root: this.root,
				parent: this,
				title: this.network.appName,
				text: 'Initializing connections...',
				caller: this,
				onCancel: onCancelWaitingForInitialization,
				theme: this.theme
			} );
			this.messages.apply( this.caller, 'applicationLaunched' );
			break;
		
		// The application begins!
		case 'applicationReady':
			this.dialog.destroy();
			this.destroy();
			var message =
			{
				userNumber: data.userNumber,
				usersNumber: data.usersNumber,
				users: data.users
			};
			this.messages.apply( this.caller, [ command, message ] );
			break;

		// Error: better reset all
		default:	
			this.dialog.destroy();
			this.openDialog();
			break;
	}
	function onCancelWaitingForInitialization()
	{
		this.network.disconnectFromUser();
		this.messages.apply( this.caller, 'aborted', [ response ] );
		this.destroy();
	}
	function onCancelWaitingForStartOfGame()
	{
		this.network.disconnectFromUser();
		this.messages.apply( this.caller, 'aborted', [ response ] );
		this.destroy();
	}
};
Friend.Tree.Game.MultiWaitForGame.openDialog = function ()
{
	var self = this;
	this.state = 'waitForGame';

	// Opens a dialog with the list of hosts
	this.dialog = new Friend.Tree.UI.Dialog( this.tree, 'dialog',
	{
		root: this.root,
		parent: this,
		x: 0,
		y: 0,
		width: this.width,
		height: this.height,
		title: 'Available games',
		caller: this,
		onCancel: onCancel,
		onOK: onOK,
		theme: this.theme
	} );
	this.list = new Friend.Tree.UI.List( this.tree, 'list',
	{
		root: this.root,
		parent: this.dialog,
		x: 8,
		y: 44,
		width: this.width - 16,
		height: this.height - 108,
		caller: this,
		onClick: click,
		onDoubleClick: doubleClick,
		theme: this.theme
	} );

	// Cancel pressed
	function onCancel()
	{
		this.destroy();
		this.messages.apply( this.caller, [ 'aborted' ] );
	}
	// One host has been chosen
	function doubleClick( option )
	{
		this.chosenHost = option.identifier;
		onOK.apply( this, [] );
	}
	// One host has been chosen
	function click( option )
	{
		this.chosenHost = option.identifier;
	}
	// OK pressed, check for selected line and validates
	function onOK()
	{
		var self = this;
		if ( this.chosenHost )
		{
			var host;
			for ( var h = 0; h < this.hosts.length; h++ )
			{
				if ( this.hosts[ h ].identifier == this.chosenHost )
				{
					host = this.hosts[ h ];
					break;
				}
			}
			if ( host )
			{
				// Connect to the host (who is also a user)
				this.network.connectToHost( host.nameHost );

				// Displays a message box 'Waiting for connection'
				this.dialog.destroy();
				this.state = 'waitForConnection';
				this.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
				{
					root: self.root,
					parent: self,
					title: self.network.appName,
					text: 'Connecting to host...',
					caller: self,
					onCancel: onCancelWaitingForConnection,
					theme: self.theme
				} );
			}
		}
	}
	// Cancel pressed during wait for connection
	function onCancelWaitingForConnection()
	{
		this.destroy();
		this.network.disconnectFromUser();
		this.messages.apply( this.caller, [ 'aborted' ] );
	}
};
Friend.Tree.Game.MultiWaitForGame.getHosts = function ( running )
{
	var self = this;
	if ( !running )
		running = 'no';

	this.network.getHosts( { running: running }, function( command, list )
	{
		var hosts = [ ];

		// Search for identical hosts -> preserve them
		for ( var h = 0; h < list.length; h ++ )
		{
			for ( var hh = 0; hh < self.hosts.length; hh ++ )
			{
				if ( list[ h ].nameHost == self.hosts[ hh ].nameHost )
				{
					list[ h ] = false;
					hosts.push( self.hosts[ hh ] );
					self.hosts.splice( hh, 1 );
					break;
				}
			}
		}

		// Creates the new hosts
		for ( h = 0; h < list.length; h ++ )
		{
			var newHost = list[ h ];
			if ( newHost )
			{
				var identifier = self.list.addLine( newHost.name );
				hosts.push
				( 
					{ 
						name: newHost.name,
						nameHost: newHost.nameHost,
						identifier: identifier,
						userInformation: newHost.userInformation
					}
				);
			}
		}

		// Removes the no longer existing hosts
		for ( h = 0; h < self.hosts.length; h ++ )
		{
			this.list.removeLine( self.hosts[ h ].identifier );
			if ( self.chosenHost == self.hosts[ h ].identifier )
				self.chosenHost = false;
		}
		self.hosts = hosts;
	} );
};
Friend.Tree.Game.MultiWaitForGame.messageUp = function ( message )
{
	if ( message.command == 'refresh' )
	{
		this.updateCount += message.delay;
		if ( this.updateCount > this.updateSpeed )
		{
			this.updateCount = 0;
			switch ( this.state )
			{
				// Waiting for a game: asks for the new hosts and updated the dialog box
				case 'waitForGame':
					this.getHosts();
					break;
				}
		}
	}
	return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.Game.MultiWaitForGame.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
