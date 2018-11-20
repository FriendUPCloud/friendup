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

/**
* TreeShareChooseTree
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
Friend.Tree.TreeShareChooseTree = function( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.network = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.TreeShareChooseTree', flags );

	this.updateSpeed = 1000;
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
            for ( h = 0; h < list.length; h ++ )
            {
                if ( list[ h ] )
                {
                    var id = this.list.addLine( list[ h ].name );
                    hosts.push( { identifier: id, hostName: list[ h ].hostName } );
                }
            }

            // Removes the no longer existing hosts
            for ( h = 0; h < this.hosts.length; h ++ )
            {
                this.list.removeLine( this.hosts[ h ].identifier );
                if ( this.chosenHost == this.hosts[ h ].identifier )
                    this.chosenHost = false;
            }
            this.hosts = hosts;
        }
		else if ( msg.command == 'treeSharing' )
		{
			switch ( msg.subCommand )
			{
				case 'clientDisconnected':

					// Close the current dialog
					this.dialog.destroy();

					// Remove the host from the list
					for ( var h = 0; h < this.hosts.length; h ++ )
					{
						if ( msg.hostName == this.hosts[ h ].hostName )
						{
							this.list.removeLine( this.hosts[ h ].identifier );
							break;
						}
					}

					// Reopen the main dialog
					this.openDialog();
					break;

				case 'ready':
					this.tree.addToDestroy( this.dialog );
					var flags =
					{
						command: 'treeSharing',
						subCommand: 'ready',
						network: this.network,
					};
					this.messages.apply( this.caller, [ flags ] );
					break;
			}
		}
	}
};
Friend.Tree.TreeShareChooseTree.openDialog = function ()
{
	var self = this;
	this.state = 'waitForTree';

	// Opens a dialog with the list of hosts
	var width = this.tree.canvasWidth / 2;
	var height = this.tree.canvasHeight / 2;
	var x = this.tree.canvasWidth / 2 - width / 2;
	var y = this.tree.canvasHeight / 2 - height / 2;
	this.dialog = new Friend.Tree.UI.Dialog( this.tree, 'dialog',
	{
		x: x,
		y: y,
		width: width,
		height: height,
		title: 'Available connections',
		caller: this,
		onCancel: onCancel,
		onOK: onOK,
		modal: true
	} );
	this.list = new Friend.Tree.UI.List( this.tree, 'list',
	{
		x: 8,
		y: 50,
		width: width - 16,
		height: height - 108,
		caller: this,
		onClick: click,
		onDoubleClick: doubleClick
	} );
	this.dialog.addItem( this.list );
	this.addItem( this.dialog );

	// Cancel pressed
	function onCancel()
	{
		this.network.close();
		this.tree.addToDestroy( this.dialog );
		this.messages.apply( this.caller,
		[ {
        	command: 'treeSharing',
        	subCommand: 'aborted'
        } ] );
	}
	// One host has been chosen
	function doubleClick( item )
	{
		self.chosenHost = item.identifier;
		onOK.apply( this );
	}
	// One host has been chosen
	function click( item )
	{
		self.chosenHost = item.identifier;
	}
	// OK pressed, check for selected line and validates
	function onOK()
	{
		if ( self.chosenHost )
		{
			for ( var i = 0; i < this.hosts.length; i ++ )
			{
				if ( this.hosts[ i ].identifier == this.chosenHost )
				{
					// Connects to the host
					this.network.connectToTree( this.hosts[ i ].hostName, true, true );

					// Displays a message box 'Waiting for connection'
					this.tree.addToDestroy( this.dialog );
					this.state = 'waitForConnection';
					this.dialog = new Friend.Tree.UI.MessageBox( this.tree, 'message',
					{
						title: this.network.gameName,
						text: 'Waiting for connection...',
						caller: this,
						onCancel: onCancelWaitingForConnection,
						modal: true,
					} );
					this.addItem( this.dialog );
					break;
				}
			}
		}
	}
	// Cancel pressed during wait for connection
	function onCancelWaitingForConnection()
	{
		this.tree.addToDestroy( this.dialog );
		this.network.close();
		this.messages.apply( this.caller,
		[
			{
				command: 'treeSharing',
				subCommand: 'aborted'
			}
		] );
	}
};

Friend.Tree.TreeShareChooseTree.messageUp = function ( message )
{
	if ( message.command == 'refresh' )
	{
		this.updateCount += delay;
		if ( this.updateCount > this.updateSpeed )
		{
			this.updateCount = 0;
			switch ( this.state )
			{
				case 'waitForTree':
					this.network.getHosts();
					break;
			}
		}
	}
	return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.TreeShareChooseTree.messageDown = function ( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
