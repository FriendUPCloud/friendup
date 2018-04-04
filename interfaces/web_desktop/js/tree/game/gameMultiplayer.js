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
 * Append this process to an object and it will be refelected on the other player's machines automatically
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 */
Friend.Tree.Game.MultiPlayerHandler = function( tree, item, flags )
{
	this.network = false;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.Game.MultiPlayerHandler', flags );
	this.item.registerEvents( 'refresh' );
	this.created = 0;
	this.network.registerItem( this.item );
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
						playerNumber: this.network.playerNumber,
						playerName: Application.username,
						identifier: this.item.identifier,
						name: this.item.name,
						creationFlags: this.utilities.replaceObjectsByNames( this.item.root, {}, creationFlags ) // Transmits the whole item creation flags
					};
					this.network.multiPlayerSend( 'create', response );
				}
				break;
			case 'destroy':
				if ( !this.item.fromNetwork )
				{
					var response =
					{
						playerNumber: this.network.playerNumber,
						playerName: Application.username,
						identifier: this.item.identifier,
						name: this.item.name
					};
					this.network.multiPlayerSend( 'destroy', response );
				}
				break;
		}
	}
	return true;
};
Friend.Tree.Game.MultiPlayerHandler.processDown = function ( message )
{
	var flag = false;
	var response = { };
	if ( message.command == 'refresh' && message.refresh && !message.fromNetwork )
	{
		var response =
		{
			identifier: this.item.identifier,
			flags: this.utilities.replaceObjectsByNames( this.item.root, {}, message )
		};
		this.network.multiPlayerSend( 'update', response );
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
	this.network = false;
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.MultiWaitForParticipants', flags );
	this.registerEvents( 'refresh' );

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
		onOK: onOK
	} );
	this.list = new Friend.Tree.UI.List( this.tree, 'list',
	{
		root: this.root,
		parent: this.dialog,
		x: 8,
		y: 50,
		width: this.width - 16,
		height: this.height - 108
	} );
	this.dialog.enable( 'OK', false );
	this.network.host();

	function handleMessages( msg )
	{
		switch ( msg.command )
		{
		case 'multiplayer':
			switch ( msg.subCommand )
			{
				case 'playerDisconnected':
					this.list.removeLineFromValue( msg.key );
					break;
				default:
					break;
			}
			break;
		case 'friendnetwork':
			switch ( msg.subCommand )
			{
				case 'clientConnected':
					this.list.addLine( msg.name, msg.key );
					this.dialog.enable( 'OK', true );
					break;
				default:
					break;
			}
			break;
		}
	}
	function onOK()
	{
		if ( this.network.checkReady() )
		{
			this.destroy();

			// Count the number of players
			var numberOfPlayers = 1;
			for ( var key in this.network.hostClients )
				numberOfPlayers ++;

			// Host is always player 0
			this.network.playerNumber = 0;

			// Send 'startgame' to clients
			var count = 1;
			for ( var key in this.network.hostClients )
			{
				FriendNetwork.send( key,
				{
					command: 'multiplayer',
					subCommand: 'iamplayer',
					playerNumber: this.network.playerNumber,
				} );
				FriendNetwork.send( key,
				{
					command: 'multiplayer',
					subCommand: 'startgame',
					playerNumber: count,
					numberOfPlayers: numberOfPlayers,
				} );
				this.network.hostClients[ key ].playerNumber = count;
				count ++;
			}
			
			// Send information to game
			var message =
			{
				command: 'multiplayer',
				subCommand: 'startgame',
				playerNumber: this.network.playerNumber,
				numberOfPlayers: numberOfPlayers,
				network: this.network,
				game: this.network.game
			};
			this.messages.apply( this.caller, [ message ] );
		}
	}
	function onCancel()
	{
		this.destroy();
		this.network.close();
		this.messages.apply( this.caller,
		[ {
			command: 'multiplayer',
			subCommand: 'aborted',
		} ] );
	}
};
Friend.Tree.Game.MultiWaitForParticipants.render = function ( flags )
{
	return flags;
};
Friend.Tree.Game.MultiWaitForParticipants.messageUp = function ( message )
{
	if ( self.dialog )									// Not the first time
		self.dialog.enable( 'OK', this.network.checkReady() );

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
	this.network = false;
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.MultiWaitForGame', flags );
	this.registerEvents( 'refresh' );

	this.updateSpeed = 1 * 1000;
	this.updateCount = this.updateSpeed;
	this.hosts = [ ];

	// Branches the network object here
	this.network.caller = this;
	this.network.messages = handleMessages;

	// Open the connection dialog
	this.openDialog();

	// Receives the listing of hosts and sends it to the dialog box
	function handleMessages( msg )
	{
		if ( msg.command == 'network' )
		{
			var list = msg.list;
			var hosts = [ ];

			// Search for identical hosts -> preserve them
			for ( var h = 0; h < list.length; h ++ )
			{
				for ( var hh = 0; hh < this.hosts.length; hh ++ )
				{
					if ( list[ h ].hostName == this.hosts[ hh ].hostName )
					{
						list[ h ] = false;
						hosts.push( this.hosts[ hh ] );
						this.hosts.splice( hh, 1 );
						break;
					}
				}
			}

			// Creates the new hosts
			for ( var h = 0; h < list.length; h ++ )
			{
				if ( list[ h ] )
				{
					var identifier = this.list.addLine( list[ h ].name );
					hosts.push( { identifier: identifier, hostName: list[ h ].hostName } );
				}
			}

			// Removes the no longer existing hosts
			for ( var h = 0; h < this.hosts.length; h ++ )
			{
				this.list.removeLine( this.hosts[ h ].identifier );
				if ( this.chosenHost == this.hosts[ h ].identifier )
					this.chosenHost = false;
			}
			this.hosts = hosts;
		}
		else if ( msg.command == 'multiplayer' )
		{
			switch ( msg.subCommand )
			{
				case 'hostDisconnected':
					// Close the current messagebox
					this.dialog.destroy();

					// Reopen the main dialog
					this.openDialog();
					break;

				case 'playerDisconnected':
					// Close the current dialog
					this.dialog.destroy();

					// Remove the host from the list
					for ( var h = 0; h < this.hosts.length; h ++ )
					{
						if ( msg.hostName == this.hosts[ h ].hostName )
						{
							this.list.removeLineFromValue( this.hosts[ h ].identifier );
							break;
						}
					}

					// Reopen the main dialog
					this.openDialog();
					break;

				case 'startgame':
					this.destroy();
					var flags =
					{
						command: 'multiplayer',
						subCommand: 'startgame',
						playerNumber: msg.playerNumber,
						numberOfPlayers: msg.numberOfPlayers,
						network: this.network,
						game: this.network.game
					};
					this.messages.apply( this.caller, [ flags ] );
					break;
			}
		}
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
		onOK: onOK
	} );
	this.list = new Friend.Tree.UI.List( this.tree, 'list',
	{
		root: this.root,
		parent: this.dialog,
		x: 8,
		y: 50,
		width: this.width - 16,
		height: this.height - 108,
		caller: this,
		onClick: click,
		onDoubleClick: doubleClick
	} );

	// Cancel pressed
	function onCancel()
	{
		this.network.close();
		this.destroy();
		this.messages.apply( this.caller,
		[ {
			command: 'multiplayer',
			subCommand: 'aborted'
		} ] );
	}
	// One host has been chosen
	function doubleClick( option )
	{
		self.chosenHost = option.identifier;
		onOK.apply( this );
	}
	// One host has been chosen
	function click( option )
	{
		self.chosenHost = option.identifier;
	}
	// OK pressed, check for selected line and validates
	function onOK()
	{
		if ( self.chosenHost )
		{
			for ( var i = 0; i < self.hosts.length; i ++ )
			{
				if ( self.hosts[ i ].identifier == self.chosenHost )
				{
					// Connects to the host
					self.network.connect( self.hosts[ i ].hostName, true, true );

					// Displays a message box 'Waiting for connection'
					self.dialog.destroy();
					self.state = 'waitForConnection';
					self.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
					{
						root: self.root,
						parent: self,
						title: self.network.appName,
						text: 'Waiting for connection...',
						caller: self,
						onCancel: onCancelWaitingForConnection
					} );
					break;
				}
			}
		}
	}
	// Cancel pressed during wait for connection
	function onCancelWaitingForConnection()
	{
		this.destroy();
		this.network.close();
		this.messages.apply( this.caller,
		[
			{
				command: 'multiplayer',
				subCommand: 'aborted'
			}
		] );
	}
};
Friend.Tree.Game.MultiWaitForGame.render = function ( flags )
{
	return flags;
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
				case 'waitForGame':
					this.network.getHosts( 'Panzers!' );
					break;
				case 'waitForConnection':
					if ( this.network.checkReady() )
					{
						this.dialog.destroy();
						this.state = 'waitForGameStart';

						// Opens a message box
						this.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
						{
							root: this.root,
							parent: this,
							title: this.network.appName,
							text: 'Waiting for start of game...',
							caller: this,
							onCancel: onCancelWaitingForGame
						} );
					}
					break;
				case 'waitForStartGame':
					break;
			}
		}
	}
	return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );

	// Cancel pressed when waiting for game
	function onCancelWaitingForGame()
	{
		this.destroy();
		this.network.close();
		this.messages.apply( this.caller,
		[ {
			command: 'multiplayer',
			subCommand: 'aborted'
		} ] );
	}
};
Friend.Tree.Game.MultiWaitForGame.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
