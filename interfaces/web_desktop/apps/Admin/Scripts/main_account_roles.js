/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for user role management
Sections.accounts_roles = function( cmd, extra )
{
	if( cmd )
	{
		if( cmd == 'edit' )
		{
			// Show the form
			function initRoleDetails( info )
			{
				// Some shortcuts
				var roleInfo = info.roleInfo;
				var settings = info.settings;
				var workspaceSettings = info.workspaceSettings;
				var wgroups = info.workgroups;
				var mountlist = info.mountlist;
				var apps = info.Permissions;
				
				if( settings )
				{				
					var themeData = workspaceSettings[ 'themedata_' + settings.Theme ];
					if( !themeData )
						themeData = { colorSchemeText: 'light', buttonSchemeText: 'windows' };
				}
				
				// Workgroups
				var wstr = '';
				if( wgroups && wgroups.length )
				{
					for( var b = 0; b < wgroups.length; b++ )
					{
						wstr += '<div class="HRow">';
						wstr += '<div class="HContent100">' + wgroups[b].Name + '</div>';
						wstr += '</div>';
					}
				}
				
				// Mountlist
				var mlst = '';
				if( mountlist && mountlist.length )
				{
					mlst += '<div class="HRow">';
					for( var b = 0; b < mountlist.length; b++ )
					{
						try
						{
							mountlist[b].Config = JSON.parse( mountlist[b].Config );
						}
						catch( e )
						{
							mountlist[b].Config = {};
						}
						mlst += '<div class="HContent20 FloatLeft">';
						mlst += '<div class="PaddingSmall Ellipsis">';
						mlst += '<div id="Storage_' + mountlist[b].ID + '">';
						mlst += '<canvas class="Rounded" name="' + mountlist[b].Name + '" id="Storage_Graph_' + mountlist[b].ID + '" size="' + mountlist[b].Config.DiskSize + '" used="' + mountlist[b].StoredBytes + '"></canvas>';
						mlst += '</div>';
						mlst += '<div class="FloatLeft HContent100 Name Ellipsis TextCenter" title="' + mountlist[b].Name + '">' + mountlist[b].Name + '</div>';
						mlst += '</div>';
						mlst += '</div>';
					}
					mlst += '</div>';
				}
				
				function initStorageGraphs()
				{
					var d = document.getElementsByTagName( 'canvas' );
					for( var a = 0; a < d.length; a++ )
					{
						if( !d[a].id || d[a].id.substr( 0, 4 ) != 'Stor' )
							continue;
						var nod = d[a];
						nod.setAttribute( 'width', nod.parentNode.offsetWidth );
						nod.setAttribute( 'height', 64 );
						
						// Calculate disk usage
						var size = nod.getAttribute( 'size' );
						var mode = size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ];
						size = parseInt( size );
						var type = mode[0].toLowerCase();
						if( type == 'mb' )
						{
							size = size * 1024;
						}
						else if( type == 'gb' )
						{
							size = size * 1024 * 1024;
						}
						else if( type == 'tb' )
						{
							size = size * 1024 * 1024 * 1024;
						}
						var used = parseInt( nod.getAttribute( 'used' ) );
						if( isNaN( size ) ) size = 500 * 1024;
						if( !used && !size ) used = 0, size = 1;
						if( !used ) used = 0;
						if( used > size || ( used && !size ) ) size = used;
						
						// Create doghnut chart
						var pie = new Chart( nod, 
							{
								type: 'doughnut',
								data: { 
									labels: [ 'Space', 'Data' ], 
									datasets: [ { 
										label: 'Disk usage', data: [ size - used, used ], 
										backgroundColor: [ '#27BBB0', '#D75B4E' ],
										borderWidth: 0,
									} ]
								},
								options: { legend: { display: false } }
							} 
						);
					}
				}
				
				
				
				var apl = '';
				var types = [ i18n( 'i18n_name' ) ];
				var keyz  = [ 'Permission' ];
				apl += '<div class="HRow">';
				for( var a = 0; a < types.length; a++ )
				{
					apl += '<div class="PaddingSmall HContent33 FloatLeft Ellipsis">' + types[ a ] + '</div>';
				}
				apl += '</div>';
				
				apl += '<div class="List">';
				var sw = 2;
				if( apps )
				{
					for( var a = 0; a < apps.length; a++ )
					{
						sw = sw == 2 ? 1 : 2;
						apl += '<div class="HRow sw' + sw + '">';
						for( var k = 0; k < keyz.length; k++ )
						{
							var ex = '';
							var value = apps[ a ][ keyz[ k ] ];
							if( !value ) continue;
							if( keyz[ k ] == 'Category' )
								value = apps[ a ].Config.Category;
							if( keyz[ k ] == 'Dock' )
							{
								value = apps[ a ].DockStatus ? '<span class="IconSmall fa-check"></span>' : '';
								ex = ' TextCenter';
							}
							apl += '<div class="PaddingSmall HContent33 FloatLeft Ellipsis' + ex + '">' + value + '</div>';
						}
						apl += '</div>';
					}
				}
				else
				{
					apl += i18n( 'i18n_no_permissions_available' );
				}
				apl += '</div>';
				
				// Get the user details template
				var d = new File( 'Progdir:Templates/account_role_details.html' );
				
				// Add all data for the template
				d.replacements = {
					id: info.ID,
					role_name: info.Name,
					role_description: info.Description,
					/*user_username: roleInfo.Name,
					user_email: roleInfo.Email,
					theme_name: settings.Theme,
					theme_dark: themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ),
					theme_style: themeData.buttonSchemeText == 'windows' ? 'Windows' : 'Mac',
					wallpaper_name: workspaceSettings.wallpaperdoors ? workspaceSettings.wallpaperdoors : i18n( 'i18n_default' ),
					workspace_count: workspaceSettings.workspacecount > 0 ? workspaceSettings.workspacecount : '1',
					system_disk_state: workspaceSettings.hiddensystem ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ),
					storage: mlst,
					workgroups: wstr,*/
					permissions: apl
				};
				
				// Add translations
				d.i18n();
				d.onLoad = function( data )
				{
					ge( 'RoleDetails' ).innerHTML = data;
					initStorageGraphs();
					
					// Responsive framework
					Friend.responsive.pageActive = ge( 'RoleDetails' );
					Friend.responsive.reinit();
				}
				d.load();
			}
			
			// Go through all data gathering until stop
			var loadingSlot = 0;
			
			var loadingList = [
				
				// Load roleinfo
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						if( e != 'ok' ) return;
						var info = null;
						try
						{
							info = JSON.parse( d );
							console.log( 'roleInfo ', info );
						}
						catch( e )
						{
							return;
						}
						loadingList[ ++loadingSlot ]( info );
			
					}
					u.execute( 'userroleget', { id: extra } );
				},
				
				/*// Load user settings
				function( roleInfo )
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
							settings = null;
						}
						loadingList[ ++loadingSlot ]( { roleInfo: roleInfo, settings: settings } );
					}
					u.execute( 'usersettings', { userid: roleInfo.ID } );
				},
				
				// Get more user settings
				function( data )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						if( e != 'ok' ) return;
						var workspacesettings = null;
						try
						{
							workspacesettings = JSON.parse( d );
						}
						catch( e )
						{
							workspacesettings = null;
						}
						
						loadingList[ ++loadingSlot ]( { roleInfo: data.roleInfo, settings: data.settings, workspaceSettings: workspacesettings } );
					}
					u.execute( 'getsetting', { settings: [ 
						'avatar', 'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
						'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
						'focusmode', 'hiddensystem', 'workspacecount', 
						'scrolldesktopicons', 'wizardrun', 'themedata_' + data.settings.Theme,
						'workspacemode'
					], userid: data.roleInfo.ID } );
				},
				
				// Get user's workgroups
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						if( e != 'ok' ) return;
						var wgroups = null;
						try
						{
							wgroups = JSON.parse( d );
						}
						catch( e )
						{
							wgroups = null;
						}
						info.workgroups = wgroups;
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'workgroups' );
				},
				
				// Get storage
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						if( e != 'ok' ) return;
						var ul = null;
						try
						{
							ul = JSON.parse( d );
						}
						catch( e )
						{
							ul = null;
						}
						info.mountlist = ul;
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'mountlist', { userid: info.roleInfo.ID } );
				},
				
				// Get user applications
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						var apps = null;
						if( e != 'ok' ) return;
						try
						{
							apps = JSON.parse( d );
						}
						catch( e )
						{
							apps = null;
						}
						info.applications = apps;
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'listuserapplications', { userid: info.roleInfo.ID } );
				},*/
				
				function( info )
				{
					initRoleDetails( info );
				}
				
			];
			
			loadingList[ 0 ]();
			
			
			return;
		}
	}
	
	
	
	// Get the user list
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		console.log( { e:e, d:d } );
		
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
		
		console.log( { e:e, d:userList } );
		
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		// Types of listed fields
		var types = {
			Edit: '10',
			Name: '80'/*,
			Description: '60'*/
		};
		
		
		// List by level
		var levels = [ 'User' ];
		
		
		var h2 = document.createElement( 'h2' );
		h2.innerHTML = '{i18n_roles}';
		o.appendChild( h2 );
		
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
			d.className = 'PaddingSmall HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
			d.innerHTML = '<strong>' + ( z != 'Edit' ? z : '' ) + '</strong>';
			headRow.appendChild( d );
		}
		
		var d = document.createElement( 'div' );
		d.className = 'PaddingSmall HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
		d.innerHTML = '<strong>(+)</strong>';
		d.onclick = function(){ Sections.userroleadd( 'Unnamed role' ) };
		headRow.appendChild( d );
		
		header.appendChild( headRow );
		o.appendChild( header );
		
		function setROnclick( r, uid )
		{
			r.onclick = function()
			{
				Sections.accounts_roles( 'edit', uid );
			}
		}
		
		var list = document.createElement( 'div' );
		list.className = 'List';
		var sw = 2;
		for( var b = 0; b < levels.length; b++ )
		{
			for( var a = 0; a < userList.length; a++ )
			{
				// Skip irrelevant level
				//if( userList[ a ].Level != levels[ b ] ) continue;
				
				sw = sw == 2 ? 1 : 2;
				var r = document.createElement( 'div' );
				setROnclick( r, userList[ a ].ID );
				r.className = 'HRow sw' + sw;
			
				var icon = '<span class="IconSmall fa-user"></span>';
				userList[ a ][ 'Edit' ] = icon;
				
				for( var z in types )
				{
					var borders = '';
					var d = document.createElement( 'div' );
					if( z != 'Edit' )
					{
						d.className = '';
						borders += ' BorderRight';
					}
					else d.className = 'TextCenter';
					if( a < userList.length - a )
						borders += ' BorderBottom';
					d.className += ' HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft PaddingSmall Ellipsis' + borders;
					d.innerHTML = ( userList[a][ z ] ? userList[a][ z ] : '-' );
					r.appendChild( d );
				}
			
				// Add row
				list.appendChild( r );
			}
		}
		
		o.appendChild( list );
		
		Friend.responsive.pageActive = ge( 'RoleList' );
		Friend.responsive.reinit();
	}
	m.execute( 'userroleget' );
};



