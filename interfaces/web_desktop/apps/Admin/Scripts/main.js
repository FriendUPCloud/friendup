/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Start!
Application.run = function( msg ){ initGui(); }

// Just initialize the GUI!
function initGui()
{
	refreshSidebar();
	refreshStatistics();
}

// Side bar being refreshed
function refreshSidebar()
{
	Application.mods = {
		'Server': {
			'Status': {
				icon: 'fa-info-circle'
			},
			'Configuration': {
				icon: 'fa-gear'
			},
			'Certificates': {
				icon: 'fa-certificate'
			},
			'Backup': {
				icon: 'fa-cloud-download'
			},
			'Logs': {
				icon: 'fa-list-alt'
			}
		},
		'Services': {
			'Status': {
				icon: 'fa-info-circle'
			}
		},
		'Applications': {
			'Status': {
				icon: 'fa-info-circle'
			}
		},
		'Accounts': {
			'Status': {
				icon: 'fa-info-circle'
			},
			'Users': {
				icon: 'fa-user'
			},
			'Workgroups': {
				icon: 'fa-users'
			},
			'Roles': {
				icon: 'fa-user-secret'
			}
		}
	};
	
	var container = ge( 'GuiSidebar' );
	var eles = container.getElementsByClassName( 'DashboardHeading' );
	var headings = {};
	var mods = Application.mods;
	for( var a in mods )
	{
		var found = false;
		for( var b = 0; b < eles.length; b++ )
		{
			if( eles[b].id == 'Heading_' + a )
			{
				headings[ a ] = eles[b];
				found = true;
				break;
			}
		}
		if( !found )
		{
			headings[ a ] = document.createElement( 'div' );
			container.appendChild( headings[ a ] );
			headings[ a ].innerHTML = '<h2>' + a + '</h2>';
			var elements = document.createElement( 'div' );
			elements.className = 'Elements';
			headings[ a ].elements = headings[ a ].appendChild( elements );
		}
		
		// Clear elements
		// TODO: Gracefully!
		headings[ a ].elements.innerHTML = '';
		
		// Populate children
		for( var b in mods[ a ] )
		{
			var ch = mods[ a ][ b ];
			var ptag = document.createElement( 'p' );
			var atag = document.createElement( 'a' );
			atag.innerHTML = b;
			ptag.appendChild( atag );
			if( ch.icon )
			{
				atag.classList.add( 'IconSmall', ch.icon );
				atag.innerHTML = '&nbsp;' + atag.innerHTML;
				( function( module, sect, ele )
				{
					ele.onclick = function()
					{
						setGUISection( module, sect );
					}
				} )( a, b, atag );
			}
			headings[ a ].elements.appendChild( ptag );
		}
	}
}

// Refreshing general statistics
function refreshStatistics()
{
}

// Sets the gui for a section in the app
function setGUISection( module, section )
{
	var found = false;
	if( typeof( Application.mods[ module ] ) != 'undefined' )
	{
		for( var a in Application.mods[ module ] )
		{
			if( a == section )
			{
				found = true;
			}
		}
	}
	if( !found ) return;
	
	var sectPart = module.toLowerCase() + '_' + section.toLowerCase();
	var f = new File( 'Progdir:Templates/' + sectPart + '.html' );
	f.onLoad = function( data )
	{
		ge( 'GuiContent' ).innerHTML = data;
		Sections[ sectPart ]();
	}
	f.load();
}

