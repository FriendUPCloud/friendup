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
 * Build web application Friend options
 * First application using FriendUI
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 19/10/2017
 */

/**
 * Application entry
 *
 * This function is called as soon as the html
 * is loaded into the view
 *
 * @params (object) creation message
 */
Application.run = function ( msg )
{
	var self = this;

	// Initialise the UI
	FriendUI.init( this, flags, function( fTree )
	{
		// When the function comes back, everything has been loaded and is ready
		self.fTree = fTree;

		// Creates the item that will handle the application
		self.root = new Root( self.fTree, 'Root',
		{
			title: 'Build a web application',		// Title
			renderingId: 'Application',				// Where to display
			width: 800,
			height: 600
		} );

		// Plant the tree!
		FriendUI.addTree( this.root, { } );
		FriendUI.start();
	} );
};

/**
 * receiveMessage
 *
 * Handles messages from the Friend machine
 */
Application.receiveMessage = function ( object )
{
	var self = this;
	var command = object.command;
	switch ( command )
	{
		// Quit the game: send a message to the content window
		case 'quit':
			this.network.close();
			break;
	}
};

/**
 * Application Tree Object
 *
 * The base of the tree
 */
function Root( name, flags )
{
	this.title = false;
	this.renderingId = false;
	Friend.Tree.Items.init( this, tree, name, 'Tree.Battle', flags );

	// Dialog Definition
	this.dialog = new Friend.Tree.UI.Dialog( this.fTree, 'Interface',
	{
		width: this.width,
		height: this.height,
		caller: this,
		onOK: this.onOk,
		onCancel: this.onCancel
	} );
};
Root.prototype.onOK = function ()
{
};
Root.prototype.onCancel = function ()
{
	Application.quit();
};
Root.prototype.render = function ( flags )
{
	return flags;
};
Root.prototype.messageUp = function ( message )
{
	return this.startProcess( message, [ ] );
};
Root.prototype.messageDown = function ( message )
{
	return this.endProcess( message, [ ] );
};
