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
 * Tree engine Dormant interface
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Network = Friend.Tree.Network || {};
Friend.Tree.Network.RenderItems = Friend.Tree.Network.RenderItems || {};

Friend.Tree.Network.Dormant = function( tree, name, properties )
{
	this.nameApplication = false;
	this.functions = false;
	this.caller = false;
	this.execute = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Network.Dormant', properties );
	
	// Register for the dormant events
	this.registerEvents( 'dormant' );

	// Send message to lower application to register the new door
	var message = 
	{
		command: 'dormant', 
		subCommand: 'addAppDoor',
		appName: this.nameApplication,
		functions: this.functions
	};
	Application.sendMessage( message );
};
Friend.Tree.Network.Dormant.setFunctions = function ( functions )
{
	// Send message to lower application to update the list of functions
	var message = 
	{
		command: 'dormant', 
		subCommand: 'setFunctions',
		functions: functions
	};
	Application.sendMessage( message );
};
Friend.Tree.Network.Dormant.messageUp = function ( message )
{
	return this.startProcess( message, [] );
};
Friend.Tree.Network.Dormant.messageDown = function ( message )
{
    var ret = this.endProcess( message, [] );

	if ( message.command == 'dormant' )
	{
		switch ( message.subCommand )
		{
			case 'execute':
				if ( this.caller && this.execute )
				{
					this.execute.apply( this.caller, [ message.functionName, message.args ] );
				}
				break; 
		}
	}
	// If item is destroyed, close the dormant door
	else if ( message.command == 'quit' || ( message.command == 'destroy' && message.itemEvent == this ) )
	{
		var message = 
		{
			command: 'dormant',
			subCommand: 'close'
		};
		Application.sendMessage( message );
	}
	return ret;
};


