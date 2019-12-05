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
	var str = '<div class="List">';
	for( var a = 0; a < project.Files.length; a++ )
	{
		var sw = a % 2 + 1;
		str += '<div class="HRow sw' + sw + '">';
		str += '<div class="HContent70 Ellipsis FloatLeft PaddingSmall">' + project.Files[a].Path + '</div>';
		str += '<div class="HContent30 FloatLeft PaddingSmall TextRight"><input type="checkbox" path="' + project.Files[a].Path + '"/></div>';
		str += '</div>';
	}
	str += '</div>';
	ge( 'project_files' ).innerHTML = str;
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
			case 'updateproject':
				for( var a in msg.data )
				{
					project[ a ] = msg.data[ a ];
				}
				RefreshFiles();
				RefreshImages();
				RefreshPermissions();
				break;
		}
	}
}

