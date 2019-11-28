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
}

Application.receiveMessage = function( msg )
{
	if( !ge( 'Type' ).value.length || !ge( 'Name' ).value.length )
	{
		return;
	}
	if( !msg.command ) return;
	
	var o = {
		command: 'permission',
		index: ge( 'Index' ).value,
		type: ge( 'Type' ).value,
		options: ge( 'Options' ).value
	};
	
	Application.sendMessage( o );
}

function cancelPermission()
{
	CloseView( Application.viewId );
}

function addPermission()
{
	Application.sendMessage( {
		command: 'setpermission',
		permission: ge( 'Type' ).value,
		permname:   ge( 'Name' ).value,
		options:    ge( 'Options' ).value,
		index:      ge( 'Index' ).value
	} );
}

