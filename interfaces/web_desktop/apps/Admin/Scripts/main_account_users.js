/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// TODO: Clean up this whole code file .... when there is time ... , plix .... Now It's a MESS !!!

var UsersSettings = function ( setting, set )
{
	var searchquery = ( ''                           );  
	var searchby    = ( ''                           );
	var sortby      = ( 'FullName'                   );
	var orderby     = ( 'ASC'                        ); 
	var divh        = ( 29                           );
	var listed      = ( 0                            );
	var total       = ( 0                            );
	var startlimit  = ( 0                            );
	var maxlimit    = ( 50                            );
	var limit       = ( startlimit + ', ' + maxlimit );
	
	this.vars = ( this.vars ? this.vars : {
		searchquery : searchquery,
		searchby    : searchby,
		sortby      : sortby,
		orderby     : orderby,
		divh        : divh,
		listed      : listed,
		total       : total,
		startlimit  : startlimit,
		maxlimit    : maxlimit,
		limit       : limit,
		reset       : true,
	} );
	
	function Update ( setting, set )
	{
		if( setting && typeof set != "undefined" )
		{
			console.log( 'UsersSettings: ' + setting + ' = ' + set );
			
			switch( setting )
			{
				case 'searchquery'        :
					this.vars.searchquery = set;
					break;
				case 'searchby'           :
					this.vars.searchby    = set;
					break;
				case 'sortby'             :
					this.vars.sortby      = set;
					break;
				case 'orderby'            :
					this.vars.orderby     = set;
					break;
				case 'divh'               :
					this.vars.divh        = set;
					break;
				case 'listed'             :
					this.vars.listed      = set;
					break;
				case 'total'              :
					this.vars.total       = set;
					break;
				case 'startlimit'         :
					this.vars.startlimit  = ( set                                              );
					this.vars.limit       = ( this.vars.startlimit + ', ' + this.vars.maxlimit );
					break;
				case 'maxlimit'           :
					this.vars.startlimit  = ( 0                                                );
					this.vars.maxlimit    = ( set                                              );
					this.vars.limit       = ( this.vars.startlimit + ', ' + this.vars.maxlimit );
					break;
				case 'limit'              :
					this.vars.startlimit  = ( this.vars.maxlimit                               );
					this.vars.maxlimit    = ( this.vars.maxlimit * 2                           );
					this.vars.limit       = ( this.vars.startlimit + ', ' + this.vars.maxlimit );
					break;
				case 'reset'              :
					this.vars.searchquery = ( searchquery                                      );
					this.vars.searchby    = ( searchby                                         );
					this.vars.sortby      = ( sortby                                           );
					this.vars.orderby     = ( orderby                                          );
					this.vars.divh        = ( divh                                             );
					this.vars.listed      = ( listed                                           );
					this.vars.total       = ( total                                            );
					this.vars.startlimit  = ( startlimit                                       );
					this.vars.maxlimit    = ( maxlimit                                         );
					this.vars.limit       = ( startlimit + ', ' + maxlimit                     );
					break;
			}
		}
	}
	
	Update( setting, set );
	
	if( setting )
	{
		return ( this.vars[ setting ] ? this.vars[ setting ] : false );
	}
	else
	{
		return this.vars;
	}
};

