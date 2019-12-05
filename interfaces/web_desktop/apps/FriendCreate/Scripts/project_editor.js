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

var supportedFiles = [
	'php',
	'pl',
	'sql',
	'sh',
	'as',
	'txt',
	'js',
	'lang',
	'pls',
	'json',
	'tpl',
	'ptpl',
	'xml',
	'html',
	'htm',
	'c',
	'h',
	'cpp',
	'd',
	'ini',
	'jsx',
	'java',
	'css',
	'run',
	'apf',
	'conf'
];


Application.run = function( msg )
{
}

function RefreshFiles()
{
	if( project.Files && project.Files.length )
	{
		var ssw = 0;
		var isw = 0;
		var str = istr = '';
		
		for( var a = 0; a < project.Files.length; a++ )
		{
			var ext = project.Files[a].Path.split( '.' ).pop().toLowerCase();
			if( ext == 'png' || ext == 'gif' || ext == 'jpg' || ext == 'jpeg' )
			{
				isw = isw == 1 ? 2 : 1;
				istr += '<div class="HRow sw' + isw + '">';
				istr += '<div class="HContent70 Ellipsis FloatLeft PaddingSmall">' + project.Files[a].Path + '</div>';
				istr += '<div class="HContent30 FloatLeft PaddingSmall TextRight"><input type="checkbox" path="' + project.Files[a].Path + '"/></div>';
				istr += '</div>';
			}
			else
			{
				ssw = ssw == 1 ? 2 : 1;
				str += '<div class="HRow sw' + ssw + '">';
				str += '<div class="HContent70 Ellipsis FloatLeft PaddingSmall">' + project.Files[a].Path + '</div>';
				str += '<div class="HContent30 FloatLeft PaddingSmall TextRight"><input type="checkbox" path="' + project.Files[a].Path + '"/></div>';
				str += '</div>';
			}
		}
		
		if( str.length )
		{
			ge( 'project_files' ).innerHTML = '<div class="List">' + str + '</div>';
		}
		else
		{
			ge( 'project_files' ).innerHTML = i18n( 'i18n_project_has_no_files' );
		}
		if( istr.length )
		{
			ge( 'project_images' ).innerHTML = '<div class="List">' + istr + '</div>';
		}
		else
		{
			ge( 'project_images' ).innerHTML = i18n( 'i18n_project_has_no_images' );
		}
	}
	else
	{
		ge( 'project_files' ).innerHTML = i18n( 'i18n_project_has_no_files' );
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
			var permKey = project.Permissions[a].Name + ':' + 
				project.Permissions[a].Options + ':' + 
				project.Permissions[a].Permission;
			str += '<div class="HRow sw' + sw + '">';
			str += '<div class="HContent35 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Name + '</div>';
			str += '<div class="HContent35 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Options + '</div>';
			str += '<div class="HContent20 Ellipsis FloatLeft PaddingSmall">' + project.Permissions[a].Permission + '</div>';
			str += '<div class="HContent10 FloatLeft PaddingSmall TextRight"><input type="checkbox" key="' + permKey + '"/></div>';
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

function RemoveImages()
{
	RemoveFiles( 'images' );
}

function RemoveFiles( mode )
{
	var els = ge( 'project_' + ( mode && mode == 'images' ? 'images' : 'files' ) ).getElementsByTagName( 'input' );
	
	var out = [];
	
	for( var a = 0; a < project.Files.length; a++ )
	{
		var checked = false;
		for( var b = 0; b < els.length; b++ )
		{
			if( els[b].checked )
			{
				var path = els[b].getAttribute( 'path' );
				if( path && project.Files[a].Path == path )
				{
					checked = true;
					break;
				}
			}
		}
		if( !checked )
		{
			out.push( project.Files[a] );
		}
	}
	
	project.Files = out;
	
	RefreshFiles();
}

function AddFiles( type )
{
	( new Filedialog( {
		path: 'Mountlist:',
		type: 'open',
		rememberPath: true,
		triggerFunction: function( files )
		{
			if( files.length )
			{
				for( var a = 0; a < files.length; a++ )
				{
					project.Files.push( files[a] );
				}
				RefreshFiles();
			}
		},
		suffix: type && type == 'images' ? [ 'jpg', 'jpeg', 'png', 'gif' ] : supportedFiles
	} ) );
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
		project: project,
		targetViewId: Application.parentViewId
	} );
}

// -----------------------------------------------------------------------------

Application.receiveMessage = function( msg )
{
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
				RefreshPermissions();
				Application.parentViewId = msg.parentView;
				break;
		}
	}
}