Sections.role_edit = function( id, _this )
{
	
	var pnt = _this.parentNode;
	
	var edit = pnt.innerHTML;
	
	var buttons = [ 
		{ 'name' : 'Save',   'icon' : '', 'func' : function()
			{ 
				Sections.userroleupdate( id, ge( 'RoleName' ).value ) 
			} 
		}, 
		{ 'name' : 'Delete', 'icon' : '', 'func' : function()
			{ 
				Sections.userroledelete( id ) 
			} 
		}, 
		{ 'name' : 'Cancel', 'icon' : '', 'func' : function()
			{ 
				pnt.innerHTML = edit 
			} 
		}
	];
	
	pnt.innerHTML = '';
	
	for( var i in buttons )
	{
		var b = document.createElement( 'button' );
		b.className = 'IconSmall FloatRight';
		b.innerHTML = buttons[i].name;
		b.onclick = buttons[i].func;
		
		pnt.appendChild( b );
	}
	
}





Sections.userroleadd = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleadd', { name: input } );
	}
};

Sections.userroledelete = function( rid )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroledelete', { id: rid } );
	}
};

Sections.userroleupdate = function( rid, input, perms )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ) } );
	}
}

Sections.checkpermission = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input } );
	}
}

console.log( 'Sections.userroleadd =', Sections.userroleadd );
console.log( 'Sections.userroledelete =', Sections.userroledelete );
console.log( 'Sections.userroleupdate =', Sections.userroleupdate );
console.log( 'Sections.accounts_roles =', Sections.accounts_roles );
console.log( 'Sections.checkpermission =', Sections.checkpermission );