// Section for user account management
Sections.accounts_users = function( cmd, extra )
{
	if( cmd )
	{
		if( cmd == 'edit' )
		{
			// Show the form
			function initUsersDetails( info, show, first )
			{
				// Some shortcuts
				var userInfo          = ( info.userInfo ? info.userInfo : {} );
				var settings          = ( info.settings ? info.settings : {} );
				var workspaceSettings = ( info.workspaceSettings ? info.workspaceSettings : {} );
				var wgroups           = typeof( userInfo.Workgroup ) == 'object' ? userInfo.Workgroup : ( userInfo.Workgroup ? [ userInfo.Workgroup ] : [] );
				var uroles            = ( info.roles ? info.roles : {} );
				var mountlist         = ( info.mountlist ? info.mountlist : {} );
				var apps              = ( info.applications ? info.applications : {} );
				
				console.log( 'initUsersDetails( info ) ', info );		
				
				var func = {
					
					user : function (  )
					{
						// User
						var ulocked = false;
						var udisabled = false;
				
						if( userInfo.Status )
						{
							// 0 = Active, 1 = Disabled, 2 = Locked
					
							if( userInfo.Status == 1 )
							{
								udisabled = true;
							}
							if( userInfo.Status == 2 )
							{
								ulocked = true;
							}
						}
					
						return { 
							udisabled : udisabled, 
							ulocked   : ulocked 
						};
					},
					
					language : function (  )
					{
						// Language
						var availLangs = {
							'en' : 'English',
							'fr' : 'French',
							'no' : 'Norwegian',
							'fi' : 'Finnish',
							'pl' : 'Polish'
						};
						var languages = '';
				
						var locale = ( workspaceSettings.language && workspaceSettings.language.spokenLanguage ? workspaceSettings.language.spokenLanguage.substr( 0, 2 ) : workspaceSettings.locale );
						for( var a in availLangs )
						{
							var sel = ( locale == a ? ' selected="selected"' : '' );
							languages += '<option value="' + a + '"' + sel + '>' + availLangs[ a ] + '</option>';
						}
					
						return languages;
					},
					
					setup : function (  )
					{
						// Setup / Template
						var setup = '<option value="0">None</option>';
						if( userInfo.Setup )
						{
							for( var s in userInfo.Setup )
							{
								if( userInfo.Setup[s] && userInfo.Setup[s].ID )
								{
									var sel = ( userInfo.Setup[s].UserID && userInfo.Setup[s].UserID == userInfo.ID ? ' selected="selected"' : '' );
									setup += '<option value="' + userInfo.Setup[s].ID + '"' + sel + '>' + userInfo.Setup[s].Name + '</option>';
								}
							}
						}
					
						return setup;
					},
					
					themes : function (  )
					{
						// Themes
						var themeData = workspaceSettings[ 'themedata_' + settings.Theme ];
						if( !themeData )
						{
							themeData = { colorSchemeText: 'light', buttonSchemeText: 'windows' };
						}
						
						return themeData;
					},
					
					workgroups : function (  )
					{
						// Workgroups
						var wstr = '';
						if( wgroups.length )
						{
							for( var b = 0; b < wgroups.length; b++ )
							{
								if( !wgroups[b].Name ) continue;
								wstr += '<div class="HRow">';
								wstr += '<div class="HContent100"><strong>' + wgroups[b].Name + '</strong></div>';
								wstr += '</div>';
							}
						}
					
						return wstr;
					},
					
					roles : function (  )
					{
						// Roles
						var rstr = '';
				
						// Roles and role adherence
						if( uroles && uroles == '404' )
						{
							rstr += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_roles_access_denied' ) + '</div></div>';
						}
						else if( uroles && uroles.length )
						{
					
							for( var a in uroles )
							{
								rstr += '<div class="HRow">';
								rstr += '<div class="PaddingSmall HContent45 FloatLeft Ellipsis"><strong>' + uroles[a].Name + '</strong></div>';
						
								var title = '';
						
								if( uroles[a].Permissions.length )
								{
									var wgrs = [];
							
									for( var b in uroles[a].Permissions )
									{
										if( uroles[a].Permissions[b].GroupType == 'Workgroup' && wgrs.indexOf( uroles[a].Permissions[b].GroupName ) < 0 )
										{
											wgrs.push( uroles[a].Permissions[b].GroupName );
										}
									}
							
									title = wgrs.join( ',' );
								}
						
								rstr += '<div class="PaddingSmall HContent40 FloatLeft Ellipsis"' + ( title ? ' title="' + title + '"' : '' ) + '>' + title + '</div>';
						
								rstr += '<div class="PaddingSmall HContent15 FloatLeft Ellipsis">';
								rstr += '<button onclick="Sections.userrole_update('+uroles[a].ID+','+userInfo.ID+',this)" class="IconButton IconSmall ButtonSmall FloatRight' + ( uroles[a].UserID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
								rstr += '</div>';
								rstr += '</div>';
							}
						}
					
						return rstr;
					},
					
					storage : function (  )
					{
						// Storage / disks
						var mlst = Sections.user_disk_refresh( mountlist, userInfo.ID );
					
						return mlst;
					},
					
					applications : function (  )
					{
						// Applications
						var apl = '';
						var types = [ '', i18n( 'i18n_name' ), i18n( 'i18n_category' ), i18n( 'i18n_dock' ) ];
						var keyz  = [ 'Icon', 'Name', 'Category', 'Dock' ];
						apl += '<div class="HRow">';
						for( var a = 0; a < types.length; a++ )
						{
							var ex = ''; var st = '';
							if( keyz[ a ] == 'Icon' )
							{
								st = ' style="width:10%"';
							}
							if( keyz[ a ] == 'Dock' )
							{
								ex = ' TextRight';
							}
							apl += '<div class="PaddingSmall HContent30 FloatLeft Ellipsis' + ex + '"' + st + '>' + types[ a ] + '</div>';
						}
						apl += '</div>';
				
						apl += '<div>';
						var sw = 2;
						if( apps && apps == '404' )
						{
							apl += i18n( 'i18n_applications_available_access_denied' );
						}
						else if( apps )
						{
							for( var a = 0; a < apps.length; a++ )
							{
								sw = sw == 2 ? 1 : 2;
								apl += '<div class="HRow sw' + sw + '">';
								for( var k = 0; k < keyz.length; k++ )
								{
									var ex = ''; var st = '';
									if( keyz[ k ] == 'Icon' )
									{
										st = ' style="width:10%"';
										var img = ( !apps[ a ].Preview ? '/iconthemes/friendup15/File_Binary.svg' : '/system.library/module/?module=system&command=getapplicationpreview&application=' + apps[ a ].Name + '&authid=' + Application.authId );
										var value = '<div style="background-image:url(' + img + ');background-size:contain;width:24px;height:24px;"></div>';
									}
									else
									{
										var value = apps[ a ][ keyz[ k ] ];
									}
									if( keyz[ k ] == 'Name' )
									{
										value = '<strong>' + apps[ a ][ keyz[ k ] ] + '</strong>';
									}
									if( keyz[ k ] == 'Category' && apps[ a ] && apps[ a ].Config && apps[ a ].Config.Category )
									{
										value = apps[ a ].Config.Category;
									}
									if( keyz[ k ] == 'Dock' )
									{
										value = '<button class="IconButton IconSmall ButtonSmall FloatRight' + ( apps[ a ].DockStatus ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
										//value = apps[ a ].DockStatus ? '<span class="IconSmall fa-check"></span>' : '';
										ex = ' TextCenter';
									}
									apl += '<div class="PaddingSmall HContent30 FloatLeft Ellipsis' + ex + '"' + st + '>' + value + '</div>';
								}
								apl += '</div>';
							}
						}
						else
						{
							apl += i18n( 'i18n_no_applications_available' );
						}
						apl += '</div>';
					
						return apl;
					}
				}
				
				
				
				// TODO: Move this out in a specific function so it can be run only once ...
				
				function template( first )
				{
					var user = func.user();
					
					var udisabled = user.udisabled; 
					var ulocked   = user.ulocked; 
					
					var languages = func.language();
					var setup     = func.setup();
					var wstr      = func.workgroups();
					var rstr      = func.roles();
					var mlst      = func.storage();
					var apl       = func.applications();
					var themeData = func.themes();
					
					
					
					function onLoad ( data )
					{
						
						var func = {
							
							init : function (  )
							{
								if( ge( 'UserDetails' ) && data )
								{
									ge( 'UserDetails' ).innerHTML = data;
									
									// Responsive framework
									Friend.responsive.pageActive = ge( 'UserDetails' );
									Friend.responsive.reinit();
								}
							},
							
							user : function (  )
							{
								
								if( ge( 'usName'     ) && userInfo.FullName )
								{
									ge( 'usName'     ).innerHTML = userInfo.FullName;
								}
								if( ge( 'usFullname' ) && userInfo.FullName )
								{
									ge( 'usFullname' ).innerHTML = userInfo.FullName;
								}
								if( ge( 'usUsername' ) && userInfo.Name )
								{
									ge( 'usUsername' ).innerHTML = userInfo.Name;
								}
								if( ge( 'usEmail'    ) && userInfo.Email )
								{
									ge( 'usEmail'    ).innerHTML = userInfo.Email;
								}
								
								if( ge( 'usLocked'   ) && ulocked )
								{
									ge( 'usLocked'   ).className = ge( 'usLocked'   ).className.split( 'fa-toggle-on' ).join( '' ).split( 'fa-toggle-off' ).join( '' ) + 'fa-toggle-on';
								}
								if( ge( 'usDisabled' ) && udisabled )
								{
									ge( 'usDisabled' ).className = ge( 'usDisabled' ).className.split( 'fa-toggle-on' ).join( '' ).split( 'fa-toggle-off' ).join( '' ) + 'fa-toggle-on';
								}
							},
							
							password : function (  )
							{
								// Password ------------------------------------------------
							
								if( ge( 'ChangePassContainer' ) && ge( 'ResetPassContainer' ) )
								{
									ge( 'ChangePassContainer' ).className = 'Closed';
									ge( 'ResetPassContainer'  ).className = 'Open';
						
									var res = ge( 'passToggle' );
									if( res ) res.onclick = function( e )
									{
										toggleChangePass();
									}
								}
							},
							
							language : function (  )
							{
								
								if( ge( 'usLanguage' ) && languages )
								{
									ge( 'usLanguage' ).innerHTML = languages;
								}
								
							},
							
							setup : function (  )
							{
								
								if( ge( 'usSetup' ) )
								{
									ge( 'usSetup' ).innerHTML = setup;
								}
								
							},
							
							avatar : function (  )
							{
								// Avatar --------------------------------------------------
					
								if( ge( 'AdminAvatar' ) && userInfo.avatar )
								{
									// Set the url to get this avatar instead and cache it in the browser ...
									
									// Only update the avatar if it exists..
									var avSrc = new Image();
									avSrc.src = userInfo.avatar;
									avSrc.onload = function()
									{
										var ctx = ge( 'AdminAvatar' ).getContext( '2d' );
										ctx.drawImage( avSrc, 0, 0, 256, 256 );
									}
								} 
								
								var ae = ge( 'AdminAvatarEdit' );
								if( ae ) ae.onclick = function( e )
								{
									changeAvatar();
								}
							},
							
							details : function (  )
							{
								// Editing basic details
								
								if( ge( 'UserBasicDetails' ) )
								{
									var inps = ge( 'UserBasicDetails' ).getElementsByTagName( 'input' );
									if( inps.length > 0 )
									{
										for( var a = 0; a < inps.length; a++ )
										{
											if( inps[ a ].id && [ 'usFullname', 'usUsername', 'usEmail' ].indexOf( inps[ a ].id ) >= 0 )
											{
												( function( i ) {
													i.onclick = function( e )
													{
														editMode();
													}
												} )( inps[ a ] );
											}
										}
									}
								}
					
								var bg1  = ge( 'UserSaveBtn' );
								if( bg1 ) bg1.onclick = function( e )
								{
									saveUser( userInfo.ID );
								}
								var bg2  = ge( 'UserCancelBtn' );
								if( bg2 ) bg2.onclick = function( e )
								{
									cancelUser(  );
								}
					
								if( ge( 'UserEditContainer' ) )
								{
									ge( 'UserEditContainer' ).className = 'Closed';
								}
							},
							
							workgroups : function (  )
							{
								
								if( ge( 'WorkgroupGui' ) && wstr )
								{
									ge( 'WorkgroupGui' ).innerHTML = wstr;
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
							
										if( info.workgroups && info.workgroups == '404' )
										{
											str += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_workgroups_access_denied' ) + '</div></div>';
										}
										else if( info.workgroups )
										{
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
										}
										ge( 'WorkgroupGui' ).innerHTML = str;
							
										var workBtns = ge( 'WorkgroupGui' ).getElementsByTagName( 'button' );
							
										if( workBtns )
										{
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
												
															console.log( { e:e, d:d } );
														}
														f.execute( 'user', args );
													}
												} )( workBtns[ a ] );
											}
										}
							
									}
									// Hide
									else
									{
										this.activated = false;
										ge( 'WorkgroupGui' ).innerHTML = this.oldML;
									}
								}
								
							},
							
							roles : function (  )
							{
								
								if( ge( 'RolesGui' ) && rstr )
								{
									ge( 'RolesGui' ).innerHTML = rstr;
								}
								
							},
							
							storage : function (  )
							{
								
								if( ge( 'StorageGui' ) && mlst )
								{
									ge( 'StorageGui' ).innerHTML = mlst;
								}
								
							},
							
							applications : function (  )
							{
								
								if( ge( 'ApplicationGui' ) && apl )
								{
									ge( 'ApplicationGui' ).innerHTML = apl;
								}
								
							},
							
							theme : function (  )
							{
								// Theme ---------------------------------------------------
								
								if( ge( 'theme_name' ) && settings.Theme )
								{
									ge( 'theme_name' ).innerHTML = settings.Theme;
								}
								if( ge( 'theme_dark' ) && themeData.colorSchemeText && ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ) )
								{
									ge( 'theme_dark' ).innerHTML = i18n( 'i18n_enabled' );
								}
								if( ge( 'theme_style' ) && themeData.buttonSchemeText && themeData.buttonSchemeText == 'windows' )
								{
									ge( 'theme_style' ).innerHTML = 'Windows';
								}
								if( ge( 'wallpaper_name' ) && workspaceSettings.wallpaperdoors )
								{
									ge( 'wallpaper_name' ).innerHTML = workspaceSettings.wallpaperdoors.split( '/' )[workspaceSettings.wallpaperdoors.split( '/' ).length-1];
								}
								if( ge( 'workspace_count' ) && workspaceSettings.workspacecount && workspaceSettings.workspacecount > 0 )
								{
									ge( 'workspace_count' ).innerHTML = workspaceSettings.workspacecount;
								}
								if( ge( 'system_disk_state' ) && workspaceSettings.hiddensystem )
								{
									ge( 'system_disk_state' ).innerHTML = i18n( 'i18n_enabled' );
								}
								
								if( ge( 'ThemePreview' ) && workspaceSettings.wallpaperdoors )
								{
									console.log( workspaceSettings );
									var img = ( workspaceSettings.wallpaperdoors ? '/system.library/module/?module=system&command=thumbnail&width=568&height=320&mode=resize&authid=' + Application.authId + '&path=' + workspaceSettings.wallpaperdoors : '' );
									var st = ge( 'ThemePreview' ).style
									st.backgroundImage = 'url(\'' + ( workspaceSettings.wallpaperdoors ? img : '/webclient/gfx/theme/default_login_screen.jpg' ) + '\')';
									st.backgroundSize = 'cover';
									st.backgroundPosition = 'center';
									st.backgroundRepeat = 'no-repeat';
								}
								
							},
							
							// Events --------------------------------------------------
							
							
							
							// End events ----------------------------------------------
							
							permissions : function ( show )
							{
								// Check Permissions
								
								if( !show || show.indexOf( 'workgroup' ) >= 0 )
								{
									if( Application.checkAppPermission( 'PERM_WORKGROUP_GLOBAL' ) || Application.checkAppPermission( 'PERM_WORKGROUP_WORKGROUP' ) )
									{
										if( ge( 'AdminWorkgroupContainer' ) ) ge( 'AdminWorkgroupContainer' ).className = 'Open';
									}
								}
								
								if( !show || show.indexOf( 'role' ) >= 0 )
								{
									if( Application.checkAppPermission( 'PERM_ROLE_GLOBAL' ) || Application.checkAppPermission( 'PERM_ROLE_WORKGROUP' ) )
									{
										if( ge( 'AdminRoleContainer' ) ) ge( 'AdminRoleContainer' ).className = 'Open';
									}
								}
								
								if( !show || show.indexOf( 'storage' ) >= 0 )
								{
									if( Application.checkAppPermission( 'PERM_STORAGE_GLOBAL' ) || Application.checkAppPermission( 'PERM_STORAGE_WORKGROUP' ) )
									{
										if( ge( 'AdminStorageContainer' ) ) ge( 'AdminStorageContainer' ).className = 'Open';
									}
								}
								
								if( !show || show.indexOf( 'application' ) >= 0 )
								{
									if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
									{
										if( ge( 'AdminApplicationContainer' ) ) ge( 'AdminApplicationContainer' ).className = 'Open';
									}
								}
								
								if( !show || show.indexOf( 'looknfeel' ) >= 0 )
								{
									if( Application.checkAppPermission( 'PERM_LOOKNFEEL_GLOBAL' ) || Application.checkAppPermission( 'PERM_LOOKNFEEL_WORKGROUP' ) )
									{
										if( ge( 'AdminLooknfeelContainer' ) ) ge( 'AdminLooknfeelContainer' ).className = 'Open';
									}
								}
							}
							
						}
						
						func.init();
						func.user();
						func.password();
						func.language();
						func.setup();
						func.avatar();
						func.details();
						func.workgroups();
						func.roles();
						func.storage();
						func.applications();
						func.theme();
						func.permissions( show );
						
					}
					
					
					
					if( first )
					{	
						// Get the user details template
						var d = new File( 'Progdir:Templates/account_users_details.html' );
						console.log( 'userInfo ', userInfo );
						// Add all data for the template
						d.replacements = {
							userid               : ( userInfo.ID ? userInfo.ID : '' ),
							user_name            : ( userInfo.FullName ? userInfo.FullName : '' ),
							user_fullname        : ( userInfo.FullName ? userInfo.FullName : '' ),
							user_username        : ( userInfo.Name ? userInfo.Name : '' ),
							user_email           : ( userInfo.Email ? userInfo.Email : '' ),
							user_language        : ( languages ? languages : '' ),
							user_setup           : ( setup ? setup : '' ),
							user_locked_toggle   : ( ulocked   ? 'fa-toggle-on' : 'fa-toggle-off' ),
							user_disabled_toggle : ( udisabled ? 'fa-toggle-on' : 'fa-toggle-off' ),
							theme_name           : ( settings.Theme ? settings.Theme : '' ),
							theme_dark           : ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ) ),
							theme_style          : ( themeData.buttonSchemeText == 'windows' ? 'Windows' : 'Mac' ),
							wallpaper_name       : ( workspaceSettings.wallpaperdoors ? workspaceSettings.wallpaperdoors.split( '/' )[workspaceSettings.wallpaperdoors.split( '/' ).length-1] : i18n( 'i18n_default' ) ),
							workspace_count      : ( workspaceSettings.workspacecount > 0 ? workspaceSettings.workspacecount : '1' ),
							system_disk_state    : ( workspaceSettings.hiddensystem ? i18n( 'i18n_enabled' ) : i18n( 'i18n_disabled' ) ),
							storage              : ( mlst ? mlst : '' ),
							workgroups           : ( wstr ? wstr : '' ),
							roles                : ( rstr ? rstr : '' ),
							applications         : ( apl ? apl : '' )
						};
						
						// Add translations
						d.i18n();
						d.onLoad = function( data )
						{
							
							onLoad( data );
							
						}
						d.load();
						
					}
					else
					{
						
						onLoad(  );
						
					}
					
					
				}
				
				
				
				// Run template
				
				template( first );
				
			}
			
			// TODO: CHANGE CODE LOGIC TO SHOW DATA ONCE THE FIRST CALL RETURNS AND THEN CONTINUE TO NEXT, INSTEAD OF WAITING FOR ALL ...
			
			// Run it all in the same time, except the first ...
			
			// Go through all data gathering until stop
			var loadingSlot = 0;
			var loadingInfo = {};
			var loadingList = [
				
				// 0 | Load userinfo
				function(  )
				{
					if( ge( 'UserDetails' ) )
					{
						ge( 'UserDetails' ).innerHTML = '';
					}
					
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
						console.log( 'userinfoget ', { e:e, d:userInfo } );
						if( e != 'ok' ) userInfo = '404';
						
						// TODO: Run avatar cached here ...
						
						userInfo.avatar = '/system.library/module/?module=system&command=getavatar&userid=' + userInfo.ID + ( userInfo.Image ? '&image=' + userInfo.Image : '' ) + '&width=256&height=256&authid=' + Application.authId;
						
						loadingInfo.userInfo = userInfo;
						
						console.log( '// 0 | Load userinfo' );
						
						initUsersDetails( loadingInfo, [  ], true );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
					}
					u.execute( 'userinfoget', { id: extra, mode: 'all', authid: Application.authId } );
				},
				
				// 3 | Get user's workgroups
				function(  )
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
						console.log( 'workgroups ', { e:e, d:d } );
						if( e != 'ok' ) wgroups = '404';
						loadingInfo.workgroups = wgroups;
						
						console.log( '// 3 | Get user\'s workgroups' );
						
						initUsersDetails( loadingInfo, [ 'workgroup' ] );
					}
					u.execute( 'workgroups', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 4 | Get user's roles
				function(  )
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
							loadingInfo.roles = uroles;
						}
						console.log( 'userroleget ', { e:e, d:uroles } );
						if( e != 'ok' ) loadingInfo.roles = '404';
						
						console.log( '// 4 | Get user\'s roles' );
						
						initUsersDetails( loadingInfo, [ 'role' ] );
					}
					u.execute( 'userroleget', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 5 | Get storage
				function(  )
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
						console.log( 'mountlist ', { e:e, d:(ul?ul:d) } );
						if( e != 'ok' ) ul = '404';
						loadingInfo.mountlist = ul;
						
						console.log( '// 5 | Get storage' );
						
						initUsersDetails( loadingInfo, [ 'storage' ] );
					}
					u.execute( 'mountlist', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 6 | Get user applications
				function(  )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						var apps = null;
					
						try
						{
							apps = JSON.parse( d );
						}
						catch( e )
						{
							apps = null;
						}
						console.log( 'listuserapplications ', { e:e, d:apps } );
						if( e != 'ok' ) apps = '404';
						loadingInfo.applications = apps;
						
						console.log( '// 6 | Get user applications' );
						
						initUsersDetails( loadingInfo, [ 'application', 'looknfeel' ] );
					}
					u.execute( 'listuserapplications', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 1 | Load user settings
				function(  )
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
						console.log( 'usersettings ', { e:e, d:settings } );
						if( e != 'ok' ) settings = '404';
						loadingInfo.settings = settings;
						
						console.log( '// 1 | Load user settings' );
						
						initUsersDetails( loadingInfo, [  ] );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
					}
					u.execute( 'usersettings', { userid: extra, authid: Application.authId } );
				},
				
				// 2 | Get more user settings
				function(  )
				{
					if( loadingInfo.settings && loadingInfo.settings.Theme )
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
						
							console.log( 'getsetting ', { e:e, d:workspacesettings } );
						
							if( e != 'ok' ) workspacesettings = '404';
							loadingInfo.workspaceSettings = workspacesettings;
							
							console.log( '// 2 | Get more user setting' );
							
							initUsersDetails( loadingInfo, [  ]/*, true*/ );
						}
						u.execute( 'getsetting', { settings: [ 
							/*'avatar', */'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
							'locale', 'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
							'focusmode', 'hiddensystem', 'workspacecount', 
							'scrolldesktopicons', 'wizardrun', 'themedata_' + loadingInfo.settings.Theme,
							'workspacemode'
						], userid: extra, authid: Application.authId } );
					}
					
					// Go to next in line ..., might not need to load the next ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 7 | init
				function(  )
				{
					console.log( '// 7 | init' );
					
					//initUsersDetails( loadingInfo );
				}
				
			];
			// Runs 0 the first in the array ...
			loadingList[ 0 ]();
			
			
			// TODO: Make a new type of more custom loop of functions ...
			
			
			
			return;
		}
	}
	
	var checkedGlobal = Application.checkAppPermission( 'PERM_USER_GLOBAL' );
	var checkedWorkgr = Application.checkAppPermission( 'PERM_USER_WORKGROUP' );
	
	function doListUsers( userList, clearFilter )
	{
		var o = ge( 'UserList' );
		
		if( !ge( 'ListUsersInner' ) )
		{
			o.innerHTML = '';
		}
		
		if( !ge( 'ListUsersInner' ) )
		{
			// Add the main heading
			( function( ol ) {
				var tr = document.createElement( 'div' );
				tr.className = 'HRow';
			
				var extr = '';
				if( clearFilter )
				{
					extr = '<button style="position: absolute; right: 0;" class="ButtonSmall IconButton IconSmall fa-remove"/>&nbsp;</button>';
				}
			
				/*tr.innerHTML = '\
					<div class="HContent20 FloatLeft">\
						<h2>' + i18n( 'i18n_users' ) + '</h2>\
					</div>\
					<div class="HContent70 FloatLeft Relative">\
						' + extr + '\
						<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_find_users' ) + '"/>\
					</div>\
					<div class="HContent10 FloatLeft TextRight">\
						<button id="AdminNewUserBtn" class="IconButton IconSmall fa-plus"></button>\
					</div>\
				';*/
				
				tr.innerHTML = '\
					<div class="HContent20 FloatLeft">\
						<h2>' + i18n( 'i18n_users' ) + '</h2>\
					</div>\
					<div class="HContent70 FloatLeft Relative">\
						' + extr + '\
						<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_find_users' ) + '"/>\
					</div>\
					<div class="HContent10 FloatLeft TextRight InActive">\
						<button id="AdminUsersBtn" class="IconButton IconSmall fa-bars"></button>\
						<div class="submenu_wrapper"><ul id="AdminUsersSubMenu"></ul></div>\
					</div>\
				';
					
				var inp = tr.getElementsByTagName( 'input' )[0];
				inp.onkeyup = function( e )
				{
					//if( e.which == 13 )
					//{
						filterUsers( this.value, true );
					//}
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
		}

		// Types of listed fields
		var types = {
			Edit: '10',
			FullName: '30',
			Name: '25',
			Status: '15',
			LoginTime: 20
		};

		// List by level
		var levels = [ 'Admin', 'User', 'Guest', 'API' ];
		
		var status = [ 'Active', 'Disabled', 'Locked' ];
		
		var login = [ 'Never' ];
		
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
			d.innerHTML = '<strong onclick="sortUsers(\''+z+'\')">' + ( z ? i18n( 'i18n_header_' + z ) : '' ) + '</strong>';
			headRow.appendChild( d );
		}
		
		var btn = ge( 'AdminUsersBtn' );
		if( btn )
		{
			btn.onclick = function( e )
			{
				SubMenu( this );
			}
		}
		
		var sm = ge( 'AdminUsersSubMenu' );
		if( sm && !sm.innerHTML )
		{
			
			var li = document.createElement( 'li' );
			li.innerHTML = i18n( 'i18n_new_user' );
			li.onclick = function( e )
			{
				// Language
				var availLangs = {
					'en' : 'English',
					'fr' : 'French',
					'no' : 'Norwegian',
					'fi' : 'Finnish',
					'pl' : 'Polish'
				};
				
				var languages = '';
				
				for( var a in availLangs )
				{
					languages += '<option value="' + a + '">' + availLangs[ a ] + '</option>';
				}
				
				// Setup / Template
				
				getSetupList( function( e, data )
				{
					
					var setup = '<option value="0">None</option>';
					
					if( e && data )
					{
						for( var s in data )
						{
							if( data[s] && data[s].ID )
							{
								setup += '<option value="' + data[s].ID + '">' + data[s].Name + '</option>';
							}
						}
					}
					
					var d = new File( 'Progdir:Templates/account_users_details.html' );
					// Add all data for the template
					d.replacements = {
						user_name            : '',
						user_fullname        : '',
						user_username        : '',
						user_email           : '',
						user_language        : languages,
						user_setup           : setup,
						user_locked_toggle   : 'fa-toggle-off',
						user_disabled_toggle : 'fa-toggle-off',
						theme_name           : '',
						theme_dark           : '',
						theme_style          : '',
						theme_preview        : '',
						wallpaper_name       : '',
						workspace_count      : '',
						system_disk_state    : '',
						storage              : '',
						workgroups           : '',
						roles                : '',
						applications         : ''
					};
				
					// Add translations
					d.i18n();
					d.onLoad = function( data )
					{
						ge( 'UserDetails'               ).innerHTML = data;
						//initStorageGraphs();
					
						ge( 'AdminStatusContainer'      ).style.display = 'none';
					
						ge( 'AdminLooknfeelContainer'   ).style.display = 'none';
						ge( 'AdminWorkgroupContainer'   ).style.display = 'none';
						ge( 'AdminRoleContainer'        ).style.display = 'none';
						ge( 'AdminStorageContainer'     ).style.display = 'none';
						ge( 'AdminApplicationContainer' ).style.display = 'none';
						
						// User
						
						var bg1  = ge( 'UserSaveBtn' );
						if( bg1 ) bg1.onclick = function( e )
						{
							saveUser(  );
						}
						var bg2  = ge( 'UserCancelBtn' );
						if( bg2 ) bg2.onclick = function( e )
						{
							cancelUser(  );
						}
						
						// Avatar 
					
						var ae = ge( 'AdminAvatarEdit' );
						if( ae ) ae.onclick = function( e )
						{
							changeAvatar();
						}
					
						var au = ge( 'usFullname' );
						if( au ) au.onblur = function( e )
						{
							if( this.value && this.value != this.fullname )
							{
							
								randomAvatar( this.value, function( avatar ) 
								{ 
									var canvas = ge( 'Avatar' ).toDataURL();
								
									console.log( 'canvas: ', canvas.length );
									console.log( 'avatar: ', avatar.length );
								
									if( ge( 'AdminAvatar' ) && avatar && canvas.length <= 15000 )
									{
										// Only update the avatar if it exists..
										var avSrc = new Image();
										avSrc.src = avatar;
										avSrc.onload = function()
										{
											var ctx = ge( 'AdminAvatar' ).getContext( '2d' );
											ctx.drawImage( avSrc, 0, 0, 256, 256 );
										}
									}
								
								} );
							
								this.fullname = this.value;
							}
						}
					
						// Responsive framework
						Friend.responsive.pageActive = ge( 'UserDetails' );
						Friend.responsive.reinit();
					}
					d.load();
					
				} );
				
				SubMenu( this.parentNode.parentNode );
			}
			sm.appendChild( li );
			
			var li = document.createElement( 'li' );
			li.className = 'show';
			li.innerHTML = i18n( 'i18n_show_disabled_users' );
			li.onclick = function( e )
			{
				if( this.className.indexOf( 'show' ) >= 0 )
				{
					hideStatus( 'Disabled', true );
					this.innerHTML = i18n( 'i18n_hide_disabled_users' );
					this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
				}
				else
				{
					hideStatus( 'Disabled', false );
					this.innerHTML = i18n( 'i18n_show_disabled_users' );
					this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
				}
				
				//SubMenu( this.parentNode.parentNode );
			}
			sm.appendChild( li );
			
			var li = document.createElement( 'li' );
			li.className = 'hide';
			li.innerHTML = i18n( 'i18n_hide_locked_users' );
			li.onclick = function( e )
			{
				if( this.className.indexOf( 'hide' ) >= 0 )
				{
					hideStatus( 'Locked', false );
					this.innerHTML = i18n( 'i18n_show_locked_users' );
					this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
				}
				else
				{
					hideStatus( 'Locked', true );
					this.innerHTML = i18n( 'i18n_hide_locked_users' );
					this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
				}
				
				//SubMenu( this.parentNode.parentNode );
			}
			sm.appendChild( li );
			
		}
		
		if( !ge( 'ListUsersInner' ) )
		{
			// Add header columns
			header.appendChild( headRow );
		}
		
		if( !ge( 'ListUsersInner' ) )
		{
			o.appendChild( header );
		}

		function setROnclick( r, uid )
		{
			r.onclick = function()
			{
				if( ge( 'ListUsersInner' ) )
				{
					var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
			
					if( list.length > 0 )
					{
						for( var a = 0; a < list.length; a++ )
						{
							if( list[a] && list[a].className && list[a].className.indexOf( ' Selected' ) >= 0 )
							{
								list[a].className = ( list[a].className.split( ' Selected' ).join( '' ) );
							}
						}
					}
				}
				
				this.className = ( this.className.split( ' Selected' ).join( '' ) + ' Selected' );
				
				Sections.accounts_users( 'edit', uid );
			}
		}
		
		var sortby  = ( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).getAttribute( 'sortby'  ) ? ge( 'ListUsersInner' ).getAttribute( 'sortby'  ) : 'FullName' );
		var orderby = ( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).getAttribute( 'orderby' ) ? ge( 'ListUsersInner' ).getAttribute( 'orderby' ) : 'ASC'      );
		
		var output = [];
		
		var wrapper = document.createElement( 'div' );
		wrapper.id = 'ListUsersWrapper';
		
		if( ge( 'ListUsersInner' ) )
		{
			var list = ge( 'ListUsersInner' );
		}
		else
		{
			var list = document.createElement( 'div' );
			list.className = 'List';
			list.id = 'ListUsersInner';
		}
		
		if( !ge( 'ListUsersInner' ) )
		{
			wrapper.appendChild( list );
		}
		
		if( !ge( 'ListUsersInner' ) )
		{
			o.appendChild( wrapper );
		}
		
		//o.appendChild( list );
		
		if( userList['Count'] )
		{ 
			Application.totalUserCount = /*5;*/userList['Count'];
		}
		
		console.log( 'Application.totalUserCount: ', Application.totalUserCount );
		//console.log( 'Application.WindowSize: ', Application.WindowSize );
		
		var sw = 2; var tot = 0;
		for( var b = 0; b < levels.length; b++ )
		{
			for( var a in userList )
			{
				if( !userList[ a ] ) continue;
				
				// Skip irrelevant level
				if( userList[ a ].Level != levels[ b ] ) continue;
				
				tot++;
				
				if( !ge( 'UserListID_'+userList[a].ID ) )
				{
					
					sw = sw == 2 ? 1 : 2;
					var r = document.createElement( 'div' );
					setROnclick( r, userList[a].ID );
					r.className = 'HRow sw' + sw + ' ' + status[ ( userList[ a ][ 'Status' ] ? userList[ a ][ 'Status' ] : 0 ) ];
					r.id = ( 'UserListID_'+userList[a].ID );
					
					var timestamp = ( userList[ a ][ 'LoginTime' ] ? userList[ a ][ 'LoginTime' ] : 0 );
					
					userList[ a ][ 'Status' ] = status[ ( userList[a][ 'Status' ] ? userList[a][ 'Status' ] : 0 ) ];
					
					userList[ a ][ 'LoginTime' ] = ( userList[a][ 'LoginTime' ] != 0 && userList[a][ 'LoginTime' ] != null ? CustomDateTime( userList[a][ 'LoginTime' ] ) : login[ 0 ] );
					
					var img = '/system.library/module/?module=system&command=getavatar&userid=' + userList[ a ].ID + ( userList[ a ].Image ? '&image=' + userList[ a ].Image : '' ) + '&width=30&height=30&authid=' + Application.authId;
					
					var bg = 'background-image: url(\'' + img + '\'); background-position: center center; background-size: contain; background-repeat: no-repeat; color: transparent;';
					
					userList[ a ][ 'Edit' ] = '<span '             + 
					'id="UserAvatar_' + userList[ a ].ID + '" '    + 
					'fullname="' + userList[ a ].FullName + '" '   + 
					'name="' + userList[ a ].Name + '" '           + 
					'status="' + userList[ a ].Status + '" '       + 
					'logintime="' + userList[ a ].LoginTime + '" ' + 
					'timestamp="' + timestamp + '" '               +
					'class="IconSmall fa-user-circle-o" '          + 
					'style="' + bg + '" '                          +
					'></span>';
					
					
					
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
						{
							borders += ' BorderBottom';
						}
						d.className += ' HContent' + types[ z ] + ' FloatLeft PaddingSmall Ellipsis' + borders;
						d.innerHTML = userList[a][ z ];
						r.appendChild( d );
					}
					
					
					
					if( userList[ a ][ sortby ] )
					{
						var obj = { 
							sortby  : userList[ a ][ sortby ].toLowerCase(), 
							object  : userList[ a ],
							content : r
						};
						
						output.push( obj );
					}
					
				}
				else
				{
					// Add to the field that is allready there ... But we also gotto consider sorting the list by default or defined sorting ...
					
					
				}
				
			}
		}
		
		if( output.length > 0 )
		{
			// Sort ASC default
			
			output.sort( ( a, b ) => ( a.sortby > b.sortby ) ? 1 : -1 );
			
			// Sort DESC
			
			if( orderby == 'DESC' ) 
			{ 
				output.reverse();  
			} 
			
			//console.log( 'sorting: ', { output: output, sortby: sortby, orderby: orderby } );
			
			var i = 0;
			
			for( var key in output )
			{
				if( output[key] && output[key].content && output[key].object )
				{
					i++;
					
					// Add row
					list.appendChild( output[key].content );
					
					/*if( output[key].object.ID )
					{
						if( ge( 'UserAvatar_' + output[key].object.ID ) )
						{
							var img = '/system.library/module/?module=system&command=getavatar&userid=' + output[key].object.ID + ( output[key].object.Image ? '&image=' + output[key].object.Image : '' ) + '&width=30&height=30&authid=' + Application.authId;
							
							ge( 'UserAvatar_' + output[key].object.ID ).style.backgroundImage = "url('"+img+"')";
							ge( 'UserAvatar_' + output[key].object.ID ).style.backgroundPosition = 'center';
							ge( 'UserAvatar_' + output[key].object.ID ).style.backgroundSize = 'contain';
							ge( 'UserAvatar_' + output[key].object.ID ).style.backgroundRepeat = 'no-repeat';
							ge( 'UserAvatar_' + output[key].object.ID ).style.color = 'transparent';
						}
					}*/
					
					// Set Avatar on delay basis because of having to do one by one user ...
					/*setAvatar( output[key].object.ID, output[key].content, function( res, userid, content, dat )
					{
						if( content )
						{
							// Add row
							//list.appendChild( content );
						}
						
						if( res )
						{
							if( ge( 'UserAvatar_' + userid ) )
							{
								ge( 'UserAvatar_' + userid ).style.backgroundImage = "url('"+dat+"')";
								ge( 'UserAvatar_' + userid ).style.backgroundPosition = 'center';
								ge( 'UserAvatar_' + userid ).style.backgroundSize = 'contain';
								ge( 'UserAvatar_' + userid ).style.backgroundRepeat = 'no-repeat';
								ge( 'UserAvatar_' + userid ).style.color = 'transparent';
							}
						}
					
					} );*/
				}
			}
			
			var total = 0;
			
			if( list.innerHTML )
			{
				var spans = list.getElementsByTagName( 'span' );
				
				if( spans )
				{
					total = spans.length;
					
					if( total > UsersSettings( 'listed' ) )
					{
						UsersSettings( 'listed', total );
					}
				}
			}
			
			
			
			console.log( 'new users added to list: ' + i + '/' + tot + ' total ['+total+']' );
			
			
			if( !UsersSettings( 'total' ) )
			{
				UsersSettings( 'total', Application.totalUserCount );
			}
			
			if( Application.totalUserCount > tot )
			{
				var divh = ge( 'ListUsersInner' ).getElementsByTagName( 'div' )[0].clientHeight;
				
				if( divh > 0 && UsersSettings( 'divh' ) != divh )
				{
					console.log( 'first div height: ' + divh );
					
					UsersSettings( 'divh', divh );
					
					//CheckUserlistSize( divh );
					
					/*var minusers = CheckUserlistSize( divh );
				
					if( UsersSettings( 'maxlimit' ) < minusers )
					{
						UsersSettings( 'maxlimit', minusers );
					
						console.log( 'MaxLimit is: ' + UsersSettings( 'maxlimit' ) );
					
						console.log( 'Running Sections.accounts_users(); again ...' );
					
						Sections.accounts_users();
					}
					else
					{
						//console.log( "UsersSettings( 'limit', true ) ", UsersSettings( 'limit', true ) );
					}*/
				}
				
				//ge( 'ListUsersInner' ).getElementsByTagName( 'div' )[0].style.border = '1px solid blue';
			
				//ge( 'ListUsersWrapper' ).style.height = ( divh * Application.totalUserCount ) + 'px';
			
				//console.log( ge( 'ListUsersWrapper' ).style.height );
				
				
				
				//CheckUserlistSize( i, Application.totalUserCount );
				
				//RunRequestQueue();
			}
			
			hideStatus( 'Disabled', false );
			
			sortUsers( UsersSettings( 'sortby' ), UsersSettings( 'orderby' ) );
		}
		
		// Moved to top instead ...
		//o.appendChild( list );
		
		Friend.responsive.pageActive = ge( 'UserList' );
		Friend.responsive.reinit();
		
		if( ge( 'ListUsersInner' ) )
		{
			ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby );
			ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
			ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
		}
		
	}
	
	function editMode()
	{
		console.log( 'editMode() ' );
		
		if( ge( 'UserEditContainer' ) )
		{
			ge( 'UserEditContainer' ).className = 'Open';
		}
	}
	
	function toggleChangePass()
	{
		if( ge( 'ChangePassContainer' ) && ge( 'ResetPassContainer' ) )
		{
			ge( 'ChangePassContainer' ).className = 'Open';
			ge( 'ResetPassContainer'  ).className = 'Closed';
			
			if( ge( 'usPassword' ) )
			{
				ge( 'usPassword' ).focus();
			}
		}
	}
	
	function getSetupList( callback )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( 'getSetupList', { e:e, d:d } );
			if( e != 'ok' )
			{
				if( callback ) return callback( false );
			}
			var rows = '';
			try
			{
				rows = JSON.parse( d );
			} 
			catch( e ) {  }
			
			if( callback ) return callback( true, rows );
		}
		m.execute( 'usersetup' );
	}
	
	function setAvatar( userid, content, callback )
	{
		// TODO: Implement support for imageid hash to be sent to the server for cach check
		
		if( userid )
		{
			var u = new Module( 'system' );
			u.onExecuted = function( e, d )
			{
				var out = null;
				try
				{
					out = JSON.parse( d );
				}
				catch( e ) {  }
				//console.log( 'getsetting ', { e:e, d:out } );
				if( callback )
				{
					callback( ( out ? true : false ), userid, content, ( out && out.avatar ? out.avatar : false ) );
				}
			}
			u.execute( 'getsetting', { setting: 'avatar', userid: userid, authid: Application.authId } );
		}
	}
	
	function randomAvatar( fullname, callback )
	{
		if( fullname )
		{
			var u = new Module( 'system' );
			u.onExecuted = function( e, d )
			{
				var out = null;
				try
				{
					out = JSON.parse( d );
				}
				catch( e ) {  }
				
				if( callback )
				{
					callback( out && out.avatar ? out.avatar : false );
				}
			}
			u.execute( 'getsetting', { setting: 'avatar', fullname: fullname, read: 'only', authid: Application.authId } );
		}
	}
	
	function changeAvatar()
	{
		var self = this;
		var description =
		{
			triggerFunction: function( item )
			{
				if ( item )
				{
					// Load the image
					var image = new Image();
					image.onload = function()
					{
						console.log( 'loaded image ... ', item );
						// Resizes the image
						var canvas = ge( 'AdminAvatar' );
						var context = canvas.getContext( '2d' );
						context.drawImage( image, 0, 0, 256, 256 );
					}
					image.src = getImageUrl( item[ 0 ].Path );
				}
			},
			path: "Mountlist:",
			type: "load",
			title: i18n( 'i18n_fileselectoravatar' ),
			filename: ""
		}
		var d = new Filedialog( description );
	}
	
	function hideStatus( status, show )
	{
		if( status && ge( 'ListUsersInner' ) )
		{
			var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
			
			if( list.length > 0 )
			{
				for( var a = 0; a < list.length; a++ )
				{
					if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
					
					var span = list[a].getElementsByTagName( 'span' )[0];
					
					if( span )
					{
						if( span.getAttribute( 'status' ).toLowerCase() == status.toLowerCase() )
						{
							if( show )
							{
								list[a].style.display = '';
							}
							else
							{
								list[a].style.display = 'none';
							}
						}
					}
				}
			}
		}
	}
	
	function filterUsers( filter, server )
	{
		if( !filter )
		{
			UsersSettings( 'searchquery', filter );
		}
		
		if( /*!server && */ge( 'ListUsersInner' ) )
		{
			var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
			if( list.length > 0 )
			{
				for( var a = 0; a < list.length; a++ )
				{
					if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
					
					var span = list[a].getElementsByTagName( 'span' )[0];
					
					if( span )
					{
						if( !filter || filter == ''  
						|| span.getAttribute( 'fullname' ).toLowerCase().substr( 0, filter.length ) == filter.toLowerCase()
						|| span.getAttribute( 'name' ).toLowerCase().substr( 0, filter.length ) == filter.toLowerCase()
						)
						{
							list[a].style.display = '';
						}
						else
						{
							list[a].style.display = 'none';
						}
					}
				}
				
				hideStatus( 'Disabled', false );
			}
		}
		
		// TODO: Fix server search query when building the search list more advanced with listout limit ...
		
		if( filter.length < 3 || filter.length < UsersSettings( 'searchquery' ).length || filter == UsersSettings( 'searchquery' ) || !server ) return;
		
		UsersSettings( 'searchquery', filter );
		
		//console.log( filter.length );
		
		
		
		SetRequestQueue( function( filter, callback, key )
		{
			console.log( filter + ' < ' + UsersSettings( 'searchquery' ) );
			
			if( filter.length < UsersSettings( 'searchquery' ).length )
			{
				if( callback ) callback( key );
				
				return;
			}
			
			var args = { 
				query   : UsersSettings( 'searchquery' ), 
				sortby  : UsersSettings( 'sortby'      ), 
				orderby : UsersSettings( 'orderby'     ), 
				limit   : UsersSettings( 'limit'       ), 
				count   : true, 
				authid  : Application.authId 
			};
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				
				if( callback ) callback( key );
				
				var userList = null;
			
				try
				{
					userList = JSON.parse( d );
					console.log( { e:e, d:(userList?userList:d), args:args } );
				}
				catch( e )
				{
					console.log( { e:e, d:d, args:args } );
					return;
				}
			
				//doListUsers( userList, filter ? filter : false );
				doListUsers( userList );
			}
			/*if( filter )
			{
				m.execute( 'listusers', { query: filter, authid: Application.authId } );
			}
			else
			{*/
				//m.execute( 'listusers', { authid: Application.authId } );
			
				m.execute( 'listusers', args );
			/*}*/
			
		}, filter );
	}
	
	
	
	if( checkedGlobal || checkedWorkgr )
	{
		// Get correct estimate of how many users fit into the window area ...
		
		CheckUserlistSize( true );
		
		/*console.log( 'divh: ', UsersSettings( 'divh' ) );
		
		var minusers = CheckUserlistSize( UsersSettings( 'divh' ) );
		
		console.log( 'minusers: ' + minusers );
		
		if( UsersSettings( 'maxlimit' ) < minusers )
		{
			UsersSettings( 'maxlimit', minusers );
		
			console.log( 'MaxLimit is: ' + UsersSettings( 'maxlimit' ) );
		}*/
		
		var args = { 
			query   : UsersSettings( 'searchquery' ),
			sortby  : UsersSettings( 'sortby'      ), 
			orderby : UsersSettings( 'orderby'     ), 
			limit   : UsersSettings( 'limit'       ), 
			count   : true, 
			authid  : Application.authId 
		};
		
		// TODO: For optimizing at a later point estimate added new rows and fill them once data return to speed up the scrolling ...
		
		// Get the user list
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{	
			
			
			var userList = null;
			
			try
			{
				userList = JSON.parse( d );
				
				console.log( { e:e, d:(userList?userList:d), args:args } );
			}
			catch( e )
			{
				console.log( { e:e, d:d, args:args } );
				
				return;
			}
			
			doListUsers( userList );
		}
		m.execute( 'listusers', args );
		
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

function SubMenu( _this )
{
	if( _this.parentNode.className.indexOf( ' InActive' ) >= 0 )
	{
		_this.parentNode.className = _this.parentNode.className.split( ' InActive' ).join( '' ).split( ' Active' ).join( '' ) + ' Active';
	}
	else
	{
		_this.parentNode.className = _this.parentNode.className.split( ' InActive' ).join( '' ).split( ' Active' ).join( '' ) + ' InActive';
	}
}

function sortUsers( sortby, orderby )
{
	if( sortby && ge( 'ListUsersInner' ) )
	{
		var output = [];
		
		var custom = { 
			'Status' : { 
				'ASC'  : { 'Locked' : 0, 'Active' : 1, 'Disabled' : 2 }, 
				'DESC' : { 'Locked' : 0, 'Disabled' : 1, 'Active' : 2 } 
			},
			'LoginTime' : 'timestamp' 
		};
		
		if( !orderby )
		{
			if( ge( 'ListUsersInner' ).className.indexOf( ' ' + sortby + ' ASC' ) >= 0 )
			{
				orderby = 'DESC';
			
				ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby );
				ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
				ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
			}
			else
			{
				orderby = 'ASC';
			
				ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby );
				ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
				ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
			}
		}
		
		var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
		
		var override = false;
		
		if( custom[ sortby ] && sortby == 'LoginTime' )
		{
			sortby = custom[ sortby ];
			orderby = ( orderby == 'ASC' ? 'DESC' : 'ASC' ); 
			
			// TODO: Find out how to specifically sort by the custom sortorder of Status ...
		}
		else if( custom[ sortby ] && custom[ sortby ][ orderby ] && sortby == 'Status' )
		{
			callback = ( function ( a, b ) { return ( custom[ sortby ][ orderby ][ a.sortby ] - custom[ sortby ][ orderby ][ b.sortby ] ); } );
			
			//console.log( custom[ sortby ][ orderby ] );
			
			override = true;
		}
		
		var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
		if( list.length > 0 )
		{
			for( var a = 0; a < list.length; a++ )
			{
				if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
				var span = list[a].getElementsByTagName( 'span' )[0];
				
				if( span && span.getAttribute( sortby.toLowerCase() ) )
				{
					var obj = { 
						sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
						content : list[a]
					};
					
					output.push( obj );
				}
			}
			
			if( output.length > 0 )
			{
				// Sort ASC default
				
				output.sort( callback );
				
				// Sort DESC
		
				if( !override && orderby == 'DESC' ) 
				{ 
					output.reverse();  
				} 
				
				//console.log( 'sortUsers('+sortby+'): ', { output: output, sortby: sortby, orderby: orderby } );
				
				// TODO: Make support for sortby Status and Timestamp on the server levels aswell ...
				
				if( UsersSettings( 'sortby') != sortby || UsersSettings( 'orderby' ) != orderby )
				{
					UsersSettings( 'startlimit', 0 );
				
					if( [ 'FullName', 'Name' ].indexOf( sortby ) >= 0 )
					{
						UsersSettings( 'sortby', sortby );
						UsersSettings( 'orderby', orderby );
					}
					else
					{
						UsersSettings( 'sortby', 'FullName' );
						UsersSettings( 'orderby', orderby );
					}
				}
				
				ge( 'ListUsersInner' ).innerHTML = '';
				
				for( var key in output )
				{
					if( output[key] && output[key].content )
					{
						// Add row
						ge( 'ListUsersInner' ).appendChild( output[key].content );
					}
				}
				
			}
		}
	}
}