var Sections = {
	// Let's do the server configuration, eh?
	server_configuration()
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				ge( 'ServerConfiguration' ).innerHTML = '<h2>Failed to load config</h2>';
				return;
			}
			var cfg = null;
			try
			{
				cfg = JSON.parse( d );
			}
			catch( e )
			{
				ge( 'ServerConfiguration' ).innerHTML = '<h2>Failed to parse config</h2>';
				return;
			}
			var str = '';
			
			for( var a in cfg )
			{
				str += FieldToInput( a, cfg[a] );
			}
			
			ge( 'ServerConfiguration' ).innerHTML = str;
		}
		m.execute( 'getconfiginijson' );
	},
	accounts_users( cmd, extra )
	{
		if( cmd )
		{
			if( cmd == 'edit' )
			{
				// Show the form
				function initUsersDetails( info )
				{
					var userInfo = info.userinfo;
					var settings = info.settings;
					
					var d = new File( 'Progdir:Templates/account_users_details.html' );
					d.replacements = {
						user_name: userInfo.FullName,
						user_fullname: userInfo.FullName,
						user_username: userInfo.Name,
						user_email: userInfo.Email,
						theme_name: settings.Theme
					};
					d.i18n();
					d.onLoad = function( data )
					{
						ge( 'UserDetails' ).innerHTML = data;
					}
					d.load();
				}
				
				// Go through all data gathering until stop
				var loadingSlot = 0;
				var loadingList = [
					// Load userinfo
					function()
					{
						var u = new Module( 'system' );
						u.onExecuted = function( e, d )
						{
							if( e != 'ok' ) return;
							var userInfo = null;
							try
							{
								userInfo = JSON.parse( d );
							}
							catch( e )
							{
								return;
							}
							loadingList[ ++loadingSlot ]( userInfo );
				
						}
						u.execute( 'userinfoget', { id: extra } );
					},
					// Load user settings
					function( userInfo )
					{
						var u = new Module( 'system' );
						u.onExecuted = function( e, d )
						{
							if( e != 'ok' ) return;
							var settings = null;
							try
							{
								settings = JSON.parse( d );
							}
							catch( e )
							{
								return;
							}
							loadingList[ ++loadingSlot ]( { userInfo: userInfo, settings: settings } );
						}
						u.execute( 'usersettings' );
					},
					function( info )
					{
						initUsersDetails( {
							userinfo: info.userInfo,
							settings: info.settings
						} );
					}
				];
				loadingList[ 0 ]();
				
				
				return;
			}
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			var userList = null;
			try
			{
				userList = JSON.parse( d );
			}
			catch( e )
			{
				return;
			}
			var o = ge( 'UserList' );
			o.innerHTML = '';
			
			// Types of listed fields
			var types = {
				Edit: '10',
				FullName: '30',
				Name: '30',
				Level: '30'
			};
			
			
			// List by level
			var levels = [ 'Admin', 'User', 'Guest', 'API' ];
			
			// List headers
			var header = document.createElement( 'div' );
			header.className = 'List';
			var headRow = document.createElement( 'div' );
			headRow.className = 'HRow sw1';
			for( var z in types )
			{
				var borders = '';
				var d = document.createElement( 'div' );
				if( z != 'Edit' )
					borders += ' BorderRight';
				if( a < userList.length - a )
					borders += ' BorderBottom';
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall HContent' + types[ z ] + ' FloatLeft Ellipsis' + borders;
				d.innerHTML = '<strong>' + z + '</strong>';
				headRow.appendChild( d );
			}
			header.appendChild( headRow );
			o.appendChild( header );
			
			var list = document.createElement( 'div' );
			list.className = 'List';
			var sw = 2;
			for( var b = 0; b < levels.length; b++ )
			{
				for( var a = 0; a < userList.length; a++ )
				{
					// Skip irrelevant level
					if( userList[ a ].Level != levels[ b ] ) continue;
					
					sw = sw == 2 ? 1 : 2;
					var r = document.createElement( 'div' );
					r.className = 'HRow sw' + sw;
				
					userList[ a ][ 'Edit' ] = '<button class="IconButton IconSmall fa-edit" onclick="Sections.accounts_users(\'edit\',\'' + userList[a].ID + '\')"></button>';
				
					for( var z in types )
					{
						var borders = '';
						var d = document.createElement( 'div' );
						if( z != 'Edit' )
							borders += ' BorderRight';
						if( a < userList.length - a )
							borders += ' BorderBottom';
						d.className = 'HContent' + types[ z ] + ' FloatLeft PaddingSmall Ellipsis' + borders;
						d.innerHTML = userList[a][ z ];
						r.appendChild( d );
					}
				
					// Add row
					list.appendChild( r );
				}
			}
			o.appendChild( list );
		}
		m.execute( 'listusers' );
	}
}

function FieldToInput( key, data )
{
	var lkey = '';
	var lupper = true;
	for( var a = 0; a < key.length; a++ )
	{
		if( key[a] == '_' || key[a] == '-' )
		{
			lkey += ' ';
			lupper = true;
			continue;
		}
		if( lupper )
		{
			lkey += key[a].toUpperCase();
			lupper = false;
		}
		else
		{
			lkey += key[a];
		}
	}

	var str = '<div class="HRow">';
	str += '<div class="HContent20 FloatLeft Ellipsis Padding">' + lkey + ':</div>';
	str += '<div class="HContent80 FloatLeft Ellipsis Padding">';
	if( parseFloat( data ) )
	{
		str += '<input type="number" class="FullWidth" value="' + data + '"/>';
	}
	else if( data.substr )
	{
		if( data.length > 64 )
		{
			str += '<textarea class="FullWidth">' + data + '</textarea>';
		}
		else
		{
			str += '<input class="FullWidth" type="text" value="' + data + '"/>';
		}
	}
	str += '</div>';
	str += '</div>';
	return str;
}


