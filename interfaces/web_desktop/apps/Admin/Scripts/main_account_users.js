/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for user account management
Sections.accounts_users = function( cmd, extra )
{
	if( cmd )
	{
		if( cmd == 'edit' )
		{
			// Show the form
			function initUsersDetails( info )
			{
				// Some shortcuts
				var userInfo = info.userInfo;
				var settings = info.settings;
				var workspaceSettings = info.workspaceSettings;
				var wgroups = typeof( userInfo.Workgroup ) == 'object' ? userInfo.Workgroup : [ userInfo.Workgroup ];
				var uroles = info.roles;
				var mountlist = info.mountlist;
				var apps = info.applications;
						
				var themeData = workspaceSettings[ 'themedata_' + settings.Theme ];
				if( !themeData )
					themeData = { colorSchemeText: 'light', buttonSchemeText: 'windows' };
				
				// Workgroups
				var wstr = '';
				if( wgroups.length )
				{
					for( var b = 0; b < wgroups.length; b++ )
					{
						if( !wgroups[b].Name ) continue;
						wstr += '<div class="HRow">';
						wstr += '<div class="HContent100">' + wgroups[b].Name + '</div>';
						wstr += '</div>';
					}
				}
				
				// Roles
				var rstr = '';
				/*if( uroles && uroles.length )
				{
					for( var b = 0; b < uroles.length; b++ )
					{
						rstr += '<div class="HRow">';
						rstr += '<div class="HContent100">' + uroles[b].Name + '</div>';
						rstr += '</div>';
					}
				}*/
				
				// Roles and role adherence
				if( uroles && uroles.length )
				{
					for( var a in uroles )
					{
						rstr += '<div class="HRow">';
						rstr += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + uroles[a].Name + '</div>';
						rstr += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
						rstr += '<button onclick="Sections.userrole_update('+uroles[a].ID+','+userInfo.ID+',this)" class="IconButton IconSmall ButtonSmall FloatRight' + ( uroles[a].UserID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
						rstr += '</div>';
						rstr += '</div>';
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
						
						// Calculate disk usage
						var size = ( mountlist[b].Config.DiskSize ? mountlist[b].Config.DiskSize : 0 );
						var mode = ( size && size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ] );
						size = parseInt( size );
						var type = mode[0].toLowerCase();
						if( type == 'kb' )
						{
							size = size * 1024;
						}
						else if( type == 'mb' )
						{
							size = size * 1024 * 1024;
						}
						else if( type == 'gb' )
						{
							size = size * 1024 * 1024 * 1024;
						}
						else if( type == 'tb' )
						{
							size = size * 1024 * 1024 * 1024 * 1024;
						}
						var used = parseInt( mountlist[b].StoredBytes );
						if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
						if( !used && !size ) used = 0, size = 0;
						if( !size ) size = 536870912;
						if( !used ) used = 0;
						if( used > size || ( used && !size ) ) size = used;
						
						var storage = {
							id   : mountlist[b].ID,
							name : mountlist[b].Name,
							type : mountlist[b].Type,
							size : size, 
							used : used, 
							free : ( size - used ), 
							prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
							icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg'
						};
						
						if( Friend.dosDrivers[ storage.type ] && Friend.dosDrivers[ storage.type ].iconLabel )
						{
							storage.icon = 'data:image/svg+xml;base64,' + Friend.dosDrivers[ storage.type ].iconLabel;
						}
						if( storage.name == 'Home' )
						{
							storage.icon = '/iconthemes/friendup15/DriveLabels/Home.svg';
						}
						else if( storage.name == 'System' )
						{
							storage.icon = '/iconthemes/friendup15/DriveLabels/SystemDrive.svg';
						}
						
						//console.log( storage );
						
						mlst += '<div class="HContent33 FloatLeft">';
						mlst += '<div class="PaddingSmall Ellipsis">';
						mlst += '<div class="Col1 FloatLeft" id="Storage_' + storage.id + '">';
						mlst += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
						//mlst += '<canvas class="Rounded" name="' + mountlist[b].Name + '" id="Storage_Graph_' + mountlist[b].ID + '" size="' + mountlist[b].Config.DiskSize + '" used="' + mountlist[b].StoredBytes + '"></canvas>';
						mlst += '</div>';
						mlst += '<div class="Col2 FloatLeft HContent100 Name Ellipsis">';
						mlst += '<div class="name" title="' + storage.name + '">' + storage.name + ':</div>';
						mlst += '<div class="type" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>';
						mlst += '<div class="rectangle"><div title="' + FormatBytes( storage.used, 0 ) + ' used" style="width:' + storage.prog + '%"></div></div>';
						mlst += '<div class="bytes">' + FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '</div>';
						mlst += '</div>';
						mlst += '</div>';
						mlst += '</div>';
					}
					mlst += '</div>';
				}
				else
				{
					mlst += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_mountlist_empty' ) + '</div></div>';
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
						nod.setAttribute( 'height', nod.parentNode.offsetHeight );
						
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
						if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
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
				
				// Applications
				var apl = '';
				var types = [ i18n( 'i18n_name' ), i18n( 'i18n_category' ), i18n( 'i18n_dock' ) ];
				var keyz  = [ 'Name', 'Category', 'Dock' ];
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
					apl += i18n( 'i18n_no_applications_available' );
				}
				apl += '</div>';
				
				// Get the user details template
				var d = new File( 'Progdir:Templates/account_users_details.html' );
				
				// Add all data for the template
				d.replacements = {
					user_name:         userInfo.FullName,
					user_fullname:     userInfo.FullName,
					user_username:     userInfo.Name,
					user_email:        userInfo.Email,
					theme_name:        settings.Theme,
					theme_dark:        themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ),
					theme_style:       themeData.buttonSchemeText == 'windows' ? 'Windows' : 'Mac',
					wallpaper_name:    workspaceSettings.wallpaperdoors ? workspaceSettings.wallpaperdoors : i18n( 'i18n_default' ),
					workspace_count:   workspaceSettings.workspacecount > 0 ? workspaceSettings.workspacecount : '1',
					system_disk_state: workspaceSettings.hiddensystem ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ),
					storage:           mlst,
					workgroups:        wstr,
					roles:             rstr,
					applications:      apl
				};
				
				// Add translations
				d.i18n();
				d.onLoad = function( data )
				{
					ge( 'UserDetails' ).innerHTML = data;
					//initStorageGraphs();
					
					// Responsive framework
					Friend.responsive.pageActive = ge( 'UserDetails' );
					Friend.responsive.reinit();
					
					// Events --------------------------------------------------
					
					// Editing basic details
					
					var inps = ge( 'UserBasicDetails' ).getElementsByTagName( 'input' );
					var bge  = ge( 'UserBasicEdit' );
					for( var a = 0; a < inps.length; a++ )
					{
						( function( i ) {
							i.onkeyup = function( e )
							{
								bge.innerHTML = ' ' + i18n( 'i18n_save_changes' );
							}
						} )( inps[ a ] );
					}
					bge.onclick = function( e )
					{
						saveUser( userInfo.ID );
					}
					
					// Editing workgroups
					
					var wge = ge( 'WorkgroupEdit' );
					if( wge ) wge.onclick = function( e )
					{
						// Show
						if( !this.activated )
						{
							this.activated = true;
							this.oldML = ge( 'WorkgroupGui' ).innerHTML;
							
							var str = '';
							for( var a = 0; a < info.workgroups.length; a++ )
							{
								var found = false;
								for( var c = 0; c < wgroups.length; c++ )
								{
									if( info.workgroups[a].Name == wgroups[c].Name )
									{
										found = true;
										break;
									}
								}
								str += '<div class="HRow">\
									<div class="PaddingSmall HContent60 FloatLeft Ellipsis">' + info.workgroups[a].Name + '</div>\
									<div class="PaddingSmall HContent40 FloatLeft Ellipsis">\
										<button wid="' + info.workgroups[a].ID + '" class="IconButton IconSmall ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>\
									</div>\
								</div>';
							}
							ge( 'WorkgroupGui' ).innerHTML = str;
							
							var workBtns = ge( 'WorkgroupGui' ).getElementsByTagName( 'button' );
							for( var a = 0; a < workBtns.length; a++ )
							{
								// Toggle user relation to workgroup
								( function( b ) {
									b.onclick = function( e )
									{
										var enabled = false;
										if( this.classList.contains( 'fa-toggle-off' ) )
										{
											this.classList.remove( 'fa-toggle-off' );
											this.classList.add( 'fa-toggle-on' );
											enabled = true;
										}
										else
										{
											this.classList.remove( 'fa-toggle-on' );
											this.classList.add( 'fa-toggle-off' );
										}
										var args = { command: 'update', id: userInfo.ID };
										args.workgroups = [];
										
										for( var c = 0; c < workBtns.length; c++ )
										{
											if( workBtns[c].classList.contains( 'fa-toggle-on' ) )
											{
												args.workgroups.push( workBtns[c].getAttribute( 'wid' ) );
											}
										}
										args.workgroups = args.workgroups.join( ',' );
										
										// Reload user gui now
										var f = new Library( 'system.library' );
										f.onExecuted = function( e, d )
										{
											// Do nothing
										}
										f.execute( 'user', args );
									}
								} )( workBtns[ a ] );
							}
							
						}
						// Hide
						else
						{
							this.activated = false;
							ge( 'WorkgroupGui' ).innerHTML = this.oldML;
						}
					}
					
					// End events ----------------------------------------------
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
					u.execute( 'userinfoget', { id: extra, mode: 'all' } );
				},
				// Load user settings
				function( userInfo )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
						var settings = null;
						try
						{
							settings = JSON.parse( d );
						}
						catch( e )
						{
							settings = null;
						}
						loadingList[ ++loadingSlot ]( { userInfo: userInfo, settings: settings } );
					}
					u.execute( 'usersettings', { userid: userInfo.ID } );
				},
				// Get more user settings
				function( data )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
						var workspacesettings = null;
						try
						{
							workspacesettings = JSON.parse( d );
						}
						catch( e )
						{
							workspacesettings = null;
						}
						
						loadingList[ ++loadingSlot ]( { userInfo: data.userInfo, settings: data.settings, workspaceSettings: workspacesettings } );
					}
					u.execute( 'getsetting', { settings: [ 
						'avatar', 'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
						'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
						'focusmode', 'hiddensystem', 'workspacecount', 
						'scrolldesktopicons', 'wizardrun', 'themedata_' + data.settings.Theme,
						'workspacemode'
					], userid: data.userInfo.ID } );
				},
				// Get user's workgroups
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
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
				// Get user's roles
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						var uroles = null;
						console.log( { e:e, d:d } );
						if( e == 'ok' )
						{
							try
							{
								uroles = JSON.parse( d );
							}
							catch( e )
							{
								uroles = null;
							}
							info.roles = uroles;
						}
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'userroleget', { userid: info.userInfo.ID } );
				},
				// Get storage
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
						var ul = null;
						try
						{
							ul = JSON.parse( d );
						}
						catch( e )
						{
							ul = null;
						}
						//console.log( { e:e, d:(ul?ul:d) } );
						info.mountlist = ul;
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'mountlist', { userid: info.userInfo.ID } );
				},
				// Get user applications
				function( info )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						var apps = null;
						//if( e != 'ok' ) return;
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
					u.execute( 'listuserapplications', { userid: info.userInfo.ID } );
				},
				function( info )
				{
					initUsersDetails( info );
				}
			];
			loadingList[ 0 ]();
			
			
			return;
		}
	}
	
	var checkedGlobal = Application.checkAppPermission( 'PERM_USER_GLOBAL' );
	var checkedWorkgr = Application.checkAppPermission( 'PERM_USER_WORKGROUP' );
	
	function doListUsers( userList, clearFilter )
	{
		var o = ge( 'UserList' );
		o.innerHTML = '';

		// Add the main heading
		( function( ol ) {
			var tr = document.createElement( 'div' );
			tr.className = 'HRow';
			
			var extr = '';
			if( clearFilter )
			{
				extr = '<button style="position: absolute; right: 0;" class="ButtonSmall IconButton IconSmall fa-remove"/>&nbsp;</button>';
			}
			
			tr.innerHTML = '\
				<div class="HContent50 FloatLeft">\
					<h2>' + i18n( 'i18n_users' ) + '</h2>\
				</div>\
				<div class="HContent50 FloatLeft Relative">\
					' + extr + '\
					<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_find_users' ) + '"/>\
				</div>\
			';
					
			var inp = tr.getElementsByTagName( 'input' )[0];
			inp.onkeyup = function( e )
			{
				if( e.which == 13 )
				{
					filterUsers( this.value );
				}
			}
			
			if( clearFilter )
			{
				inp.value = clearFilter;
			}
			
			var bt = tr.getElementsByTagName( 'button' )[0];
			if( bt )
			{
				bt.onclick = function()
				{
					filterUsers( false );
				}
			}
					
			ol.appendChild( tr );
		} )( o );

		// Types of listed fields
		var types = {
			Edit: '10',
			FullName: '30',
			Name: '25',
			Level: '25'
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
			if( z == 'Edit' ) z = '';
			d.innerHTML = '<strong>' + ( z ? i18n( 'i18n_header_' + z ) : '' ) + '</strong>';
			headRow.appendChild( d );
		}
		
		// New user button
		var l = document.createElement( 'div' );
		l.className = 'HContent10 FloatLeft BorderBottom';
		var b = document.createElement( 'button' );
		b.className = 'IconButton IconSmall fa-plus Negative';
		b.innerHTML = '&nbsp;';
		l.appendChild( b );		
		headRow.appendChild( l );
		b.onclick = function( e )
		{
			var d = new File( 'Progdir:Templates/account_users_details.html' );
			// Add all data for the template
			d.replacements = {
				user_name:         '',
				user_fullname:     '',
				user_username:     '',
				user_email:        '',
				theme_name:        '',
				theme_dark:        '',
				theme_style:       '',
				theme_preview:     '',
				wallpaper_name:    '',
				workspace_count:   '',
				system_disk_state: '',
				storage:           '',
				workgroups:        '',
				roles:             '',
				applications:      ''
			};
			
			// Add translations
			d.i18n();
			d.onLoad = function( data )
			{
				ge( 'UserDetails' ).innerHTML = data;
				//initStorageGraphs();
				
				// Responsive framework
				Friend.responsive.pageActive = ge( 'UserDetails' );
				Friend.responsive.reinit();
			}
			d.load();
		}
		
		// Add header columns
		header.appendChild( headRow );
		o.appendChild( header );

		function setROnclick( r, uid )
		{
			r.onclick = function()
			{
				Sections.accounts_users( 'edit', uid );
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
				if( userList[ a ].Level != levels[ b ] ) continue;

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
					d.className += ' HContent' + types[ z ] + ' FloatLeft PaddingSmall Ellipsis' + borders;
					d.innerHTML = userList[a][ z ];
					r.appendChild( d );
				}

				// Add row
				list.appendChild( r );
			}
		}
		o.appendChild( list );

		Friend.responsive.pageActive = ge( 'UserList' );
		Friend.responsive.reinit();
	}
	
	function filterUsers( filter )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var userList = null;
			
			try
			{
				userList = JSON.parse( d );
			}
			catch( e )
			{
				return;
			}
			
			doListUsers( userList, filter ? filter : false );
		}
		if( filter )
		{
			m.execute( 'listusers', { query: filter } );
		}
		else
		{
			m.execute( 'listusers' );
		}
	}
	
	if( checkedGlobal || checkedWorkgr )
	{
		// Get the user list
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{			
			var userList = null;
			
			try
			{
				userList = JSON.parse( d );
			}
			catch( e )
			{
				return;
			}
			
			doListUsers( userList );
		}
		m.execute( 'listusers' );
		
	}
	else
	{
		var o = ge( 'UserList' );
		o.innerHTML = '';
		
		var h2 = document.createElement( 'h2' );
		h2.innerHTML = '{i18n_permission_denied}';
		o.appendChild( h2 );
	}
};