function CheckUserlistSize( firstrun )
{
	
	// If first run then reset list so we get first list of users ...
	//if( firstrun && UsersSettings( 'startlimit' ) > 0 )
	//{
		//console.log( 'UsersSettings( "reset", true );' );
		//UsersSettings( 'reset', true );
	//}
	
	var scrollbox = ge( 'UserList' );
	var container = ge( 'ListUsersInner' );
	var wrapper   = ge( 'ListUsersWrapper' );
	
	//console.log( 'CheckUserlistSize( '+firstrun+' ) ', { scrollbox: scrollbox, container: container, wrapper: wrapper } );
	
	if( scrollbox )
	{
		var m = 85;
		
		// Check scrollarea ...
		
		if( ( scrollbox.scrollHeight - scrollbox.clientHeight ) > 0 )
		{
			var pos = Math.round( scrollbox.scrollTop / ( scrollbox.scrollHeight - scrollbox.clientHeight ) * 100 );
			
			// If scrolled area is more then 50% prosentage
			
			if( pos && pos >= 50 )
			{
				if( UsersSettings( 'total' ) > 0 && ( UsersSettings( 'listed' ) == UsersSettings( 'total' ) ) )
				{
					wrapper.style.minHeight = 'auto';
				}
				else if( container.clientHeight >= wrapper.clientHeight )
				{
					//console.log( 'Scrollpos is ... ' + pos );
										
					wrapper.style.minHeight = ( container.clientHeight + scrollbox.clientHeight ) + 'px';
					
					//console.log( 'container: ' + ( container.clientHeight + m ) + ' > scrollbox: ' + scrollbox.clientHeight + ' Wrapper height: ' + wrapper.style.minHeight );
					
					UsersSettings( 'limit', true );
					
					console.log( 'GETTING SERVER DATA ... ' + UsersSettings( 'limit' ) ); 
						
					Sections.accounts_users();
				}
			}
		}
		
		//console.log( 'container: ' + container.clientHeight + ' > scrollbox: ' + scrollbox.clientHeight );
		
		if( container && ( container.clientHeight + m ) > scrollbox.clientHeight )
		{
			if( container.clientHeight >= wrapper.clientHeight )
			{
				//wrapper.style.minHeight = ( container.clientHeight + scrollbox.clientHeight ) + 'px';
				
				//console.log( 'container: ' + ( container.clientHeight + m ) + ' > scrollbox: ' + scrollbox.clientHeight + ' Wrapper height: ' + wrapper.style.minHeight );
			}
		}
		else if( container && ( container.clientHeight + m ) < scrollbox.clientHeight )
		{
			if( wrapper.clientHeight > container.clientHeight )
			{
				//wrapper.style.minHeight = 'auto';
				
				//console.log( wrapper.style.minHeight );
			}
		}
		
		var divh = UsersSettings( 'divh' );
		
		//console.log( UsersSettings( 'listed' ) + ' != ' + UsersSettings( 'total' ) );
		
		if( divh && ( !UsersSettings( 'total' ) || ( UsersSettings( 'listed' ) != UsersSettings( 'total' ) ) ) )
		{
			//return Math.floor( ( scrollbox.clientHeight - m ) / divh );
			
			var minusers = Math.floor( ( scrollbox.clientHeight - m ) / divh );
			
			if( UsersSettings( 'maxlimit' ) < ( minusers * 1.5 ) )
			{
				//console.log( ( scrollbox.clientHeight - m ) + ' vs ' + Math.floor( ( scrollbox.clientHeight - m ) / divh ) );
				
				//console.log( 'minusers: ' + minusers );
				
				// Set double max limit so that it fills beyond the minimum
				
				UsersSettings( 'maxlimit', ( minusers * 2 ) );
		
				//console.log( 'MaxLimit is: ' + UsersSettings( 'maxlimit' ) );
				
				// TODO: Move some of this into a queue so it doesn't set the limit faster then the server can get new data ...
				
				if( !firstrun )
				{
					//SetRequestQueue( function() {
						
						console.log( 'GETTING SERVER DATA ... ' + UsersSettings( 'limit' ) ); 
						
						Sections.accounts_users(); 
						
					//} );
				}
			}
		}
	}
}

