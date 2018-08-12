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
 * Tree DOS system interface item
 *
 * @author FL (Francois Lionet)
 * @date first push on 3/11/2017
 */
Friend = window.Friend || {};
Friend.DOS = Friend.DOS || {};
/*
Door: {icons: Array(0), handler: "system", dosdriver: "System", ready: true, Volume: "System:", …}
Handler: "built-in"
ID: "system"
IconClass: "SystemDisk"
MetaType: "Directory"
Mounted: true
Path: "System:"
Title: "System:"
Type: "Door"
Visible: true
Volume: "System:"
*/
Friend.DOS.classToIcons =
{

};
Friend.DOS.Root = function( tree, name, flags )
{
	Friend.Tree.Items.init( this, tree, name, 'Friend.DOS.Root', flags );

	// Fire up the core shell proxy
	var self = this;
	this.ready = false;
	this.shell = new Shell();
	this.shell.onReady = function()
	{
		self.ready = true;

		// Asks for the initial mountlist
		self.getMountList( function( msg, data )
		{
			var drives = msg.returnMessage;
			for ( var d = 0; d < drives.length; d++ )
			{
				var drive = drives[ d ];
				new Friend.DOS.Drive( self.tree, drive.Title,
				{
					door: drive.Door,
					handler: drive.Handler,
					ID: drive.ID,
					iconClass: drive.IconClass,
					metaType: drive.MetaType,
					mounted: drive.Mounted,
					path: drive.Path,
					type: drive.Type,
					visible: drive.visible,
					volume: drive.Volume
				} );
			}
			self.root.setReady();
		} );
	};

	// Pipeing back to this object from outside
	this.shell.onPipe = function( msg )
	{
		//debugger;
	};
};
Friend.DOS.Root.render = function( flags )
{
	return flags;
};
Friend.DOS.Root.messageUp = function( message )
{
	return this.startProcess( message, [] );
};
Friend.DOS.Root.messageDown = function( message )
{
	return this.endProcess( message, [] );
};


Friend.DOS.Drive = function( tree, name, flags )
{
	this.door = false;
	this.handler = false;
	this.ID = false;
	this.iconClass = false;
	this.metaType = false;
	this.mounted = false;
	this.path = false;
	this.type = false;
	this.visible = false;
	this.volume = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.DOS.Drive', flags );
};
Friend.DOS.Drive.render = function( flags )
{
	return flags;
};
Friend.DOS.Drive.messageUp = function( message )
{
	return this.startProcess( message, [] );
};
Friend.DOS.Drive.messageDown = function( message )
{
	return this.endProcess( message, [] );
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Internal functions
//
Friend.DOS.Root.getMountList = function( callback )
{
	this.sendCommand( [ 'mountlist' ], callback );
};
Friend.DOS.Root.sendCommand = function( command, callback )
{
	this.shell.evaluate( command, callback, 'Workspace' );
};
