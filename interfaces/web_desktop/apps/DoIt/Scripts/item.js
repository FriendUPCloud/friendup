/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	console.log( 'Hello! We are an item!' );
	console.log( document.title );
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'set':
			var cmd = msg.data.command;
			var res = msg.data.resource;
			var opt = msg.data.args;
			
			ge( 'fResource' ).value = res;
			ge( 'fCommand' ).value = cmd;
			ge( 'fArgs' ).value = opt ? opt : '';
			Application.pwin = msg.data.pwin;
			break;
	}
}

function cancel()
{
	Application.sendMessage( {
		command: 'close',
		pwin: Application.pwin
	} );
}

function apply()
{
	
}