var RequestQueue = {
	
	ServerRequestQueue : [], 
	
	Set : function ( func, obj )
	{
		if( !this.ServerRequestQueue.length )
		{
			this.ServerRequestQueue.push( { obj: obj, func: func } );
			
			this.Run();
		}
		else
		{
			this.ServerRequestQueue.push( { obj: obj, func: func } );
		}
	},
	
	Run : function (  )
	{
		if( this.ServerRequestQueue )
		{
			for( var key in this.ServerRequestQueue )
			{
				if( this.ServerRequestQueue[key] && this.ServerRequestQueue[key].func )
				{
					console.log( "ServerRequestQueue["+key+"].func( obj, callback );" );
					
					var _this = this;
					
					this.ServerRequestQueue[key].key = key;
					
					this.ServerRequestQueue[key].func( this.ServerRequestQueue[key].obj, function( key )
					{
						if( _this.ServerRequestQueue[key] )
						{
							delete _this.ServerRequestQueue[key];
						}
						
						_this.Run();
						
					}, key );
					
					if( this.ServerRequestQueue[key] )
					{
						delete this.ServerRequestQueue[key];
					}
					
					return;
				}
			}
		}
	}
	
}

function SetRequestQueue( func, obj )
{
	RequestQueue.Set( func, obj );
}