Sections.userrole_edit = function( userid, _this )
{
	
	var pnt = _this.parentNode;
	
	var edit = pnt.innerHTML;
	
	var buttons = [  
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

Sections.userrole_update = function( rid, userid, _this )
{
	var data = '';
	
	if( _this )
	{
		Toggle( _this, function( on )
		{
			data = ( on ? 'Activated' : '' );
		} );
	}
	
	if( rid && userid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		}
		m.execute( 'userroleupdate', { id: rid, userid: userid, data: data } );
	}
};

// Save a user
function saveUser( uid )
{
	if( !uid ) return;
	
	var args = { command: 'update' };
	args.id = uid;
	var mapping = {
		usFullname: 'fullname',
		usEmail:    'email',
		usUsername: 'username',
		usPassword: 'password'
	};
	for( var a in mapping )
	{
		var k = mapping[ a ];
		
		// Skip nonchanged passwords
		if( a == 'usPassword' && ge( a ).value == '********' )
			continue;
		
		args[ k ] = Trim( ge( a ).value );
		
		// Special case, hashed password
		if( a == 'usPassword' )
		{
			args[ k ] = '{S6}' + Sha256.hash( 'HASHED' + Sha256.hash( args[ k ] ) );
		}
	}

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Notify( { title: i18n( 'i18n_user_updated' ), text: i18n( 'i18n_user_updated_succ' ) } );
			Sections.accounts_users( 'edit', uid );
		}
		else
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_user_update_failed' ) } );
		}
	}
	f.execute( 'user', args );
}

