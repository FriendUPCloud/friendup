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
	if( project.Files && project.Files.length )
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
	else
	{
		ge( 'project_files' ).innerHTML = i18n( 'i18n_project_has_no_files' );
	}
}

function RefreshImages()
{
	if( project.Images && project.Images.length )
	{
		var str = '<div class="List">';
		for( var a = 0; a < project.Images.length; a++ )
		{
			var sw = a % 2 + 1;
			str += '<div class="HRow sw' + sw + '">';
			str += '<div class="HContent70 Ellipsis FloatLeft PaddingSmall">' + project.Images[a].Path + '</div>';
			str += '<div class="HContent30 FloatLeft PaddingSmall TextRight"><input type="checkbox" path="' + project.Images[a].Path + '"/></div>';
			str += '</div>';
		}
		str += '</div>';
		ge( 'project_images' ).innerHTML = str;
	}
	else
	{
		ge( 'project_images' ).innerHTML = i18n( 'i18n_project_has_no_images' );
	}
}

function RefreshPermissions()
{
	if( project.Permissions && project.Permissions.length )
	{
		var str = '<div class="List">';
		for( var a = 0; a < project.Permissions.length; a++ )
		{
			var sw = a % 2 + 1;
			str += '<div class="HRow sw' + sw + '">';
			str += '<div class="HContent33 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Name + '</div>';
			str += '<div class="HContent33 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Options + '</div>';
			str += '<div class="HContent33 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Permission + '</div>';
			str += '</div>';
		}
		str += '</div>';
		ge( 'project_permissions' ).innerHTML = str;
	}
	else
	{
		ge( 'project_permissions' ).innerHTML = i18n( 'i18n_project_has_no_permissions' );
	}
}

function UpdateProject()
{
	var values = [
		'project_projectname',
		'project_author',
		'project_version',
		'project_category',
		'project_description'
	];
	for( var a = 0; a < values.length; a++ )
		project[ values[a] ] = ge( values[a] ).value;
	

	Application.sendMessage( {
		command: 'updateproject',
		project: project
	} );
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
					if( ge( 'project_' + a.toLowerCase() ) )
					{
						ge( 'project_' + a.toLowerCase() ).value = project[ a ];
					}
				}
				var opts = ge( 'project_category' ).getElementsByTagName( 'option' );
				for( var a = 0; a < opts[a].length; a++ )
				{
					if( opts[a].value == project.Category )
					{
						opts[a].selected = 'selected';
					}
					else opts[a].selected = '';
				}
				
				RefreshFiles();
				RefreshImages();
				RefreshPermissions();
				break;
		}
	}
}