Sections.user_status_update = function( userid, status )
{
	
	if( userid && status )
	{
		// 0 = Active, 1 = Disabled, 2 = Locked
		
		var on = false;
		
		switch( status )
		{
			// false = Active, true = Disabled
			
			case 1:
				
				if( ge( 'usDisabled' ).className.indexOf( 'fa-toggle-off' ) >= 0 )
				{
					on = true;
				}
				
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( 'Sections.user_status_update( '+userid+', '+status+' ) ', { e:e, d:d } );
					
					if( e == 'ok' )
					{
						Toggle( ge( 'usDisabled' ), false, ( on ? true : false ) );
						Toggle( ge( 'usLocked'   ), false, false );
					}
				}
				f.execute( 'user/updatestatus', { id: userid, status: ( on ? 1 : 0 ) } );
				
				break;
			
			// false = Active, true = Locked
			
			case 2:
				
				if( ge( 'usLocked' ).className.indexOf( 'fa-toggle-off' ) >= 0 )
				{
					on = true;
				}
				
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( 'Sections.user_status_update( '+userid+', '+status+' ) ', { e:e, d:d } );
					
					if( e == 'ok' )
					{
						Toggle( ge( 'usLocked'   ), false, ( on ? true : false ) );
						Toggle( ge( 'usDisabled' ), false, false );
					}
				}
				f.execute( 'user/updatestatus', { id: userid, status: ( on ? 2 : 0 ) } );
				
				break;
			
		}
	}
	
}

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
		m.execute( 'userroleupdate', { id: rid, userid: userid, data: data, authid: Application.authId } );
	}
};

