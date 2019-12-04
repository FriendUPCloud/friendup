/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var project = {};

Application.run = function( msg )
{
}

function RefreshFiles()
{
}

function RefreshImages()
{
}

function RefreshPermissions()
{
}

// -----------------------------------------------------------------------------

Application.receiveMessage = function( msg )
{
	console.log( 'Received message: ', msg );
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'content':
				for( var a in msg.content )
				{
					project[ a ] = msg.content[ a ];
				}
				RefreshFiles();
				RefreshImages();
				RefreshPermissions();
				break;
		}
	}
}

