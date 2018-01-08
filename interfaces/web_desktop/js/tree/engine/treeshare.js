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
 * Tree tree sharing via Friend Network
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 29/09/2017
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};
Friend.Flags = Friend.Flags || {};

/**
* Process: TreeShareEmitter
*
* Append this process to an object and it will be transmitted through the network
*
* @param tree (object) The Tree engine
* @param name (string) The name of the object
* @param flags (object) Creation flags
*
* Flags
*/
 Friend.Tree.TreeShareEmitter = function( tree, object, params )
 {
 	this.tree = tree;
 	this.object = object;
 	this.created = 0;
 	this.treeShare = params.treeShare;
	Object.assign( this, Friend.Tree.TreeShareEmitter );
 }
 Friend.Tree.TreeShareEmitter.processUp = function ( flags )
 {
 	if ( flags.command && flags.itemEvent == this.object )
 	{
 		switch ( flags.command )
 		{
 			case 'create':
 				var response =
 				{
 					userName: Application.username,
 					creationFlags: this.utilities.replaceObjectsByNames( this.object.root, flags.creationFlags ), // Transmits the whole object creation flags
 					name: flags.name,
 					identifier: this.object.identifier,
 					parentName: this.object.parent.name,
 					className: this.object.className
 				};
 				this.treeShare.send( 'create', response );
 				break;
 			case 'destroy':
 				var response =
 				{
 					userName: Application.username,
 					identifier: this.object.identifier
 				};
 				this.network.send( 'destroy', response );
 				break;
 		}
 	}
	return flags;
};
Friend.Tree.TreeShareEmitter.processDown = function ( flags )
{
	var flag = false;
	if ( flags.refresh )
	{
        // Copy only the modified properties
        var toSend = {};
        for ( var p in flags )
        {
            if ( flags[ p ] != Friend.Flags.NOTINITIALIZED )
            toSend[ p ] = flags[ p ];
        }
		var response =
		{
			identifier: this.object.identifier,
			flags: this.network.replaceObjectsByNames( this.object.root, toSend )
		};
		var time = new Date().getTime();
		this.network.send( 'update', response );
	}
	return flags;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
* Process: TreeShareReceiver
*
* Append this process to an object and it will be controller by the emitter object from the other player's machine
*
* @param tree (object) The Tree engine
* @param name (string) The name of the object
* @param flags (object) Creation flags
*
* Flags
*/
Friend.Tree.TreeShareReceiver = function( tree, object, params )
{
	this.tree = tree;
	this.object = object;
	this.created = 0;
	this.network = params.network;
	Object.assign( this, Friend.Tree.TreeShareReceiver );
}
Friend.Tree.TreeShareReceiver.processUp = function ( flags )
{
 	return flags;
};
Friend.Tree.TreeShareReceiver.processDown = function ( flags )
{
 	return flags;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


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
Friend.Tree.TreeShareChooseTree = function ( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.network = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.TreeShareChooseTree', flags );
	Object.assign( this, Friend.Tree.TreeChooseTree );

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
	this.dialog = new Friend.UI.Dialog( this.tree, 'dialog',
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
	this.list = new Friend.UI.List( this.tree, 'list',
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
					this.dialog = new Friend.UI.MessageBox( this.tree, 'message',
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

Friend.Tree.TreeShareChooseTree.processUp = function ( flags )
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
	return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.TreeShareChooseTree.processDown = function ( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation' ] );
};