Sections.user_disk_save = function( userid, did )
{
	//console.log( 'Sections.user_disk_save ', { did : did, userid : userid } );
	
	var elems = {};
			
	var inputs = ge( 'StorageGui' ).getElementsByTagName( 'input' );
	
	if( inputs.length > 0 )
	{
		for( var i in inputs )
		{
			if( inputs[i] && inputs[i].id )
			{
				elems[inputs[i].id] = inputs[i];
			}
		}
	}
	
	var texts = ge( 'StorageGui' ).getElementsByTagName( 'textarea' );
	
	if( texts.length > 0 )
	{
		for( var t in texts )
		{
			if( texts[t] && texts[t].id )
			{
				elems[texts[t].id] = texts[t];
			}
		}
	}
	
	var selects = ge( 'StorageGui' ).getElementsByTagName( 'select' );
	
	if( selects.length > 0 )
	{
		for( var s in selects )
		{
			if( selects[s] && selects[s].id )
			{
				elems[selects[s].id] = selects[s];
			}
		}
	}
	
	//console.log( { userid: userid, elems: elems } );
	
	if( userid && elems )
	{
		
		// New way of setting DiskSize so overwrite old method ...
		
		if( elems[ 'DiskSizeA' ] && elems[ 'DiskSizeA' ].value && elems[ 'DiskSizeB' ] && elems[ 'DiskSizeB' ].value )
		{
			elems[ 'conf.DiskSize' ] = { id: 'conf.DiskSize', value: ( elems[ 'DiskSizeA' ].value + elems[ 'DiskSizeB' ].value ) };
		}
		
		var req = { 'Name' : i18n( 'i18n_disk_name_missing' ), 'Type' : i18n( 'i18n_disk_type_missing' ) };
		
		for( var r in req )
		{
			if( elems[r] && !elems[r].value )
			{
				elems[r].focus();
				
				Notify( { title: i18n( 'i18n_disk_error' ), text: req[r] } );
				
				return;
			}
		}
		
		var data = { userid: userid, Name: elems[ 'Name' ].value };
		
		if( elems[ 'Server'           ] ) data.Server           = elems[ 'Server'           ].value;
		if( elems[ 'ShortDescription' ] ) data.ShortDescription = elems[ 'ShortDescription' ].value;
		if( elems[ 'Port'             ] ) data.Port             = elems[ 'Port'             ].value;
		if( elems[ 'Username'         ] ) data.Username         = elems[ 'Username'         ].value;
		// Have password and password is not dummy
		if( elems[ 'Password' ] && elems[ 'Password' ].value != '********' )
		{
			data.Password = elems[ 'Password' ].value;
		}
		// Have hashed password and password is not dummy
		else if( elems[ 'HashedPassword' ] && elems[ 'HashedPassword' ].value != '********' )
		{
			data.Password = 'HASHED' + Sha256.hash( elems[ 'HashedPassword' ].value );
		}
		if( elems[ 'Path'          ] ) data.Path      = elems[ 'Path'      ].value;
		if( elems[ 'Type'          ] ) data.Type      = elems[ 'Type'      ].value;
		if( elems[ 'Workgroup'     ] ) data.Workgroup = elems[ 'Workgroup' ].value;
		if( elems[ 'conf.Pollable' ] )
		{
			data.Pollable = elems[ 'conf.Pollable' ].checked ? 'yes' : 'no';
			elems[ 'conf.Pollable' ].value = elems[ 'conf.Pollable' ].checked ? 'yes' : 'no';
		}
		if( elems[ 'conf.Invisible' ] )
		{
			data.Invisible = elems[ 'conf.Invisible' ].checked ? 'yes' : 'no';
			elems[ 'conf.Invisible' ].value = elems[ 'conf.Invisible' ].checked ? 'yes' : 'no';
		}
		if( elems[ 'conf.Executable' ] )
			data.Invisible = elems[ 'conf.Executable' ].value;
	
		if( elems[ 'PrivateKey'      ] )
		{
			data.PrivateKey = elems[ 'PrivateKey' ].value;
		}
		if( elems[ 'EncryptedKey'    ] )
		{
			data.EncryptedKey = elems[ 'EncryptedKey' ].value;
		}
		
		// Custom fields
		for( var a in elems )
		{
			if( elems[a] && elems[a].id.substr( 0, 5 ) == 'conf.' )
			{
				data[elems[a].id] = elems[a].value;
			}
		}
		
		console.log( data );
		
		//return;
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			if( e != 'ok' ) 
			{
				Notify( { title: i18n( 'i18n_disk_error' ), text: i18n( 'i18n_failed_to_edit' ) } );
				return;
			}
			else
			{
				Notify( { title: i18n( 'i18n_disk_success' ), text: i18n( 'i18n_disk_edited' ) } );
			}
			remountDrive( data.Name, data.userid, function()
			{
				
				var u = new Module( 'system' );
				u.onExecuted = function( ee, dd )
				{
					var ul = null;
					try
					{
						ul = JSON.parse( dd );
					}
					catch( ee )
					{
						ul = null;
					}
				
					ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid );
				
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
				}
				u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
			
			} );
		}
		
		// TODO: Make sure we save for the selected user and not the loggedin user ...
		
		data.authid = Application.authId;
		
		// Edit?
		if( did > 0 )
		{
			data.ID = did;
			
			m.execute( 'editfilesystem', data );
		}
		// Add new...
		else
		{
			m.execute( 'addfilesystem', data );
		}
		
	}
	
};

