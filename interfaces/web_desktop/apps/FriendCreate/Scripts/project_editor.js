/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var project = {
	Type: 'standard'
};

var saved = false;

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
	if( this.initialized ) return;
	this.initialized = true;
	InitializeForm();
}

function InitializeForm()
{
	// Project didn't change
	if( Sha256.hash( JSON.stringify( project ) ) == Application.lastProjectState )
	{
		return;
	}
	
	InitTabs( 'ProjectTabs' );
	
	Application.lastProjectState = Sha256.hash( JSON.stringify( project ) );
	
	RefreshProject();
}

function RefreshProject()
{
	let types = {
		'standard': i18n( 'i18n_standard_friend_project' ),
		'webssh': i18n( 'i18n_web_project_ssh' )
	};

	// Initialize
	if( project.ProjectType && project.Path && saved )
	{
		var topts = '<strong>';
		for( var a in types )
		{
			if( project.ProjectType && project.ProjectType == a )
				topts += types[ a ];
		}
		topts += '</strong>';
	}
	else
	{
		let topts = '<select id="project_type" onchange="project.ProjectType = this.value; InitializeForm()">';
		let s = null;
		for( let a in types )
		{
			s = '';
			if( project.ProjectType && project.ProjectType == a )
				s = ' selected="selected"';
			topts += '<option value="' + a + '"' + s + '>' + types[ a ] + '</option>';
		}
		topts += '</select>';
	}
	
	ge( 'ProjectTypes' ).innerHTML = topts;
	
	if( project.WhiteLabelEnabled && project.WhiteLabelEnabled === true )
	{
		document.querySelector( '.WhiteLabelEnabled' ).checked = true;
	}
	
	let whArr = [ 
		'LoginHeading',
		'LoginFooter',
		'LoginLogo',
		'LoginBackground',
		'LoginCSS' 
	];
	whArr.forEach( label => {
		if( project[ label ] && project[ label ].length )
		{
			if( label == 'LoginLogo' )
			{
				ge( 'CustomLogo' ).innerHTML = '<img src="' + getImageUrl( project[ label ] ) + '"/>';
			}
			else if( label == 'LoginBackground' )
			{
				ge( 'CustomBackground' ).innerHTML = '<img src="' + getImageUrl( project[ label ] ) + '"/>';
			}
			document.querySelector( '.' + label ).value = project[ label ];
		}
	} );
	
	switch( project.ProjectType )
	{
		case 'webssh':
			ge( 'Version' ).style.display = 'none';
			ge( 'Host' ).style.display = '';

			if( !ge( 'ProjectHostSSHServer' ).value )
				ge( 'ProjectHostSSHServer' ).value = project.ProjectHostSSHServer ? project.ProjectHostSSHServer : '';
			if( !ge( 'ProjectHostSSHUsername' ).value )
				ge( 'ProjectHostSSHUsername' ).value = project.ProjectHostSSHUsername ? project.ProjectHostSSHUsername : '';
			if( !ge( 'ProjectHostSSHPassword' ).value )
				ge( 'ProjectHostSSHPassword' ).value = project.ProjectHostSSHPassword ? project.ProjectHostSSHPassword : '';
			if( !ge( 'ProjectHostSSHPort' ).value )
				ge( 'ProjectHostSSHPort' ).value = project.ProjectHostSSHPort ? project.ProjectHostSSHPort : '';
			if( !ge( 'ProjectHostSSHKey' ).value )
				ge( 'ProjectHostSSHKey' ).value = project.ProjectHostSSHKey ? project.ProjectHostSSHKey : '';
			if( !ge( 'ProjectHostSSHPath' ).value )
				ge( 'ProjectHostSSHPath' ).value = project.ProjectHostSSHPath ? project.ProjectHostSSHPath : '';
			ge( 'ProjectWebEnabled' ).checked = project.ProjectWebEnabled ? 'checked' : '';
			if( !ge( 'ProjectWebPath' ).value )
				ge( 'ProjectWebPath' ).value = project.ProjectWebPath ? project.ProjectWebPath : '';
			
			// Web host enabled?
			if( project.ProjectWebEnabled )
			{
				ge( 'WebEnabled' ).style.display = '';
			}
			else
			{
				ge( 'WebEnabled' ).style.display = 'none';
			}
			ge( 'Mandatory' ).style.display = 'none';
			ge( 'Privileges' ).style.display = 'none';
			
			
			break;
		case 'standard':
		default:
			ge( 'Version' ).style.display = '';
			ge( 'Host' ).style.display = 'none';
			ge( 'Mandatory' ).style.display = '';
			ge( 'Privileges' ).style.display = '';
			break;
	}
}


