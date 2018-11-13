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