Sections.user_disk_cancel = function( userid )
{
	//console.log( 'Sections.user_disk_cancel ' + userid );
	
	var u = new Module( 'system' );
	u.onExecuted = function( e, d )
	{
		var ul = null;
		try
		{
			ul = JSON.parse( d );
		}
		catch( e )
		{
			ul = null;
		}
		
		ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid );
	}
	u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
	
};

Sections.user_disk_remove = function( devname, did, userid )
{
	//console.log( 'Sections.user_disk_remove ', { devname : devname, did: did, userid: userid } );
	
	if( devname && did && userid )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove' ), function( r )
		{
			if( r && r.data == true )
			{
				// This is the hard delete method, used by admins ...
				
				unmountDrive( devname, userid, function()
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						console.log( 'deletedoor', { id:did, e:e, d:d } );
						
						if( e == 'ok' )
						{
						
							var u = new Module( 'system' );
							u.onExecuted = function( ee, dd )
							{
								var ul = null;
								try
								{
									ul = JSON.parse( dd );
								}
								catch( ee )
								{
									ul = null;
								}
							
								ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid );
							}
							u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
						
							return;
						}
						try
						{
							var r = JSON.parse( d );						
							Notify( { title: 'An error occured', text: r.message } );
						}
						catch( e )
						{
							Notify( { title: 'An error occured', text: 'Could not delete this disk.' } );
						}
						return;
					
					}
					m.execute( 'deletedoor', { id: did, userid: userid, authid: Application.authId } );
					
				} );
				
			}
		} );
	}
};

// TODO: Evaluate Disk Editing Design and check what features are missing / removed based on the old app "DiskCatalog" EncryptionKey, Network Visibility, Show on Desktop, JSX Executable, Disk Cover is not included in the new design ...

Sections.user_disk_update = function( user, did = 0, name = '', userid )
{
	//console.log( { name: name, did: did } );
	
	if( user && userid )
	{
		var n = new Module( 'system' );
		n.onExecuted = function( ee, dat )
		{
			console.log( { e:ee, d:dat } );
			
			try
			{
				var da = JSON.parse( dat );
			}
			catch( e )
			{
				var da = {};
			}
			
			if( !da.length ) return;
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( 'user_disk_update ', { e:e, d:d } );
				
				var storage = { id : '', name : '', type : '', size : 512, user : user };
			
				var units = [ 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
		
				if( e == 'ok' )
				{
					try
					{
						var js = JSON.parse( d );
					}
					catch( e )
					{
						js = {};
					}
			
					if( js )
					{
						try
						{
							js.Config = JSON.parse( js.Config );
						}
						catch( e )
						{
							js.Config = {};
						}
				
						// Calculate disk usage
						var size = ( js.Config.DiskSize ? js.Config.DiskSize : 0 );
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
						var used = parseInt( js.StoredBytes );
						if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
						if( !used && !size ) used = 0, size = 0;
						if( !size ) size = 536870912;
						if( !used ) used = 0;
						if( used > size || ( used && !size ) ) size = used;
				
						storage = {
							id   : js.ID,
							user : js.UserID,
							name : js.Name,
							type : js.Type,
							size : size, 
							used : used, 
							free : ( size - used ), 
							prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
							icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
							mont : js.Mounted,
							data : js
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
					}
				}
			
				StorageForm( storage, function( storage )
				{
				
					var str = '';
				
					str += '<div class="HRow">';
					str += '<div class="Col1 FloatLeft">';
			
					str += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
			
					str += '</div><div class="Col2 FloatLeft">';
			
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_name' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent70 FloatLeft Ellipsis">';
					str += '<input type="text" class="FullWidth" id="Name" value="' + storage.name + '" placeholder="Mydisk"/>';
					str += '</div>';
					str += '</div>';
		
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_type' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent70 FloatLeft Ellipsis">';
					str += '<select class="FullWidth" id="Type" onchange="LoadDOSDriverGUI(this)"' + ( storage.id ? ' disabled="disabled"' : '' ) + '>';
					
					console.log( 'StorageForm ', storage );
					
					if( da )
					{
						var found = false;
						
						for( var i in da )
						{
							if( da[i].type )
							{
								str += '<option value="' + da[i].type + '"' + ( storage.type == da[i].type ? ' selected="selected"' : '' ) + '>' + i18n( 'i18n_' + da[i].type ) + '</option>';
								
								if( storage.type == da[i].type )
								{
									found = true;
								}
							}
						}
						
						if( storage.id && !found )
						{
							str  = '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_disks_access_denied' ) + '</div></div>';
							str += '<div class="HRow PaddingTop"><button class="IconSmall FloatRight MarginLeft" onclick="Sections.user_disk_cancel(' + userid + ')">Cancel</button></div>';
							
							return ge( 'StorageGui' ).innerHTML = str;
						}
					}
			
					str += '</select>';
					str += '</div>';
					str += '</div>';
		
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_size' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent35 FloatLeft Ellipsis PaddingRight">';
					str += '<input type="text" class="FullWidth" id="DiskSizeA" value="' + FormatBytes( storage.size, 0, 0 ) + '" placeholder="512"/>';
					str += '</div>';
					str += '<div class="HContent35 FloatLeft Ellipsis PaddingLeft">';
					str += '<select class="FullWidth" id="DiskSizeB">';
				
					if( units )
					{
						for( var a in units )
						{
							str += '<option' + ( storage.size && FormatBytes( storage.size, 0, 2 ) == units[a] ? ' selected="selected"' : '' ) + '>' + units[a] + '</option>';
						}
					}
			
					str += '</select>';
					str += '</div>';
					str += '</div>';
			
					// Insert Gui based on DosDriver
				
					str += '<div id="DosDriverGui"></div>';
				
					str += '</div>';
					
					str += '<div class="HRow PaddingTop">';
					str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.user_disk_save(' + storage.user + ',\'' + storage.id + '\')">Save</button>';
					str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.user_disk_cancel(' + userid + ')">Cancel</button>';
					
					if( storage.id )
					{
						str += '<button class="IconSmall Danger FloatRight MarginLeft" onclick="Sections.user_disk_remove(\'' + storage.name + '\',' + storage.id + ',' + storage.user + ')">Remove disk</button>';
						str += '<button class="IconSmall FloatLeft MarginRight" onclick="Sections.user_disk_mount(\'' + storage.name + '\',' + storage.user + ',this)">' + ( storage.mont > 0 ? 'Unmount disk' : 'Mount disk' ) + '</button>';
					}
					
					str += '</div>';
				
					str += '</div>';
			
					ge( 'StorageGui' ).innerHTML = str;
				
					//console.log( { e:e, d:(js?js:d) } );
				
				} );
			}
		
			// TODO: Update userid to be selected user ...
		
			m.execute( 'filesystem', {
				userid: user,
				devname: name, 
				authid: Application.authId
			} );
			
		}
		n.execute( 'types', { mode: 'all', userid: user, authid: Application.authId } );
	}
};

Sections.user_disk_refresh = function( mountlist, userid )
{
	// Mountlist
	var mlst = '';
	if( mountlist && mountlist.length )
	{
		var sorted = {};
		
		for( var a = 0; a < mountlist.length; a++ )
		{
			if( mountlist[a].Mounted <= 0 )
			{
				sorted['1000'+a] = mountlist[a];
			}
			else
			{
				sorted[a] = mountlist[a];
			}
		}
		
		if( sorted )
		{
			mountlist = sorted;
		}
		
		console.log( 'mountlist ', { mountlist: mountlist, userid: userid } );
		
		mlst += '<div class="HRow">';
		for( var b in mountlist )
		{
			if( mountlist[b] && !mountlist[b].ID ) continue;
			
			try
			{
				mountlist[b].Config = JSON.parse( mountlist[b].Config );
			}
			catch( e )
			{
				mountlist[b].Config = {};
			}
			
			// Return access denied if the list is only the logged in Users disks
			if( userid && userid != mountlist[b].UserID )
			{
				// Skip if user doesn't have access to this disk ...
				//continue;
				console.log( '['+mountlist[b].ID+']['+mountlist[b].Type+'] '+mountlist[b].Name+' has another owner id:'+mountlist[b].UserID );
				//return '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_disks_access_denied' ) + '</div></div>';
			}
			
			// Skip the IsDeleted disks for now ...
			//if( mountlist[b] && mountlist[b].Mounted < 0 ) continue;
			
			//console.log( mountlist[b] );
			
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
				user : mountlist[b].UserID,
				name : mountlist[b].Name,
				type : mountlist[b].Type,
				size : size, 
				used : used, 
				free : ( size - used ), 
				prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
				icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
				mont : mountlist[b].Mounted
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
			
			console.log( storage );
			
			mlst += '<div class="HContent33 FloatLeft DiskContainer"' + ( mountlist[b].Mounted <= 0 ? ' style="opacity:0.6"' : '' ) + '>';
			mlst += '<div class="PaddingSmall Ellipsis" onclick="Sections.user_disk_update(' + storage.user + ',' + storage.id + ',\'' + storage.name + '\',' + userid + ')">';
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
	
	return mlst;
};

Sections.user_disk_mount = function( devname, userid, _this )
{
	if( devname && userid && _this )
	{
		if( _this.innerHTML.toLowerCase().indexOf( 'unmount' ) >= 0 )
		{
			unmountDrive( devname, userid, function( e, d )
			{
				console.log( 'unmountDrive( '+devname+', '+userid+' ) ', { e:e, d:d } );
				
				if( e == 'ok' )
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					Notify( { title: i18n( 'i18n_unmounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_unmounted' ) } );
					
					var u = new Module( 'system' );
					u.onExecuted = function( ee, dd )
					{
						var ul = null;
						try
						{
							ul = JSON.parse( dd );
						}
						catch( ee )
						{
							ul = null;
						}
					
						ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid );
					}
					u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
				
					return;
				}
				else
				{
					Notify( { title: i18n( 'i18n_fail_unmount' ), text: i18n( 'i18n_fail_unmount_more' ) } );
				}
				
			} );
		}
		else
		{
			mountDrive( devname, userid, function( e, d )
			{
				console.log( 'mountDrive( '+devname+', '+userid+' ) ', { e:e, d:d } );
				
				if( e == 'ok' )
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					Notify( { title: i18n( 'i18n_mounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_mounted' ) } );
					
					var u = new Module( 'system' );
					u.onExecuted = function( ee, dd )
					{
						var ul = null;
						try
						{
							ul = JSON.parse( dd );
						}
						catch( ee )
						{
							ul = null;
						}
					
						ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid );
					}
					u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
				
					return;
				}
				else
				{
					Notify( { title: i18n( 'i18n_fail_mount' ), text: i18n( 'i18n_fail_mount_more' ) } );
				}
				
			} );
		}
	}
}