function RefreshFiles()
{
	if( project.Files && project.Files.length )
	{
		var ssw = 0;
		var isw = 0;
		var str = istr = '';
		
		var foundScreenshot = foundIcon = foundPreview = false;
		
		for( var a = 0; a < project.Files.length; a++ )
		{
			if( project.ID )
				project.Files[ a ].ProjectID = project.ID;
			
			var ext = project.Files[a].Path.split( '.' ).pop().toLowerCase();
			
			if( ext == 'png' || ext == 'gif' || ext == 'jpg' || ext == 'jpeg' )
			{
				if( project.Files[a].Path.indexOf( 'screenshot.' ) == 0 )
				{
					ge( 'ButtonScreenshot' ).innerHTML = '<img src="' + getImageUrl( project.ProjectPath + project.Files[a].Path ) + '" style="width: 64px; height: 64px"/>';
					foundScreenshot = true;
				}
				if( project.Files[a].Path.indexOf( 'icon.' ) == 0 )
				{
					ge( 'ButtonIcon' ).innerHTML = '<img src="' + getImageUrl( project.ProjectPath + project.Files[a].Path ) + '" style="width: 64px; height: 64px"/>';
					foundIcon = true;
				}
				if( project.Files[a].Path.indexOf( 'preview.' ) == 0 )
				{
					ge( 'ButtonPreview' ).innerHTML = '<img src="' + getImageUrl( project.ProjectPath + project.Files[a].Path ) + '" style="width: 64px; height: 64px"/>';
					foundPreview = true;
				}
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
		
		if( !foundScreenshot )
		{
			ge( 'ButtonScreenshot' ).innerHTML = '';
		}
		if( !foundIcon )
		{
			ge( 'ButtonIcon' ).innerHTML = '';
		}
		if( !foundPreview )
		{
			ge( 'ButtonPreview' ).innerHTML = '';
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
		var str = '';
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
		ge( 'project_permissions' ).innerHTML = str;
	}
	else
	{
		ge( 'project_permissions' ).innerHTML = i18n( 'i18n_project_has_no_permissions' );
	}
}

function AddImageTo( type )
{
	( new Filedialog( {
		path: project.ProjectPath,
		type: 'open',
		multiple: false,
		triggerFunction: function( file )
		{
			if( file && file.length )
			{
				document.querySelector( '.' + type ).value = file[0].Path;
				project[ type ] = file[0].Path;
			}
			RefreshProject();
		},
		suffix: [ 'jpg', 'jpeg', 'png', 'gif' ]
	} ) );
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

var priv = false;
var lineSeed = 1;
function AddPrivilege( pele )
{
	if( pele )
	{
		var s = pele.parentNode.parentNode;
		if( !project.Permissions )
			project.Permissions = [];
		project.Permissions.push( {
			Permission: s.getElementsByTagName( 'select' )[0].value,
			Name: s.getElementsByTagName( 'input' )[0].value,
			Options: s.getElementsByTagName( 'input' )[1].value
		} );
		RefreshPermissions();
		s.parentNode.removeChild( s );
		priv = false;
		return;
	}
	if( !priv )
	{
		lineSeed++;
		var sels = '<select class="FullWidth" onchange="evaluateOptions( this, ' + lineSeed + ' )"><option value="Module">' + i18n( 'i18n_module' ) + '</option><option value="Library">' + i18n( 'i18n_library' ) + '</option><option value="Door">' + i18n( 'i18n_disk' ) + '</option></select>';
	
		var p = document.createElement( 'div' );
		var str = '';
		str += '<div class="HRow BackgroundHeavier" id="Line' + ( lineSeed ) + '">';
		str += '<div class="HContent30 Ellipsis FloatLeft PaddingSmall">' + sels + '</div>';
		str += '<div class="HContent35 Ellipsis FloatLeft PaddingSmall"><input id="placeholderNamed' + lineSeed + '" type="text" placeholder="' + i18n( 'i18n_named_item' ) + '" class="FullWidth"/></div>';
		str += '<div class="HContent25 Ellipsis FloatLeft PaddingSmall"><input id="placeholderOptions' + lineSeed + '" type="text" placeholder="' + i18n( 'i18n_options' ) + '" class="FullWidth"/></div>';
		str += '<div class="HContent10 Ellipsis FloatLeft PaddingSmall"><button class="ImageButton IconSmall fa-check FullWidth" onclick="AddPrivilege(this)"></button></div>';
		str += '</div>';
		p.innerHTML = str;
		priv = p;
		ge( 'project_permissions' ).appendChild( p );
	}
	
	priv.getElementsByTagName( 'input' )[0].focus();
}

function evaluateOptions( sel, line )
{
	if( sel.value == 'Door' )
	{
		ge( 'placeholderNamed' + line ).value = 'All';
		ge( 'placeholderOptions' + line ).value = '';
	}
}

function RemovePrivileges()
{
	var els = ge( 'project_permissions' ).getElementsByTagName( 'input' );
	
	var out = [];
	
	for( var a = 0; a < project.Permissions.length; a++ )
	{
		var checked = false;
		
		var permKey = project.Permissions[a].Name + ':' + 
			project.Permissions[a].Options + ':' + 
			project.Permissions[a].Permission;
		
		for( var b = 0; b < els.length; b++ )
		{
			if( els[b].checked )
			{
				var pk = els[b].getAttribute( 'key' );
				if( permKey == pk )
				{
					checked = true;
					break;
				}
			}
		}
		if( !checked )
		{
			out.push( project.Permissions[a] );
		}
	}
	
	project.Permissions = out;
	
	RefreshPermissions();
}

function AddFiles( type )
{
	( new Filedialog( {
		path: project.ProjectPath,
		type: 'open',
		triggerFunction: function( files )
		{
			if( files.length )
			{
				for( var a = 0; a < files.length; a++ )
				{
					if( files[a].Path.substr( 0, project.ProjectPath.length ) == project.ProjectPath )
					{
						var pl = project.ProjectPath.length;
						files[a].Path = files[a].Path.substr( pl, files[a].Path.length - pl );
					}
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
	let values = [
		'project_projectname',
		'project_author',
		'project_type',
		'project_version',
		'project_category',
		'project_description',
		'whitelabel_login',
		'whitelabel_footer',
		'whitelabel_logo',
		'whitelabel_background',
		'whitelabel_css',
		'whitelabel_enabled'
	];
	let equiv = [
		'ProjectName',
		'Author', 
		'ProjectType',
		'Version',
		'Category',
		'Description',
		'LoginHeading',
		'LoginFooter',
		'LoginLogo',
		'LoginBackground',
		'LoginCSS',
		'WhiteLabelEnabled'
	];
	for( var a = 0; a < values.length; a++ )
	{
		let inp = ge( values[ a ] );
		if( inp )
		{
			if( inp.type == 'checkbox' )
			{
				project[ equiv[a] ] = ( inp.checked ) ? true : false;
				continue;
			}
			project[ equiv[a] ] = ge( values[a] ).value;
		}
	}

	if( project.ProjectType == 'webssh' )
	{
		project.ProjectHostSSHServer = ge( 'ProjectHostSSHServer' ).value;
		project.ProjectHostSSHUsername = ge( 'ProjectHostSSHUsername' ).value;
		project.ProjectHostSSHPassword = ge( 'ProjectHostSSHPassword' ).value;
		project.ProjectHostSSHPort = ge( 'ProjectHostSSHPort' ).value;
		project.ProjectHostSSHPath = ge( 'ProjectHostSSHPath' ).value;
		project.ProjectSSHHostKey = ge( 'ProjectHostSSHKey' ).value;
		project.ProjectWebEnabled = ge( 'ProjectWebEnabled' ).checked ? true : false;
		project.ProjectWebPath = ge( 'ProjectWebPath' ).value;
		if( project.ProjectHostSSHPath )
		{
			project.ProjectPath = project.ProjectName + ':';
		}
	}
	
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
				
				// This means we chose a project type
				if( project.ProjectType )
				{
					saved = true;
				}
				
				// Should really never be called.
				if( !project.ProjectType || project.ProjectType == 'standard' )
				{
					if( project.Path && !project.ProjectPath )
					{
						var p = '';
						if( project.Path.indexOf( '.' ) > 0 )
						{
							if( project.Path.indexOf( '/' ) > 0 )
							{
								p = project.Path.split( '/' ); p.pop();
								p = p.join( '/' ) + '/';
							}
							else
							{
								p = project.Path.split( ':' ); p.pop();
								p = p.join( ':' ) + ':';
							}
							project.ProjectPath = p;
						}
					}
				}
				else if( project.ProjectType == 'webssh' )
				{
					if( project.ProjectHostSSHPath && !project.ProjectPath )
					{
						project.ProjectPath = project.ProjectName + ':';
					}
				}
				InitializeForm();
				break;
		}
	}
}

