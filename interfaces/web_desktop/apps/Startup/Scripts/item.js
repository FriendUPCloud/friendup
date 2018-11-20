/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.itemId = false;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return false;
	
	switch( msg.command )
	{
		case 'item':
			if( msg.data )
			{
				ge( 'command' ).value = msg.data.command;
			}
			if( typeof( msg.itemId ) != 'undefined' )
			{
				this.itemId = msg.itemId;
			}
			this.viewId = msg.viewid;
			this.guiview = msg.guiview;
			break;
	}
}

function saveItem()
{
	var o = {
		command: 'saveitem',
		itemcommand: ge( 'command' ).value,
		destinationViewId: Application.viewId,
		guiview: Application.guiview
	};
	if( Application.itemId >= 0 )
	{
		o.itemId = Application.itemId;
	}
	else
	{
		o.itemId = false;
	}
	Application.sendMessage( o );
}