function StorageForm( storage, callback )
{
	
	var ft = new Module( 'system' );
	ft.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			i18nAddTranslations( d )
		}
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			// return info that this is loaded.
			
			console.log( { e:e, d:d } );
			
			if( callback ) callback( storage );
			
			var scripts = [];
			
			if( e == 'ok' )
			{
				// collect scripts
				
				var scr;
				while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
				{
					d = d.split( scr[0] ).join( '' );
					scripts.push( scr[1] );
				}
				
				var mch;
				var i = 0;
				while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
				{
					d = d.split( mch[0] ).join( i18n( mch[1] ) );
				}
				
				// Fix to add more space
				d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
			}
			else
			{
				d = '';
			}
			
			d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
			
			if( ge( 'DosDriverGui' ) )
			{
				ge( 'DosDriverGui' ).innerHTML = d;
				
				if( ge( 'StorageGui' ) )
				{
					var data = ( storage.data ? storage.data : false );
					
					// We are in edit mode..
					if( data )
					{
						var elems = {};
						
						var inputs = ge( 'StorageGui' ).getElementsByTagName( 'input' );
					
						if( inputs.length > 0 )
						{
							for( var i in inputs )
							{
								if( inputs[i] && inputs[i].id )
								{
									elems[inputs[i].id] = inputs[i];
								}
							}
						}
						
						var selects = ge( 'StorageGui' ).getElementsByTagName( 'select' );
						
						if( selects.length > 0 )
						{
							for( var s in selects )
							{
								if( selects[s] && selects[s].id )
								{
									elems[selects[s].id] = selects[s];
								}
							}
						}
						
						//console.log( elems );
						
						var fields = [
							'Name', 'Server', 'ShortDescription', 'Port', 'Username', 
							'Password', 'Path', 'Type', 'Workgroup', 'PrivateKey'
						];
						if( elems )
						{
							for( var a = 0; a < fields.length; a++ )
							{
								if( elems[ fields[ a ] ] && typeof( data[ fields[ a ] ] ) != 'undefined' )
								{
									elems[ fields[ a ] ].value = data[ fields[ a ] ];
								}
							}
							// Do we have conf?
							if( data.Config )
							{
								for( var a in data.Config )
								{
									if( elems[ 'conf.' + a ] )
									{
										elems[ 'conf.' + a ].value = data.Config[ a ];
									}
								}
							}
						}
					}
					
				}
			}
			
			if( ge( 'DiskSizeContainer' ) )
			{
				ge( 'DiskSizeContainer' ).style.display = 'none';
			}
			
			// TODO: Don't know what Types and Cbutton relates to ... remove later if it doesn't serve a purpose ...
			
			if( ge( 'Types' ) )
			{
				ge( 'Types' ).classList.add( 'closed' );
			}
			
			if( ge( 'CButton' ) )
			{
				ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_back' );
				ge( 'CButton' ).disabled = '';
				ge( 'CButton' ).oldOnclick = ge( 'CButton' ).onclick;
				
				// Return!!
				ge( 'CButton' ).onclick = function()
				{
					if( ge( 'Types' ) )
					{
						ge( 'Types' ).classList.remove( 'closed' );
					}
					ge( 'Form' ).classList.remove( 'open' );
					ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_cancel' );
					ge( 'CButton' ).onclick = ge( 'CButton' ).oldOnclick;
				}
			}
			
			
			
			// Run scripts at the end ...
			if( scripts )
			{
				for( var key in scripts )
				{
					if( scripts[key] )
					{
						eval( scripts[key] );
					}
				}
			}
		}
		m.execute( 'dosdrivergui', { type: storage.type, id: storage.id, authid: Application.authId } );
	}
	ft.execute( 'dosdrivergui', { component: 'locale', type: storage.type, language: Application.language, authid: Application.authId } );
	
}

function LoadDOSDriverGUI( _this )
{
	var type = ( _this ? _this.value : false );
	
	if( type )
	{
		var ft = new Module( 'system' );
		ft.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				i18nAddTranslations( d )
			}
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				var scripts = [];
			
				if( e == 'ok' )
				{
					// collect scripts
				
					var scr;
					while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
					{
						d = d.split( scr[0] ).join( '' );
						scripts.push( scr[1] );
					}
				
					var mch;
					var i = 0;
					while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
					{
						d = d.split( mch[0] ).join( i18n( mch[1] ) );
					}
				
					// Fix to add more space
					d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
				
					d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
					
					
					
					i18nAddTranslations( d );
					var f = new File();
					f.i18n();
					for( var a in f.replacements )
					{
						d = d.split( '{' + a + '}' ).join( f.replacements[a] );
					}
					ge( 'DosDriverGui' ).innerHTML = d;
				
					// Run scripts at the end ...
					if( scripts )
					{
						for( var key in scripts )
						{
							if( scripts[key] )
							{
								eval( scripts[key] );
							}
						}
					}
				}
				else
				{
					ge( 'DosDriverGui' ).innerHTML = '';
				}
			}
			m.execute( 'dosdrivergui', { type: type, authid: Application.authId } );
		
		}
		ft.execute( 'dosdrivergui', { component: 'locale', type: type, language: Application.language, authid: Application.authId } );
	}
}

// TODO: Check why it doesn't work to mount / unmount for other users as admin or with rights ...

function mountDrive( devname, userid, callback )
{
	if( devname )
	{
		var f = new Library( 'system.library' );
		
		f.onExecuted = function( e, d )
		{
			console.log( 'mountDrive ( device/mount ) ', { devname: devname, userid: userid, e:e, d:d } );
			
			if( callback ) callback( e, d );
		}
		
		f.execute( 'device/mount', { devname: devname, userid: userid } );
	}
}

function unmountDrive( devname, userid, callback )
{
	if( devname )
	{
		var f = new Library( 'system.library' );
		
		f.onExecuted = function( e, d )
		{
			console.log( 'unmountDrive ( device/unmount ) ', { devname: devname, userid: userid, e:e, d:d } );
			
			if( callback ) callback( e, d );
		}
		
		f.execute( 'device/unmount', { devname: devname, userid: userid } );
	}
}

function remountDrive( devname, userid, callback )
{
	if( devname )
	{
		unmountDrive( devname, userid, function( e, d )
		{
			
			mountDrive( devname, userid, function( e, d )
			{
				
				if( callback ) callback( e, d );
				
			} );
			
		} );
	}
}

// Add new user
function addUser( callback )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		console.log( 'addUser() ', { e:e, d:d } );
		
		if( e == 'ok' && d )
		{
			if( callback )
			{
				callback( d );
			}
			else
			{
				saveUser( d );
			}
			
			return;
		}
		
		if( callback ) callback( false );
	}
	m.execute( 'useradd', { authid: Application.authId } );
}

// Save a user
function saveUser( uid )
{	
	var args = { command: 'update' };
	
	var mapping = {
		usFullname : 'fullname',
		usEmail    : 'email',
		usUsername : 'username',
		usPassword : 'password',
		usSetup    : 'setup'
	};
	
	for( var a in mapping )
	{
		var k = mapping[ a ];
		
		// Skip nonchanged passwords
		if( a == 'usPassword' )
		{
			if( ( !ge( a ).value || ge( a ).value == '********' ) )
			{
				continue;
			}
			else
			{
				if( ge( a ).value != ge( 'usPasswordConfirm' ).value )
				{
					ge( 'PassError' ).innerHTML = i18n( '<span>New password confirmation does not match new password.</span>' );
					ge( a ).focus();
					return false;
				}
				else
				{
					ge( 'PassError' ).innerHTML = '';
				}
			}
		}
		
		args[ k ] = Trim( ge( a ).value );
		
		// Special case, hashed password
		if( a == 'usPassword' )
		{
			args[ k ] = '{S6}' + Sha256.hash( 'HASHED' + Sha256.hash( args[ k ] ) );
		}
		
		
	}
	
	if( !uid )
	{
		addUser( function( uid )
		{
			
			if( uid && uid > 0 )
			{
				saveUser( uid );
			}
			
		} );
		
		return;
	}
	else
	{
		args.id = uid;
	}
	
	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		console.log( { e:e, d:d } );
		
		if( !uid ) return;
		
		if( e == 'ok' )
		{
			
			// Save language setting
			
			function updateLanguages( callback )
			{
				/*Confirm( i18n( 'i18n_update_language_warning' ), i18n( 'i18n_update_language_desc' ), function( resp )
				{
					if( resp.data )
					{*/
						// Find right language for speech
						var langs = speechSynthesis.getVoices();
						
						var voice = false;
						for( var v = 0; v < langs.length; v++ )
						{
							console.log( langs[v].lang.substr( 0, 2 ) );
							if( langs[v].lang.substr( 0, 2 ) == ge( 'usLanguage' ).value )
							{
								voice = {
									spokenLanguage: langs[v].lang,
									spokenAlternate: langs[v].lang // TODO: Pick an alternative voice - call it spokenVoice
								};
							}
						}
						
						var mt = new Module( 'system' );
						mt.onExecuted = function( ee, dd )
						{	
							var mo = new Module( 'system' );
							mo.onExecuted = function()
							{
								if( callback ) return callback( true );
							}
							mo.execute( 'setsetting', { userid: uid, setting: 'locale', data: ge( 'usLanguage' ).value, authid: Application.authId } );
						}
						mt.execute( 'setsetting', { userid: uid, setting: 'language', data: voice, authid: Application.authId } );
					/*}
					else
					{
						if( callback ) return callback( true );
					}
					
				} );*/
			}
			
			// Save avatar image
			
			function saveAvatar( callback )
			{
				var canvas = ge( 'AdminAvatar' );
				if( canvas )
				{
					context = canvas.getContext( '2d' );
					var base64 = canvas.toDataURL();
					if( base64 )
					{
						var ma = new Module( 'system' );
						ma.forceHTTP = true;
						ma.onExecuted = function( e, d )
						{
							if( e != 'ok' )
							{
								console.log( 'Avatar saving failed.' );
						
								if( callback ) callback( false );
							}
					
							if( callback ) callback( true );
						};
						ma.execute( 'setsetting', { userid: uid, setting: 'avatar', data: base64 } );
					}
				}
			}
			
			updateLanguages( function(  )
			{
				
				saveAvatar( function (  )
				{
					
					Notify( { title: i18n( 'i18n_user_updated' ), text: i18n( 'i18n_user_updated_succ' ) } );
					
					Sections.accounts_users( 'edit', uid );
					
				} );
				
			} );
			
		}
		else
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_user_update_failed' ) } );
		}
	}
	f.execute( 'user', args );
}

function cancelUser(  )
{
	console.log( 'cancelUser(  ) ' );
	
	if( ge( 'UserDetails' ) )
	{
		ge( 'UserDetails' ).innerHTML = '';
		
		if( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).innerHTML )
		{
			var div = ge( 'ListUsersInner' ).getElementsByTagName( 'div' )[0];
			
			if( div )
			{
				div.click();
			}
		}
	}
}

