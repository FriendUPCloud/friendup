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
 * Tree application sub-loader: initialisation of the Tree engine and call of the root object
 *
 * @author FL (Francois Lionet)
 * @date first push on 3/11/2017
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
	this.width = document.body.clientWidth;
	this.height = document.body.clientHeight;

	// Initialise the UI
	Friend.Tree.init( function( response )
	{
		// Loaded OK?
		if ( response != 'OK' )
		{
			Application.Quit();
			return;
		}

		// Creates a new instance of the Tree engine
		self.tree = new Friend.Tree( self,
		{
			title: 'Panzers!',
			renderers: [ { name: 'Renderer_Canvas2D' } ],
			renderingId: 'Application',
			width: self.width,
			height: self.height
		} );

		//  Load the 'root.js' code and call it
		Friend.Tree.include( 'Progdir:Scripts/root.js', function( response )
		{
			if ( response == 'OK' )
			{
				// Creates the root object of the tree
				// When no 'root' or 'parent' properties are indicated, this creates the root item...
				self.root = new Root( self.tree, 'Root',
				{
					x: 0,
					y: 0,
					z: 0,
					zoomX: 1,
					zoomY: 1,
					width: self.width,
					height: self.height
				} );
			}
		} );
	} );
};

/**
* receiveMessage
*
* Handles messages from the Friend machine
*/
Application.receiveMessage = function ( message )
{
	var self = this;
	var command = message.command;
	switch ( command )
	{
		// Quit the game: send a message to the content window
		case 'quitGame':
			self.tree.events.sendSystemEvent( { command: 'quit' } );
			break;

		// Dormant execute command
		case 'dormant':
			self.tree.events.sendEvent( 'dormant', Friend.Tree.Events.DORMANTEXECUTE, message );
			break;
	}
};
