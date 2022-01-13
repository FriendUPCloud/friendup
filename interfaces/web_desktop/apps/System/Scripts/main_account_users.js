/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

let initdebug = false;

function debug ( pretty )
{
	return ( initdebug = ( pretty ? 'pretty' : true ) );
}

console.log( '///// debug( true ); for pretty print ... /////' );

// Main User Settings function to set up the whole user "module"
var UsersSettings = function ( setting, set )
{
	let searchquery = ( ''                           );  
	let searchby    = ( ''                           );
	let sortby      = ( 'FullName'                   );
	let orderby     = ( 'ASC'                        ); 
	let customsort  = ( ''                           );
	let sortstatus  = ( '0,2'                        );
	let divh        = ( 29                           );
	let listed      = ( 0                            );
	let total       = ( 0                            );
	let startlimit  = ( 0                            );
	let maxlimit    = ( 60                           );
	let minlength   = ( 1							 );
	let intervals   = ( 50                           );
	let limit       = ( startlimit + ', ' + maxlimit );
	let busy        = ( false                        );
	let abort       = ( false                        );
	
	this.vars = ( this.vars ? this.vars : {
		searchquery : searchquery,
		searchby    : searchby,
		sortby      : sortby,
		orderby     : orderby,
		customsort  : customsort,
		sortstatus  : sortstatus,
		divh        : divh,
		listed      : listed,
		total       : total,
		startlimit  : startlimit,
		maxlimit    : maxlimit,
		minlength   : minlength,
		limit       : limit,
		uids        : [],
		avatars     : false,
		logintime   : true,
		experiment  : true,
		listall     : false,
		reset       : true,
		debug       : false,
		busy        : busy,
		abort       : abort
	} );
	
	function Update ( setting, set )
	{
		if( setting && typeof set != "undefined" )
		{
			//console.log( 'UsersSettings: ' + setting + ' = ' + set );
			
			switch( setting )
			{
				case 'searchquery'         :
					this.vars.searchquery  = set;
					break;
				case 'searchby'            :
					this.vars.searchby     = set;
					break;
				case 'sortby'              :
					this.vars.sortby       = set;
					break;
				case 'orderby'             :
					this.vars.orderby      = set;
					break;
				case 'customsort'          :
					this.vars.customsort   = set;
					break;
				case 'sortstatus'          :
					if( set )
					{
						let out = [];
						let arr = this.vars.sortstatus ? this.vars.sortstatus.split( ',' ) : [];
						if( arr.length )
						{
							for( let i in arr )
							{
								if( set && set[0] == arr[i] && !set[1] )
								{
									continue;
								}
							
								out.push( arr[i] );
							}
						
						}
						if( set && set[0] && set[1] )
						{
							out.push( set[0] );
						}
						this.vars.sortstatus = out.join( ',' );
					}
					break;
				case 'divh'                :
					this.vars.divh         = set;
					break;
				case 'listed'              :
					this.vars.listed       = set;
					break;
				case 'total'               :
					this.vars.total        = set;
					break;
				case 'startlimit'          :
					this.vars.startlimit   = ( set                                                    );
					this.vars.limit        = ( this.vars.startlimit + ', ' + this.vars.maxlimit       );
					break;
				case 'maxlimit'            :
					this.vars.startlimit   = ( 0                                                      );
					this.vars.maxlimit     = ( set                                                    );
					this.vars.limit        = ( this.vars.startlimit + ', ' + this.vars.maxlimit       );
					break;
				case 'minlength'           :
					this.vars.minlength    = set;
					break;
				case 'intervals'           :
					this.vars.intervals    = ( set                                                    );
					break;
				case 'limit'               :
					this.vars.startlimit   = ( this.vars.maxlimit                                     );
					this.vars.maxlimit     = ( Math.round(this.vars.startlimit + this.vars.intervals) );
					this.vars.limit        = ( this.vars.startlimit + ', ' + this.vars.maxlimit       );
					break;
				case 'uids':
					if( this.vars.uids.indexOf( set ) < 0 )
					{
						this.vars.uids.push( set                                                      );
					}
					break;
				case 'experiment'          :
					this.vars.experiment   = ( set                                                    );
					break;
				case 'avatars'             :
					this.vars.avatars      = ( set                                                    );
					break;
				case 'logintime'           :
					this.vars.logintime    = ( set                                                    );
					break;
				case 'listall'             :
					this.vars.listall      = ( set                                                    );
					this.vars.startlimit   = ( 0                                                      );
					this.vars.maxlimit     = ( 99999                                                  );
					this.vars.limit        = ( this.vars.startlimit + ', ' + this.vars.maxlimit       );
					break;
				case 'reset'               :
					this.vars.searchquery  = ( searchquery                                            );
					if( set && set == 'all' )
					{
						this.vars.searchby = ( searchby                                               );
						this.vars.sortby   = ( sortby                                                 );
						this.vars.orderby  = ( orderby                                                );
					}
					this.vars.divh         = ( divh                                                   );
					this.vars.listed       = ( listed                                                 );
					this.vars.total        = ( total                                                  );
					this.vars.startlimit   = ( startlimit                                             );
					if( !this.vars.listall )
					{
						this.vars.maxlimit = ( maxlimit                                               );
						this.vars.limit    = ( startlimit + ', ' + maxlimit                           );
					}
					this.vars.intervals    = ( intervals                                              );
					this.vars.uids         = ( []                                                     );
					this.vars.busy         = ( busy                                                   );
					this.vars.abort        = ( abort                                                  );
					break;
				case 'debug'               :
					this.vars.debug        = ( set                                                    );
					break;
				case 'busy'                :
					this.vars.busy         = ( set                                                    );
					break;
				case 'abort'               :
					this.vars.abort        = ( set                                                    );
					break;
			}
		}
	}
	
	if( setting )
	{
		Update( setting, set );
	}
	
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
Sections.accounts_users = function( cmd, extra, accounts_users_callback )
{
	// Ugly method for now to get access to functions in the function, but this mess needs to ble cleaned up first ....
	
	if( cmd && cmd != 'init' )
	{
		if( cmd == 'edit' )
		{
			// Show the form
			function initUsersDetails( info, show, first )
			{
				
				
				// Some shortcuts
				let userInfo          = ( info.userInfo ? info.userInfo : {} );
				let settings          = ( info.settings ? info.settings : {} );
				let workspaceSettings = ( info.workspaceSettings ? info.workspaceSettings : {} );
				let wgroups           = typeof( userInfo.Workgroup ) == 'object' ? userInfo.Workgroup : ( userInfo.Workgroup ? [ userInfo.Workgroup ] : [] );
				let uroles            = ( info.roles ? info.roles : {} );
				let mountlist         = ( info.mountlist ? info.mountlist : {} );
				let soft              = ( info.software ? info.software : {} );
				let apps              = ( info.applications ? info.applications : {} );
				let dock              = ( info.dock ? info.dock : {} );
				let star              = ( workspaceSettings.startupsequence && workspaceSettings.startupsequence != "[]" ? workspaceSettings.startupsequence : [] );
				
				if( /*1==1 || */ShowLog ) console.log( 'initUsersDetails( info ) ', info );		
				
				let func = {
					
					init: function()
					{
						refreshUserList( userInfo );
					},
					
					user: function()
					{
						// User
						let ulocked = false;
						let udisabled = false;
				
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
					
					level: function()
					{					
						return ( userInfo.Level ? userInfo.Level : false );
					},
					
					language: function()
					{
						// Language
						let availLangs = {
							'en' : 'English',
							'fr' : 'French',
							'no' : 'Norwegian',
							'fi' : 'Finnish',
							'pl' : 'Polish'
						};
						let languages = '';
				
						let locale = ( workspaceSettings.language && workspaceSettings.language.spokenLanguage ? workspaceSettings.language.spokenLanguage.substr( 0, 2 ) : workspaceSettings.locale );
						for( var a in availLangs )
						{
							let sel = ( locale == a ? ' selected="selected"' : '' );
							languages += '<option value="' + a + '"' + sel + '>' + availLangs[ a ] + '</option>';
						}
					
						return languages;
					},
					
					setup: function()
					{
						// Setup / Template
						let setup = '<option value="0">None</option>';
						if( userInfo.Setup )
						{
							for( var s in userInfo.Setup )
							{
								if( userInfo.Setup[s] && userInfo.Setup[s].ID )
								{
									let sel = ( userInfo.Setup[s].UserID && userInfo.Setup[s].UserID == userInfo.ID ? ' selected="selected"' : '' );
									setup += '<option value="' + userInfo.Setup[s].ID + '"' + sel + '>' + userInfo.Setup[s].Name + '</option>';
								}
							}
						}
						
						return setup;
					},
					
					themes: function()
					{
						// Themes
						let themeData = workspaceSettings[ 'themedata_' + settings.Theme ];
						if( !themeData )
						{
							themeData = { colorSchemeText: 'light', buttonSchemeText: 'windows' };
						}
						
						return themeData;
					},
					
					workgroups: function()
					{
						// Workgroups
						let wstr = '';
						if( wgroups.length )
						{
							let wids = {};
							
							for( var a in wgroups )
							{
								if( wgroups[a] && wgroups[a].ID && wgroups[a].Name )
								{
									wids[ wgroups[a].ID ] = wgroups[a];
								}
							}
							
							if( wids )
							{
								for( var b in wids )
								{
									if( !wids[b] || !wids[b].Name ) continue;
									
									wstr += '<div>';
									wstr += '<div class="HRow">';
									wstr += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
									wstr += '		<span name="' + wids[b].Name + '" class="IconMedium fa-users"></span>';
									wstr += '	</div>';
									wstr += '	<div class="PaddingSmall InputHeight FloatLeft Ellipsis">' + wids[b].Name + '</div>';
									wstr += '	<div class="PaddingSmall HContent40 FloatRight Ellipsis">';
									
									if( Application.checkAppPermission( [ 
										'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
										'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
										'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
									] ) )
									{
										//wstr += '	<button wid="' + wids[b].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-on"> </button>';
										
										wstr += CustomToggle( 'wid_' + wids[b].ID, 'FloatRight', null, function (  )
										{
		
											var args = { 
												id     : this.id.split( 'wid_' )[1], 
												users  : userInfo.ID, 
												authid : Application.authId 
											};
									
											args.args = JSON.stringify( {
												'type'    : 'write', 
												'context' : 'application', 
												'authid'  : Application.authId, 
												'data'    : { 
													'permission' : [ 
														'PERM_WORKGROUP_CREATE_GLOBAL', 
														'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
														'PERM_WORKGROUP_UPDATE_GLOBAL', 
														'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
														'PERM_WORKGROUP_GLOBAL', 
														'PERM_WORKGROUP_WORKGROUP' 
													]
												}, 
												'object'   : 'workgroup', 
												'objectid' : this.id.split( 'wid_' )[1] 
											} );
									
											if( this.checked )
											{
												// Toggle off ...
											
												if( args && args.id && args.users )
												{
													let f = new Library( 'system.library' );
													f.btn = this;
													f.wids = wids;
													f.onExecuted = function( e, d )
													{
														
														this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
												
														let pnt = this.btn.parentNode.parentNode;
												
														if( pnt )
														{
															pnt.innerHTML = '';
														}
													
														// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
													
														// Refresh Storage ...
														//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
														Sections.user_disk_cancel( userInfo.ID );
													
													}
													f.execute( 'group/removeusers', args );
												}
										
											}
		
										}, true );
										
									}
									
									wstr += '	</div>';
									wstr += '</div>';
									wstr += '</div>';
								}
							}
						}
					
						return wstr;
					},
					
					roles: function()
					{
								
						// Roles
						let rstr = '';
				
						// Roles and role adherence
						if( uroles && uroles == '404' )
						{
							rstr += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_roles_access_denied' ) + '</div></div>';
						}
						else if( uroles && uroles.length )
						{
							
							for( var a in uroles )
							{
								if( !uroles[a].UserID && !Application.checkAppPermission( [ 
									'PERM_ROLE_CREATE_GLOBAL', 'PERM_ROLE_CREATE_IN_WORKGROUP', 
									'PERM_ROLE_READ_GLOBAL',   'PERM_ROLE_READ_IN_WORKGROUP', 
									'PERM_ROLE_UPDATE_GLOBAL', 'PERM_ROLE_UPDATE_IN_WORKGROUP', 
									'PERM_ROLE_GLOBAL',        'PERM_ROLE_WORKGROUP' 
								] ) )
								{
									continue;
								}
								
								let title = '';
						
								if( uroles[a].Permissions.length )
								{
									let wgrs = [];
							
									for( var b in uroles[a].Permissions )
									{
										if( uroles[a].Permissions[b].GroupType == 'Workgroup' && wgrs.indexOf( uroles[a].Permissions[b].GroupName ) < 0 )
										{
											wgrs.push( uroles[a].Permissions[b].GroupName );
										}
									}
							
									title = wgrs.join( ',' );
								}
								
								rstr += '<div class="HRow">';
								rstr += '	<div class="PaddingSmall HContent40 FloatLeft Ellipsis" title="' + uroles[a].Name + '">';
								rstr += '		<span name="' + uroles[a].Name + '" workgroups="' + title + '" style="display: none;"></span>';
								rstr += '		<strong>' + uroles[a].Name + '</strong>';
								rstr += '	</div>';
								
								
								
								rstr += '<div class="PaddingSmall HContent45 FloatLeft Ellipsis"' + ( title ? ' title="' + title + '"' : '' ) + '>' + title + '</div>';
						
								rstr += '<div class="PaddingSmall HContent15 FloatLeft Ellipsis">';
								
								if( Application.checkAppPermission( [ 
									'PERM_ROLE_CREATE_GLOBAL', 'PERM_ROLE_CREATE_IN_WORKGROUP', 
									'PERM_ROLE_UPDATE_GLOBAL', 'PERM_ROLE_UPDATE_IN_WORKGROUP', 
									'PERM_ROLE_GLOBAL',        'PERM_ROLE_WORKGROUP' 
								] ) )
								{
									//rstr += '<button onclick="Sections.userrole_update('+uroles[a].ID+','+userInfo.ID+',this)" class="IconButton IconSmall IconToggle ButtonSmall FloatRight' + ( uroles[a].UserID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
									
									rstr += CustomToggle( 'rid_'+uroles[a].ID, 'FloatRight', null, 'Sections.userrole_update('+uroles[a].ID+','+userInfo.ID+',this)', ( uroles[a].UserID ? true : false ) );
									
								}
								
								rstr += '</div>';
								rstr += '</div>';
							}
						}
						else
						{
							rstr += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_roles_empty' ) + '</div></div>';
						}
						
						
						
						return rstr;
					},
					
					storage: function()
					{
						if( !Application.checkAppPermission( [ 
							'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
							'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
						] ) )
						{
							if( ge( 'StorageAdd' ) )
							{
								ge( 'StorageAdd' ).style.display = 'none';
							}
						}
						
						// Storage / disks
						let mlst = Sections.user_disk_refresh( mountlist, userInfo.ID, Sections.user_volumeinfo_refresh( mountlist, userInfo.ID ) );
						
						return mlst;
					},
					
					applications: function()
					{
						// Applications
						let apl = '';
						let types = [ '', i18n( 'i18n_name' ), i18n( 'i18n_category' ), i18n( 'i18n_dock' ) ];
						let keyz  = [ 'Icon', 'Name', 'Category', 'Dock' ];
						apl += '<div class="HRow">';
						for( var a = 0; a < types.length; a++ )
						{
							let ex = ''; var st = '';
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
						let sw = 2;
						if( apps && apps == '404' )
						{
							apl += i18n( 'i18n_applications_available_access_denied' );
						}
						else if( apps )
						{
							for( var a = 0; a < apps.length; a++ )
							{
								sw = sw == 2 ? 1 : 2;
								apl += '<div class="HRow">';
								for( var k = 0; k < keyz.length; k++ )
								{
									let ex = ''; var st = '';
									if( keyz[ k ] == 'Icon' )
									{
										st = ' style="width:10%"';
										let img = ( !apps[ a ].Preview ? '/iconthemes/friendup15/File_Binary.svg' : '/system.library/module/?module=system&command=getapplicationpreview&application=' + apps[ a ].Name + '&authid=' + Application.authId );
										let value = '<div style="background-image:url(' + img + ');background-size:contain;width:24px;height:24px;"></div>';
									}
									else
									{
										let value = apps[ a ][ keyz[ k ] ];
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
										value = '<button class="IconButton IconSmall IconToggle ButtonSmall FloatRight' + ( apps[ a ].DockStatus ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
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
					
					
					let user = func.user();
					
					let udisabled = user.udisabled; 
					let ulocked   = user.ulocked; 
					
					let level     = func.level();
					let languages = func.language();
					let setup     = func.setup();
					let wstr      = func.workgroups();
					let rstr      = func.roles();
					let mlst      = func.storage();
					let themeData = func.themes();
					
					
					
					function onLoad ( data )
					{
						
						let func = {
							
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
								
								if( userInfo.ID )
								{
									if( ge( 'usName'     ) )
									{
										ge( 'usName'     ).innerHTML = ( userInfo.FullName ? userInfo.FullName : 'n/a' );
									}
									if( ge( 'usFullname' ) )
									{
										ge( 'usFullname' ).innerHTML = ( userInfo.FullName ? userInfo.FullName : 'n/a' );
									}
									if( ge( 'usUsername' ) )
									{
										ge( 'usUsername' ).innerHTML = ( userInfo.Name ? userInfo.Name : 'n/a' );
									}
									if( ge( 'usEmail'    ) && userInfo.Email )
									{
										ge( 'usEmail'    ).innerHTML = userInfo.Email;
									}
									if( ge( 'usMobile'    ) && userInfo.Mobile )
									{
										ge( 'usMobile'    ).innerHTML = userInfo.Mobile;
									}
									
									if( Application.userId != userInfo.ID )
									{
										
										if( ge( 'usLocked'   ) )
										{
											ge( 'usLocked'   ).onclick = function()
											{
												updateUserStatus( userInfo.ID, 2 );
											};
										}
										if( ge( 'usDisabled' ) )
										{
											ge( 'usDisabled' ).onclick = function()
											{
												updateUserStatus( userInfo.ID, 1 );
											};
										}
										
										if( ge( 'usLocked'   ) && ulocked )
										{
											ge( 'usLocked'   ).checked = true;
											//ge( 'usLocked'   ).className = ge( 'usLocked'   ).className.split( 'fa-toggle-on' ).join( '' ).split( 'fa-toggle-off' ).join( '' ) + 'fa-toggle-on';
										}
										if( ge( 'usDisabled' ) && udisabled )
										{
											ge( 'usDisabled' ).checked = true;
											//ge( 'usDisabled' ).className = ge( 'usDisabled' ).className.split( 'fa-toggle-on' ).join( '' ).split( 'fa-toggle-off' ).join( '' ) + 'fa-toggle-on';
										}
										
									}
									else
									{
										if( ge( 'AdminStatusContainer' ) ) ge( 'AdminStatusContainer' ).style.display = 'none';
									}
									
								}
							},
							
							password : function (  )
							{
								// Password ------------------------------------------------
								
								if( ge( 'ChangePassContainer' ) && ge( 'ResetPassContainer' ) )
								{
									ge( 'ChangePassContainer' ).className = 'Closed';
									ge( 'ResetPassContainer'  ).className = 'Open';
									
									if( Application.checkAppPermission( [ 
										'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
										'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_WORKGROUP_GLOBAL' 
									] ) )
									{
										let res = ge( 'passToggle' );
										if( res ) res.onclick = function( e )
										{
											toggleChangePass();
											editMode();
										}
									}
									else
									{
										ge( 'ResetPassContainer' ).style.display = 'none';
									}
								}
							},
							
							level : function (  )
							{
								
								if( ge( 'usLevel' ) && level )
								{
									let opt = ge( 'usLevel' ).getElementsByTagName( 'option' );
									
									if( opt.length > 0 )
									{
										for( var a = 0; a < opt.length; a++ )
										{
											if( opt[a].value == level ) opt[a].selected = 'selected';
										}
									}
								}
								
								if( ge( 'AdminLevelContainer' ) && Application.checkAppPermission( [ 'PERM_USER_READ_GLOBAL', 'PERM_USER_GLOBAL' ] ) )
								{
									if( ge( 'AdminLevelContainer' ).classList.contains( 'Closed' ) )
									{
										ge( 'AdminLevelContainer' ).classList.remove( 'Closed' );
										ge( 'AdminLevelContainer' ).classList.add( 'Open' );
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
									let avSrc = new Image();
									avSrc.src = userInfo.avatar;
									avSrc.onload = function()
									{
										//console.log( 'image have loaded ... ' + this.src );
										if( ge( 'AdminAvatar' ) )
										{
											ge( 'AdminAvatarArea' ).className = ge( 'AdminAvatarArea' ).className.split( ' fa-user-circle-o' ).join( '' );
											
											let ctx = ge( 'AdminAvatar' ).getContext( '2d' );
											ctx.drawImage( avSrc, 0, 0, 256, 256 );
										}
									}
								} 
								
								let ra = ge( 'AdminAvatarRemove' );
								if( ra ) 
								{
									if( Application.checkAppPermission( [ 
										'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
										'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_WORKGROUP_GLOBAL' 
									] ) )
									{
										ra.onclick = function( e )
										{
											removeAvatar();
										}
									}
									else
									{
										ra.style.display = 'none';
									}
								}
								
								let ae = ge( 'AdminAvatarEdit' );
								if( ae ) 
								{
									if( Application.checkAppPermission( [ 
										'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
										'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_WORKGROUP_GLOBAL' 
									] ) )
									{
										ae.onclick = function( e )
										{
											changeAvatar();
										}
									}
									else
									{
										ae.style.display = 'none';
									}
								}
							},
							
							details : function (  )
							{
								// Editing basic details
								
								if( ge( 'UserBasicDetails' ) )
								{
									let inps = ge( 'UserBasicDetails' ).getElementsByTagName( '*' );
									if( inps.length > 0 )
									{
										for( var a = 0; a < inps.length; a++ )
										{
											if( inps[ a ].id && [ 'usFullname', 'usUsername', 'usEmail', 'usMobile', 'usLevel', 'usLanguage', 'usSetup' ].indexOf( inps[ a ].id ) >= 0 )
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
									
									if( ge( 'usLevel' ) )
									{
										ge( 'usLevel' ).current = ge( 'usLevel' ).value;
									}
									if( ge( 'usLanguage' ) )
									{
										ge( 'usLanguage' ).current = ge( 'usLanguage' ).value;
									}
									if( ge( 'usSetup' ) )
									{
										ge( 'usSetup' ).current = ge( 'usSetup' ).value;
									}
								}
								
								let bg1  = ge( 'UserSaveBtn' );
								if( bg1 )
								{
									if( Application.checkAppPermission( [ 
										'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
									] ) )
									{
										bg1.onclick = function( e )
										{
											if( ge( 'usUsername' ).value )
											{
												//this.innerHTML = '<i class="fa fa-spinner" aria-hidden="true"></i>';
												
												//_saveUser( userInfo.ID );
										
												//editMode( true );
												
												_saveUser( userInfo.ID, function( uid )
												{
													
													// Refresh user list ... TODO: Make a refresh function.
													
													searchServer( null, true, function(  )
													{
														
														// Go to edit mode for the new user ...
														
														if( ge( 'UserListID_' + userInfo.ID ) && ge( 'UserListID_' + userInfo.ID ).parentNode.onclick )
														{
															ge( 'UserListID_' + userInfo.ID ).parentNode.skip = true;
															ge( 'UserListID_' + userInfo.ID ).parentNode.onclick(  );
														}
														else
														{
															Sections.accounts_users( 'edit', userInfo.ID );
														}
														
													} );
													
												} );
												
											}
											else
											{
												ge( 'usUsername' ).focus();
											}
										}
									}
									else
									{
										bg1.style.display = 'none';
									}
								}
								let bg2  = ge( 'UserCancelBtn' );
								if( bg2 ) bg2.onclick = function( e )
								{
									//cancelUser( userInfo.ID );
									Sections.accounts_users( 'edit', userInfo.ID );
								}
								let bg3  = ge( 'UserBackBtn' );
								if( !isMobile ) 
								{
									if( bg3 ) bg3.style.display = 'none';
								}
								else
								{
									if( bg3 ) bg3.onclick = function( e )
									{
										cancelUser(  );
									}
								}
								
								let bg4  = ge( 'UserDeleteBtn' );
								if( bg4 ) 
								{
									if( Application.checkAppPermission( [ 
										'PERM_USER_DELETE_GLOBAL', 'PERM_USER_DELETE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
									] ) )
									{
										bg4.onclick = function( e )
										{
				
											// Delete user ...
							
											if( userInfo.ID )
											{
												//console.log( '// delete user' );
					
												removeBtn( this, { id: userInfo.ID, button_text: 'i18n_delete_user', }, function ( args )
												{
									
													_removeUser( args.id, function(  )
													{
														
														cancelUser(  );
														
														searchServer( null, true );
														
														//if( UsersSettings( 'experiment' ) )
														//{
														//	Sections.accounts_users( 'init' );
														//}
														
													} );
									
												} );
								
											}
				
										}
									}
									else
									{
										bg4.style.display = 'none';
									}
								}
								
								if( ge( 'UserEditButtons' ) )
								{
									ge( 'UserEditButtons' ).className = 'Closed';
								}
							},
							
							workgroups : function (  )
							{
								
								// Heading ...
								
								let o = ge( 'WorkgroupGui' ); if( o ) o.innerHTML = '';
								
								let divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											let d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function(  ) 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														sortgroups( 'Name' );
													};
													return d;
												}(  ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong></strong>';
													return d;
												}( this )
											},
											{ 
												'element' : function() 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
													return d;
												}()
											}
										]
									},
									{
										'element' : function() 
										{
											let d = document.createElement( 'div' );
											d.className = 'HRow List PaddingTop PaddingRight PaddingBottom';
											d.style.overflow = 'auto';
											d.style.maxHeight = '314px';
											d.id = 'WorkgroupInner';
											return d;
										}()
									}
								] );
				
								if( divs )
								{
									for( var i in divs )
									{
										if( divs[i] && o )
										{
											o.appendChild( divs[i] );
										}
									}
								}
								
								
								
								// Editing workgroups
								
								let wge = ge( 'WorkgroupEdit' );
								
								if( !Application.checkAppPermission( [ 
									'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
									'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
									'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
								] ) )
								{
									wge.style.display = 'none';
									wge = false;
								}
								
								if( wge )
								{
									wge.wids = {};
									wge.wgroups = false;
								}
								
								// TODO: List the groups sorting here since that is constant, so there is no difference between first render and switch between edit and list enabled.
								
								if( ge( 'WorkgroupInner' ) && wstr )
								{
									ge( 'WorkgroupInner' ).innerHTML = wstr;
									
									// TODO: Move wstr rendering into this function so we don't have to render all of this 3 times ....
									
									if( ge( 'WorkgroupInner' ).innerHTML )
									{
										let workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
										
										if( workBtns )
										{
											for( var a = 0; a < workBtns.length; a++ )
											{
												if( workBtns[a] && workBtns[a].classList.contains( 'fa-toggle-on' ) && workBtns[a].getAttribute( 'wid' ) )
												{
													wge.wids[ workBtns[a].getAttribute( 'wid' ) ] = true;
												}
											}
											
											for( var a = 0; a < workBtns.length; a++ )
											{
												// Toggle user relation to workgroup
												( function( b, wids ) {
													b.onclick = function( e )
													{
														let args = { 
															id     : this.getAttribute( 'wid' ), 
															users  : userInfo.ID, 
															authid : Application.authId 
														};
													
														args.args = JSON.stringify( {
															'type'    : 'write', 
															'context' : 'application', 
															'authid'  : Application.authId, 
															'data'    : { 
																'permission' : [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 
																	'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 
																	'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL', 
																	'PERM_WORKGROUP_WORKGROUP' 
																]
															}, 
															'object'   : 'workgroup', 
															'objectid' : this.getAttribute( 'wid' ) 
														} );
													
														if( this.classList.contains( 'fa-toggle-on' ) )
														{
															// Toggle off ...
														
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.wids = wids;
																f.onExecuted = function( e, d )
																{
																	//console.log( { e:e, d:d } );
																
																	this.btn.classList.remove( 'fa-toggle-on' );
																	this.btn.classList.add( 'fa-toggle-off' );
																
																	this.wids[ this.btn.getAttribute( 'wid' ) ] = false;
																
																	let pnt = this.btn.parentNode.parentNode;
																
																	if( pnt )
																	{
																		pnt.innerHTML = '';
																	}
																	
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																	
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																}
																f.execute( 'group/removeusers', args );
															}
														
														}
													}
												} )( workBtns[ a ], wge.wids );
											}
											
										}
										
										let workInps = ge( 'WorkgroupInner' ).getElementsByTagName( 'input' );
										
										if( workInps )
										{
											for( var a = 0; a < workInps.length; a++ )
											{
												if( workInps[a] && workInps[a].checked && workInps[a].id.split( 'wid_' )[1] )
												{
													wge.wids[ workInps[a].id.split( 'wid_' )[1] ] = true;
												}
											}
											
											for( var a = 0; a < workInps.length; a++ )
											{
												// Toggle user relation to workgroup
												( function( b, wids ) {
													b.onclick = function( e )
													{
														var args = { 
															id     : this.id.split( 'wid_' )[1], 
															users  : userInfo.ID, 
															authid : Application.authId 
														};
													
														args.args = JSON.stringify( {
															'type'    : 'write', 
															'context' : 'application', 
															'authid'  : Application.authId, 
															'data'    : { 
																'permission' : [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 
																	'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 
																	'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL', 
																	'PERM_WORKGROUP_WORKGROUP' 
																]
															}, 
															'object'   : 'workgroup', 
															'objectid' : this.id.split( 'wid_' )[1] 
														} );
													
														// Toggle off ...
													
														if( args && args.id && args.users )
														{
															let f = new Library( 'system.library' );
															f.btn = this;
															f.wids = wids;
															f.onExecuted = function( e, d )
															{
																//console.log( { e:e, d:d } );
															
																this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
															
																let pnt = this.btn.parentNode.parentNode.parentNode;
															
																if( pnt )
																{
																	pnt.innerHTML = '';
																}
																
																// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																// Refresh Storage ...
																//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																Sections.user_disk_cancel( userInfo.ID );
															}
															f.execute( 'group/removeusers', args );
														}
														
													}
												} )( workInps[ a ], wge.wids );
											}
											
										}
										
									}
									
								}
								
								
								
								if( wge ) wge.onclick = function( e )
								{
									
									
									groups = {};
									
									if( info.workgroups )
									{

										var unsorted = {};
										
										// Add all workgroups to unsorted and add subgroups array ...
					
										for( var i in info.workgroups )
										{
											if( info.workgroups[i] && info.workgroups[i].ID )
											{
												if( info.workgroups[i].Hide && info.workgroups[i].UserID == userInfo.ID )
												{
													info.workgroups[i].Hide = false;
												}
												
												unsorted[info.workgroups[i].ID] = {};
							
												for( var ii in info.workgroups[i] )
												{
													if( info.workgroups[i][ii] )
													{
														unsorted[info.workgroups[i].ID][ii] = info.workgroups[i][ii];
													}
												}
												
												unsorted[info.workgroups[i].ID].level = 1;
												unsorted[info.workgroups[i].ID].groups = [];
											}
										}
					
										// Arrange all subgroups to parentgroups ...
					
										var set = [];
					
										for( var k in unsorted )
										{
											if( unsorted[k].ParentID > 0 && unsorted[ unsorted[k].ParentID ] )
											{
												unsorted[ unsorted[k].ParentID ].groups.push( unsorted[k] );
												
												if( unsorted[ unsorted[k].ParentID ].groups )
												{
													for( var kk in unsorted[ unsorted[k].ParentID ].groups )
													{
														if( unsorted[ unsorted[k].ParentID ].groups[ kk ] )
														{
															unsorted[ unsorted[k].ParentID ].groups[ kk ].level = ( unsorted[ unsorted[k].ParentID ].level +1 );
														}
													}
												}
												
												set.push( unsorted[k].ID );
											}
										}
					
										// Filter all subgroups allready set, away from root level ...
					
										for( var k in unsorted )
										{
											if( set.indexOf( unsorted[k].ID ) < 0 )
											{
												groups[ unsorted[k].ID ] = unsorted[k];
											}
										}
										
										if( ShowLog/* || 1==1*/ ) console.log( [ unsorted, set, groups ] );
										
									}
									
									if( ge( 'AdminWorkgroupContainer' ) )
									{
										let inpu = ge( 'AdminWorkgroupContainer' ).getElementsByTagName( 'input' )[0];
										inpu.value = '';
									
										if( ge( 'WorkgroupSearchCancelBtn' ) && ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) )
										{
											ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Open' );
											ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Closed' );
										}
									}
									
									
									
										this.activated = true;
										
										var ii = 0;
										
										let str = '';
										
										if( groups && groups == '404' )
										{
											str += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_workgroups_access_denied' ) + '</div></div>';
										}
										else if( userInfo.Status != 1 && groups )
										{
											
											for( var a in groups )
											{
												var found = false;
												if( this.wids[ groups[a].ID ] )
												{
													found = true;
												}
												else if( this.wgroups.length )
												{
													for( var c = 0; c < this.wgroups.length; c++ )
													{
														if( groups[a].Name == this.wgroups[c].Name )
														{
															found = true;
															break;
														}
													}
												}
						
												ii++;
						
												str += '<div>';
						
												str += '<div class="HRow'+(groups[a].Hide?' Hidden':'')+'" id="WorkgroupID_' + groups[a].ID + '">';
						
												str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
												str += '		<span name="' + groups[a].Name + '" class="IconMedium fa-users"></span>';
												str += '	</div>';
												str += '	<div class="PaddingSmall HContent60 InputHeight FloatLeft Ellipsis">' + groups[a].Name + (groups[a].Owner?' (by '+groups[a].Owner+')':'') + '</div>';
						
												str += '	<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
												
												if( Application.checkAppPermission( [ 
													'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
													'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
													'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
												] ) )
												{
													//str += '		<button wid="' + groups[a].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"></button>';
													
													str += CustomToggle( 'wid_' + groups[a].ID, 'FloatRight', null, function (  )
													{
							
														var args = { 
															id     : this.id.split( 'wid_' )[1], 
															users  : userInfo.ID, 
															authid : Application.authId 
														};
														
														args.args = JSON.stringify( {
															'type'    : 'write', 
															'context' : 'application', 
															'authid'  : Application.authId, 
															'data'    : { 
																'permission' : [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 
																	'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 
																	'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL', 
																	'PERM_WORKGROUP_WORKGROUP' 
																]
															}, 
															'object'   : 'workgroup', 
															'objectid' : this.id.split( 'wid_' )[1] 
														} );
														
														if( this.checked )
														{
															// Toggle on ...
															
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{
																	
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																	
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																}
																f.execute( 'group/addusers', args );
															}
															
														}
														else
														{
															// Toggle off ...
															
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{
																	
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																	
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																	
																}
																f.execute( 'group/removeusers', args );
															}
															
														}
							
													}, ( found ? true : false ) );
													
												}
												
												str += '	</div>';
						
												str += '</div>';
						
												if( groups[a].groups.length > 0 )
												{
							
													str += '<div class="SubGroups">';
							
													for( var aa in groups[a].groups )
													{
														var found = false;
														if( this.wids[ groups[a].groups[aa].ID ] )
														{
															found = true;
														}
														else if( this.wgroups.length )
														{
															for( var cc = 0; cc < this.wgroups.length; cc++ )
															{
																if( groups[a].groups[aa].Name == this.wgroups[cc].Name )
																{
																	found = true;
																	break;
																}
															}
														}
								
														ii++;
								
														str += '<div class="HRow'+(groups[a].groups[aa].Hide?' Hidden':'')+'" id="WorkgroupID_' + groups[a].groups[aa].ID + '">';
								
														str += '	<div class="TextCenter HContent4 FloatLeft InputHeight PaddingSmall" style="min-width:36px"></div>';
														str += '	<div class="TextCenter HContent10 FloatLeft InputHeight PaddingSmall Ellipsis edit">';
														str += '		<span name="' + groups[a].groups[aa].Name + '" class="IconMedium fa-users"></span>';
														str += '	</div>';
														str += '	<div class="PaddingSmall HContent55 InputHeight FloatLeft Ellipsis">' + groups[a].groups[aa].Name + (groups[a].groups[aa].Owner?' (by '+groups[a].groups[aa].Owner+')':'') + '</div>';
								
														str += '<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
														
														if( Application.checkAppPermission( [ 
															'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
															'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
															'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
														] ) )
														{
															//str += '<button wid="' + groups[a].groups[aa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>';
															
															str += CustomToggle( 'wid_' + groups[a].groups[aa].ID, 'FloatRight', null, function (  )
															{
						
																var args = { 
																	id     : this.id.split( 'wid_' )[1], 
																	users  : userInfo.ID, 
																	authid : Application.authId 
																};
													
																args.args = JSON.stringify( {
																	'type'    : 'write', 
																	'context' : 'application', 
																	'authid'  : Application.authId, 
																	'data'    : { 
																		'permission' : [ 
																			'PERM_WORKGROUP_CREATE_GLOBAL', 
																			'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																			'PERM_WORKGROUP_UPDATE_GLOBAL', 
																			'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																			'PERM_WORKGROUP_GLOBAL', 
																			'PERM_WORKGROUP_WORKGROUP' 
																		]
																	}, 
																	'object'   : 'workgroup', 
																	'objectid' : this.id.split( 'wid_' )[1] 
																} );
													
																if( this.checked )
																{
																	// Toggle on ...
														
																	if( args && args.id && args.users )
																	{
																		let f = new Library( 'system.library' );
																		f.btn = this;
																		f.onExecuted = function( e, d )
																		{
																
																			// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																			// Refresh Storage ...
																			//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																			Sections.user_disk_cancel( userInfo.ID );
																		}
																		f.execute( 'group/addusers', args );
																	}
														
																}
																else
																{
																	// Toggle off ...
														
																	if( args && args.id && args.users )
																	{
																		let f = new Library( 'system.library' );
																		f.btn = this;
																		f.onExecuted = function( e, d )
																		{
																
																			// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																			// Refresh Storage ...
																			//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																			Sections.user_disk_cancel( userInfo.ID );
																
																		}
																		f.execute( 'group/removeusers', args );
																	}
														
																}
						
															}, ( found ? true : false ) );
															
														}
														
														str += '</div>';
								
														str += '</div>';
								
														if( groups[a].groups[aa].groups.length > 0 )
														{
									
															str += '<div class="SubGroups">';
									
															for( var aaa in groups[a].groups[aa].groups )
															{
																var found = false;
																if( this.wids[ groups[a].groups[aa].groups[aaa].ID ] )
																{
																	found = true;
																}
																else if( this.wgroups.length )
																{
																	for( var cc = 0; cc < this.wgroups.length; cc++ )
																	{
																		if( groups[a].groups[aa].groups[aaa].Name == this.wgroups[cc].Name )
																		{
																			found = true;
																			break;
																		}
																	}
																}
										
																ii++;
																
																str += '<div class="HRow'+(groups[a].groups[aa].groups[aaa].Hide?' Hidden':'')+'" id="WorkgroupID_' + groups[a].groups[aa].groups[aaa].ID + '">';
										
																str += '	<div class="TextCenter HContent8 InputHeight FloatLeft PaddingSmall" style="min-width:73px"></div>';
																str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
																str += '		<span name="' + groups[a].groups[aa].groups[aaa].Name + '" class="IconMedium fa-users"></span>';
																str += '	</div>';
																str += '	<div class="PaddingSmall HContent55 InputHeight FloatLeft Ellipsis">' + groups[a].groups[aa].groups[aaa].Name + (groups[a].groups[aa].groups[aaa].Owner?' (by '+groups[a].groups[aa].groups[aaa].Owner+')':'') + '</div>';
										
																str += '	<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
																
																if( Application.checkAppPermission( [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
																] ) )
																{
																	//str += '		<button wid="' + groups[a].groups[aa].groups[aaa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"></button>';
																	
																	str += CustomToggle( 'wid_' + groups[a].groups[aa].groups[aaa].ID, 'FloatRight', null, function (  )
																	{
						
																		var args = { 
																			id     : this.id.split( 'wid_' )[1], 
																			users  : userInfo.ID, 
																			authid : Application.authId 
																		};
													
																		args.args = JSON.stringify( {
																			'type'    : 'write', 
																			'context' : 'application', 
																			'authid'  : Application.authId, 
																			'data'    : { 
																				'permission' : [ 
																					'PERM_WORKGROUP_CREATE_GLOBAL', 
																					'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																					'PERM_WORKGROUP_UPDATE_GLOBAL', 
																					'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																					'PERM_WORKGROUP_GLOBAL', 
																					'PERM_WORKGROUP_WORKGROUP' 
																				]
																			}, 
																			'object'   : 'workgroup', 
																			'objectid' : this.id.split( 'wid_' )[1] 
																		} );
													
																		if( this.checked )
																		{
																			// Toggle on ...
														
																			if( args && args.id && args.users )
																			{
																				let f = new Library( 'system.library' );
																				f.btn = this;
																				f.onExecuted = function( e, d )
																				{
																
																					// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																					// Refresh Storage ...
																					//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																					Sections.user_disk_cancel( userInfo.ID );
																				}
																				f.execute( 'group/addusers', args );
																			}
														
																		}
																		else
																		{
																			// Toggle off ...
														
																			if( args && args.id && args.users )
																			{
																				let f = new Library( 'system.library' );
																				f.btn = this;
																				f.onExecuted = function( e, d )
																				{
																
																					// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																					// Refresh Storage ...
																					//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																					Sections.user_disk_cancel( userInfo.ID );
																
																				}
																				f.execute( 'group/removeusers', args );
																			}
														
																		}
						
																	}, ( found ? true : false ) );
																	
																}
																
																str += '	</div>';
										
																str += '</div>';
									
															}
								
															str += '</div>';
														}
								
													}
						
													str += '</div>';
												}
					
												str += '</div>';
					
											}
											
											
											
										}
										else
										{
											str += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_workgroups_empty' ) + '</div></div>';
										}
										
										
										ge( 'WorkgroupInner' ).innerHTML = str;
										
										// Hide add / edit button ...
										
										if( this.classList.contains( 'Open' ) || this.classList.contains( 'Closed' ) )
										{
											this.classList.remove( 'Open' );
											this.classList.add( 'Closed' );
										}
										
										// Toggle arrow function, put into function that can be reused some time ...
										
										let workArr = ge( 'WorkgroupInner' ).getElementsByTagName( 'span' );
										
										if( workArr )
										{
											for( var a = 0; a < workArr.length; a++ )
											{
												
												if( workArr[ a ].classList.contains( 'fa-caret-right' ) || workArr[ a ].classList.contains( 'fa-caret-down' ) )
												{
													
													( function( b ) {
														b.onclick = function( e )
														{
															let pnt = this.parentNode.parentNode.parentNode;
															
															if( this.classList.contains( 'fa-caret-right' ) )
															{
																// Toggle open ...
																
																this.classList.remove( 'fa-caret-right' );
																this.classList.add( 'fa-caret-down' );
																
																let divs = pnt.getElementsByTagName( 'div' );
																
																if( divs )
																{
																	for( var c = 0; c < divs.length; c++ )
																	{
																		if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
																		{
																			divs[c].classList.remove( 'Closed' );
																			divs[c].classList.add( 'Open' );
																			
																			break;
																		}
																	}
																}
															}
															else
															{
																// Toggle close ...
																
																this.classList.remove( 'fa-caret-down' );
																this.classList.add( 'fa-caret-right' );
																
																let divs = pnt.getElementsByTagName( 'div' );
																
																if( divs )
																{
																	for( var c = 0; c < divs.length; c++ )
																	{
																		if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
																		{
																			divs[c].classList.remove( 'Open' );
																			divs[c].classList.add( 'Closed' );
																			
																			break;
																		}
																	}
																}
															}
															
														}
													} )( workArr[ a ] );
													
												}
												
											}
										}
										
										let workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
							
										if( workBtns )
										{
											for( var a = 0; a < workBtns.length; a++ )
											{
												// Toggle user relation to workgroup
												( function( b ) {
													b.onclick = function( e )
													{
														let args = { 
															id     : this.getAttribute( 'wid' ), 
															users  : userInfo.ID, 
															authid : Application.authId 
														};
														
														args.args = JSON.stringify( {
															'type'    : 'write', 
															'context' : 'application', 
															'authid'  : Application.authId, 
															'data'    : { 
																'permission' : [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 
																	'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 
																	'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL', 
																	'PERM_WORKGROUP_WORKGROUP' 
																]
															}, 
															'object'   : 'workgroup', 
															'objectid' : this.getAttribute( 'wid' ) 
														} );
														
														if( this.classList.contains( 'fa-toggle-off' ) )
														{
															// Toggle on ...
															
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{

																	this.btn.classList.remove( 'fa-toggle-off' );
																	this.btn.classList.add( 'fa-toggle-on' );
																	
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																	
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																}
																f.execute( 'group/addusers', args );
															}
															
														}
														else
														{
															// Toggle off ...
															
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{
																	
																	this.btn.classList.remove( 'fa-toggle-on' );
																	this.btn.classList.add( 'fa-toggle-off' );
																	
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																	
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																	
																}
																f.execute( 'group/removeusers', args );
															}
															
														}
														
													}
												} )( workBtns[ a ] );
											}
										}
										
										
										
										let workInps = ge( 'WorkgroupInner' ).getElementsByTagName( 'input' );
							
										if( workInps )
										{
											for( var a = 0; a < workInps.length; a++ )
											{
												// Toggle user relation to workgroup
												( function( b ) {
													b.onclick = function( e )
													{
														
														var args = { 
															id     : this.id.split( 'wid_' )[1], 
															users  : userInfo.ID, 
															authid : Application.authId 
														};
					
														args.args = JSON.stringify( {
															'type'    : 'write', 
															'context' : 'application', 
															'authid'  : Application.authId, 
															'data'    : { 
																'permission' : [ 
																	'PERM_WORKGROUP_CREATE_GLOBAL', 
																	'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_UPDATE_GLOBAL', 
																	'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																	'PERM_WORKGROUP_GLOBAL', 
																	'PERM_WORKGROUP_WORKGROUP' 
																]
															}, 
															'object'   : 'workgroup', 
															'objectid' : this.id.split( 'wid_' )[1] 
														} );
					
														if( this.checked )
														{
															// Toggle on ...
						
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{
								
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
								
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																}
																f.execute( 'group/addusers', args );
															}
						
														}
														else
														{
															// Toggle off ...
						
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.onExecuted = function( e, d )
																{
								
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
								
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
								
																}
																f.execute( 'group/removeusers', args );
															}
						
														}
														
													}
												} )( workInps[ a ] );
											}
										}
										
										
										
										sortgroups( 'Name', 'ASC' );
	
										let wgc = ge( 'WorkgroupEditBack' );
										wgc.wge = this;
										
										if( wgc.classList.contains( 'Open' ) || wgc.classList.contains( 'Closed' ) )
										{
											wgc.classList.remove( 'Closed' );
											wgc.classList.add( 'Open' );
										}
										
										if( wgc ) wgc.onclick = function( e )
										{
											
											
											let inpu = ge( 'AdminWorkgroupContainer' ).getElementsByTagName( 'input' )[0];
											inpu.value = '';
									
											if( ge( 'WorkgroupSearchCancelBtn' ) && ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) )
											{
												ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Open' );
												ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Closed' );
											}
											
											
											
											this.wge.wids = {};
											this.wge.wgroups = false;
										
											if( ge( 'WorkgroupInner' ) && ge( 'WorkgroupInner' ).innerHTML )
											{
												let workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
									
												if( workBtns )
												{
													for( var a = 0; a < workBtns.length; a++ )
													{
														if( workBtns[a] && workBtns[a].classList.contains( 'fa-toggle-on' ) && workBtns[a].getAttribute( 'wid' ) )
														{
															this.wge.wids[ workBtns[a].getAttribute( 'wid' ) ] = true;
														}
													}
												}
												
												let workInps = ge( 'WorkgroupInner' ).getElementsByTagName( 'input' );
									
												if( workInps )
												{
													for( var a = 0; a < workInps.length; a++ )
													{
														if( workInps[a] && workInps[a].checked && workInps[a].id.split( 'wid_' )[1] )
														{
															this.wge.wids[ workInps[a].id.split( 'wid_' )[1] ] = true;
														}
													}
												}
												
											}
										
											let wstr = '';
										
											if( groups )
											{
												for( var b in groups )
												{
													
													if( groups[b].Name && this.wge.wids[ groups[b].ID ] )
													{
														wstr += '<div>';
														wstr += '<div class="HRow">';
														wstr += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
														wstr += '		<span name="' + groups[b].Name + '" class="IconMedium fa-users"></span>';
														wstr += '	</div>';
														wstr += '	<div class="PaddingSmall InputHeight FloatLeft Ellipsis">' + groups[b].Name + '</div>';
														wstr += '	<div class="PaddingSmall HContent40 FloatRight Ellipsis">';
														
														if( Application.checkAppPermission( [ 
															'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
															'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
															'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
														] ) )
														{
															//wstr += '		<button wid="' + groups[b].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-on"> </button>';
															wstr += CustomToggle( 'wid_' + groups[b].ID, 'FloatRight', null, function (  )
															{
							
																var args = { 
																	id     : this.id.split( 'wid_' )[1], 
																	users  : userInfo.ID, 
																	authid : Application.authId 
																};
														
																args.args = JSON.stringify( {
																	'type'    : 'write', 
																	'context' : 'application', 
																	'authid'  : Application.authId, 
																	'data'    : { 
																		'permission' : [ 
																			'PERM_WORKGROUP_CREATE_GLOBAL', 
																			'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																			'PERM_WORKGROUP_UPDATE_GLOBAL', 
																			'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																			'PERM_WORKGROUP_GLOBAL', 
																			'PERM_WORKGROUP_WORKGROUP' 
																		]
																	}, 
																	'object'   : 'workgroup', 
																	'objectid' : this.id.split( 'wid_' )[1] 
																} );
														
																if( this.checked )
																{
																	// Toggle off ...
																
																	if( args && args.id && args.users )
																	{
																		let f = new Library( 'system.library' );
																		f.btn = this;
																		f.wids = wids;
																		f.onExecuted = function( e, d )
																		{
																			
																			this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
																	
																			let pnt = this.btn.parentNode.parentNode;
																	
																			if( pnt )
																			{
																				pnt.innerHTML = '';
																			}
																		
																			// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																		
																			// Refresh Storage ...
																			//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																			Sections.user_disk_cancel( userInfo.ID );
																		
																		}
																		f.execute( 'group/removeusers', args );
																	}
															
																}
							
															}, true );
															
														}
														
														wstr += '	</div>';
														wstr += '</div>';
														wstr += '</div>';
													}
												
													if( groups[b].groups.length > 0 )
													{
														for( var k in groups[b].groups )
														{
															if( groups[b].groups[k] && groups[b].groups[k].ID )
															{
																if( groups[b].groups[k].Name && this.wge.wids[ groups[b].groups[k].ID ] )
																{
																	wstr += '<div>';
																	wstr += '<div class="HRow">';
																	wstr += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
																	wstr += '		<span name="' + groups[b].groups[k].Name + '" class="IconMedium fa-users"></span>';
																	wstr += '	</div>';
																	wstr += '	<div class="PaddingSmall InputHeight FloatLeft Ellipsis">' + groups[b].groups[k].Name + '</div>';
																	wstr += '	<div class="PaddingSmall HContent40 FloatRight Ellipsis">';
																	
																	if( Application.checkAppPermission( [ 
																		'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
																	] ) )
																	{
																		//wstr += '		<button wid="' + groups[b].groups[k].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-on"> </button>';
																		
																		wstr += CustomToggle( 'wid_' + groups[b].groups[k].ID, 'FloatRight', null, function (  )
																		{
							
																			var args = { 
																				id     : this.id.split( 'wid_' )[1], 
																				users  : userInfo.ID, 
																				authid : Application.authId 
																			};
														
																			args.args = JSON.stringify( {
																				'type'    : 'write', 
																				'context' : 'application', 
																				'authid'  : Application.authId, 
																				'data'    : { 
																					'permission' : [ 
																						'PERM_WORKGROUP_CREATE_GLOBAL', 
																						'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																						'PERM_WORKGROUP_UPDATE_GLOBAL', 
																						'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																						'PERM_WORKGROUP_GLOBAL', 
																						'PERM_WORKGROUP_WORKGROUP' 
																					]
																				}, 
																				'object'   : 'workgroup', 
																				'objectid' : this.id.split( 'wid_' )[1] 
																			} );
														
																			if( this.checked )
																			{
																				// Toggle off ...
																
																				if( args && args.id && args.users )
																				{
																					let f = new Library( 'system.library' );
																					f.btn = this;
																					f.wids = wids;
																					f.onExecuted = function( e, d )
																					{
																			
																						this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
																	
																						let pnt = this.btn.parentNode.parentNode;
																	
																						if( pnt )
																						{
																							pnt.innerHTML = '';
																						}
																		
																						// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																		
																						// Refresh Storage ...
																						//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																						Sections.user_disk_cancel( userInfo.ID );
																		
																					}
																					f.execute( 'group/removeusers', args );
																				}
															
																			}
							
																		}, true );
																		
																	}
																	
																	wstr += '	</div>';
																	wstr += '</div>';
																	wstr += '</div>';
																}
															
																if( groups[b].groups[k].groups.length > 0 )
																{
																	for( var i in groups[b].groups[k].groups )
																	{
																		if( groups[b].groups[k].groups[i] && groups[b].groups[k].groups[i].ID )
																		{
																			if( groups[b].groups[k].groups[i].Name && this.wge.wids[ groups[b].groups[k].groups[i].ID ] )
																			{
																				wstr += '<div>';
																				wstr += '<div class="HRow">';
																				wstr += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
																				wstr += '		<span name="' + groups[b].groups[k].groups[i].Name + '" class="IconMedium fa-users"></span>';
																				wstr += '	</div>';
																				wstr += '	<div class="PaddingSmall InputHeight FloatLeft Ellipsis">' + groups[b].groups[k].groups[i].Name + '</div>';
																				wstr += '	<div class="PaddingSmall HContent40 FloatRight Ellipsis">';
																				
																				if( Application.checkAppPermission( [ 
																					'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																					'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
																				] ) )
																				{
																					//wstr += '		<button wid="' + groups[b].groups[k].groups[i].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-on"> </button>';
																					
																					wstr += CustomToggle( 'wid_' + groups[b].groups[k].groups[i].ID, 'FloatRight', null, function (  )
																					{
							
																						var args = { 
																							id     : this.id.split( 'wid_' )[1], 
																							users  : userInfo.ID, 
																							authid : Application.authId 
																						};
														
																						args.args = JSON.stringify( {
																							'type'    : 'write', 
																							'context' : 'application', 
																							'authid'  : Application.authId, 
																							'data'    : { 
																								'permission' : [ 
																									'PERM_WORKGROUP_CREATE_GLOBAL', 
																									'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																									'PERM_WORKGROUP_UPDATE_GLOBAL', 
																									'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																									'PERM_WORKGROUP_GLOBAL', 
																									'PERM_WORKGROUP_WORKGROUP' 
																								]
																							}, 
																							'object'   : 'workgroup', 
																							'objectid' : this.id.split( 'wid_' )[1] 
																						} );
														
																						if( this.checked )
																						{
																							// Toggle off ...
																
																							if( args && args.id && args.users )
																							{
																								let f = new Library( 'system.library' );
																								f.btn = this;
																								f.wids = wids;
																								f.onExecuted = function( e, d )
																								{
																			
																									this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
																	
																									let pnt = this.btn.parentNode.parentNode;
																	
																									if( pnt )
																									{
																										pnt.innerHTML = '';
																									}
																		
																									// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																		
																									// Refresh Storage ...
																									//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																									Sections.user_disk_cancel( userInfo.ID );
																		
																								}
																								f.execute( 'group/removeusers', args );
																							}
															
																						}
							
																					}, true );	
																					
																				}
																				
																				wstr += '	</div>';
																				wstr += '</div>';
																				wstr += '</div>';
																			}
																		}
																	}
																}
															}
														}
													}
													
													
													
												}
											}
										
											
										
											this.wge.activated = false;
											ge( 'WorkgroupInner' ).innerHTML = wstr;
										
											let workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
							
											if( workBtns )
											{
												for( var a = 0; a < workBtns.length; a++ )
												{
													// Toggle user relation to workgroup
													( function( b, wids ) {
														b.onclick = function( e )
														{
															let args = { 
																id     : this.getAttribute( 'wid' ), 
																users  : userInfo.ID, 
																authid : Application.authId 
															};
														
															args.args = JSON.stringify( {
																'type'    : 'write', 
																'context' : 'application', 
																'authid'  : Application.authId, 
																'data'    : { 
																	'permission' : [ 
																		'PERM_WORKGROUP_CREATE_GLOBAL', 
																		'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_UPDATE_GLOBAL', 
																		'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_GLOBAL', 
																		'PERM_WORKGROUP_WORKGROUP' 
																	]
																}, 
																'object'   : 'workgroup', 
																'objectid' : this.getAttribute( 'wid' ) 
															} );
														
															if( this.classList.contains( 'fa-toggle-on' ) )
															{
																// Toggle off ...
																
																if( args && args.id && args.users )
																{
																	let f = new Library( 'system.library' );
																	f.btn = this;
																	f.wids = wids;
																	f.onExecuted = function( e, d )
																	{
																		this.btn.classList.remove( 'fa-toggle-on' );
																		this.btn.classList.add( 'fa-toggle-off' );
																	
																		this.wids[ this.btn.getAttribute( 'wid' ) ] = false;
																	
																		let pnt = this.btn.parentNode.parentNode;
																	
																		if( pnt )
																		{
																			pnt.innerHTML = '';
																		}
																		
																		// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																		
																		// Refresh Storage ...
																		//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																		Sections.user_disk_cancel( userInfo.ID );
																		
																	}
																	f.execute( 'group/removeusers', args );
																}
															
															}
														}
													} )( workBtns[ a ], this.wge.wids );
												}
											}
											
											
											
											let workInps = ge( 'WorkgroupInner' ).getElementsByTagName( 'input' );
							
											if( workInps )
											{
												for( var a = 0; a < workInps.length; a++ )
												{
													// Toggle user relation to workgroup
													( function( b, wids ) {
														b.onclick = function( e )
														{
															
															var args = { 
																id     : this.id.split( 'wid_' )[1], 
																users  : userInfo.ID, 
																authid : Application.authId 
															};
													
															args.args = JSON.stringify( {
																'type'    : 'write', 
																'context' : 'application', 
																'authid'  : Application.authId, 
																'data'    : { 
																	'permission' : [ 
																		'PERM_WORKGROUP_CREATE_GLOBAL', 
																		'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_UPDATE_GLOBAL', 
																		'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
																		'PERM_WORKGROUP_GLOBAL', 
																		'PERM_WORKGROUP_WORKGROUP' 
																	]
																}, 
																'object'   : 'workgroup', 
																'objectid' : this.id.split( 'wid_' )[1] 
															} );
															
															// Toggle off ...
														
															if( args && args.id && args.users )
															{
																let f = new Library( 'system.library' );
																f.btn = this;
																f.wids = wids;
																f.onExecuted = function( e, d )
																{
																	
																	this.wids[ this.btn.id.split( 'wid_' )[1] ] = false;
															
																	let pnt = this.btn.parentNode.parentNode.parentNode;
															
																	if( pnt )
																	{
																		pnt.innerHTML = '';
																	}
																
																	// TODO: Create functionality to mount / unmount Workgroup drive(s) connected to this workgroup
																
																	// Refresh Storage ...
																	//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
																	Sections.user_disk_cancel( userInfo.ID );
																
																}
																f.execute( 'group/removeusers', args );
															}
															
														}
													} )( workInps[ a ], this.wge.wids );
												}
											}
											
											
											
											// Hide back button ...
											
											if( this.classList.contains( 'Open' ) || this.classList.contains( 'Closed' ) )
											{
												this.classList.remove( 'Open' );
												this.classList.add( 'Closed' );
											}
											
											// Show add / edit button ...
											
											if( this.wge.classList.contains( 'Open' ) || this.wge.classList.contains( 'Closed' ) )
											{
												this.wge.classList.remove( 'Closed' );
												this.wge.classList.add( 'Open' );
											} 
											
											
											
											// Refresh Storage ...
											//console.log( '// Refresh Storage ... Sections.user_disk_cancel( '+userInfo.ID+' )' );
											Sections.user_disk_cancel( userInfo.ID );
											
											sortgroups( 'Name', 'ASC' );
											
										}
										
										
										
										
									
								}
								
								
								// Search ...............
								
								let searchgroups = function ( filter, server )
								{
									
									if( ge( 'WorkgroupInner' ) )
									{
										var list = ge( 'WorkgroupInner' ).getElementsByTagName( 'div' );
										
										ge( 'WorkgroupInner' ).className = ge( 'WorkgroupInner' ).className.split( ' Visible' ).join( '' ) + ( filter ? ' Visible' : '' );
										
										if( list.length > 0 )
										{
											for( var a = 0; a < list.length; a++ )
											{
												if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
								
												var strong = list[a].getElementsByTagName( 'strong' )[0];
												var span = list[a].getElementsByTagName( 'span' )[0];
								
												if( strong || span )
												{
									
													if( !filter || filter == '' 
													|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
													|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
													|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
													)
													{
														list[a].style.display = '';
										
														if( list[a].parentNode.parentNode && list[a].parentNode.parentNode.parentNode && list[a].parentNode.parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
														{
															//if( list[a].parentNode.classList.contains( 'Closed' ) )
															//{
															//	list[a].parentNode.classList.remove( 'Closed' );
															//	list[a].parentNode.classList.add( 'Open' );
															//}
											
															list[a].parentNode.style.display = '';
															list[a].parentNode.parentNode.style.display = '';
														}
													}
													else if( list[a].parentNode && list[a].parentNode.className )
													{
														list[a].style.display = 'none';
													}
												}
											}

										}
						
										if( ge( 'WorkgroupSearchCancelBtn' ) )
										{
											if( !filter && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
											{
												ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Open' );
												ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Closed' );
								
												if( list.length > 0 )
												{
													for( var a = 0; a < list.length; a++ )
													{
														if( list[a].classList.contains( 'Open' ) )
														{
															list[a].classList.remove( 'Open' );
															list[a].classList.add( 'Closed' );
														}
													}
												}
											}
							
											else if( filter != '' && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
											{
												ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Closed' );
												ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Open' );
											}
										}
									}
									
								};
								
								// Sort .............
								
								let sortgroups = function ( sortby, orderby )
								{
									
									//
									
									let _this = ge( 'WorkgroupInner' );
									
									if( _this )
									{
										orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
										
										let list = _this.getElementsByTagName( 'div' );
										
										if( list.length > 0 )
										{
											let output = [];
											
											let callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
											
											for( var a = 0; a < list.length; a++ )
											{
												if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
												
												let span = list[a].getElementsByTagName( 'span' )[0];
												
												if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' && span.getAttribute( sortby.toLowerCase() ) )
												{
													if( !list[a].parentNode.className )
													{
														let obj = { 
															sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
															content : list[a].parentNode
														};
													
														output.push( obj );
													}
												}
											}
											
											if( output.length > 0 )
											{
												// Sort ASC default
												
												output.sort( callback );
												
												// Sort DESC
												
												if( orderby == 'DESC' ) 
												{ 
													output.reverse();  
												}
												
												_this.innerHTML = '';
												
												_this.setAttribute( 'orderby', orderby );
												
												for( var key in output )
												{
													if( output[key] && output[key].content )
													{
														// Add row
														_this.appendChild( output[key].content );
													}
												}
											}
										}
									}
									
								};
								
								sortgroups( 'Name', 'ASC' );
								
								// .................
								
								if( ge( 'AdminWorkgroupContainer' ) )
								{
									let inpu = ge( 'AdminWorkgroupContainer' ).getElementsByTagName( 'input' )[0];
									inpu.onkeyup = function( e )
									{
										searchgroups( this.value );
									}
									ge( 'WorkgroupSearchCancelBtn' ).onclick = function( e )
									{
										searchgroups( false );
										inpu.value = '';
									}
								}
								
							},
							
							roles : function (  )
							{
								
								if( ge( 'RolesGui' ) && rstr )
								{
									
									
									let o = ge( 'RolesGui' ); if( o ) o.innerHTML = '';
									
									let divs = appendChild( [ 
										{ 
											'element' : function() 
											{
												let d = document.createElement( 'div' );
												d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
												return d;
											}(),
											'child' : 
											[ 
												{ 
													'element' : function(  ) 
													{
														let d = document.createElement( 'div' );
														d.className = 'PaddingSmall HContent40 FloatLeft';
														d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
														d.style.cursor = 'pointer';
														d.onclick = function(  )
														{
															sortroles( 'Name' );
														};
														return d;
													}(  ) 
												}, 
												{ 
													'element' : function( _this ) 
													{
														let d = document.createElement( 'div' );
														d.className = 'PaddingSmall HContent45 FloatLeft Relative';
														d.innerHTML = '<strong>' + i18n( 'i18n_workgroups' ) + '</strong>';
														d.style.cursor = 'pointer';
														d.onclick = function(  )
														{
															sortroles( 'Workgroups' );
														};
														return d;
													}( this )
												},
												{ 
													'element' : function() 
													{
														let d = document.createElement( 'div' );
														d.className = 'PaddingSmall HContent15 FloatLeft Relative';
														return d;
													}()
												}
											]
										},
										{
											'element' : function() 
											{
												let d = document.createElement( 'div' );
												d.className = 'HRow Box Padding';
												d.style.overflow = 'auto';
												d.style.maxHeight = '369px';
												d.id = 'RolesInner';
												return d;
											}()
										}
									] );
		
									if( divs )
									{
										for( var i in divs )
										{
											if( divs[i] && o )
											{
												o.appendChild( divs[i] );
											}
										}
									}
									
									
									
									ge( 'RolesInner' ).innerHTML = rstr;
									
									let inpi = ge( 'AdminRoleContainer' ).getElementsByTagName( 'input' )[0];
									inpi.value = '';
									
									if( ge( 'RolesSearchCancelBtn' ) && ge( 'RolesSearchCancelBtn' ).classList.contains( 'Open' ) )
									{
										ge( 'RolesSearchCancelBtn' ).classList.remove( 'Open' );
										ge( 'RolesSearchCancelBtn' ).classList.add( 'Closed' );
									}
									
									// Search ...............
									
									let searchroles = function ( filter, server )
									{
									
										if( ge( 'RolesInner' ) )
										{
											let list = ge( 'RolesInner' ).getElementsByTagName( 'div' );
										
											if( list.length > 0 )
											{
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
												
													let strong = list[a].getElementsByTagName( 'strong' )[0];
													let span = list[a].getElementsByTagName( 'span' )[0];
												
													if( strong || span )
													{
														if( !filter || filter == '' 
														|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
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
		
											}
											
											if( ge( 'RolesSearchCancelBtn' ) )
											{
												if( !filter && ( ge( 'RolesSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RolesSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'RolesSearchCancelBtn' ).classList.remove( 'Open' );
													ge( 'RolesSearchCancelBtn' ).classList.add( 'Closed' );
												}
											
												else if( filter != '' && ( ge( 'RolesSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RolesSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'RolesSearchCancelBtn' ).classList.remove( 'Closed' );
													ge( 'RolesSearchCancelBtn' ).classList.add( 'Open' );
												}
											}
										}
									
									};
								
									// Sort .............
								
									let sortroles = function ( sortby )
									{
									
										//
									
										let _this = ge( 'RolesInner' );
									
										if( _this )
										{
											let orderby = ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' );
										
											let list = _this.getElementsByTagName( 'div' );
										
											if( list.length > 0 )
											{
												let output = [];
											
												let callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
											
												for( var a = 0; a < list.length; a++ )
												{
													if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
												
													var span = list[a].getElementsByTagName( 'span' )[0];
													
													if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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
												
													if( orderby == 'DESC' ) 
													{ 
														output.reverse();  
													}
												
													_this.innerHTML = '';
												
													_this.setAttribute( 'orderby', orderby );
												
													for( var key in output )
													{
														if( output[key] && output[key].content )
														{
															// Add row
															_this.appendChild( output[key].content );
														}
													}
												}
											}
										}
									
									};
									
									// .................
									
									let inpu = ge( 'AdminRoleContainer' ).getElementsByTagName( 'input' )[0];
									inpu.onkeyup = function( e )
									{
										searchroles( this.value );
									}
									ge( 'RolesSearchCancelBtn' ).onclick = function( e )
									{
										searchroles( false );
										inpu.value = '';
									}
									
								}
								
							},
							
							storage : function (  )
							{
								
								if( ge( 'StorageGui' ) && mlst )
								{
									ge( 'StorageGui' ).innerHTML = mlst;
								}
								
							},
							
							appids : function ( soft )
							{
								var output = []; var ids = {};
								
								if( soft )
								{
									var i = 0;
									
									for( var a in soft )
									{
										if( soft[a] && soft[a].ID && soft[a].Name )
										{
											output.push( soft[a] );
										}
									}
									
									if( output )
									{
										for( var b in output )
										{
											ids[ i++ ] = output[b];
										}
									}
									
								}
								
								//console.log( 'appids', ids );
								
								return ids;
						
							}( soft ),
							
							dockids : function ( dock )
							{
								var output = []; var ids = {};
								
								if( dock )
								{
									var i = 0;
									
									for( var a in dock )
									{
										if( dock[a] && dock[a].Id && dock[a].Name )
										{
											// Force int to be able to sort ...
											dock[a].SortOrder = parseInt( dock[a].SortOrder );
											
											output.push( dock[a] );
										}
									}
									
									// Sort ASC default
									
									output.sort( function ( a, b ) { return ( a.SortOrder > b.SortOrder ) ? 1 : -1; } );
									
									if( output )
									{
										for( var b in output )
										{	
											ids[ i++ ] = output[b];
										}
									}
									
								}
								
								//console.log( 'dockids', ids );
								
								return ids;
						
							}( dock ),
							
							startids : function ( star )
							{
								var ids = {};
								
								if( star )
								{
									if( ShowLog ) console.log( 'star ', star );
							
									var i = 0;
							
									for( var a in star )
									{
										if( star[a] && star[a].split( 'launch ' )[1] )
										{
											ids[ i++ ] = star[a];
										}
									}
								}
						
								return ids;
							
							}( star ),
							
							updateids : function ( mode, key, value )
							{
								
								// TODO: ALWAYS CHECK BEFORE CHANGING VAR TO LET, CODE BROKE !!!!
								
								switch( mode )
								{
									
									case 'applications':
										
										if( this.appids )
										{
											var arr = []; var i = 0; var found = false;
											
											for( var a in this.appids )
											{
												if( this.appids[a] && this.appids[a].Name )
												{
													if( key && this.appids[a].Name.toLowerCase() == key.toLowerCase() )
													{
														if( value[0] )
														{
															var obj = { Name: value[0], DockStatus: value[1] };
														}
														
														this.appids[a] = ( value ? obj : false ); found = true;
													}
										
													if( this.appids[a] && this.appids[a].Name )
													{
														arr.push( this.appids[a].Name + '_' + this.appids[a].DockStatus );
													}
												}
									
												i++;
											}
											
											if( key && value && !found )
											{
												if( value[0] )
												{
													arr.push( value[0] + '_' + value[1] );
													
													var obj = { Name: value[0], DockStatus: value[1] };
													
													this.appids[ i++ ] = obj; 
												}
											}
											
											//console.log( '[1] applications', arr, [ mode, key, value ] );
											
											if( ge( 'TempApplications' ) )
											{
												ge( 'TempApplications' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
											}
										}
										else if( key && value )
										{
											if( value[0] )
											{
												var obj = { Name: value[0], DockStatus: value[1] };
												
												this.appids[0] = obj;
											}
											
											//console.log( '[2] applications', arr, [ mode, key, value ] );
											
											if( ge( 'TempApplications' ) && value[0] )
											{
												ge( 'TempApplications' ).setAttribute( 'value', value[0] + '_' + value[1] );
											}
										}
							
										break;
										
									case 'dock':
										
										if( this.dockids )
										{
											var arr = []; var i = 0; var found = false;
											
											for( var a in this.dockids )
											{
												if( this.dockids[a] && this.dockids[a].Name )
												{
													if( key && this.dockids[a].Name.toLowerCase() == key.toLowerCase() )
													{
														if( value )
														{
															value.SortOrder = a;
														}
														
														this.dockids[a] = ( value ? value : false ); found = true;
													}
												}
												
												i++;
											}
											
											if( key && value && !found )
											{
												value.SortOrder = i;
												
												this.dockids[ i++ ] = value; 
											}
											
											//console.log( '[1] dock', this.dockids, [ mode, key, value ] );
										}
										else if( key && value )
										{
											value.SortOrder = 0;
											
											this.dockids[0] = value;
										}
										
										//console.log( '[2] dock', this.dockids, [ mode, key, value ] );
										
										break;
									
									case 'startup':
										
										if( ge( 'TempStartup' ) )
										{
											if( this.startids )
											{
												var arr = []; var i = 0;
										
												for( var a in this.startids )
												{
													if( this.startids[a] && this.startids[a].split( 'launch ' )[1] )
													{
														if( key && this.startids[a].split( 'launch ' )[1].toLowerCase() == key.toLowerCase() )
														{
															this.startids[a] = ( value ? value : false ); found = true;
														}
												
														arr.push( this.startids[a] );
													}
											
													i++;
												}
										
												if( key && value && !found )
												{
													if( value.split( 'launch ' )[1] )
													{
														arr.push( value );
												
														this.startids[ i++ ] = value; 
													}
												}
										
												if( ShowLog ) console.log( 'startup ', this.startids );
										
												if( ge( 'TempStartup' ) )
												{
													ge( 'TempStartup' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
												}
											}
											else if( key && value )
											{
												this.startids[0] = value;
											}
										}
								
										break;
									
								}
					
							},
							
							mode : { applications : 'list', dock : 'list', startup : 'list' },
							
							// Applications ------------------------------------------------------------------------------------
							
							applications : function ( func )
							{
						
								// Editing applications
						
								let init =
								{
							
									func : this,
							
									ids  : this.appids,
									
									head : function (  )
									{
										
										if( ge( 'AdminApplicationContainer' ) )
										{
											let inpu = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
											inpu.value = '';
										
											if( ge( 'ApplicationSearchCancelBtn' ) && ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) )
											{
												ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
												ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
											}
										}
										
										let o = ge( 'ApplicationGui' ); if( o ) o.innerHTML = '<input type="hidden" id="TempApplications">';
										
										this.func.updateids( 'applications' );
								
										let divs = appendChild( [ 
											{ 
												'element' : function() 
												{
													let d = document.createElement( 'div' );
													//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
													d.className = 'HRow BackgroundNegative Negative Padding';
													return d;
												}(),
												'child' : 
												[ 
													{ 
														'element' : function( _this ) 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
															d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortapps( 'Name' );
															};
															return d;
														}( this ) 
													}, 
													{ 
														'element' : function( _this ) 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
															d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortapps( 'Category' );
															};
															return d;
														}( this )
													},
													{ 
														'element' : function() 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallRight HContent15 FloatLeft Relative';
															return d;
														}()
													}
												]
											},
											{
												'element' : function() 
												{
													let d = document.createElement( 'div' );
													d.className = 'HRow List Padding';
													d.style.overflow = 'auto';
													d.style.maxHeight = '366px';
													d.id = 'ApplicationInner';
													return d;
												}()
											}
										] );
						
										if( divs )
										{
											for( var i in divs )
											{
												if( divs[i] && o )
												{
													o.appendChild( divs[i] );
												}
											}
										}
								
									},
									
									list : function (  )
									{
								
										this.func.mode[ 'applications' ] = 'list';
										
										if( apps )
										{
											this.head();
									
											let o = ge( 'ApplicationInner' ); if( o ) o.innerHTML = '';
									
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a].Name )
													{
														var found = false;
												
														for( var k in apps )
														{
															if( this.ids[a] && this.ids[a].Name == apps[k].Name )
															{
																found = true;
																
																break;
															}
														}
														
														if( !found ) continue;
											
														var divs = appendChild( [
															{ 
																'element' : function() 
																{
																	let d = document.createElement( 'div' );
																	d.className = 'HRow';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'TextCenter PaddingSmall HContent10 FloatLeft Ellipsis';
																			return d;
																		}(),
																		 'child' : 
																		[ 
																			{ 
																				'element' : function() 
																				{
																					let d = document.createElement( 'span' );
																					d.setAttribute( 'Name', apps[k].Name );
																					d.setAttribute( 'Category', apps[k].Category );
																					d.style.backgroundImage = "url('/iconthemes/friendup15/File_Binary.svg')";
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																					d.style.display = 'block';
																					return d;
																				}(), 
																				 'child' : 
																				[ 
																					{
																						'element' : function() 
																						{
																							let d = document.createElement( 'div' );
																							if( apps[k].Preview )
																							{
																								d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																								d.style.backgroundSize = 'contain';
																								d.style.width = '24px';
																								d.style.height = '24px';
																							}
																							return d;
																						}()
																					}
																				]
																			}
																		]
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis name';
																			d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																			return d;
																		}() 
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis category';
																			d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																			return d;
																		}() 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'HContent15 FloatLeft';
																			return d;
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( ids, name, func ) 
																				{
																					if( Application.checkAppPermission( [ 
																						'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																					] ) )
																					{
																						let b = document.createElement( 'button' );
																						b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																						b.onclick = function(  )
																						{
																			
																							let pnt = this.parentNode.parentNode;
																			
																							removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																							{
																				
																								args.func.updateids( 'applications', args.name, false );
																								
																								removeApplication( args.name, userInfo.ID, function( e, d, vars )
																								{
																					
																									if( e && vars )
																									{
																						
																										if( vars.pnt )
																										{
																											vars.pnt.innerHTML = '';
																										}
																			
																										if( vars.func )
																										{	
																											// TODO: Look at dock refresh, doesn't get latest info ...
																											
																											vars.func.updateids( 'dock', args.name, false );
																											
																											vars.func.dock( 'refresh' );
																											
																											args.func.updateids( 'startup', args.name, false );
																							
																											updateStartup( userInfo.ID );
																											
																											vars.func.startup( 'refresh' );
																										}
																						
																									}
																									else
																									{
																										if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																									}
																					
																								}, { pnt: args.pnt, func: args.func } );
																								
																							} );
																			
																						};
																						return b;
																					}
																				}( this.ids, apps[k].Name, this.func ) 
																			}
																		]
																	}
																]
															}
														] );
											
														if( divs )
														{
															for( var i in divs )
															{
																if( divs[i] && o )
																{
																	o.appendChild( divs[i] );
																}
															}
														}
													}
									
												}
										
												// Sort default by Name ASC
												this.sortapps( 'Name', 'ASC' );
										
											}
									
										}
									
									},
							
									edit : function (  )
									{
								
										this.func.mode[ 'applications' ] = 'edit';
								
										if( apps )
										{
											this.head();
									
											let o = ge( 'ApplicationInner' ); if( o ) o.innerHTML = '';
									
											for( var k in apps )
											{
												if( apps[k] && apps[k].Name )
												{
													var found = false;
													
													if( this.ids )
													{
														for( var a in this.ids )
														{
															if( this.ids[a] && this.ids[a].Name == apps[k].Name )
															{
																found = true;
															}
														}
													}
											
													var divs = appendChild( [
														{ 
															'element' : function() 
															{
																let d = document.createElement( 'div' );
																d.className = 'HRow';
																return d;
															}(),
															'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		let d = document.createElement( 'div' );
																		d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																		return d;;
																	}(),
																	 'child' : 
																	[ 
																		{ 
																			'element' : function() 
																			{
																				let d = document.createElement( 'span' );
																				d.setAttribute( 'Name', apps[k].Name );
																				d.setAttribute( 'Category', apps[k].Category );
																				d.style.backgroundImage = "url('/iconthemes/friendup15/File_Binary.svg')";
																				d.style.backgroundSize = 'contain';
																				d.style.width = '24px';
																				d.style.height = '24px';
																				d.style.display = 'block';
																				return d;
																			}(), 
																			 'child' : 
																			[ 
																				{
																					'element' : function() 
																					{
																						let d = document.createElement( 'div' );
																						if( apps[k].Preview )
																						{
																							d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																							d.style.backgroundSize = 'contain';
																							d.style.width = '24px';
																							d.style.height = '24px';
																						}
																						return d;
																					}()
																				}
																			]
																		}
																	]
																},
																{ 
																	'element' : function() 
																	{
																		let d = document.createElement( 'div' );
																		d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis name';
																		d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																		return d;
																	}() 
																}, 
																{ 
																	'element' : function() 
																	{
																		let d = document.createElement( 'div' );
																		d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis category';
																		d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																		return d;
																	}() 
																},
																{ 
																	'element' : function() 
																	{
																		let d = document.createElement( 'div' );
																		d.className = 'PaddingSmall HContent15 FloatLeft Ellipsis';
																		return d;
																	}(),
																	'child' : 
																	[ 
																		{ 
																			'element' : function( ids, name, func ) 
																			{
																				if( Application.checkAppPermission( [ 
																					'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																					'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																					'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																				] ) )
																				{
																					
																					var b = CustomToggle( 'aid_'+name, 'FloatRight', null, function (  )
																					{
																						
																						if( this.checked )
																						{
																							
																							func.updateids( 'applications', name, [ name, '0' ] );
																							
																							addApplication( name, userInfo.ID, function( e, d, vars )
																							{
																								
																								if( e && vars )
																								{
																						
																									if( vars.func )
																									{
																										vars.func.dock( 'refresh' );
																										vars.func.startup( 'refresh' );
																									}
																						
																								}
																								else
																								{
																									if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																								}
																					
																							}, { _this: this, func: func } );
																							
																						}
																						else
																						{
																							
																							func.updateids( 'applications', name, false );
																							
																							func.updateids( 'startup', name, false );
																							
																							updateStartup( userInfo.ID );
																							
																							removeApplication( name, userInfo.ID, function( e, d, vars )
																							{
																					
																								if( e && vars )
																								{
																									
																									if( vars.func )
																									{
																										vars.func.dock( 'refresh' );
																										vars.func.startup( 'refresh' );
																									}
																						
																								}
																								else
																								{
																									if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																								}
																					
																							}, { _this: this, func: func } );
																							
																						}
																						
																					}, ( found ? true : false ), 1 );
																					
																					return b;
																				}
																			}( this.ids, apps[k].Name, this.func ) 
																		}
																	]
																}
															]
														}
													] );
											
													if( divs )
													{
														for( var i in divs )
														{
															if( divs[i] && o )
															{
																o.appendChild( divs[i] );
															}
														}
													}
												}
												
												// Sort default by Name ASC
												this.sortapps( 'Name', 'ASC' );
												
											}
									
										}
								
									},
									
									searchapps : function ( filter, server )
									{
										
										if( ge( 'ApplicationInner' ) )
										{
											let list = ge( 'ApplicationInner' ).getElementsByTagName( 'div' );
	
											if( list.length > 0 )
											{
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
													var span = list[a].getElementsByTagName( 'span' )[0];
				
													if( span )
													{
														var param = [
															( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
															( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
														];
														
														if( !filter || filter == ''  
														|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														)
														{
															list[a].style.display = '';
						
															var div = list[a].getElementsByTagName( 'div' );
						
															if( div.length )
															{
																for( var i in div )
																{
																	if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
																	{
																		// TODO: Make text searched for ...
																	}
																}
															}
														}
														else
														{
															list[a].style.display = 'none';
														}
													}
												}
			
											}
											
											if( ge( 'ApplicationSearchCancelBtn' ) )
											{
												if( !filter && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
													ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
												}
												
												else if( filter != '' && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Closed' );
													ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Open' );
												}
											}
										}
										
									},
									
									sortapps : function ( sortby, orderby )
									{
		
										//
		
										let _this = ge( 'ApplicationInner' );
		
										if( _this )
										{
											orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
											
											let list = _this.getElementsByTagName( 'div' );
			
											if( list.length > 0 )
											{
												let output = [];
				
												let callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
				
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
					
													var span = list[a].getElementsByTagName( 'span' )[0];
					
													if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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
					
													if( orderby == 'DESC' ) 
													{ 
														output.reverse();  
													}
					
													_this.innerHTML = '';
					
													_this.setAttribute( 'orderby', orderby );
					
													for( var key in output )
													{
														if( output[key] && output[key].content )
														{
															// Add row
															_this.appendChild( output[key].content );
														}
													}
												}
											}
										}
										
									},
									
									refresh : function (  )
									{
								
										switch( this.func.mode[ 'applications' ] )
										{
									
											case 'list':
										
												this.list();
										
												break;
										
											case 'edit':
										
												this.edit();
										
												break;
										
										}
								
									}
							
								};
								
								switch( func )
								{
							
									case 'head':
								
										init.head();
								
										break;
								
									case 'list':
								
										init.list();
								
										break;
								
									case 'edit':
								
										init.edit();
								
										break;
								
									case 'refresh':
								
										init.refresh();
								
										break;
									
									default:
								
										let etn = ge( 'ApplicationEdit' );
										if( etn )
										{
											
											if( Application.checkAppPermission( [ 
												'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
												'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
												'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
											] ) )
											{
												
												etn.onclick = function( e )
												{
								
													init.edit();
								
													// Hide add / edit button ...
								
													if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
													{
														etn.classList.remove( 'Open' );
														etn.classList.add( 'Closed' );
													}
								
													// Show back button ...
								
													if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
													{
														btn.classList.remove( 'Closed' );
														btn.classList.add( 'Open' );
													}
								
												};
												
											}
											else
											{
												etn.style.display = 'none';
											}
											
										}
						
										let btn = ge( 'ApplicationEditBack' );
										if( btn )
										{
											btn.onclick = function( e )
											{
								
												init.list();
								
												// Hide back button ...
								
												if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
												{
													btn.classList.remove( 'Open' );
													btn.classList.add( 'Closed' );
												}
						
												// Show add / edit button ...
								
												if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
												{
													etn.classList.remove( 'Closed' );
													etn.classList.add( 'Open' );
												}
								
											};
										}
										
										if( ge( 'AdminApplicationContainer' ) )
										{
											let inpu = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
											inpu.onkeyup = function( e )
											{
												init.searchapps( this.value );
											}
											ge( 'ApplicationSearchCancelBtn' ).onclick = function( e )
											{
												init.searchapps( false );
												inpu.value = '';
											}
										}
										
										// Show listed applications ... 
										
										init.list();
								
										break;
								
								}
						
							},
							
							// Dock --------------------------------------------------------------------------------------------
							
							dock : function ( func )
							{
						
								// Editing Dock
						
								let init =
								{
							
									func : this,
							
									ids  : this.dockids,
									
									head : function ( hidecol )
									{
										
										if( ge( 'AdminDockContainer' ) )
										{
											let inpu = ge( 'AdminDockContainer' ).getElementsByTagName( 'input' )[0];
											inpu.value = '';
										
											if( ge( 'DockSearchCancelBtn' ) && ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) )
											{
												ge( 'DockSearchCancelBtn' ).classList.remove( 'Open' );
												ge( 'DockSearchCancelBtn' ).classList.add( 'Closed' );
											}
										}
										
										let o = ge( 'DockGui' ); if( o ) o.innerHTML = '';
								
										this.func.updateids( 'dock' );
										
										let divs = appendChild( [ 
											{ 
												'element' : function() 
												{
													let d = document.createElement( 'div' );
													//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
													d.className = 'HRow BackgroundNegative Negative Padding';
													return d;
												}(),
												'child' : 
												[ 
													{ 
														'element' : function( _this ) 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
															d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortdock( 'Name' );
															};
															return d;
														}( this ) 
													}, 
													{ 
														'element' : function( _this ) 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 FloatLeft Relative';
															d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortdock( 'Category' );
															};
															return d;
														}( this )
													},
													{ 
														'element' : function() 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
															d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
															return d;
														}()
													},
													{ 
														'element' : function() 
														{
															let d = document.createElement( 'div' );
															d.className = 'PaddingSmall HContent10 FloatLeft Relative';
															return d;
														}()
													}
												]
											},
											{
												'element' : function() 
												{
													let d = document.createElement( 'div' );
													d.className = 'HRow Box Padding';
													d.style.overflow = 'auto';
													d.style.maxHeight = '366px';
													d.id = 'DockInner';
													return d;
												}()
											}
										] );
						
										if( divs )
										{
											for( var i in divs )
											{
												if( divs[i] && o )
												{
													o.appendChild( divs[i] );
												}
											}
										}
								
									},
							
									list : function (  )
									{
								
										this.func.mode[ 'dock' ] = 'list';
										
										if( apps )
										{
											this.head( !Application.checkAppPermission( [ 
												'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
												'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
												'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
											] ) );
											
											let o = ge( 'DockInner' ); if( o ) o.innerHTML = '';
											
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a].Name )
													{
														var found = false;
											
														for( var k in apps )
														{
															if( this.ids[a] && this.ids[a].Name == apps[k].Name )
															{
																found = true;
																
																break;
															}
														}
														
														if( !found ) continue;
											
														var divs = appendChild( [
															{ 
																'element' : function() 
																{
																	let d = document.createElement( 'div' );
																	d.className = 'HRow';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																			return d;
																		}(),
																		 'child' : 
																		[ 
																			{ 
																				'element' : function() 
																				{
																					let d = document.createElement( 'span' );
																					d.setAttribute( 'Name', apps[k].Name );
																					d.setAttribute( 'Category', apps[k].Category );
																					d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																					d.style.display = 'block';
																					return d;
																				}(), 
																				 'child' : 
																				[ 
																					{
																						'element' : function() 
																						{
																							let d = document.createElement( 'div' );
																							if( apps[k].Preview )
																							{
																								d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																								d.style.backgroundSize = 'contain';
																								d.style.width = '24px';
																								d.style.height = '24px';
																							}
																							return d;
																						}()
																					}
																				]
																			}
																		] 
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis name';
																			d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																			return d;
																		}() 
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis category';
																			d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																			return d;
																		}() 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'HContent25 InputHeight TextCenter FloatLeft Ellipsis';
																			return d;
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( order, itemId, _this ) 
																				{
																					if( Application.checkAppPermission( [ 
																						'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																					] ) )
																					{
																						let b = document.createElement( 'button' );
																						b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
																						b.onclick = function(  )
																						{
																			
																							_this.sortdown( order, function( e, vars )
																							{
																								
																								if( e && vars && vars.itemId )
																								{
																									// TODO: Update two dockitems only ...
																								
																									sortDockItem( 'down', vars.itemId, userInfo.ID );
																								}
																							
																							}, { itemId: itemId } );
																			
																						};
																						return b;
																					}
																				}( a, this.ids[a].Id, this ) 
																			},
																			{ 
																				'element' : function( order, itemId, _this ) 
																				{
																					if( Application.checkAppPermission( [ 
																						'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																					] ) )
																					{
																						let b = document.createElement( 'button' );
																						b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																						b.onclick = function()
																						{
																			
																							_this.sortup( order, function( e, vars )
																							{
																								
																								if( e && vars && vars.itemId )
																								{
																									// TODO: Update two dockitems only ...
																								
																									sortDockItem( 'up', vars.itemId, userInfo.ID );
																								}
																							
																							}, { itemId: itemId } );
																			
																						};
																						return b;
																					}
																				}( a, this.ids[a].Id, this ) 
																			}
																		] 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'HContent10 FloatLeft';
																			return d;
																
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( name, itemId, func ) 
																				{
																					if( Application.checkAppPermission( [ 
																						'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																					] ) )
																					{
																						let b = document.createElement( 'button' );
																						b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																						b.onclick = function(  )
																						{
																			
																							let pnt = this.parentNode.parentNode;
																			
																							removeBtn( this, { name: name, itemId: itemId, func: func, pnt: pnt }, function ( args )
																							{
																							
																								removeDockItem( args.name, userInfo.ID, function( e, d, vars )
																								{
																								
																									if( e && vars )
																									{
																									
																										vars.func.updateids( 'dock', vars.name, false );
																									
																										if( vars.pnt )
																										{
																											vars.pnt.innerHTML = '';
																										}
																					
																									}
																								
																								}, { pnt: args.pnt, name: args.name, itemId: args.itemId, func: args.func } );
																				
																							} );
																			
																						};
																						return b;
																					}
																				}( apps[k].Name, this.ids[a].Id, this.func ) 
																			}
																		]
																	}
																]
															}
														] );
											
														if( divs )
														{
															for( var i in divs )
															{
																if( divs[i] && o )
																{
																	o.appendChild( divs[i] );
																}
															}
														}
													}
									
												}
											}
									
										}
									
									},
							
									edit : function (  )
									{
								
										this.func.mode[ 'dock' ] = 'edit';
								
										if( apps )
										{
											this.head( true );
									
											let o = ge( 'DockInner' ); if( o ) o.innerHTML = '';
									
											if( this.func.appids )
											{
												for( var a in this.func.appids )
												{
													if( this.func.appids[a] && this.func.appids[a].Name )
													{
														var found = false; var toggle = false;
												
														for( var k in apps )
														{
															if( this.func.appids[a] && this.func.appids[a].Name == apps[k].Name )
															{
																found = true;
																
																if( this.ids )
																{
																	for( var i in this.ids )
																	{	
																		if( this.ids[i] && this.ids[i].Name == apps[k].Name )
																		{
																			toggle = true;
																			
																			break;
																		}
																	}
																}
													
																break;
															}
														}
														
														if( !found ) continue;
											
														var divs = appendChild( [
															{ 
																'element' : function() 
																{
																	let d = document.createElement( 'div' );
																	d.className = 'HRow';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																			return d;;
																		}(),
																		 'child' : 
																		[ 
																			{ 
																				'element' : function() 
																				{
																					let d = document.createElement( 'span' );
																					d.setAttribute( 'Name', apps[k].Name );
																					d.setAttribute( 'Category', apps[k].Category );
																					d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																					d.style.display = 'block';
																					return d;
																				}(), 
																				 'child' : 
																				[ 
																					{
																						'element' : function() 
																						{
																							let d = document.createElement( 'div' );
																							if( apps[k].Preview )
																							{
																								d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																								d.style.backgroundSize = 'contain';
																								d.style.width = '24px';
																								d.style.height = '24px';
																							}
																							return d;
																						}()
																					}
																				]
																			}
																		] 
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis name';
																			d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																			return d;
																		}() 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis category';
																			d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																			return d;
																		}() 
																	},
																	{ 
																		'element' : function() 
																		{
																			let d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent15 FloatLeft Ellipsis';
																			return d;
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( name, func ) 
																				{
																					if( Application.checkAppPermission( [ 
																						'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
																						'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
																					] ) )
																					{
																						
																						var b = CustomToggle( 'did_'+name, 'FloatRight', null, function (  )
																						{
																						
																							if( this.checked )
																							{
																								
																								addDockItem( name, userInfo.ID, function( e, d, vars )
																								{
																									
																									if( e && d && vars )
																									{
																										
																										vars.func.updateids( 'dock', vars.name, { Id: d, Name: vars.name } );
																										
																									}
																									
																								}, { _this: this, func: func, name: name } );
																								
																							}
																							else
																							{
																								
																								removeDockItem( name, userInfo.ID, function( e, d, vars )
																								{
																									
																									if( e && vars )
																									{
																										
																										vars.func.updateids( 'dock', vars.name, false );
																										
																									}
																									
																								}, { _this: this, func: func, name: name } );
																								
																							}
																						
																						}, ( toggle ? true : false ), 1 );
																						
																						return b;
																					}
																				}( apps[k].Name, this.func ) 
																			}
																		]
																	}
																]
															}
														] );
											
														if( divs )
														{
															for( var i in divs )
															{
																if( divs[i] && o )
																{
																	o.appendChild( divs[i] );
																}
															}
														}
													}
									
												}
												
												// Sort default by Name ASC
												this.sortdock( 'Name', 'ASC' );
												
											}
									
										}
								
									},
									
									searchdock : function ( filter, server )
									{
										
										if( ge( 'DockInner' ) )
										{
											let list = ge( 'DockInner' ).getElementsByTagName( 'div' );
	
											if( list.length > 0 )
											{
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
													var span = list[a].getElementsByTagName( 'span' )[0];
				
													if( span )
													{
														var param = [
															( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
															( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
														];
														
														if( !filter || filter == ''  
														|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														)
														{
															list[a].style.display = '';
						
															var div = list[a].getElementsByTagName( 'div' );
						
															if( div.length )
															{
																for( var i in div )
																{
																	if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
																	{
																		// TODO: Make text searched for ...
																	}
																}
															}
														}
														else
														{
															list[a].style.display = 'none';
														}
													}
												}
			
											}
											
											if( ge( 'DockSearchCancelBtn' ) )
											{
												if( !filter && ( ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'DockSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'DockSearchCancelBtn' ).classList.remove( 'Open' );
													ge( 'DockSearchCancelBtn' ).classList.add( 'Closed' );
												}
												
												else if( filter != '' && ( ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'DockSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'DockSearchCancelBtn' ).classList.remove( 'Closed' );
													ge( 'DockSearchCancelBtn' ).classList.add( 'Open' );
												}
											}
										}
										
									},
									
									sortdock : function ( sortby, orderby )
									{
		
										//
		
										let _this = ge( 'DockInner' );
		
										if( _this )
										{
											orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
											
											let list = _this.getElementsByTagName( 'div' );
			
											if( list.length > 0 )
											{
												let output = [];
				
												let callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
				
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
					
													var span = list[a].getElementsByTagName( 'span' )[0];
					
													if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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
					
													if( orderby == 'DESC' ) 
													{ 
														output.reverse();  
													}
					
													_this.innerHTML = '';
					
													_this.setAttribute( 'orderby', orderby );
					
													for( var key in output )
													{
														if( output[key] && output[key].content )
														{
															// Add row
															_this.appendChild( output[key].content );
														}
													}
												}
											}
										}
										
									},
									
									refresh : function (  )
									{
								
										switch( this.func.mode[ 'dock' ] )
										{
									
											case 'list':
										
												this.list();
										
												break;
										
											case 'edit':
										
												this.edit();
										
												break;
										
										}
								
									},
							
									// TODO: Check this function, top doesn't sort properly after one click ...
							
									sortup : function ( order, callback, vars )
									{
										
										// TODO: LOOK AT FUNCTIONALITY AND IMPLICATIONS BEFORE CHANGING IT TO LET INSTEAD OF VAR ...
										
										var num = 0; var array = []; var found = null;
										
										var current = false; var past = false;
										
										if( this.ids && typeof order !== "undefined" )
										{
											for( var a in this.ids )
											{
												if( this.ids[a] && this.ids[a].Name )
												{
											
													// 
													
													if( order == a && typeof this.ids[ order ] !== "undefined" )
													{
														found = num;
													}
											
													array.push( a );
											
													num++;
												}
											}
											
											if( array && typeof found !== "undefined" )
											{
										
												// 
										
												if( typeof array[ found ] !== "undefined" && typeof array[ found-1 ] !== "undefined" )
												{
											
													if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found-1 ] ] !== "undefined" )
													{
														var current = this.ids[ array[ found   ] ];
														var past    = this.ids[ array[ found-1 ] ];
												
														if( current && past )
														{
													
															// 
													
															this.ids[ array[ found   ] ] = past;
															this.ids[ array[ found-1 ] ] = current;
													
														}
													}
												}
											}
											
											//console.log( { ids: this.ids, order: order, vars: vars, found: found, array: array, current: current, past: past } );
											
											if( current && past )
											{
												this.refresh();
												
												if( callback ) return callback( true, vars );
											}
											else
											{
												if( callback ) return callback( false, false );
											}
										}
								
									},
							
									sortdown : function ( order, callback, vars )
									{
										
										// TODO: LOOK AT FUNCTIONALITY AND IMPLICATIONS BEFORE CHANGING IT TO LET INSTEAD OF VAR ...
															
										var num = 0; var array = []; var found = null;
										
										var current = false; var past = false;
										
										if( this.ids && typeof order !== "undefined" )
										{
											for( var a in this.ids )
											{
												if( this.ids[a] && this.ids[a].Name )
												{
													
													if( order == a && typeof this.ids[ order ] !== "undefined" )
													{
														found = num;
													}
											
													array.push( a );
											
													num++;
												}
											}
											
											if( array && typeof found !== "undefined" )
											{
										
												// 
										
												if( typeof array[ found ] !== "undefined" && typeof array[ found+1 ] !== "undefined" )
												{
											
													if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found+1 ] ] !== "undefined" )
													{
														var current = this.ids[ array[ found   ] ];
														var past    = this.ids[ array[ found+1 ] ];
														
														if( current && past )
														{
													
															// 
													
															this.ids[ array[ found   ] ] = past;
															this.ids[ array[ found+1 ] ] = current;
													
														}
													}
												}
											}
											
											//console.log( { ids: this.ids, order: order, vars: vars, found: found, array: array, current: current, past: past } );
											
											if( current && past )
											{
												this.refresh();
									
												if( callback ) return callback( true, vars );
											}
											else
											{
												if( callback ) return callback( false, false );
											}
										}
								
									}
							
								};
						
								switch( func )
								{
							
									case 'head':
								
										init.head();
								
										break;
								
									case 'list':
								
										init.list();
								
										break;
								
									case 'edit':
								
										init.edit();
								
										break;
								
									case 'refresh':
								
										init.refresh();
								
										break;
							
									default:
								
										let etn = ge( 'DockEdit' );
										if( etn )
										{
											
											if( Application.checkAppPermission( [ 
												'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
												'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
												'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_GLOBAL' 
											] ) )
											{
												
												etn.onclick = function( e )
												{
								
													init.edit();
								
													// Hide add / edit button ...
								
													if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
													{
														etn.classList.remove( 'Open' );
														etn.classList.add( 'Closed' );
													}
								
													// Show back button ...
								
													if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
													{
														btn.classList.remove( 'Closed' );
														btn.classList.add( 'Open' );
													}
										
												};
												
											}
											else
											{
												etn.style.display = 'none';
											}
											
										}
						
										let btn = ge( 'DockEditBack' );
										if( btn )
										{
											btn.onclick = function( e )
											{
								
												init.list();
								
												// Hide back button ...
										
												if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
												{
													btn.classList.remove( 'Open' );
													btn.classList.add( 'Closed' );
												}
						
												// Show add / edit button ...
								
												if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
												{
													etn.classList.remove( 'Closed' );
													etn.classList.add( 'Open' );
												}
										
											};
										}
										
										if( ge( 'AdminDockContainer' ) )
										{
											let inpu = ge( 'AdminDockContainer' ).getElementsByTagName( 'input' )[0];
											inpu.onkeyup = function( e )
											{
												init.searchdock( this.value );
											}
											ge( 'DockSearchCancelBtn' ).onclick = function( e )
											{
												init.searchdock( false );
												inpu.value = '';
											}
										}
										
										// Show listed dock ... 
						
										init.list();
								
										break;
								
								}
						
							},
							
							// Startup -----------------------------------------------------------------------------------------
							
							startup : function ( func )
							{
					
								// Editing Startup
					
								var init =
								{
						
									func : this,
						
									ids  : this.startids,
						
									head : function ( hidecol )
									{
										var o = ge( 'StartupGui' ); if( o ) o.innerHTML = '<input type="hidden" id="TempStartup">';
							
										this.func.updateids( 'startup' );
							
										var divs = appendChild( [ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
													d.className = 'HRow BackgroundNegative Negative Padding';
													return d;
												}(),
												'child' : 
												[ 
													{ 
														'element' : function( _this ) 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
															d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortstartup( 'Name' );
															};
															return d;
														}( this ) 
													}, 
													{ 
														'element' : function( _this ) 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 FloatLeft Relative';
															d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
															d.style.cursor = 'pointer';
															d.ele = this;
															d.onclick = function(  )
															{
																_this.sortstartup( 'Category' );
															};
															return d;
														}( this )
													},
													{ 
														'element' : function() 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
															d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
															return d;
														}()
													},
													{ 
														'element' : function() 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmallLeft PaddingSmallRight HContent10 FloatLeft Relative';
															return d;
														}()
													}
												]
											},
											{
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'HRow Box Padding';
													d.style.overflow = 'auto';
													d.style.maxHeight = '366px';
													d.id = 'StartupInner';
													return d;
												}()
											}
										] );
					
										if( divs )
										{
											for( var i in divs )
											{
												if( divs[i] && o )
												{
													o.appendChild( divs[i] );
												}
											}
										}
							
									},
						
									list : function (  )
									{
										this.func.mode[ 'startup' ] = 'list';
							
										if( apps )
										{
											this.head();
								
											var o = ge( 'StartupInner' ); if( o ) o.innerHTML = '';
								
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
													{
														var found = false;
											
														for( var k in apps )
														{
															if( this.ids[a] && this.ids[a].split( 'launch ' )[1] == apps[k].Name )
															{
																//found = true;
													
																break;
															}
														}
										
														if( this.func.appids )
														{
															for( var i in this.func.appids )
															{
																if( this.func.appids[i] && this.func.appids[i].Name && this.ids[a].split( 'launch ' )[1] == this.func.appids[i].Name )
																{
																	found = true;
																}
															}
														}
											
														if( !found ) 
														{
															this.func.updateids( 'startup', this.ids[a].split( 'launch ' )[1], false );
												
															continue;
														}
										
														var divs = appendChild( [
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'HRow';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																			return d;
																		}(),
																		 'child' : 
																		[ 
																			{ 
																				'element' : function() 
																				{
																					var d = document.createElement( 'span' );
																					d.setAttribute( 'Name', apps[k].Name );
																					d.setAttribute( 'Category', apps[k].Category );
																					d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																					d.style.display = 'block';
																					return d;
																				}(), 
																				 'child' : 
																				[ 
																					{
																						'element' : function() 
																						{
																							var d = document.createElement( 'div' );
																							if( apps[k].Preview )
																							{
																								d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																								d.style.backgroundSize = 'contain';
																								d.style.width = '24px';
																								d.style.height = '24px';
																							}
																							return d;
																						}()
																					}
																				]																		
																			}
																		] 
																	},
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																			d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																			return d;
																		}() 
																	},
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis';
																			d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																			return d;
																		}() 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'HContent25 InputHeight TextCenter FloatLeft Ellipsis';
																			return d;
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( order, _this ) 
																				{
																					var b = document.createElement( 'button' );
																					b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
																					b.onclick = function(  )
																					{
																		
																						_this.sortdown( order, function()
																						{
																							
																							// TODO: Make a callback here to let the user know if it was saved or not.
																							
																							updateStartup( userInfo.ID );
																				
																						} );
																		
																					};
																					return b;
																				}( a, this ) 
																			},
																			{ 
																				'element' : function( order, _this ) 
																				{
																					var b = document.createElement( 'button' );
																					b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																					b.onclick = function()
																					{
																		
																						_this.sortup( order, function()
																						{
																				
																							// TODO: Make a callback here to let the user know if it was saved or not.
																							
																							updateStartup( userInfo.ID );
																				
																						} );
																		
																					};
																					return b;
																				}( a, this ) 
																			}
																		] 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'HContent10 FloatLeft';
																			return d;
															
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( ids, name, func ) 
																				{
																					var b = document.createElement( 'button' );
																					b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																					b.onclick = function(  )
																					{
																		
																						var pnt = this.parentNode.parentNode;
																		
																						removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																						{
																			
																							//ids[ name ] = false;
																			
																							args.func.updateids( 'startup', args.name, false );
																							
																							updateStartup( userInfo.ID, function( e, d, vars )
																							{
																			
																								if( e && vars )
																								{
																				
																									if( vars.pnt )
																									{
																										vars.pnt.innerHTML = '';
																									}
																				
																								}
																								else
																								{
																									if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																								}
																			
																							}, { pnt: args.pnt } );
																			
																						} );
																		
																					};
																					return b;
																				}( this.ids, apps[k].Name, this.func ) 
																			}
																		]
																	}
																]
															}
														] );
										
														if( divs )
														{
															for( var i in divs )
															{
																if( divs[i] && o )
																{
																	o.appendChild( divs[i] );
																}
															}
														}
													}
												}
								
											}
								
										}
								
									},
						
									edit : function (  )
									{
							
										this.func.mode[ 'startup' ] = 'edit';
							
										if( apps )
										{
											this.head( true );
								
											var o = ge( 'StartupInner' ); if( o ) o.innerHTML = '';
											
											if( this.func.appids )
											{
												for( var a in this.func.appids )
												{
													if( this.func.appids[a] && this.func.appids[a].Name )
													{
														var found = false; var toggle = false;
											
														for( var k in apps )
														{
															if( apps[k] && apps[k].Name == this.func.appids[a].Name )
															{
																found = true;
													
																if( this.ids )
																{
																	for( var i in this.ids )
																	{
																		if( this.ids[i] && this.ids[i].split( 'launch ' )[1] == apps[k].Name )
																		{
																			toggle = true;
																
																			break;
																		}
																	}
																}
													
																break;
															}
														}
											
														if( !found ) continue;
										
														var divs = appendChild( [
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'HRow';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																			return d;;
																		}(),
																		 'child' : 
																		[ 
																			{ 
																				'element' : function() 
																				{
																					var d = document.createElement( 'span' );
																					d.setAttribute( 'Name', apps[k].Name );
																					d.setAttribute( 'Category', apps[k].Category );
																					d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																					d.style.display = 'block';
																					return d;
																				}(), 
																				 'child' : 
																				[ 
																					{
																						'element' : function() 
																						{
																							var d = document.createElement( 'div' );
																							if( apps[k].Preview )
																							{
																								d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																								d.style.backgroundSize = 'contain';
																								d.style.width = '24px';
																								d.style.height = '24px';
																							}
																							return d;
																						}()
																					}
																				]
																			}
																		] 
																	},
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																			d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																			return d;
																		}() 
																	}, 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																			d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																			return d;
																		}() 
																	},
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'div' );
																			d.className = 'PaddingSmall HContent15 FloatLeft Ellipsis';
																			return d;
																		}(),
																		'child' : 
																		[ 
																			{ 
																				'element' : function( ids, name, func ) 
																				{
																		
																					var b = CustomToggle( 'sid_'+name, 'FloatRight', null, function (  )
																					{
																		
																						if( this.checked )
																						{
																				
																							func.updateids( 'startup', name, ( 'launch ' + name ) );
																							
																							updateStartup( userInfo.ID, function( e, d, vars )
																							{
																			
																								if( e && vars )
																								{
																						
																									vars._this.checked = true;
																				
																								}
																								else
																								{
																									if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																						
																									vars._this.checked = false;
																						
																								}
																			
																							}, { _this: this } );
																				
																						}
																						else
																						{
																				
																							func.updateids( 'startup', name, false );
																							
																							updateStartup( userInfo.ID, function( e, d, vars )
																							{
																			
																								if( e && vars )
																								{
																					
																									vars._this.checked = false;
																					
																								}
																								else
																								{
																									if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																						
																									vars._this.checked = true;
																						
																								}
																			
																							}, { _this: this } );
																							
																						}
																		
																					}, ( toggle ? true : false ), 1 );
																		
																					return b;
																				}( this.ids, apps[k].Name, this.func ) 
																			}
																		]
																	}
																]
															}
														] );
										
														if( divs )
														{
															for( var i in divs )
															{
																if( divs[i] && o )
																{
																	o.appendChild( divs[i] );
																}
															}
														}
													}
												}
								
											}
								
										}
							
										// Sort default by Name ASC
										this.sortstartup( 'Name', 'ASC' );
							
									},
						
									refresh : function (  )
									{
							
										switch( this.func.mode[ 'startup' ] )
										{
								
											case 'list':
									
												this.list();
									
												break;
									
											case 'edit':
									
												this.edit();
									
												break;
									
										}
							
									},
						
									searchstartup : function ( filter, server )
									{
							
										//
							
										if( ge( 'StartupInner' ) )
										{
											var list = ge( 'StartupInner' ).getElementsByTagName( 'div' );

											if( list.length > 0 )
											{
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
	
													var span = list[a].getElementsByTagName( 'span' )[0];
	
													if( span )
													{
														var param = [
															( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
															( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
														];
											
														if( !filter || filter == ''  
														|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
														)
														{
															list[a].style.display = '';
			
															var div = list[a].getElementsByTagName( 'div' );
			
															if( div.length )
															{
																for( var i in div )
																{
																	if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
																	{
																		// TODO: Make text searched for ...
																	}
																}
															}
														}
														else
														{
															list[a].style.display = 'none';
														}
													}
												}

											}
								
											if( ge( 'StartupSearchCancelBtn' ) )
											{
												if( !filter && ( ge( 'StartupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'StartupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'StartupSearchCancelBtn' ).classList.remove( 'Open' );
													ge( 'StartupSearchCancelBtn' ).classList.add( 'Closed' );
												}
									
												else if( filter != '' && ( ge( 'StartupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'StartupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
												{
													ge( 'StartupSearchCancelBtn' ).classList.remove( 'Closed' );
													ge( 'StartupSearchCancelBtn' ).classList.add( 'Open' );
												}
											}
										}
							
									},
						
									sortstartup : function ( sortby, orderby )
									{

										//

										var _this = ge( 'StartupInner' );

										if( _this )
										{
											orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
								
											var list = _this.getElementsByTagName( 'div' );

											if( list.length > 0 )
											{
												var output = [];
	
												var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
	
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
													var span = list[a].getElementsByTagName( 'span' )[0];
		
													if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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
		
													if( orderby == 'DESC' ) 
													{ 
														output.reverse();  
													}
		
													_this.innerHTML = '';
		
													_this.setAttribute( 'orderby', orderby );
		
													for( var key in output )
													{
														if( output[key] && output[key].content )
														{
															// Add row
															_this.appendChild( output[key].content );
														}
													}
												}
											}
										}

										//console.log( output );
									},
						
									// TODO: Check this function, top doesn't sort properly after one click ...
						
									sortup : function ( order, callback )
									{
							
										if( ShowLog ) console.log( 'TODO: sortup: ' + order + ' ', this.ids );
							
										if( ShowLog ) console.log( 'star: ', star );
							
										var num = 0; var array = []; var found = null;
							
										if( this.ids && typeof order !== "undefined" )
										{
											for( var a in this.ids )
											{
												if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
												{
										
													// 
										
													if( ShowLog ) console.log( { a:a, num:num } );
										
													if( order == a && typeof this.ids[ order ] !== "undefined" )
													{
														found = num;
													}
										
													array.push( a );
										
													num++;
												}
											}
								
											if( ShowLog ) console.log( { array: array, found: found, past: array[ found-1 ] } );
								
											if( array && typeof found !== "undefined" )
											{
									
												// 
									
												if( typeof array[ found ] !== "undefined" && typeof array[ found-1 ] !== "undefined" )
												{
										
													if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found-1 ] ] !== "undefined" )
													{
														var current = this.ids[ array[ found   ] ];
														var past    = this.ids[ array[ found-1 ] ];
											
														if( current && past )
														{
												
															// 
												
															this.ids[ array[ found   ] ] = past;
															this.ids[ array[ found-1 ] ] = current;
												
														}
													}
												}
											}
								
											if( ShowLog ) console.log( this.ids );
								
											this.refresh();
								
											if( callback ) return callback( true );
										}
							
									},
						
									sortdown : function ( order, callback )
									{
							
										if( ShowLog ) console.log( 'TODO: sortdown: ' + order + ' ', this.ids );
							
										if( ShowLog ) console.log( 'star: ', star );
							
										var num = 0; var array = []; var found = null;
							
										if( this.ids && typeof order !== "undefined" )
										{
											for( var a in this.ids )
											{
												if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
												{
										
													// 
										
													if( ShowLog ) console.log( { a:a, num:num } );
										
													if( order == a && typeof this.ids[ order ] !== "undefined" )
													{
														found = num;
													}
										
													array.push( a );
										
													num++;
												}
											}
								
											if( ShowLog ) console.log( { array: array, found: found, past: array[ found+1 ] } );
								
											if( array && typeof found !== "undefined" )
											{
									
												// 
									
												if( typeof array[ found ] !== "undefined" && typeof array[ found+1 ] !== "undefined" )
												{
										
													if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found+1 ] ] !== "undefined" )
													{
														var current = this.ids[ array[ found   ] ];
														var past    = this.ids[ array[ found+1 ] ];
											
														if( current && past )
														{
												
															// 
												
															this.ids[ array[ found   ] ] = past;
															this.ids[ array[ found+1 ] ] = current;
												
														}
													}
												}
											}
								
											if( ShowLog ) console.log( this.ids );
								
											this.refresh();
								
											if( callback ) return callback( true );
										}
							
									}
						
								};
					
								switch( func )
								{
						
									case 'head':
							
										init.head();
							
										break;
							
									case 'list':
							
										init.list();
							
										break;
							
									case 'edit':
							
										init.edit();
							
										break;
							
									case 'refresh':
							
										init.refresh();
							
										break;
						
									default:
							
										var etn = ge( 'StartupEdit' );
										if( etn )
										{
											etn.onclick = function( e )
											{
							
												init.edit();
							
												// Hide add / edit button ...
							
												if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
												{
													etn.classList.remove( 'Open' );
													etn.classList.add( 'Closed' );
												}
							
												// Show back button ...
							
												if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
												{
													btn.classList.remove( 'Closed' );
													btn.classList.add( 'Open' );
												}
									
											};
										}
							
										var btn = ge( 'StartupEditBack' );
										if( btn )
										{
											btn.onclick = function( e )
											{
							
												init.list();
							
												// Hide back button ...
									
												if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
												{
													btn.classList.remove( 'Open' );
													btn.classList.add( 'Closed' );
												}
					
												// Show add / edit button ...
							
												if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
												{
													etn.classList.remove( 'Closed' );
													etn.classList.add( 'Open' );
												}
									
											};
										}
										
										if( ge( 'AdminStartupContainer' ) )
										{
											var inp = ge( 'AdminStartupContainer' ).getElementsByTagName( 'input' )[0];
											inp.onkeyup = function( e )
											{
												init.searchstartup( this.value );
											}
											ge( 'StartupSearchCancelBtn' ).onclick = function( e )
											{
												init.searchstartup( false );
												inp.value = '';
											}
										}
							
										// Show listed startup ... 
					
										init.list();
							
										break;
							
								}
					
							},
							
							// Theme -----------------------------------------------------------------------------------
							
							theme : function (  )
							{
								
								let currTheme = ( settings.Theme ? settings.Theme : 'friendup12' );
								
								themeConfig = {  };
								
								if( ge( 'theme_style_select' ) )
								{
									let s = ge( 'theme_style_select' );
									
									if( themeData.buttonSchemeText )
									{
										let opt = { 'mac' : 'Mac style', 'windows' : 'Windows style' };
										
										let str = '';
										
										for( var k in opt )
										{
											str += '<option value="' + k + '"' + ( themeData.buttonSchemeText == k ? ' selected="selected"' : '' ) + '>' + opt[k] + '</option>';
										}
										
										s.innerHTML = str;
									}
									
									s.current = s.value;
									
									themeConfig.buttonSchemeText = s.current;
									
									if( Application.checkAppPermission( [ 
										'PERM_LOOKNFEEL_CREATE_GLOBAL', 'PERM_LOOKNFEEL_CREATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_UPDATE_GLOBAL', 'PERM_LOOKNFEEL_UPDATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_GLOBAL',        'PERM_LOOKNFEEL_WORKGROUP' 
									] ) )
									{
										
										s.onchange = function(  )
										{
											
											themeConfig.buttonSchemeText = this.value;
										
											let m = new Module( 'system' );
											m.s = this;
											m.onExecuted = function( e, d )
											{
												
												if( e != 'ok' )
												{
													themeConfig.buttonSchemeText = this.s.current;
												}
												else
												{
													themeConfig.buttonSchemeText = this.s.value;
												}
											
											}
											m.execute( 'setsetting', { 
												setting : 'themedata_' + currTheme.toLowerCase(), 
												data    : themeConfig, 
												userid  : userInfo.ID, 
												authid  : Application.authId 
											} );
										
										};
										
									}
									else
									{
										s.disabled = true;
									}
								}
								
								if( ge( 'theme_dark_button' ) )
								{
									let b = ge( 'theme_dark_button' );
									
									if( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' )
									{
										//b.classList.remove( 'fa-toggle-off' );
										//b.classList.add( 'fa-toggle-on' );
										
										b.checked = true;
										
										themeConfig.colorSchemeText = 'charcoal';
									}
									else
									{
										//b.classList.remove( 'fa-toggle-on' );
										//b.classList.add( 'fa-toggle-off' );
										
										b.checked = false;
										
										themeConfig.colorSchemeText = 'light';
									}
									
									if( Application.checkAppPermission( [ 
										'PERM_LOOKNFEEL_CREATE_GLOBAL', 'PERM_LOOKNFEEL_CREATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_UPDATE_GLOBAL', 'PERM_LOOKNFEEL_UPDATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_GLOBAL',        'PERM_LOOKNFEEL_WORKGROUP' 
									] ) )
									{
										
										b.onclick = function(  )
										{
										
											if( this.checked/* this.classList.contains( 'fa-toggle-off' )*/ )
											{
												themeConfig.colorSchemeText = 'charcoal';
											}
											else
											{
												themeConfig.colorSchemeText = 'light';
											}
											
											let m = new Module( 'system' );
											m.b = this;
											m.onExecuted = function( e, d )
											{
												
												if( this.b.checked/*this.b.classList.contains( 'fa-toggle-off' )*/ )
												{
												
													if( e == 'ok' )
													{
														//this.b.classList.remove( 'fa-toggle-off' );
														//this.b.classList.add( 'fa-toggle-on' );
													
														this.b.checked = true;
													}
													else
													{
														themeConfig.colorSchemeText = 'light';
													}
												
												}
												else
												{
												
													if( e == 'ok' )
													{
														//this.b.classList.remove( 'fa-toggle-on' );
														//this.b.classList.add( 'fa-toggle-off' );
														
														this.b.checked = false;
													}
													else
													{
														themeConfig.colorSchemeText = 'charcoal';
													}
												
												}
											
											}
											m.execute( 'setsetting', { 
												setting : 'themedata_' + currTheme.toLowerCase(), 
												data    : themeConfig, 
												userid  : userInfo.ID, 
												authid  : Application.authId 
											} );
										
										};
										
									}
									
								}
								
								if( ge( 'workspace_count_input' ) )
								{
									let i = ge( 'workspace_count_input' );
									i.value = ( workspaceSettings.workspacecount > 0 ? workspaceSettings.workspacecount : '1' );
									i.current = i.value;
									
									if( Application.checkAppPermission( [ 
										'PERM_LOOKNFEEL_CREATE_GLOBAL', 'PERM_LOOKNFEEL_CREATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_UPDATE_GLOBAL', 'PERM_LOOKNFEEL_UPDATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_GLOBAL',        'PERM_LOOKNFEEL_WORKGROUP' 
									] ) )
									{
										
										i.onchange = function(  )
										{
											if( this.value >= 1 )
											{
												let m = new Module( 'system' );
												m.i = this;
												m.onExecuted = function( e, d )
												{
													
													if( e != 'ok' )
													{
														this.i.value = this.i.current;
													}
													else
													{
														this.i.current = this.i.value;
													}
												
												}
											
												let setData = { 
													setting : 'workspacecount', 
													data    : this.value, 
													userid  : userInfo.ID, 
													authid  : Application.authId 
												}
												m.execute( 'setsetting', setData );
											}
											else
											{
												this.value = this.current;
											}
										
										};
										
									}
									else
									{
										i.disabled = true;
									}
									
								}
								
								if( ge( 'wallpaper_button_inner' ) )
								{
									
									if( Application.checkAppPermission( [ 
										'PERM_LOOKNFEEL_CREATE_GLOBAL', 'PERM_LOOKNFEEL_CREATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_UPDATE_GLOBAL', 'PERM_LOOKNFEEL_UPDATE_IN_WORKGROUP', 
										'PERM_LOOKNFEEL_GLOBAL',        'PERM_LOOKNFEEL_WORKGROUP' 
									] ) )
									{
										
										let b = ge( 'wallpaper_button_inner' );
										b.onclick = function(  )
										{
										
											let flags = {
												type: 'load',
												path: 'Home:',
												suffix: [ 'jpg', 'jpeg', 'png', 'gif' ],
												triggerFunction: function( item )
												{
													if( item && item.length && item[ 0 ].Path )
													{
														
														let m = new Module( 'system' );
														m.onExecuted = function( e, d )
														{
															
															let data = false;
														
															try
															{
																data = JSON.parse( d );
															}
															catch( e ) {  }
														
															if( e == 'ok' )
															{
															
																// Load the image
																let image = new Image();
																image.onload = function()
																{
																	// Resizes the image
																	let canvas = ge( 'AdminWallpaper' );
																	if( canvas )
																	{
																		let context = canvas.getContext( '2d' );
																		context.drawImage( image, 0, 0, 256, 256 );
																
																		if( data )
																		{
																			Notify( { title: 'success', text: data.message } );
																		}
																	}
																
																}
																image.src = getImageUrl( item[ 0 ].Path );
															
															}
															else
															{
															
																if( data )
																{
																	Notify( { title: 'failed', text: data.message } );
																}
															
															}
													
														}
														m.execute( 'userwallpaperset', { 
															path    : item[ 0 ].Path, 
															userid  : userInfo.ID, 
															authid  : Application.authId 
														} );
													
													}
												}
											};
											// Execute
											( new Filedialog( flags ) );
								
										};
									
									}
									else
									{
										ge( 'WallpaperContainer' ).style.display = 'none';
									}
									
								}
						
								if( ge( 'AdminWallpaper' ) && ge( 'AdminWallpaperPreview' ) )
								{
									// Set the url to get this wallpaper instead and cache it in the browser ...
									
									if( workspaceSettings.wallpaperdoors )
									{
										let img = ( workspaceSettings.wallpaperdoors ? '/system.library/module/?module=system&command=thumbnail&width=568&height=320&mode=resize&userid='+userInfo.ID+'&authid='+Application.authId+'&path='+workspaceSettings.wallpaperdoors : '' );
										
										// Only update the wallaper if it exists..
										let avSrc = new Image();
										avSrc.src = ( workspaceSettings.wallpaperdoors ? img : '/webclient/gfx/theme/default_login_screen.jpg' );
										avSrc.onload = function()
										{
											if( ge( 'AdminWallpaper' ) )
											{
												let ctx = ge( 'AdminWallpaper' ).getContext( '2d' );
												ctx.drawImage( avSrc, 0, 0, 256, 256 );
											}
										}
									}
									
									function wallpaperdelete()
									{
										if( !ge( 'AdminWallpaperDeleteBtn' ) )
										{
											let del = document.createElement( 'button' );
											del.id = 'AdminWallpaperDeleteBtn';
											del.className = 'IconButton IconSmall ButtonSmall Negative FloatRight fa-remove';
											del.onclick = function( e )
											{
												Confirm( 'Are you sure?', 'This will delete the wallpaper from this template.', function( r )
												{
													if( r.data == true )
													{
														ge( 'AdminWallpaperPreview' ).innerHTML = '<canvas id="AdminWallpaper" width="256" height="256"></canvas>';
											
														wallpaperdelete();
													}
												} );
											}
											ge( 'AdminWallpaperPreview' ).appendChild( del );
										}
									}
									
								}
								
							},
							
							// Events --------------------------------------------------
							
							
							
							// End events ----------------------------------------------
							
							permissions : function ( show )
							{
								// Check Permissions
								
								if( ShowLog ) console.log( '// Check Permissions ', show );
								
								if( show )
								{
									
									if( /*!show || */show.indexOf( 'workgroup' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( [ 
											'PERM_WORKGROUP_READ_GLOBAL', 'PERM_WORKGROUP_READ_IN_WORKGROUP', 
											'PERM_WORKGROUP_GLOBAL',      'PERM_WORKGROUP_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminWorkgroupContainer' ) )
											{
												ge( 'AdminWorkgroupContainer' ).className = ge( 'AdminWorkgroupContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = workgroup' );
										}
									}
								
									if( /*!show || */show.indexOf( 'role' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( 1!=1 && Application.checkAppPermission( [ 
											'PERM_ROLE_READ_GLOBAL', 'PERM_ROLE_READ_IN_WORKGROUP', 
											'PERM_ROLE_GLOBAL',      'PERM_ROLE_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminRoleContainer' ) )
											{
												ge( 'AdminRoleContainer' ).className = ge( 'AdminRoleContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											//console.log( '// No Permission = role' );
										}
									}
								
									if( /*!show || */show.indexOf( 'storage' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( [ 
											'PERM_STORAGE_READ_GLOBAL', 'PERM_STORAGE_READ_IN_WORKGROUP', 
											'PERM_STORAGE_GLOBAL',      'PERM_STORAGE_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminStorageContainer' ) )
											{
												ge( 'AdminStorageContainer' ).className = ge( 'AdminStorageContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = storage' );
										}
									}
								
									if( /*!show || */show.indexOf( 'application' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( [ 
											'PERM_APPLICATION_READ_GLOBAL', 'PERM_APPLICATION_READ_IN_WORKGROUP', 
											'PERM_APPLICATION_GLOBAL',      'PERM_APPLICATION_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminApplicationContainer' ) )
											{
												ge( 'AdminApplicationContainer' ).className = ge( 'AdminApplicationContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = application' );
										}
									}
								
									if( /*!show || */show.indexOf( 'dock' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( [ 
											'PERM_APPLICATION_READ_GLOBAL', 'PERM_APPLICATION_READ_IN_WORKGROUP', 
											'PERM_APPLICATION_GLOBAL',      'PERM_APPLICATION_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminDockContainer' ) )
											{
												ge( 'AdminDockContainer' ).className = ge( 'AdminDockContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = dock' );
										}
									}
									
									if( /*!show || */show.indexOf( 'startup' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
										{
											if( ge( 'AdminStartupContainer' ) )
											{
												ge( 'AdminStartupContainer' ).className = ge( 'AdminStartupContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = startup' );
										}
									}
									
									if( /*!show || */show.indexOf( 'looknfeel' ) >= 0 || show.indexOf( '*' ) >= 0 )
									{
										if( Application.checkAppPermission( [ 
											'PERM_LOOKNFEEL_READ_GLOBAL', 'PERM_LOOKNFEEL_READ_IN_WORKGROUP', 
											'PERM_LOOKNFEEL_GLOBAL',      'PERM_LOOKNFEEL_WORKGROUP' 
										] ) )
										{
											if( ge( 'AdminLooknfeelContainer' ) )
											{
												ge( 'AdminLooknfeelContainer' ).className = ge( 'AdminLooknfeelContainer' ).className.split( 'Closed' ).join( 'Open' );
											}
										}
										else
										{
											console.log( '// No Permission = looknfeel' );
										}
									}
									
								}
							}
							
						}
						
						func.init();
						func.user();
						func.password();
						func.level();
						func.language();
						func.setup();
						func.avatar();
						func.details();
						func.workgroups();
						func.roles();
						func.storage();
						func.applications();
						func.startup();
						func.dock();
						func.theme();
						func.permissions( show );
						
						// Everything is loaded ...
						UsersSettings( 'busy', false );
						
					}
					
					
					
					if( first )
					{
						func.init();
						
						let theme = {
							
							dark : function ()
							{
								
								//return '<button class="IconButton IconSmall IconToggle ButtonSmall fa-toggle-' + ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? 'on' : 'off' ) + '" id="theme_dark_button"></button>';
								
								return CustomToggle( 'theme_dark_button', null, null, null, ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? true : false ) );
								
							},
			
							controls : function ()
							{
								
								let opt = { 'mac' : 'Mac style', 'windows' : 'Windows style' };
								
								let str = '<select class="InputHeight FullWidth" id="theme_style_select">';
								
								for( var k in opt )
								{
									str += '<option value="' + k + '"' + ( themeData.buttonSchemeText == k ? ' selected="selected"' : '' ) + '>' + opt[k] + '</option>';
								}
								
								str += '</select>';
								
								return str;
				
							},
			
							workspace_count : function ()
							{
								
								return '<input type="number" class="InputHeight FullWidth" id="workspace_count_input" value="' + ( workspaceSettings.workspacecount > 0 ? workspaceSettings.workspacecount : '1' ) + '">';
								
							},
							
							wallpaper_button : function ()
							{
								return '<button class="Button IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>';
							}
			
						};
						
						let mobile = {
							
							codes : [ 47, 45 ],
							
							parts : function ( num )
							{
								let obj = { 0 : '', 1 : '' };
								
								if( userInfo && userInfo.Mobile )
								{
									if( userInfo.Mobile.indexOf( '+' ) >= 0 )
									{
										if( userInfo.Mobile.indexOf( ' ' ) >= 0 )
										{
											obj[0] = userInfo.Mobile.split( ' ' )[0];
											obj[1] = userInfo.Mobile.split( obj[0] ).join( '' ).split( ' ' ).join( '' );
										}
										else
										{
											if( this.codes )
											{
												for( let i in this.codes )
												{
													if( this.codes[i] )
													{
														if( userInfo.Mobile.indexOf( '+' + this.codes[i] ) >= 0 )
														{
															obj[0] = ( '+' + this.codes[i] );
															obj[1] = userInfo.Mobile.split( '+' + this.codes[i] ).join( '' ).split( ' ' ).join( '' );
															break;
														}
													}
												}
											}
										}
									}
									else
									{
										obj[1] = userInfo.Mobile.split( ' ' ).join( '' );
									}
								}
								
								return obj[num];
							},
							
							select : function (  )
							{
								let opt = '';
								
								let code = this.parts( 0 );
								
								if( this.codes )
								{
									for( let i in this.codes )
									{
										if( this.codes[i] )
										{
											var sel = ( code == ( '+' + this.codes[i] ) ? ' selected="selected"' : '' );
											opt += '<option value="+'+this.codes[i]+'"'+sel+'>+'+this.codes[i]+'</option>';
										}
									}
								}
								
								return opt;
							},
							
							number : function (  )
							{
								return this.parts( 1 );
							}
							
						};
						
						
						
						// Get the user details template
						let d = new File( 'Progdir:Templates/account_users_details.html' );
						
						// Add all data for the template
						d.replacements = {
							userid               : ( userInfo.ID ? userInfo.ID : '' ),
							user_name            : ( userInfo.FullName ? userInfo.FullName : ( userInfo.ID ? 'n/a' : '' ) ),
							user_fullname        : ( userInfo.FullName ? userInfo.FullName : ( userInfo.ID ? 'n/a' : '' ) ),
							user_username        : ( userInfo.Name ? userInfo.Name : ( userInfo.ID ? 'n/a' : '' ) ),
							user_email           : ( userInfo.Email ? userInfo.Email : '' ),
							user_mobile_code     : ( mobile.select() ),
							user_mobile          : ( mobile.number() ),
							user_language        : ( languages ? languages : '' ),
							user_setup           : ( setup ? setup : '' ),
							user_locked_toggle   : ( CustomToggle( 'usLocked', 'FloatLeft', null, null, ( ulocked ? true : false ) ) ),
							user_disabled_toggle : ( CustomToggle( 'usDisabled', 'FloatRight', null, null, ( udisabled ? true : false ) ) ),
							
							theme_dark           : theme.dark(),
							theme_controls       : theme.controls(),
							workspace_count      : theme.workspace_count(),
							wallpaper_button     : theme.wallpaper_button(),
							
							storage              : ( mlst ? mlst : '' ),
							workgroups           : ( wstr ? wstr : '' ),
							roles                : ( rstr ? rstr : '' ),
							applications         : '',
							dock                 : '',
							startup              : ''
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
			let loadingSlot = 0;
			let loadingInfo = {};
			let loadingBoxs = [ 'workgroup', 'role', 'storage', 'application', 'dock', 'startup', 'looknfeel' ];
			let loadingList = [
				
				// 0 | Load userinfo
				function(  )
				{
					// Set busy ...
					UsersSettings( 'busy', true );
					
					// TODO: perhaps set a loading spinning wheel ...
					
					if( ge( 'UserDetails' ) )
					{
						ge( 'UserDetails' ).innerHTML = '';
					}
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						
						if( e != 'ok' ) return;
						let userInfo = null;
						try
						{
							userInfo = JSON.parse( d );
						}
						catch( e )
						{
							return;
						}
						
						if( e != 'ok' ) userInfo = '404';
						
						// TODO: Run avatar cached here ...
						
						userInfo.avatar = '/system.library/module/?module=system&command=getavatar&userid=' + userInfo.ID + ( userInfo.Image ? '&image=' + userInfo.Image : '' ) + '&width=256&height=256&authid=' + Application.authId;
						
						loadingInfo.userInfo = userInfo;
						
						if( ShowLog || 1==1 ) console.log( '// 0 | Load userinfo', userInfo );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ '*' ], true );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
					}
					u.execute( 'userinfoget', { id: extra, mode: 'all', authid: Application.authId } );
				},
				
				// 3 | Get user's workgroups
				function(  )
				{
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						
						let wgroups = null;
						try
						{
							wgroups = JSON.parse( d );
						}
						catch( e ) {  }
						
						if( e != 'ok' ) wgroups = '';
						loadingInfo.workgroups = wgroups;
						
						if( ShowLog || 1==1 ) console.log( '// 3 | Get user\'s workgroups', wgroups );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ 'workgroup' ] );
					}
					u.execute( 'workgroups', { userid: extra, owner: true, level: true, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 4 | Get user's roles
				function(  )
				{
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						let uroles = null;
						
						if( e == 'ok' )
						{
							try
							{
								uroles = JSON.parse( d );
							}
							catch( e ) {  }
							
							loadingInfo.roles = uroles;
						}
						
						if( e != 'ok' ) loadingInfo.roles = '';
						
						if( ShowLog ) console.log( '// 4 | Get user\'s roles' );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ 'role' ] );
					}
					u.execute( 'userroleget', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 5 | Get storage
				function(  )
				{
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						let rows = [];
						try
						{
							rows = JSON.parse( d );
						}
						catch( e ) {  }
						
						if( e != 'ok' ) rows = ''/*'404'*/;
						loadingInfo.mountlist = rows;
						
						if( ShowLog ) console.log( '// 5 | Get storage' );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ 'storage' ] );
						
					}
					u.execute( 'mountlist', { userid: extra, authid: Application.authId } );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 6 | Get user applications
				function(  )
				{
					
					applications( function ( res, dat )
					{
						
						if( dat )
						{
							for( var k in dat )
							{
								if( dat[k] && dat[k].Name )
								{
									dat[k].Preview = ( !dat[k].Preview ? '/webclient/apps/'+dat[k].Name+'/icon.png' : '/system.library/module/?module=system&command=getapplicationpreview&application='+dat[k].Name+'&authid='+Application.authId );
								}
							}
						}
						
						loadingInfo.software = dat;
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
					}, extra );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 6 | Get all applications
				function(  )
				{
					
					applications( function ( res, dat )
					{
						
						if( dat )
						{
							for( var k in dat )
							{
								if( dat[k] && dat[k].Name )
								{
									dat[k].Preview = ( !dat[k].Preview ? '/webclient/apps/'+dat[k].Name+'/icon.png' : '/system.library/module/?module=system&command=getapplicationpreview&application='+dat[k].Name+'&authid='+Application.authId );
								}
							}
						}
						
						loadingInfo.applications = dat;
						
						if( ShowLog ) console.log( '// 6 | Get all applications' );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ 'application', 'looknfeel' ] );
						
					} );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 7 | Get user dock
				function(  )
				{
					
					getDockItems( function ( res, dat )
					{
						
						if( dat )
						{
							for( var k in dat )
							{
								if( dat[k] && dat[k].Name )
								{
									dat[k].Preview = ( !dat[k].Preview ? '/webclient/apps/'+dat[k].Name+'/icon.png' : '/system.library/module/?module=system&command=getapplicationpreview&application='+dat[k].Name+'&authid='+Application.authId );
								}
							}
						}
						
						loadingInfo.dock = dat;
						
						if( ShowLog ) console.log( '// 7 | Get user dock' );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ 'dock' ] );
						
					}, extra );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 8 | Load user settings
				function(  )
				{
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						
						let settings = null;
						try
						{
							settings = JSON.parse( d );
						}
						catch( e ) {  }
						
						if( e != 'ok' ) settings = '404';
						loadingInfo.settings = settings;
						
						if( ShowLog ) console.log( '// 8 | Load user settings' );
						
						// If abort request is set stop loading this user ...
						if( UsersSettings( 'abort' ) )
						{
							if( ge( 'UserDetails' ) )
							{
								ge( 'UserDetails' ).innerHTML = '';
							}
							UsersSettings( 'abort', false ); return;
						}
						
						initUsersDetails( loadingInfo, [ '*' ] );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
					}
					u.execute( 'usersettings', { userid: extra, authid: Application.authId } );
					
				},
				
				// 9 | Get more user settings
				function(  )
				{
					if( loadingInfo.settings && loadingInfo.settings.Theme )
					{
						
						let u = new Module( 'system' );
						u.onExecuted = function( e, d )
						{
							
							let workspacesettings = null;
						
							try
							{
								workspacesettings = JSON.parse( d );
							}
							catch( e ) {  }
						
							if( e != 'ok' ) workspacesettings = '404';
							loadingInfo.workspaceSettings = workspacesettings;
							
							if( ShowLog ) console.log( '// 9 | Get more user setting' );
							
							// If abort request is set stop loading this user ...
							if( UsersSettings( 'abort' ) )
							{
								if( ge( 'UserDetails' ) )
								{
									ge( 'UserDetails' ).innerHTML = '';
								}
								UsersSettings( 'abort', false ); return;
							}
							
							initUsersDetails( loadingInfo, [ '*' ] );
						}
						u.execute( 'getsetting', { settings: [ 
							'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
							'locale', 'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
							'focusmode', 'hiddensystem', 'workspacecount', 
							'scrolldesktopicons', 'wizardrun', 'themedata_' + loadingInfo.settings.Theme,
							'workspacemode', 'startupsequence'
						], userid: extra, authid: Application.authId } );
					}
					
					// Go to next in line ..., might not need to load the next ...
					loadingList[ ++loadingSlot ](  );
				},
				
				// 7 | init
				function(  )
				{
					if( ShowLog ) console.log( '// 10 | init' );
					
					// If abort request is set stop loading this user ...
					if( UsersSettings( 'abort' ) )
					{
						if( ge( 'UserDetails' ) )
						{
							ge( 'UserDetails' ).innerHTML = '';
						}
						UsersSettings( 'abort', false ); return;
					}
					
					initUsersDetails( loadingInfo, [ 'workgroup', 'role', 'storage', 'application', 'dock', 'startup', 'looknfeel' ] );
				}
				
			];
			// Runs 0 the first in the array ...
			loadingList[ 0 ]();
			
			
			// TODO: Make a new type of more custom loop of functions ...
			
			
			
			return;
		}
	}
	
	let checkedGlobal = Application.checkAppPermission( [ 'PERM_USER_READ_GLOBAL', 'PERM_USER_GLOBAL' ] );
	let checkedWorkgr = Application.checkAppPermission( [ 'PERM_USER_READ_IN_WORKGROUP', 'PERM_USER_WORKGROUP' ] );
	
	
	// After permission checks, initialize the userlist
	if( checkedGlobal || checkedWorkgr )
	{
		
		if( !cmd || cmd == 'init' )
		{
			
			// If extra has data no need to run getUserlist twice, just doListUsers( userList )
			
			if( extra )
			{
				
				if( !UsersSettings( 'experiment' ) )
				{
					doListUsers( extra );
				}
			}
			else
			{
				
				//console.log( "UsersSettings( 'logintime', false ); to list users without lastlogin ..." );
				//console.log( "UsersSettings( 'experiment', true ); to show latest grid method ..." );
				
				console.log( "UsersSettings( 'avatars', true ); to show users list with avatars ..." );
				
				// Experimental ...
				if( UsersSettings( 'experiment' ) )
				{
					console.log( "UsersSettings( 'debug', true ); to show debug info ..." );
					
					getUserlist( function( res, userList )
					{
							
						if( res == 'ok' )
						{
							initUserlist( userList );
							
							if( UsersSettings( 'debug' ) )
							{
								scrollengine.debug = ge( 'Debug' );
							}
							
							// Set layout function
							scrollengine.set( function( start, allNodes, myArray )
							{
								//console.log( { start: start, allNodes: allNodes, myArray: myArray } );
								
								if( allNodes && myArray )
								{
									let uids = [];
								
									let status = [ 'Active', 'Disabled', 'Locked' ];
		
									let login = [ 'Never' ];
									
									let self = this;
									let s = start;
									let len = self.length( allNodes );
									
									// Used to draw stuff
									let canvas = document.createElement( 'canvas' );
									let ctx = canvas.getContext( '2d' );
									canvas.width = 16;
									canvas.height = 16;
									
									for( let a = 0; a < len; a++, s++ )
									{
										
										// Set content
										if( myArray[ s ] && myArray[ s ].ID && myArray[ s ].Name && allNodes[ s ] )
										{
											let str = '';
											
											let src = '';
											
											if( UsersSettings( 'avatars' ) )
											{
												if( myArray[ s ].imageObj == null )
												{
													src = '/system.library/module/?module=system&command=getavatar&userid=' + myArray[s].ID + ( myArray[s].image ? '&image=' + myArray[s].image : '' ) + '&width=16&height=16&authid=' + Application.authId;
													let iii = new Image();
													iii.myArray = myArray[ s ];
													iii.onload = function() 
													{
														this.myArray.imageObj = this;
														ctx.clearRect( 0, 0, 16, 16);
														ctx.drawImage( this.myArray.imageObj, 0, 0, 16, 16 );
														this.myArray.imageObj.blob = canvas.toDataURL( 'image/png' );
													};
													iii.src = src;
												}
												// From cache
												else
												{
													src = myArray[ s ].imageObj.blob;
												}
											}
											
											let obj = {
												ID        : ( myArray[s][ 'ID' ] ),
												Name      : ( myArray[s][ 'Name' ] ? myArray[s][ 'Name' ] : 'n/a' ),
												FullName  : ( myArray[s][ 'FullName' ] ? myArray[s][ 'FullName' ] : 'n/a' ),
												Status    : ( status[ ( myArray[s][ 'Status' ] ? myArray[s][ 'Status' ] : 0 ) ] ),
												Timestamp : ( myArray[s][ 'LoginTime' ] ? myArray[s][ 'LoginTime' ] : 0 ),
												Logintime : ( myArray[s][ 'LoginTime' ] != 0 && myArray[s][ 'LoginTime' ] != null ? CustomDateTime( myArray[s][ 'LoginTime' ] ) : login[ 0 ] )
											};
											
											let bg = 'background-position: center center;background-size: contain;background-repeat: no-repeat;position: absolute;top: 0;left: 0;width: 100%;height: 100%;background-image: url(\'' + src + '\')';
											
											str += '\
				<div class="TextCenter HContent10 FloatLeft PaddingSmall Ellipsis edit">\
					<span id="UserAvatar_'+obj.ID+'" fullname="'+obj.FullName+'" status="'+obj.Status+'" logintime="'+obj.Logintime+'" timestamp="'+obj.Timestamp+'" class="IconSmall fa-user-circle-o avatar" style="position: relative;">\
						<div style="' + bg + '"></div>\
					</span>\
				</div>\
				<div class=" HContent30 FloatLeft PaddingSmall Ellipsis fullname">' + obj.FullName + '</div>\
				<div class=" HContent25 FloatLeft PaddingSmall Ellipsis name">' + obj.Name + '</div>\
				<div class=" HContent15 FloatLeft PaddingSmall Ellipsis status">' + obj.Status + '</div>\
				<div class=" HContent20 FloatLeft PaddingSmall Ellipsis logintime">' + obj.Logintime + '</div>';
											
											let selected = ( ge( 'UserListID_' + obj.ID ) && ge( 'UserListID_' + obj.ID ).className.indexOf( 'Selected' ) >= 0 ? ' Selected' : '' );
											
											let div = document.createElement( 'div' );
											div.className = 'HRow ' + obj.Status + ' Line ' + s + selected;
											div.id = 'UserListID_' + obj.ID;
											div.innerHTML = str;
											
											let test = allNodes[ s ];
											if( test )
											{
												test = test.getElementsByTagName( 'div' );
												
												if( test.length )
												{
													allNodes[ s ].replaceChild( div, test[0] );
												}
												else
												{
													allNodes[ s ].innerHTML = '';
													allNodes[ s ].appendChild( div );
												}
											
												// TODO: Set the image once it's ready ...
												if( UsersSettings( 'avatars' ) )
												{
													let spa = allNodes[ s ].getElementsByTagName( 'span' )[0].getElementsByTagName( 'div' )[0];
													spa.style.backgroundImage = 'url(' + src + ')';
												}
												
												allNodes[ s ].title = 'Line ' + s;
											
												allNodes[ s ].myArrayID = obj.ID;
												allNodes[ s ].onclick = ( function(  )
												{
													
													// If former operation is still loading, abort it.
													if( UsersSettings( 'busy' ) )
													{
														console.log( '[1] aborting ... ', UsersSettings( 'busy' ) );
														UsersSettings( 'abort', true );
													}
													
													if( this.line != null && allNodes )
													{
														for( let i in allNodes )
														{
															if( allNodes[i] && allNodes[i].className && allNodes[i].className.indexOf( ' Selected' ) >= 0 )
															{
																allNodes[i].className = ( allNodes[i].className.split( ' Selected' ).join( '' ) );
															}
														}
									
														this.className = this.className.split( ' Selected' ).join( '' ) + ' Selected';
														self.selectedLine = this.line;
													}
													
													Sections.accounts_users( 'edit', this.myArrayID );
												} );
												
												uids.push( obj.ID );
											}
										}
										else
										{
											// TODO: Look at this and see if we need to remove or not ...
											
											let test = allNodes[ s ];
											if( test )
											{
												allNodes[ s ].parentNode.removeChild( test );
											}
										}
										
									}
									
								}
								
							} );
							
							UsersSettings( 'reset', 'all' );
							
							scrollengine.init( ge( 'ListUsersInner' ), userList, userList[ 'Count' ], function( ret ) 
							{
								//console.log( '[1] ListUsersInner ', ret );
								
								let obj = { start: ret.start, limit: ret.limit };
								
								// Only run the request when server is ready, one job at a time ... 
								
								RequestQueue.Set( function( callback, key )
								{
									
									getUserlist( function( res, dat )
									{
										
										if( callback )
										{
											callback( key );
										}
										
										//console.log( '[2] ListUsersInner ', { res: res, dat: dat } );
										
										if( res == 'ok' && dat )
										{
											// TODO: Check why it refreshes twice on Arrow Down ...
											//alert( 'blinky blinky? ...' );
											//return;
											scrollengine.distribute( dat, obj.start, dat['Count'] );
										
										}
									
									}, key, ( obj.start/*ret.start*/ + ', ' + obj.limit/*ret.limit*/ ) );
								
								} );
								
							} );
							
							
							
							if( accounts_users_callback )
							{
								accounts_users_callback( true );
							}
							
						}
					
					}, false, '0, 150'/* + UsersSettings( 'maxlimit' )*/ );
					
					return;	
				}
				
				// This is the old init, and can be removed once the new one is working PROPERLY, not before.
				
				console.log( "UsersSettings( 'listall', true ); to list all users ..." );
				console.log( "UsersSettings( 'avatars', false ); to list users without avatar ..." );
				console.log( "UsersSettings(  ); for current Users Settings ..." );
				
				// Temporary ...
				UsersSettings( 'avatars', false );
				
				// Get correct estimate of how many users fit into the window area ...
			
				CheckUserlistSize( true );
				
				getUserlist( function( res, userList )
				{
					
					doListUsers( userList );
					
					if( res == 'ok' )
					{
						Init();
					}
					
				} );
				
			}
			
		}
		
		mitraApps( function( ret )
		{
		
			// TODO: save a list of all users or create a specific call by id to get one user together with user details, this is just to see if the apps list so we can add it to the users dock ...
			
		} );
		
	}
	else
	{
		let o = ge( 'UserList' );
		if( o ) o.innerHTML = '';
		
		let h3 = document.createElement( 'h3' );
		h3.innerHTML = '<strong>{i18n_permission_denied}</strong>';
		o.appendChild( h3 );
	}
};





// --- Functions related to Sections.account_users() ---------------------------------------------------------------- */



// read ------------------------------------------------------------------------------------------------------------- //



function initUserlist( userList  )
{
	
	ge( 'UserList' ).innerHTML = '<div class="VContent100 OverflowHidden BorderRadius Elevated"></div>';
	
	let o = ge( 'UserList' ).getElementsByTagName( 'div' )[0];
					
	if( !ge( 'ListUsersInner' ) )
	{
		if( o ) o.innerHTML = '';
	}
	
	if( !ge( 'ListUsersInner' ) )
	{								
		let str = '';
		
		// Temporary ...
		
		let divs = appendChild( [ 
			{ 
				'element' : function() 
				{
					let d = document.createElement( 'div' );
					d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight';
					return d;
				}(),
				'child' : 
				[ 
					{ 
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'HContent25 InputHeight FloatLeft';
							d.innerHTML = '<h3 class="NoMargin PaddingSmallLeft PaddingSmallRight"><strong>Users </strong><span id="AdminUsersCount">(' + userList['Count'] + ')</span></h3>';
							return d;
						}() 
					}, 
					{ 
						'element' : function() 
						{
							// TODO: Make this one dynamic based on left div width ...
							let d = document.createElement( 'div' );
							d.className = 'PaddingSmall HContent65 FloatLeft Relative';
							return d;
						}(),
						'child' : 
						[ 
							{ 
								'element' : function() 
								{
									let inpu = document.createElement( 'input' );
									inpu.className = 'FullWidth';
									inpu.type = 'text';
									inpu.placeholder = i18n( 'i18n_search' );
									inpu.onkeyup = function(  )
									{
										searchServer( this.value );
									};
									return inpu;
								}()
							}
						]
					},
					{ 
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'HContent10 FloatLeft TextRight InActive';
							return d;
						}(),
						'child' : 
						[ 
							{
								'element' : function() 
								{
									let btn = document.createElement( 'button' );
									btn.className = 'IconButton IconMedium Negative fa-bars';
									btn.id = 'AdminUsersBtn';
									btn.onclick = function(  )
									{
										SubMenu( this );
									};
									return btn;
								}()
							},
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'submenu_wrapper';
									return d;
								}(),
								'child' : 
								[ 
									{
										'element' : function() 
										{
											let ul = document.createElement( 'ul' );
											ul.className = 'Positive';
											ul.id = 'AdminUsersSubMenu';
											return ul;
										}(),
										'child' : 
										[ 
											{
												'element' : function() 
												{
													let li = document.createElement( 'li' );
													li.innerHTML = i18n( 'i18n_new_user' );
													li.onclick = function(  )
													{
														NewUser( this );
													};
													return li;
												}()
											},
											{
												'element' : function() 
												{
													let li = document.createElement( 'li' );
													li.className = 'show';
													li.innerHTML = i18n( 'i18n_show_disabled_users' );
													li.onclick = function(  )
													{
														if( this.className.indexOf( 'show' ) >= 0 )
														{
															hideStatus( 'Disabled', true, true );
															this.innerHTML = i18n( 'i18n_hide_disabled_users' );
															this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
														}
														else
														{
															hideStatus( 'Disabled', false, true );
															this.innerHTML = i18n( 'i18n_show_disabled_users' );
															this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
														}
														
														SubMenu( this.parentNode.parentNode );
													};
													return li;
												}()
											},
											{
												'element' : function() 
												{
													let li = document.createElement( 'li' );
													li.className = 'hide';
													li.innerHTML = i18n( 'i18n_hide_locked_users' );
													li.onclick = function(  )
													{
														if( this.className.indexOf( 'hide' ) >= 0 )
														{
															hideStatus( 'Locked', false, true );
															this.innerHTML = i18n( 'i18n_show_locked_users' );
															this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
														}
														else
														{
															hideStatus( 'Locked', true, true );
															this.innerHTML = i18n( 'i18n_hide_locked_users' );
															this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
														}
														
														SubMenu( this.parentNode.parentNode );
													};
													return li;
												}()
											}
										]
									}
								]
							}
						]
					}
				]
			},
			{
				'element' : function() 
				{
					let d = document.createElement( 'div' );
					d.className = 'List';
					return d;
				}(),
				'child' : 
				[ 
					{
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'HRow BackgroundNegative Negative Padding';
							return d;
						}(),
						'child' : 
						[ 
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft Ellipsis';
									return d;
								}(),
								'child' : 
								[ 
									{
										'element' : function() 
										{
											let b = document.createElement( 'strong' );
											b.innerHTML = i18n( 'i18n_header_FullName' );
											b.onclick = function()
											{
												sortUsers( 'FullName' );
											};
											return b;
										}()
									}
								]
							},
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallRight HContent25 FloatLeft Ellipsis';
									return d;
								}(),
								'child' : 
								[ 
									{
										'element' : function() 
										{
											let b = document.createElement( 'strong' );
											b.innerHTML = i18n( 'i18n_header_Name' );
											b.onclick = function()
											{
												sortUsers( 'Name' );
											};
											return b;
										}()
									}
								]
							},
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Ellipsis';
									return d;
								}(),
								'child' : 
								[ 
									{
										'element' : function() 
										{
											let b = document.createElement( 'strong' );
											b.innerHTML = i18n( 'i18n_header_Status' );
											b.onclick = function()
											{
												sortUsers( 'Status' );
											};
											return b;
										}()
									}
								]
							},
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallLeft PaddingSmallRight HContent20 FloatLeft Ellipsis';
									return d;
								}(),
								'child' : 
								[ 
									{
										'element' : function() 
										{
											let b = document.createElement( 'strong' );
											b.innerHTML = i18n( 'i18n_header_LoginTime' );
											b.onclick = function()
											{
												sortUsers( 'LoginTime' );
											};
											return b;
										}()
									}
								]
							}
						]
					}
				]
			},
			{
				'element' : function() 
				{
					let d = document.createElement( 'div' );
					d.style = 'position:relative;height:calc(100% - 77px);';
					d.id = 'ListUsersWrapper';
					return d;
				}(),
				'child' : 
				[ 
					{
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'ScrollArea HContentLeft VContent100 HContent100';
							return d;
						}(),
						'child' : 
						[ 
							{
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'List FullName ASC';
									d.id = 'ListUsersInner';
									d.setAttribute( 'sortby', 'FullName' );
									d.setAttribute( 'orderby', 'ASC' );
									return d;
								}()
							}
						]
					}
				]
			}
		] );
		
		if( divs )
		{
			for( var i in divs )
			{
				if( divs[i] && o )
				{
					o.appendChild( divs[i] );
				}
			}
		}
		
		ge( 'UserList' ).className = ge( 'UserList' ).className + ' experiment';
		ge( 'ListUsersInner' ).className = ge( 'ListUsersInner' ).className + ' experiment';
		
	}
	
}

function getStorageInfo( path, id, args, callback )
{
	// TODO: Had to move this function out of this section to get access to it outside in another function, look at this mess some other time ...

	// TODO: So we need to get server token as admin for this user and then use that as a sessionid ???

	if( path && id && callback )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			let json = null;
		
			if( d )
			{
				try
				{
					json = JSON.parse( d );
				} 
				catch( e ){ }
			}
			
			if( e == 'ok' && d )
			{
				if( json )
				{
					if( ShowLog ) console.log( '[ok] volumeinfo ', { e:e, d:json, args: { path: path, userid: id, authid: Application.authId } } );
				
					return callback( true, json, args );
				}
			}
		
			// Show error message if there is any ...
		
			if( d )
			{
				args.Errors = { text: '[fail] volumeinfo ', content: { e:e, d:(json?json:d), args: { path: path, userid: id, authid: Application.authId } } };
			}
			else
			{
				args.Errors = { text: '[fail] volumeinfo not support in DOSDriver ... ', content: { path: path, userid: id, authid: Application.authId } };
			}
		
			return callback( false, ( json ? json : false ), args );
		}
		m.execute( 'volumeinfo', { path: path, userid: id, authid: Application.authId } );
	
		return true;
	}

	return false;
}

function applications( callback, id )
{
	
	if( callback )
	{
		if( id )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' && d )
				{
					try
					{
						let json = JSON.parse( d );
				
						if( json )
						{
							//console.log( 'Listuserapplications: ', json );
							
							return callback( true, json );
						}
					} 
					catch( e ){ } 
				}
				
				return callback( false, false );
			}
			m.execute( 'listuserapplications', { userid: id, authid: Application.authId } );
		}
		else
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' && d )
				{
					try
					{
						let json = JSON.parse( d );
				
						
						if( json )
						{
							//console.log( 'Software: ', json );
							
							return callback( true, json );
						}
					} 
					catch( e ){ } 
				}
				
				return callback( false, false );
			}
			m.execute( 'software', { mode: 'showall', authid: Application.authId } );
		}
		
		return true;
	}
	
	return false;
	
}

function getDockItems( callback, userId )
{
	let m = new Module( 'dock' );
	m.onExecuted = function( e, d )
	{
		let data = false;
											
		try
		{
			data = JSON.parse( d );
		}
		catch( e ) {  }
		
		if( e == 'ok' && data )
		{
			if( ShowLog ) console.log( 'getDockItems ', { e:e, d:data } );
			
			if( callback ) callback( true, data );
		}
		else
		{
			if( ShowLog ) console.log( 'getDockItems ', { e:e, d:d } );
			
			if( callback ) callback( false, false );
		}
	}
	m.execute( 'items', { userID: userId } );
}

function getSetupList( callback )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			if( callback ) return callback( false );
		}
		let rows = '';
		try
		{
			rows = JSON.parse( d );
		} 
		catch( e ) {  }
		
		if( callback ) return callback( true, rows );
	}
	m.execute( 'usersetup' );
}

function randomAvatar( fullname, callback )
{
	if( fullname )
	{
		let u = new Module( 'system' );
		u.onExecuted = function( e, d )
		{
			let out = null;
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

function NewUser( _this )
{
	// Language
	let availLangs = {
		'en' : 'English',
		'fr' : 'French',
		'no' : 'Norwegian',
		'fi' : 'Finnish',
		'pl' : 'Polish'
	};
	
	let languages = '';
	
	for( var a in availLangs )
	{
		languages += '<option value="' + a + '">' + availLangs[ a ] + '</option>';
	}
	
	// Setup / Template
	
	getSetupList( function( e, data )
	{
		
		let setup = '<option value="0">None</option>';
		
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
		
		let mobile = {
			
			codes : [ 47, 45 ],
						
			select : function (  )
			{
				let opt = '';
				
				if( this.codes )
				{
					for( let i in this.codes )
					{
						if( this.codes[i] )
						{
							opt += '<option value="+'+this.codes[i]+'">+'+this.codes[i]+'</option>';
						}
					}
				}
				
				return opt;
			}
			
		};
		
		let d = new File( 'Progdir:Templates/account_users_details.html' );
		// Add all data for the template
		d.replacements = {
			user_name            : i18n( 'i18n_new_user' ),
			user_fullname        : '',
			user_username        : '',
			user_email           : '',
			user_mobile_code     : mobile.select(),
			user_mobile          : '',
			user_language        : languages,
			user_setup           : setup,
			user_locked_toggle   : '',
			user_disabled_toggle : '',
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
			applications         : '',
			dock                 : '',
			startup              : ''
		};
	
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'UserDetails'               ).innerHTML = data;
			
			ge( 'WorkgroupEdit' ).style.display = 'none';
			
			ge( 'AdminStatusContainer'      ).style.display = 'none';
		
			ge( 'AdminLooknfeelContainer'   ).style.display = 'none';
			
			ge( 'AdminRoleContainer'        ).style.display = 'none';
			ge( 'AdminStorageContainer'     ).style.display = 'none';
			ge( 'AdminApplicationContainer' ).style.display = 'none';
			ge( 'AdminDockContainer'        ).style.display = 'none';
			ge( 'AdminStartupContainer'     ).style.display = 'none';
			
			// User
			
			let bg1  = ge( 'UserSaveBtn' );
			if( bg1 )
			{
				if( Application.checkAppPermission( [ 
					'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
				] ) )
				{
					bg1.onclick = function( e )
					{
						
						if( ge( 'usUsername' ).value )
						{
							//this.innerHTML = '<i class="fa fa-spinner" aria-hidden="true"></i>';
							
							_saveUser( false, function( uid )
							{
								
								if( uid )
								{
									
									// Refresh whole users list ...
									
									searchServer( null, true, function(  )
									{
										
										/*// TODO: look at a better way to handle this with the scrollengine for new users and refresh of the list ...
									
										Sections.accounts_users( 'init', false, function( ok )
										{
										
											//console.log( "Sections.accounts_users( 'init', false, function( ok )" );
										
											if( ok )
											{*/
												// Go to edit mode for the new user ...
											
												if( ge( 'UserListID_' + uid ) && ge( 'UserListID_' + uid ).parentNode.onclick )
												{
													ge( 'UserListID_' + uid ).parentNode.skip = true;
													ge( 'UserListID_' + uid ).parentNode.onclick(  );
												}
												else
												{
													Sections.accounts_users( 'edit', uid );
												}
											/*}
										
										} );*/
										
									} );
								}
				
							} );
						}
						else
						{
							ge( 'usUsername' ).focus();
						}
					}
				}
				else
				{
					bg1.style.display = 'none';
				}
			}
			let bg2  = ge( 'UserCancelBtn' );
			if( bg2 ) bg2.onclick = function( e )
			{
				cancelUser(  );
			}
			let bg3  = ge( 'UserBackBtn' );
			if( !isMobile ) 
			{
				if( bg3 ) bg3.style.display = 'none';
			}
			else
			{
				if( bg3 ) bg3.onclick = function( e )
				{
					cancelUser(  );
				}
			}
			
			if( ge( 'UserDeleteBtn' ) )
			{
				ge( 'UserDeleteBtn' ).className = 'Closed';
			}
			
			if( ge( 'UserBasicDetails' ) )
			{
				let inps = ge( 'UserBasicDetails' ).getElementsByTagName( 'input' );
				if( inps.length > 0 )
				{
					for( var a = 0; a < inps.length; a++ )
					{
						if( inps[ a ].id && [ 'usFullname', 'usUsername', 'usEmail', 'usMobile' ].indexOf( inps[ a ].id ) >= 0 )
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
				
				if( ge( 'usLevel' ) )
				{
					ge( 'usLevel' ).current = ge( 'usLevel' ).value;
				}
				
				if( ge( 'AdminLevelContainer' ) && Application.checkAppPermission( [ 'PERM_USER_READ_GLOBAL', 'PERM_USER_GLOBAL' ] ) )
				{
					if( ge( 'AdminLevelContainer' ).classList.contains( 'Closed' ) )
					{
						ge( 'AdminLevelContainer' ).classList.remove( 'Closed' );
						ge( 'AdminLevelContainer' ).classList.add( 'Open' );
					}
				}
				
				if( ge( 'usLanguage' ) )
				{
					ge( 'usLanguage' ).current = ge( 'usLanguage' ).value;
				}
				if( ge( 'usSetup' ) )
				{
					ge( 'usSetup' ).current = ge( 'usSetup' ).value;
				}
			}
			
			// Avatar 
			
			let ra = ge( 'AdminAvatarRemove' );
			if( ra ) 
			{
				if( Application.checkAppPermission( [ 
					'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
					'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_WORKGROUP_GLOBAL' 
				] ) )
				{
					ra.onclick = function( e )
					{
						removeAvatar();
					}
				}
				else
				{
					ra.style.display = 'none';
				}
			}
			
			let ae = ge( 'AdminAvatarEdit' );
			if( ae )
			{
				if( Application.checkAppPermission( [ 
					'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
					'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL',        'PERM_WORKGROUP_GLOBAL' 
				] ) )
				{
					ae.onclick = function( e )
					{
						changeAvatar();
					}
				}
				else
				{
					ae.style.display = 'none';
				}
			}
			
			let au = ge( 'usFullname' );
			if( au ) au.onblur = function( e )
			{
				if( this.value && this.value != this.fullname )
				{
				
					randomAvatar( this.value, function( avatar ) 
					{
						let canvas = 0;
						
						try
						{
							canvas = ge( 'AdminAvatar' ).toDataURL();
						}
						catch( e ) {  }
						
						if( ge( 'AdminAvatar' ) && avatar && ( ( canvas && canvas.length <= 15000 ) || !canvas ) )
						{
							// Only update the avatar if it exists..
							let avSrc = new Image();
							avSrc.src = avatar;
							avSrc.onload = function()
							{
								if( ge( 'AdminAvatar' ) )
								{
									let ctx = ge( 'AdminAvatar' ).getContext( '2d' );
									ctx.drawImage( avSrc, 0, 0, 256, 256 );
								}
							}
						}
					
					} );
				
					this.fullname = this.value;
				}
			}
			
			// Workgroups ...
			
			function GetUserWorkgroups( callback )
			{
				
				if( Application.checkAppPermission( [ 
					'PERM_WORKGROUP_READ_GLOBAL', 'PERM_WORKGROUP_READ_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',      'PERM_WORKGROUP_WORKGROUP' 
				] ) )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
					
					let args = JSON.stringify( {
						'type'    : 'read', 
						'context' : 'application', 
						'authid'  : Application.authId, 
						'data'    : { 
							'permission' : [ 
								'PERM_WORKGROUP_READ_GLOBAL',
								'PERM_WORKGROUP_READ_IN_WORKGROUP',
								'PERM_WORKGROUP_GLOBAL', 
								'PERM_WORKGROUP_WORKGROUP' 
							]
						}, 
						'listdetails' : 'workgroup' 
					} );
					
					let f = new Library( 'system.library' );
					f.onExecuted = function( e, d )
					{
						
						let wgroups = null; var workgroups = null;
						
						try
						{
							wgroups = JSON.parse( d );
						}
						catch( e ){ }
						
						if( ShowLog ) console.log( 'workgroups ', { e:e , d:(wgroups?wgroups:d), args: args } );
						
						if( wgroups.groups )
						{
							workgroups = wgroups.groups;
						}
						else if( wgroups.data && wgroups.data.details && wgroups.data.details.groups )
						{
							workgroups = wgroups.data.details.groups;
						}
						
						var out = {};
						
						if( wgroups && workgroups )
						{
							for( var a in workgroups )
							{
								if( workgroups[a] && workgroups[a].ID )
								{
									out[workgroups[a].ID] = ( { ID: workgroups[a].ID, UUID: workgroups[a].uuid, Name: workgroups[a].name, ParentID: workgroups[a].parentid, Status: workgroups[a].status } );
								}
							}
							
							//if( callback ) return callback( out );
						}
						
						listModuleWorkgroups( out, callback );
						
						//if( callback ) return callback( [] );
						
					}
					f.execute( 'group/list', { authid: Application.authId, args: args } );
					
				}
				else
				{
					
					let u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
				
						let userInfo = null;
				
						try
						{
							userInfo = JSON.parse( d );
						}
						catch( e ){  }
						
						let workgroups = userInfo.Workgroup;
						
						if( ShowLog ) console.log( 'userinfo ', { e:e, d:(userInfo?userInfo:d) } );
						
						if( userInfo && workgroups )
						{
							if( callback ) return callback( workgroups );
						}
						
						if( callback ) return callback( [] );
						
					}
					u.execute( 'userinfoget', { mode: 'all', authid: Application.authId } );
					
				}
				
			}
			
			// TODO: Temporary until owner and only admin flags are supported in system.library/group/list
			
			function listModuleWorkgroups( workgroups, callback )
			{
		
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					var data = null;
			
					try
					{
						data = JSON.parse( d );
					}
					catch( e ) {  }
			
					if( data && workgroups )
					{
						for( var i in data )
						{
							// Set Owner ...
					
							if( data[i] && data[i].ID && data[i].Owner && workgroups[data[i].ID] )
							{
								workgroups[data[i].ID].Owner = data[i].Owner;
							}
					
							// Hide non Admin workgroups ...
					
							if( data[i] && data[i].ID && data[i].Level == 'User' && workgroups[data[i].ID] )
							{
								workgroups[data[i].ID].Hide = true;
							}
					
						}
					}
			
					console.log( '[1] listModuleWorkgroups', workgroups );
			
					console.log( '[2] listModuleWorkgroups', { e:e, d:(data?data:d) } );
			
					if( callback )
					{
						// Temporary until FriendCore supports all this ...
						if( data )
						{
							return callback( data );
						}
						//if( workgroups )
						//{
						//	return callback( workgroups );
						//}
				
						return callback( [] );
					}
			
				}
				m.execute( 'workgroups', { owner: true, level: true, authid: Application.authId } );
		
			}
			
			
			
			GetUserWorkgroups( function( workgroups )
			{
				
				if( ShowLog ) console.log( 'workgroups: ', workgroups );
				
				groups = {};
				
				if( workgroups )
				{
					
					let adminlevel = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_GLOBAL', 'PERM_USER_READ_GLOBAL', 'PERM_WORKGROUP_GLOBAL', 'PERM_USER_GLOBAL' ] );
					let userlevel  = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_IN_WORKGROUP', 'PERM_USER_READ_IN_WORKGROUP', 'PERM_WORKGROUP_WORKGROUP', 'PERM_USER_WORKGROUP' ] );
					
					let wgroups = false;
					
					if( ShowLog ) console.log( 'userlevel ', { adminlevel: adminlevel, userlevel: userlevel } );
					
					if( !adminlevel && userlevel )
					{
						let wgroups = {};
						
						//console.log( 'userlevel ', userlevel );
						
						for( var a in userlevel )
						{
							if( userlevel[a] && userlevel[a].GroupID )
							{
								wgroups[ userlevel[a].GroupID ] = userlevel[a];
							}
						}
						
					}
					
					var unsorted = {};
					
					// Add all workgroups to unsorted and add subgroups array ...
					
					for( var i in workgroups )
					{
						if( workgroups[i] && workgroups[i].ID )
						{
							if( wgroups && !wgroups[workgroups[i].ID] )
							{
								continue;
							}
							
							unsorted[workgroups[i].ID] = {};
							
							for( var ii in workgroups[i] )
							{
								if( workgroups[i][ii] )
								{
									unsorted[workgroups[i].ID][ii] = workgroups[i][ii];
								}
							}
							
							unsorted[workgroups[i].ID].level = 1;
							unsorted[workgroups[i].ID].groups = [];
						}
					}
					
					// Arrange all subgroups to parentgroups ...
					
					let set = [];
					
					for( var k in unsorted )
					{
						if( unsorted[k].ParentID > 0 && unsorted[ unsorted[k].ParentID ] )
						{
							unsorted[ unsorted[k].ParentID ].groups.push( unsorted[k] );
							
							if( unsorted[ unsorted[k].ParentID ].groups )
							{
								for( var kk in unsorted[ unsorted[k].ParentID ].groups )
								{
									if( unsorted[ unsorted[k].ParentID ].groups[ kk ] )
									{
										unsorted[ unsorted[k].ParentID ].groups[ kk ].level = ( unsorted[ unsorted[k].ParentID ].level +1 );
									}
								}
							}
							
							set.push( unsorted[k].ID );
						}
					}
					
					// Filter all subgroups allready set, away from root level ...
					
					for( var k in unsorted )
					{
						if( set.indexOf( unsorted[k].ID ) < 0 )
						{
							groups[ unsorted[k].ID ] = unsorted[k];
						}
					}
					
					if( ShowLog/* || 1==1*/ ) console.log( [ unsorted, set, groups ] );
					
				}
				
				var ii = 0;
				
				let str = '';
				
				if( groups )
				{
						
					for( var a in groups )
					{
						var found = false;
						
						ii++;
						
						str += '<div>';
						
						str += '<div class="HRow'+(groups[a].Hide||!groups[a].Owner?' Hidden':'')+'" id="WorkgroupID_' + groups[a].ID + '">';
						
						str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
						str += '		<span name="' + groups[a].Name + '" class="IconMedium fa-users"></span>';
						str += '	</div>';
						str += '	<div class="PaddingSmall HContent60 InputHeight FloatLeft Ellipsis">' + groups[a].Name + (groups[a].Owner?' (by '+groups[a].Owner+')':'') + '</div>';
						
						str += '	<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
						//str += '		<button wid="' + groups[a].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"></button>';
						str += CustomToggle( 'wid_' + groups[a].ID, 'FloatRight', null, function (  )
						{
							
							if( ge( 'usWorkgroups' ) )
							{
								
								var wids = [];
									
								if( ge( 'usWorkgroups' ).value )
								{
									wids = ge( 'usWorkgroups' ).value.split( ',' );
								}
								
								if( this.checked )
								{
									// Toggle on ...
									
									console.log( '// Toggle on ', wids );
									
									if( this.id && this.id.split( 'wid_' )[1] )
									{
										
										wids.push( this.id.split( 'wid_' )[1] );
										
										if( wids )
										{
											ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
										}
										else
										{
											ge( 'usWorkgroups' ).removeAttribute( 'value' );	
										}
										
									}
									
								}
								else
								{
									// Toggle off ...
								
									console.log( '// Toggle off ', wids );
									
									if( this.id && this.id.split( 'wid_' )[1] )
									{
										var nwid = [];
										
										if( wids )
										{
											for( var a in wids )
											{
												if( wids[a] )
												{
													if( wids[a] != this.id.split( 'wid_' )[1] )
													{
														nwid.push( wids[a] );
													}
												}
											}
											
											wids = nwid;
										}
										
										if( wids )
										{
											ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
										}
										else
										{
											ge( 'usWorkgroups' ).removeAttribute( 'value' );	
										}
										
									}
																				
								}
							}
							
						}, ( found ? true : false ) );
						
						str += '	</div>';
						
						str += '</div>';
						
						if( groups[a].groups.length > 0 )
						{
							
							str += '<div class="SubGroups">';
							
							for( var aa in groups[a].groups )
							{
								var found = false;
								
								ii++;
								
								str += '<div class="HRow'+(groups[a].groups[aa].Hide||!groups[a].groups[aa].Owner?' Hidden':'')+'" id="WorkgroupID_' + groups[a].groups[aa].ID + '">';
								
								str += '	<div class="TextCenter HContent4 InputHeight FloatLeft PaddingSmall" style="min-width:36px"></div>';
								str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
								str += '		<span name="' + groups[a].groups[aa].Name + '" class="IconMedium fa-users"></span>';
								str += '	</div>';
								str += '	<div class="PaddingSmall HContent55 InputHeight FloatLeft Ellipsis">' + groups[a].groups[aa].Name + (groups[a].groups[aa].Owner?' (by '+groups[a].groups[aa].Owner+')':'') + '</div>';
								
								str += '<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
								//str += '<button wid="' + groups[a].groups[aa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>';
								
								str += CustomToggle( 'wid_' + groups[a].groups[aa].ID, 'FloatRight', null, function (  )
								{
							
									if( ge( 'usWorkgroups' ) )
									{
								
										var wids = [];
									
										if( ge( 'usWorkgroups' ).value )
										{
											wids = ge( 'usWorkgroups' ).value.split( ',' );
										}
								
										if( this.checked )
										{
											// Toggle on ...
									
											console.log( '// Toggle on ', wids );
									
											if( this.id && this.id.split( 'wid_' )[1] )
											{
										
												wids.push( this.id.split( 'wid_' )[1] );
										
												if( wids )
												{
													ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
												}
												else
												{
													ge( 'usWorkgroups' ).removeAttribute( 'value' );	
												}
										
											}
									
										}
										else
										{
											// Toggle off ...
								
											console.log( '// Toggle off ', wids );
									
											if( this.id && this.id.split( 'wid_' )[1] )
											{
												var nwid = [];
										
												if( wids )
												{
													for( var a in wids )
													{
														if( wids[a] )
														{
															if( wids[a] != this.id.split( 'wid_' )[1] )
															{
																nwid.push( wids[a] );
															}
														}
													}
											
													wids = nwid;
												}
										
												if( wids )
												{
													ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
												}
												else
												{
													ge( 'usWorkgroups' ).removeAttribute( 'value' );	
												}
										
											}
																				
										}
									}
							
								}, ( found ? true : false ) );
								
								str += '</div>';
								
								str += '</div>';
								
								if( groups[a].groups[aa].groups.length > 0 )
								{
									
									str += '<div class="SubGroups">';
									
									for( var aaa in groups[a].groups[aa].groups )
									{
										var found = false;
										
										ii++;
										
										str += '<div class="HRow'+(groups[a].groups[aa].groups[aaa].Hide||!groups[a].groups[aa].groups[aaa].Owner?' Hidden':'')+'" id="WorkgroupID_' + groups[a].groups[aa].groups[aaa].ID + '">';
										
										str += '	<div class="TextCenter HContent8 InputHeight FloatLeft PaddingSmall" style="min-width:73px"></div>';
										str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
										str += '		<span name="' + groups[a].groups[aa].groups[aaa].Name + '" class="IconMedium fa-users"></span>';
										str += '	</div>';
										str += '	<div class="PaddingSmall HContent55 InputHeight FloatLeft Ellipsis">' + groups[a].groups[aa].groups[aaa].Name + (groups[a].groups[aa].groups[aaa].Owner?' (by '+groups[a].groups[aa].groups[aaa].Owner+')':'') + '</div>';
										
										str += '	<div class="PaddingSmall HContent15 FloatRight Ellipsis">';
										//str += '		<button wid="' + groups[a].groups[aa].groups[aaa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"></button>';
										
										str += CustomToggle( 'wid_' + groups[a].groups[aa].groups[aaa].ID, 'FloatRight', null, function (  )
										{
							
											if( ge( 'usWorkgroups' ) )
											{
								
												var wids = [];
									
												if( ge( 'usWorkgroups' ).value )
												{
													wids = ge( 'usWorkgroups' ).value.split( ',' );
												}
								
												if( this.checked )
												{
													// Toggle on ...
									
													console.log( '// Toggle on ', wids );
									
													if( this.id && this.id.split( 'wid_' )[1] )
													{
										
														wids.push( this.id.split( 'wid_' )[1] );
										
														if( wids )
														{
															ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
														}
														else
														{
															ge( 'usWorkgroups' ).removeAttribute( 'value' );	
														}
										
													}
									
												}
												else
												{
													// Toggle off ...
								
													console.log( '// Toggle off ', wids );
									
													if( this.id && this.id.split( 'wid_' )[1] )
													{
														var nwid = [];
										
														if( wids )
														{
															for( var a in wids )
															{
																if( wids[a] )
																{
																	if( wids[a] != this.id.split( 'wid_' )[1] )
																	{
																		nwid.push( wids[a] );
																	}
																}
															}
											
															wids = nwid;
														}
										
														if( wids )
														{
															ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
														}
														else
														{
															ge( 'usWorkgroups' ).removeAttribute( 'value' );	
														}
										
													}
																				
												}
											}
							
										}, ( found ? true : false ) );
										
										str += '	</div>';
										
										str += '</div>';
									
									}
								
									str += '</div>';
								}
								
							}
						
							str += '</div>';
						}
					
						str += '</div>';
					
					}
					
					
					
					//if( ge( 'AdminWorkgroupContainer' ) ) 
					//{ 
					//	ge( 'AdminWorkgroupContainer' ).className = 'Open';
					//}
					
				}
				
				
				
				let o = ge( 'WorkgroupGui' ); if( o ) o.innerHTML = '<input type="hidden" id="usWorkgroups">';
				
				let divs = appendChild( [ 
					{ 
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'HRow BackgroundNegative Negative Padding';
							return d;
						}(),
						'child' : 
						[ 
							{ 
								'element' : function(  ) 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallLeft PaddingSmallLeft HContent40 FloatLeft';
									d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
									d.style.cursor = 'pointer';
									d.ele = this;
									d.onclick = function(  )
									{
										sortgroups( 'Name' );
									};
									return d;
								}(  ) 
							}, 
							{ 
								'element' : function( _this ) 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmallLeft PaddingSmallLeft HContent45 FloatLeft Relative';
									d.innerHTML = '<strong></strong>';
									return d;
								}( this )
							},
							{ 
								'element' : function() 
								{
									let d = document.createElement( 'div' );
									d.className = 'PaddingSmall HContent15 FloatLeft Relative';
									return d;
								}()
							}
						]
					},
					{
						'element' : function() 
						{
							let d = document.createElement( 'div' );
							d.className = 'HRow List PaddingTop PaddingRight PaddingBottom';
							d.id = 'WorkgroupInner';
							d.style.overflow = 'auto';
							d.style.maxHeight = '314px';
							return d;
						}()
					}
				] );

				if( divs )
				{
					for( var i in divs )
					{
						if( divs[i] && o )
						{
							o.appendChild( divs[i] );
						}
					}
				}
				
				
				
				ge( 'WorkgroupInner' ).innerHTML = str;
				
				// Toggle arrow function, put into function that can be reused some time ...
						
				let workArr = ge( 'WorkgroupInner' ).getElementsByTagName( 'span' );
				
				if( workArr )
				{
					for( var a = 0; a < workArr.length; a++ )
					{
						
						if( workArr[ a ].classList.contains( 'fa-caret-right' ) || workArr[ a ].classList.contains( 'fa-caret-down' ) )
						{
							
							( function( b ) {
								b.onclick = function( e )
								{
									let pnt = this.parentNode.parentNode.parentNode;
									
									if( this.classList.contains( 'fa-caret-right' ) )
									{
										// Toggle open ...
										
										//console.log( '// Toggle open ...' );
										
										this.classList.remove( 'fa-caret-right' );
										this.classList.add( 'fa-caret-down' );
										
										let divs = pnt.getElementsByTagName( 'div' );
										
										if( divs )
										{
											for( var c = 0; c < divs.length; c++ )
											{
												if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
												{
													divs[c].classList.remove( 'Closed' );
													divs[c].classList.add( 'Open' );
													
													break;
												}
											}
										}
									}
									else
									{
										// Toggle close ...
										
										//console.log( '// Toggle close ...' );
										
										this.classList.remove( 'fa-caret-down' );
										this.classList.add( 'fa-caret-right' );
										
										let divs = pnt.getElementsByTagName( 'div' );
										
										if( divs )
										{
											for( var c = 0; c < divs.length; c++ )
											{
												if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
												{
													divs[c].classList.remove( 'Open' );
													divs[c].classList.add( 'Closed' );
													
													break;
												}
											}
										}
									}
									
								}
							} )( workArr[ a ] );
							
						}
						
					}
				}
				
				let workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
				
				if( workBtns )
				{
					for( var a = 0; a < workBtns.length; a++ )
					{
						// Toggle user relation to workgroup
						( function( b ) {
							b.onclick = function( e )
							{
								
								if( ge( 'usWorkgroups' ) )
								{
									
									let wids = [];
										
									if( ge( 'usWorkgroups' ).value )
									{
										wids = ge( 'usWorkgroups' ).value.split( ',' );
									}
									
									if( this.classList.contains( 'fa-toggle-off' ) )
									{
										// Toggle on ...
										
										//console.log( '// Toggle on ', wids );
										
										if( this.getAttribute( 'wid' ) )
										{
											
											wids.push( this.getAttribute( 'wid' ) );
											
											if( wids )
											{
												ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
											}
											else
											{
												ge( 'usWorkgroups' ).removeAttribute( 'value' );	
											}
											
											this.classList.remove( 'fa-toggle-off' );
											this.classList.add( 'fa-toggle-on' );
											
										}
										
									}
									else
									{
										// Toggle off ...
									
										//console.log( '// Toggle off ', wids );
										
										if( this.getAttribute( 'wid' ) )
										{
											let nwid = [];
											
											if( wids )
											{
												for( var a in wids )
												{
													if( wids[a] )
													{
														if( wids[a] != this.getAttribute( 'wid' ) )
														{
															nwid.push( wids[a] );
														}
													}
												}
												
												wids = nwid;
											}
											
											if( wids )
											{
												ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
											}
											else
											{
												ge( 'usWorkgroups' ).removeAttribute( 'value' );	
											}
											
											this.classList.remove( 'fa-toggle-on' );
											this.classList.add( 'fa-toggle-off' );
											
										}
																					
									}
								}
								
							}
						} )( workBtns[ a ] );
					}
				}
				
				let workInps = ge( 'WorkgroupInner' ).getElementsByTagName( 'input' );
				
				if( workInps )
				{
					for( var a = 0; a < workInps.length; a++ )
					{
						// Toggle user relation to workgroup
						( function( b ) {
							b.onclick = function( e )
							{
								
								if( ge( 'usWorkgroups' ) )
								{
								
									var wids = [];
									
									if( ge( 'usWorkgroups' ).value )
									{
										wids = ge( 'usWorkgroups' ).value.split( ',' );
									}
								
									if( this.checked )
									{
										// Toggle on ...
									
										//console.log( '// Toggle on ', wids );
									
										if( this.id && this.id.split( 'wid_' )[1] )
										{
										
											wids.push( this.id.split( 'wid_' )[1] );
										
											if( wids )
											{
												ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
											}
											else
											{
												ge( 'usWorkgroups' ).removeAttribute( 'value' );	
											}
										
										}
									
									}
									else
									{
										// Toggle off ...
								
										//console.log( '// Toggle off ', wids );
									
										if( this.id && this.id.split( 'wid_' )[1] )
										{
											var nwid = [];
										
											if( wids )
											{
												for( var a in wids )
												{
													if( wids[a] )
													{
														if( wids[a] != this.id.split( 'wid_' )[1] )
														{
															nwid.push( wids[a] );
														}
													}
												}
											
												wids = nwid;
											}
										
											if( wids )
											{
												ge( 'usWorkgroups' ).setAttribute( 'value', wids.join( ',' ) );
											}
											else
											{
												ge( 'usWorkgroups' ).removeAttribute( 'value' );	
											}
										
										}
																				
									}
								}
								
							}
						} )( workInps[ a ] );
					}
				}
				
				// Search ...............
				
				let searchgroups = function ( filter, server )
				{
					
					if( ge( 'WorkgroupInner' ) )
					{
						var list = ge( 'WorkgroupInner' ).getElementsByTagName( 'div' );
						
						ge( 'WorkgroupInner' ).className = ge( 'WorkgroupInner' ).className.split( ' Visible' ).join( '' ) + ( filter ? ' Visible' : '' );
						
						if( list.length > 0 )
						{
							for( var a = 0; a < list.length; a++ )
							{
								if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
								
								var strong = list[a].getElementsByTagName( 'strong' )[0];
								var span = list[a].getElementsByTagName( 'span' )[0];
								
								if( strong || span )
								{
									
									if( !filter || filter == '' 
									|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									)
									{
										list[a].style.display = '';
										
										if( list[a].parentNode.parentNode && list[a].parentNode.parentNode.parentNode && list[a].parentNode.parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
										{
											//if( list[a].parentNode.classList.contains( 'Closed' ) )
											//{
											//	list[a].parentNode.classList.remove( 'Closed' );
											//	list[a].parentNode.classList.add( 'Open' );
											//}
											
											list[a].parentNode.style.display = '';
											list[a].parentNode.parentNode.style.display = '';
										}
									}
									else if( list[a].parentNode && list[a].parentNode.className )
									{
										list[a].style.display = 'none';
									}
								}
							}

						}
						
						if( ge( 'WorkgroupSearchCancelBtn' ) )
						{
							if( !filter && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Closed' );
								
								if( list.length > 0 )
								{
									for( var a = 0; a < list.length; a++ )
									{
										if( list[a].classList.contains( 'Open' ) )
										{
											list[a].classList.remove( 'Open' );
											list[a].classList.add( 'Closed' );
										}
									}
								}
							}
							
							else if( filter != '' && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Closed' );
								ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Open' );
							}
						}
					}
					
				};
				

				
				// Sort .............
				
				let sortgroups = function ( sortby, orderby )
				{
					
					//
					
					let _this = ge( 'WorkgroupInner' );
					
					if( _this )
					{
						orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
						
						let list = _this.getElementsByTagName( 'div' );
						
						if( list.length > 0 )
						{
							let output = [];
							
							let callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
							
							for( var a = 0; a < list.length; a++ )
							{
								if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
								
								let span = list[a].getElementsByTagName( 'span' )[0];
								
								if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' && span.getAttribute( sortby.toLowerCase() ) )
								{
									if( !list[a].parentNode.className )
									{
										let obj = { 
											sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
											content : list[a].parentNode
										};
									
										output.push( obj );
									}
								}
							}
							
							if( output.length > 0 )
							{
								// Sort ASC default
								
								output.sort( callback );
								
								// Sort DESC
								
								if( orderby == 'DESC' ) 
								{ 
									output.reverse();  
								}
								
								_this.innerHTML = '';
								
								_this.setAttribute( 'orderby', orderby );
								
								for( var key in output )
								{
									if( output[key] && output[key].content )
									{
										// Add row
										_this.appendChild( output[key].content );
									}
								}
							}
						}
					}
					
				};
				
				sortgroups( 'Name', 'ASC' );
				
				// .................
				
				if( ge( 'AdminWorkgroupContainer' ) )
				{
					let inpu = ge( 'AdminWorkgroupContainer' ).getElementsByTagName( 'input' )[0];
					inpu.onkeyup = function( e )
					{
						searchgroups( this.value );
					}
					ge( 'WorkgroupSearchCancelBtn' ).onclick = function( e )
					{
						searchgroups( false );
						inpu.value = '';
					}
				}		
				
			} );
			
			
			
			
			// Responsive framework
			Friend.responsive.pageActive = ge( 'UserDetails' );
			Friend.responsive.reinit();
		}
		d.load();
		
	} );
	
	SubMenu( _this.parentNode.parentNode );
	
	scrollengine.unselectLine();
}

// Temp function until it's merged into one main function for users list ...

function refreshUserList( userInfo )
{
	
	
	if( !ge( 'UserListID_'+userInfo.ID ) && ge( 'ListUsersInner' ) && !UsersSettings( 'experiment' ) )
	{
		let str = '';
		
		str += '<div class="TextCenter HContent10 FloatLeft PaddingSmall Ellipsis edit"></div>';
		str += '<div class=" HContent30 FloatLeft PaddingSmall Ellipsis fullname"></div>';
		str += '<div class=" HContent25 FloatLeft PaddingSmall Ellipsis name"></div>';
		str += '<div class=" HContent15 FloatLeft PaddingSmall Ellipsis status"></div>';
		str += '<div class=" HContent20 FloatLeft PaddingSmall Ellipsis logintime"></div>';
		
		let div = document.createElement( 'div' );
		div.id = 'UserListID_' + userInfo.ID;
		div.className = 'HRow Active';
		div.innerHTML = str;
		div.onclick = function()
		{
			if( !UsersSettings( 'experiment' ) )
			{
				if( ge( 'ListUsersInner' ) )
				{
					let list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
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
			}
			
			Sections.accounts_users( 'edit', userInfo.ID );
		}
		
		ge( 'ListUsersInner' ).appendChild( div );
	}
	
	//console.log( 'refreshUserList( userInfo )', ge( 'UserListID_'+userInfo.ID ) );
	
	if( ge( 'UserListID_'+userInfo.ID ) )
	{
		
		let r = ge( 'UserListID_'+userInfo.ID );
		
		let div = r.getElementsByTagName( 'div' );
		
		if( div.length > 0 )
		{
			let status = [ 'Active', 'Disabled', 'Locked' ];
			
			let login = [ 'Never' ];
			
			let timestamp = ( userInfo[ 'LoginTime' ] ? userInfo[ 'LoginTime' ] : 0 );
			let logintime = ( userInfo[ 'LoginTime' ] != 0 && userInfo[ 'LoginTime' ] != null ? CustomDateTime( userInfo[ 'LoginTime' ] ) : login[ 0 ] );
			status        = status[ ( userInfo[ 'Status' ] ? userInfo[ 'Status' ] : 0 ) ];
			
			userInfo[ 'Name' ]     = ( userInfo[ 'Name' ]     ? userInfo[ 'Name' ]     : 'n/a' );
			userInfo[ 'FullName' ] = ( userInfo[ 'FullName' ] ? userInfo[ 'FullName' ] : 'n/a' );
			userInfo[ 'Level' ]    = ( userInfo[ 'Level' ]    ? userInfo[ 'Level' ]    : 'n/a' );
			
			r.className = r.className.split( 'Active' ).join( status ).split( 'Disabled' ).join( status ).split( 'Locked' ).join( status );
			
			if( !UsersSettings( 'experiment' ) )
			{
				if( ge( 'ListUsersInner' ) )
				{
					let list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
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
			
				r.className = ( r.className.split( ' Selected' ).join( '' ) + ' Selected' );
			}
			
			for ( var i in div )
			{
				if( div[i].className )
				{
					
					if( div[i].className.indexOf( ' edit' ) >= 0 )
					{
						src = '/system.library/module/?module=system&command=getavatar&userid=' + userInfo.ID + ( userInfo.Image ? '&image=' + userInfo.Image : '' ) + '&width=16&height=16&authid=' + Application.authId;
						
						if( div[i].getElementsByTagName( 'span' )[0] )
						{
							//let spa = div[i].getElementsByTagName( 'span' )[0].getElementsByTagName( 'div' )[0];
        					//spa.style.backgroundImage = 'url(' + src + ')';
						}
						
						//var bg = 'background-position: center center;background-size: contain;background-repeat: no-repeat;position: absolute;top: 0;left: 0;width: 100%;height: 100%;background-image: url(\'' + src + '\')';
									
						//str += '	<span id="UserAvatar_'+obj.ID+'" fullname="'+obj.FullName+'" status="'+obj.Status+'" logintime="'+obj.Logintime+'" timestamp="'+obj.Timestamp+'" class="IconSmall fa-user-circle-o avatar" style="position: relative;">';
						//str += '		<div style="' + bg + '"></div>';
						//str += '	</span>';

						//let spa = allNodes[a].getElementsByTagName( 'span' )[0].getElementsByTagName( 'div' )[0];
						
						// TODO: maybe remove this from memory?
						/*let iii = new Image();
			    		iii.src = src;
			    		iii.div = div[i];
						iii.onload = function()
		        		{
		        			// Temp fix, just comment out ....
		        			
							let spa = this.div.getElementsByTagName( 'span' )[0].getElementsByTagName( 'div' )[0];
            				//spa.style.backgroundImage = 'url(' + this.src + ')';
            				//console.log( 'image loaded ' + src );
            			}*/
						
					}
					
					if( div[i].className.indexOf( ' fullname' ) >= 0 )
					{
						div[i].innerHTML = userInfo[ 'FullName' ];
					}
					
					if( div[i].className.indexOf( ' name' ) >= 0 )
					{
						div[i].innerHTML = userInfo[ 'Name' ];
					}
					
					if( div[i].className.indexOf( ' status' ) >= 0 )
					{
						div[i].innerHTML = status;
					}
					
					if( div[i].className.indexOf( ' logintime' ) >= 0 )
					{
						//div[i].innerHTML = logintime;
					}
					
				}
			}
			
			if( !UsersSettings( 'experiment' ) )
			{
				
				// Temporary get lastlogin time separate to speed up the sql query ...
			
				getLastLoginlist( function ( res, dat )
				{
					if( res == 'ok' && dat )
					{
						for ( var i in dat )
						{
							if( dat[i] && dat[i]['UserID'] )
							{
								if( ge( 'UserListID_' + dat[i]['UserID'] ) )
								{
									let elems = ge( 'UserListID_' + dat[i]['UserID'] ).getElementsByTagName( '*' );
			
									if( elems.length > 0 )
									{
										for ( var div in elems )
										{
											if( elems[div] && elems[div].className )
											{
												let timestamp = ( dat[i]['LoginTime'] );
												let logintime = ( dat[i]['LoginTime'] != 0 && dat[i]['LoginTime'] != null ? CustomDateTime( dat[i]['LoginTime'] ) : login[ 0 ] );
						
												if( elems[div].className.indexOf( 'avatar' ) >= 0 )
												{
													elems[div].setAttribute( 'timestamp', timestamp );
													elems[div].setAttribute( 'logintime', logintime );
												}
												if( elems[div].className.indexOf( 'logintime' ) >= 0 )
												{
													elems[div].innerHTML = logintime;
												}
											}
										}
									}
			
			
								}
							}
						}
					}

				}, userInfo.ID );
			
			}
		}
		
		UsersSettings( 'uids', userInfo.ID );
		
	}
}

function getUserlist( callback, obj, limit )
{
	// TODO: Check why notids is buggy ... 	
	
	let args = { 
		query      : UsersSettings( 'searchquery'           ), 
		sortby     : UsersSettings( 'sortby'                ), 
		orderby    : UsersSettings( 'orderby'               ), 
		customsort : UsersSettings( 'customsort'            ), 
		sortstatus : UsersSettings( 'sortstatus'            ), 
		logintime  : UsersSettings( 'logintime'             ),
		limit      : limit ? limit : UsersSettings( 'limit' ),
		/*notids   : UsersSettings( 'uids'        ).join( ',' ),*/
		count      : true, 
		authid     : Application.authId 
	};
	
	if( UsersSettings( 'total' ) > 0 && UsersSettings( 'startlimit' ) > UsersSettings( 'total' ) )
	{
		console.log( 'getUserlist( callback, obj ): ', { args: args, usersettings: UsersSettings() } );
		return;
	}
	
	// Get the user list
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		
		let userList = null;
		
		try
		{
			userList = JSON.parse( d );
			//console.log( { e:e, d:(userList?userList:d), args:args } );
		}
		catch( e )
		{
			console.log( { e:e, d:d, args:args } );
		}
		
		console.log( 'getUserlist( callback, obj ): ', { e:e, d:(userList?userList:d), args: args, usersettings: UsersSettings() } );
		
		if( callback )
		{
			return callback( e, userList, obj );
		}
		
		return userList;
	}
	m.execute( 'listusers', args );
}

function getLastLoginlist( callback, users )
{
	
	if( users && UsersSettings( 'logintime' ) )
	{
		let args = { 
			mode    : 'logintime',
			userid  : users,
			authid  : Application.authId 
		};
	
		// Get the user list
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		
			let loginTime = null;
			
			try
			{
				loginTime = JSON.parse( d );
				//console.log( 'getLastLoginlist( callback, users )', { e:e, d:(loginTime?loginTime:d), args:args } );
			}
			catch( e )
			{
				console.log( { e:e, d:d, args:args } );
			}
		
			if( callback )
			{
				return callback( e, loginTime );
			}
		
			return loginTime;
		}
		m.execute( 'listusers', args );
	}
}

function searchServer( filter, force, search_server_callback )
{
	
	//if( !force )
	//{
	//	if( filter.length < UsersSettings( 'minlength' ).length || filter.length < UsersSettings( 'searchquery' ).length || filter == UsersSettings( 'searchquery' ) ) return;
	//}
	
	console.log( 'searchServer( '+filter+', '+force+' )' );
	
	if( filter != null )
	{
		UsersSettings( 'reset', true );
		
		UsersSettings( 'searchquery', filter );
	}
	
	RequestQueue.Set( function( callback, key )
	{
		console.log( filter + ' < ' + UsersSettings( 'searchquery' ) );
		
		if( filter && filter.length < UsersSettings( 'searchquery' ).length )
		{
			if( callback ) callback( key );
			
			return;
		}
		
		getUserlist( function( res, userList, key )
		{
			
			if( callback ) callback( key );
			
			//console.log( '[1] searchServer ', userList );
			
			if( userList )
			{
				
				if( ge( 'AdminUsersCount' ) )
				{
					ge( 'AdminUsersCount' ).innerHTML = ( userList['Count'] ? '(' + userList['Count'] + ')' : '(0)' );
				}
				
				//console.log( 'scrollengine.distribute', ( userList && !userList.response ? userList : [] ), 0, ( userList['Count'] ? userList['Count'] : 0 ), true );
				
				scrollengine.distribute( ( userList && !userList.response ? userList : [] ), 0, ( userList['Count'] ? userList['Count'] : 0 ), true );
				
				//scrollengine.refresh( true );
				
				if( search_server_callback )
				{
					search_server_callback( true );
				}
				
			}
			
		}, key );
		
	} );
	
}

function sortUsers( sortby, orderby, callback )
{
	let experiment = UsersSettings( 'experiment' );
	
	if( sortby && ge( 'ListUsersInner' ) )
	{
		let output = [];
		
		// ASC
		
		// 0 => 'locked'   (2)
		// 1 => 'active'   (0)
		// 2 => 'disabled' (1)
		
		// DESC
		
		// 0 => 'locked'   (2)
		// 1 => 'disabled' (1)
		// 2 => 'active'   (0)
		
		let custom = { 
			'Status' : { 
				'ASC'  : { 'locked' : 0, 'active' : 1, 'disabled' : 2 }, 
				'DESC' : { 'locked' : 0, 'disabled' : 1, 'active' : 2 } 
			},
			'LoginTime' : 'timestamp' 
		};
		
		if( !orderby )
		{
			if( ge( 'ListUsersInner' ).className.indexOf( ' ' + sortby + ' ASC' ) >= 0 )
			{
				orderby = 'DESC';
			
				ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby ) + ( experiment ? ' experiment' : '' );
				ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
				ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
			}
			else
			{
				orderby = 'ASC';
			
				ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby ) + ( experiment ? ' experiment' : '' );
				ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
				ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
			}
		}
		
		// TODO: Make support for sortby Status and Timestamp on the server levels aswell ...
				
		if( sortby == 'Status' )
		{
			UsersSettings( 'customsort', orderby == 'DESC' ? '2,1,0' : '2,0,1' );
		}
		else
		{
			UsersSettings( 'customsort', false );
		}
		
		if( UsersSettings( 'sortby') != sortby || UsersSettings( 'orderby' ) != orderby )
		{
			if( [ 'FullName', 'Name', 'Status', 'LoginTime' ].indexOf( sortby ) >= 0 )
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
		
		if( experiment )
		{
			searchServer( null, true );
		}
		
		return;
		
		let cb = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
		
		let override = false;
		
		if( !experiment )
		{
			if( custom[ sortby ] && sortby == 'LoginTime' )
			{
				sortby = custom[ sortby ];
				orderby = ( orderby == 'ASC' ? 'DESC' : 'ASC' ); 
			
				// TODO: Find out how to specifically sort by the custom sortorder of Status ...
			}
			else if( custom[ sortby ] && custom[ sortby ][ orderby ] && sortby == 'Status' )
			{
				cb = ( function ( a, b ) { return ( custom[ sortby ][ orderby ][ a.sortby ] - custom[ sortby ][ orderby ][ b.sortby ] ); } );
			
				//console.log( custom[ sortby ][ orderby ] );
			
				override = true;
			}
		}
		
		let list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
		if( experiment || list.length > 0 )
		{
			if( !experiment )
			{
				for( var a = 0; a < list.length; a++ )
				{
					if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
					let span = list[a].getElementsByTagName( 'span' )[0];
				
					if( span && span.getAttribute( sortby.toLowerCase() ) )
					{
						let obj = { 
							sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
							content : list[a]
						};
					
						output.push( obj );
					}
				}
			}
			
			if( experiment || output.length > 0 )
			{
				if( !experiment )
				{
					// Sort ASC default
				
					output.sort( cb );
				
					// Sort DESC
		
					if( !override && orderby == 'DESC' ) 
					{ 
						output.reverse();  
					} 
				
					//console.log( 'sortUsers('+sortby+'): ', { output: output, sortby: sortby, orderby: orderby } );
				}
				
				
				
				if( !experiment )
				{
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
}

Sections.user_disk_cancel = function( userid )
{
	//console.log( 'Sections.user_disk_cancel ' + userid );
	
	let u = new Module( 'system' );
	u.onExecuted = function( e, d )
	{
		let ul = null;
		try
		{
			ul = JSON.parse( d );
		}
		catch( e ) {  }
		
		//console.log( '[3] mountlist ', { e:e, d:(ul?ul:d), args: { userid: userid+"", authid: Application.authId } } );
		
		ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid, Sections.user_volumeinfo_refresh( ul, userid ) );
		
		//console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
		
		Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
	}
	u.execute( 'mountlist', { userid: userid+"", authid: Application.authId } );
	
};

// TODO: Evaluate Disk Editing Design and check what features are missing / removed based on the old app "DiskCatalog" EncryptionKey, Network Visibility, Show on Desktop, JSX Executable, Disk Cover is not included in the new design ...

Sections.user_disk_update = function( user, did = 0, name = '', userid )
{
	//console.log( { name: name, did: did } );
	
	userid = ( userid ? userid : ( user ? user : false ) );
	
	if( user && userid )
	{
		let n = new Module( 'system' );
		n.onExecuted = function( ee, dat )
		{
			//console.log( { e:ee, d:dat } );
			
			let da = {};
			
			try
			{
				da = JSON.parse( dat );
			}
			catch( e ) {  }
			
			if( !da.length ) return;
			
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				//console.log( 'user_disk_update ', { e:e, d:d } );
				
				let storage = { id : '', name : '', type : '', csize : 500, cunit : 'MB', user : user };
				
				let units = [ 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
		
				if( e == 'ok' )
				{
					let js = {};
					
					try
					{
						js = JSON.parse( d );
					}
					catch( e ) {  }
					
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
						let size = ( js.Config.DiskSize ? js.Config.DiskSize : 0 );
						let mode = ( size && size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ] );
						size = parseInt( size );
						
						let csize = size;
						let cunit = ( mode[0] ? mode[0] : 'MB' );
						
						let type = mode[0].toLowerCase();
						if( type == 'kb' )
						{
							size = size * 1000;
						}
						else if( type == 'mb' )
						{
							size = size * 1000 * 1000;
						}
						else if( type == 'gb' )
						{
							size = size * 1000 * 1000 * 1000;
						}
						else if( type == 'tb' )
						{
							size = size * 1000 * 1000 * 1000 * 1000;
						}
						let used = parseInt( js.StoredBytes );
						if( isNaN( size ) ) size = 500 * 1000; // < Normally the default size
						if( !used && !size ) used = 0, size = 0;
						if( !size ) size = 500000000;
						if( !used ) used = 0;
						if( used > size || ( used && !size ) ) size = used;
						
						csize = ( !csize ? 500 : csize );
						
						storage = {
							id    : js.ID,
							user  : js.UserID,
							name  : js.Name,
							type  : js.Type,
							csize : csize,
							cunit : cunit,
							size  : size, 
							used  : used, 
							free  : ( size - used ), 
							prog  : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
							icon  : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
							mont  : js.Mounted,
							data  : js
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
				
					let str = '';
				
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
					
					//console.log( 'StorageForm ', storage );
					
					if( da )
					{
						let found = false;
						
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
					str += '<input type="text" class="FullWidth" id="DiskSizeA" value="' + storage.csize + '" placeholder="512"/>';
					str += '</div>';
					str += '<div class="HContent35 FloatLeft Ellipsis PaddingLeft">';
					str += '<select class="FullWidth" id="DiskSizeB">';
				
					if( units )
					{
						for( var a in units )
						{
							str += '<option' + ( storage.csize && storage.cunit == units[a] ? ' selected="selected"' : '' ) + '>' + units[a] + '</option>';
						}
					}
			
					str += '</select>';
					str += '</div>';
					str += '</div>';
			
					// Insert Gui based on DosDriver
				
					str += '<div id="DosDriverGui"></div>';
				
					str += '</div>';
					
					str += '<div class="HRow PaddingTop">';
					
					if( Application.checkAppPermission( [ 
						'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
						'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
						'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
					] ) )
					{
						str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.user_disk_save(' + userid + ',\'' + storage.id + '\')">Save</button>';
					}
					
					str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.user_disk_cancel(' + userid + ')">Cancel</button>';
					
					if( storage.id )
					{
						if( Application.checkAppPermission( [ 
							'PERM_STORAGE_DELETE_GLOBAL', 'PERM_STORAGE_DELETE_IN_WORKGROUP', 
							'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
						] ) )
						{
							str += '<button class="IconSmall Danger FloatRight MarginLeft" onclick="Sections.user_disk_remove(\'' + storage.name + '\',' + storage.id + ',' + userid + ')">Remove disk</button>';
						}
						
						if( Application.checkAppPermission( [ 
							'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
							'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
							'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
						] ) )
						{
							str += '<button class="IconSmall FloatLeft MarginRight" onclick="Sections.user_disk_mount(\'' + storage.name + '\',' + userid + ',this)">' + ( storage.mont > 0 ? 'Unmount disk' : 'Mount disk' ) + '</button>';
						}
					}
					
					str += '</div>';
				
					str += '</div>';

					ge( 'StorageGui' ).innerHTML = str;
				
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

Sections.user_disk_refresh = function( mountlist, userid, func )
{
	// Mountlist
	let mlst = '';
	if( mountlist && mountlist.length )
	{
		let sorted = { 
			'personal_drives' : 
			{ 
				'heading' : 'personal_drives', 
				'rows'    : null 
			}, 
			'workgroup_drives' : 
			{
				'heading' : 'workgroup_drives', 
				'rows'    : null 
			}
		};
		
		for( var a = 0; a < mountlist.length; a++ )
		{
			if( mountlist[a] && !mountlist[a].ID ) continue;
			
			if( !sorted[(mountlist[a].Type=='SQLWorkgroupDrive'?'workgroup_drives':'personal_drives')]['rows'] )
			{
				sorted[(mountlist[a].Type=='SQLWorkgroupDrive'?'workgroup_drives':'personal_drives')]['rows'] = {};
			}
			
			if( mountlist[a].Mounted <= 0 )
			{
				sorted[(mountlist[a].Type=='SQLWorkgroupDrive'?'workgroup_drives':'personal_drives')]['rows']['1000'+mountlist[a].ID] = mountlist[a];
			}
			else
			{
				sorted[(mountlist[a].Type=='SQLWorkgroupDrive'?'workgroup_drives':'personal_drives')]['rows'][mountlist[a].ID] = mountlist[a];
			}
		}
		
		if( sorted )
		{
			mountlist = sorted;
		}
		
		//console.log( 'mountlist ', { mountlist: mountlist, userid: userid } );
		
		mlst += '<div class="HRow">';
		for( var a in mountlist )
		{
			let heading = mountlist[a]['heading'];
			let rows    = mountlist[a]['rows'];
			
			if( rows )
			{
				// TODO: Add Alt (alternative css class) for blue color in design ...
				
				mlst += '<div class="HContent100 FloatLeft PaddingSmall BorderBottom"><strong>' + i18n( 'i18n_' + heading ) + ':</strong></div>';
				
				for( var b in rows )
				{
					if( rows[b].Type == 'SharedDrive' ) continue;
					
					try
					{
						if( typeof rows[b].Config != "object" )
						{
							let conf = JSON.parse( rows[b].Config );
						
							if( conf )
							{
								rows[b].Config = conf;
							}
						}
					}
					catch( e )
					{
						rows[b].Config = {};
					}
					
					// Return access denied if the list is only the logged in Users disks
					if( userid && userid != rows[b].UserID )
					{
						// Skip if user doesn't have access to this disk ...
						//continue;
						//console.log( '['+rows[b].ID+']['+rows[b].Type+'] '+rows[b].Name+' has another owner id:'+rows[b].UserID );
						//return '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_disks_access_denied' ) + '</div></div>';
					}
			
					// Skip the IsDeleted disks for now ...
					//if( rows[b] && rows[b].Mounted < 0 ) continue;
			
					//console.log( rows[b] );
					
					// TODO: Add support decimals ...
					
					// Calculate disk usage
					let size = ( rows[b].Config.DiskSize ? rows[b].Config.DiskSize : 0 );
					let mode = ( size && size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ] );
					size = parseInt( size );
					
					let csize = size;
					let cunit = ( mode[0] ? mode[0] : 'MB' );
					
					let type = mode[0].toLowerCase();
					if( type == 'kb' )
					{
						size = size * 1000;
					}
					else if( type == 'mb' )
					{
						size = size * 1000 * 1000;
					}
					else if( type == 'gb' )
					{
						size = size * 1000 * 1000 * 1000;
					}
					else if( type == 'tb' )
					{
						size = size * 1000 * 1000 * 1000 * 1000;
					}
					let used = parseInt( rows[b].StoredBytes );
					if( isNaN( size ) ) size = 500 * 1000; // < Normally the default size
					if( !used && !size ) used = 0, size = 0;
					if( !size ) size = 500000000;
					if( !used ) used = 0;
					if( used > size || ( used && !size ) ) size = used;
					
					csize = ( !csize ? 500 : csize );
					
					let storage = {
						id    : rows[b].ID,
						user  : rows[b].UserID,
						name  : rows[b].Name,
						type  : rows[b].Type,
						group : rows[b].GroupID,
						csize : csize,
						cunit : cunit,
						size  : size, 
						used  : used, 
						free  : ( size - used ), 
						prog  : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
						icon  : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
						mont  : rows[b].Mounted
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
					
					mlst += '<div id="StorageWrapper_' + storage.id + '" class="HContent33 FloatLeft DiskContainer"' + ( storage.mont <= 0 ? ' style="opacity:0.6"' : '' ) + '>';
					
					// If "SQLWorkgroupDrive" handle the edit in Workgroups ...
					
					if( !Application.checkAppPermission( [ 
						'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
						'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
						'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
					] ) )
					{
						mlst += '<div class="PaddingSmall Ellipsis">';
					}
					else if( storage.type == 'SQLWorkgroupDrive' )
					{
						mlst += '<div class="PaddingSmall Ellipsis" onclick="Notify( { title: i18n( \'i18n_cannot_edit_workgroup_drive\' ), text: i18n( \'i18n_workgroup_drive_edit_in\' ) } )">';
					}
					else
					{
						mlst += '<div class="PaddingSmall Ellipsis" onclick="Sections.user_disk_update(' + storage.user + ',' + storage.id + ',\'' + storage.name + '\',' + userid + ',' + storage.group + ')">';
					}
					
					mlst += '<div class="Col1 FloatLeft" id="Storage_' + storage.id + '">';
					mlst += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
					mlst += '</div>';
					mlst += '<div class="Col2 FloatLeft HContent100 Name Ellipsis" id="StorageInfo_' + storage.id + '">';
					mlst += '<div class="name Ellipsis" title="' + storage.name + '">' + storage.name + ':</div>';
					mlst += '<div class="type Ellipsis" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>';
					mlst += '<div class="rectangle" title="' + FormatBytes( storage.used, 0 ) + ' used"><div style="width:' + storage.prog + '%"></div></div>';
					mlst += '<div class="bytes Ellipsis" title="'+ FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '">' + FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '</div>';
					mlst += '</div>';
					mlst += '</div>';
					mlst += '</div>';
				}
			}
		}
		mlst += '</div>';
		
		// Run delayed function if defined ...
		
		if( func )
		{
			func();
		}
		
	}
	else
	{
		mlst += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_mountlist_empty' ) + '</div></div>';
	}
	
	return mlst;
};

Sections.user_volumeinfo_refresh = function( mountlist, userid )
{
	// Temporary complicated function until list of volumeinfo per user per disks can be combined without sessionid dependency, or mountlist can be used with out wrong StoredBytes data from db ...
	
	if( mountlist && userid )
	{
		for( var i in mountlist )
		{
			if( mountlist[i].ID && mountlist[i].Name && mountlist[i].UserID )
			{
				getStorageInfo( mountlist[i].Name + ':', mountlist[i].UserID, mountlist[i], function( res, dat, args )
				{
					
					//
					
					// Update even if there is an error so we can see what is missing ServerToken etc other stuff in console ...
					
					if( ge( 'StorageInfo_' + args.ID ) && ge( 'StorageInfo_' + args.ID ).className.indexOf( 'Updated' ) < 0 )
					{
						
						let size = 0;
						let used = 0;
						
						try
						{
							if( dat )
							{
								size = ( dat.Filesize ? dat.Filesize : 0 );
								used = ( dat.Used ? dat.Used : 0 );
							}
						}
						catch( e ){  }
						
						
						
						let storage = {
							id    : args.ID,
							user  : args.UserID,
							name  : args.Name,
							type  : args.Type,
							size  : size, 
							used  : used, 
							free  : ( size - used ), 
							prog  : ( ( used / size * 100 ) > 100 ? 100 : ( !used && !size ? 0 : ( used / size * 100 ) ) )
						};
						
						if( ShowLog ) console.log( storage );
						
						let mlst = '';
						
						mlst += '<div class="name Ellipsis" title="' + storage.name + '">' + storage.name + ':</div>';
						mlst += '<div class="type Ellipsis" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>';
						mlst += '<div class="rectangle" title="' + FormatBytes( storage.used, 0 ) + ' used"><div style="width:' + storage.prog + '%"></div></div>';
						mlst += '<div class="bytes Ellipsis" title="'+ FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '">' + FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '</div>';
						
						//console.log( mlst );
						
						ge( 'StorageInfo_' + args.ID ).classList.add( 'Updated' );
						
						ge( 'StorageInfo_' + args.ID ).innerHTML = mlst;
						
						// Show errors if there is any ...
						
						if( ShowLog && args.Errors ) console.log( args.Errors.text, args.Errors.content );
						
					}
					
				} );
			}
		}	
	}
	
}

function StorageForm( storage, callback )
{
	
	let ft = new Module( 'system' );
	ft.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			i18nAddTranslations( d )
		}
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			// return info that this is loaded.
			if( callback ) callback( storage );
			
			let scripts = [];
			
			if( e == 'ok' )
			{
				// collect scripts
				
				let scr;
				while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
				{
					d = d.split( scr[0] ).join( '' );
					scripts.push( scr[1] );
				}
				
				let mch;
				let i = 0;
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
			
			if( d != '' ) d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
			
			if( ge( 'DosDriverGui' ) )
			{
				ge( 'DosDriverGui' ).innerHTML = d;
				
				if( ge( 'StorageGui' ) )
				{
					let data = ( storage.data ? storage.data : false );
					
					// We are in edit mode..
					if( data )
					{
						let elems = {};
						
						let inputs = ge( 'StorageGui' ).getElementsByTagName( 'input' );
					
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
						
						let selects = ge( 'StorageGui' ).getElementsByTagName( 'select' );
						
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
						
						let fields = [
							'Name', 'Server', 'ShortDescription', 'Port', 'Username', 
							'Password', 'Path', 'Type', 'Workgroup', 'PrivateKey'
						];
						if( elems )
						{
							for( var a = 0; a < fields.length; a++ )
							{
								if( elems[ fields[ a ] ] && typeof( data[ fields[ a ] ] ) != 'undefined' )
								{
									elems[ fields[ a ] ].value   = data[ fields[ a ] ];
									elems[ fields[ a ] ].current = data[ fields[ a ] ];
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
	let type = ( _this ? _this.value : false );
	
	if( type )
	{
		let ft = new Module( 'system' );
		ft.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				i18nAddTranslations( d )
			}
			
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				let scripts = [];
			
				if( e == 'ok' )
				{
					// collect scripts
				
					let scr;
					while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
					{
						d = d.split( scr[0] ).join( '' );
						scripts.push( scr[1] );
					}
				
					let mch;
					let i = 0;
					while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
					{
						d = d.split( mch[0] ).join( i18n( mch[1] ) );
					}
				
					// Fix to add more space
					d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
				
					d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
					
					
					
					i18nAddTranslations( d );
					let f = new File();
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



// write ------------------------------------------------------------------------------------------------------------ //



function addApplication( appName, userId, callback, vars )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( ShowLog ) console.log( 'adduserapplication ', { e:e, d:d } );
		
		if( e == 'ok' )
		{
			if( callback ) callback( true, d, vars );
		}
		else
		{
			if( callback ) callback( false, d, vars );
		}
	}
	m.execute( 'adduserapplication', { application: appName, userid: userId, authid: Application.authId } );
}

function updateUserStatus( userid, status )
{
	
	if( userid )
	{
		
		Sections.user_status_update( userid, status, function()
		{
			
			searchServer( null, true, function(  )
			{
				
				// Refresh whole users list ...
				
				//Sections.accounts_users(  );
				
				// Go to edit mode for the new user ...
				
				//Sections.accounts_users( 'edit', userid );
			
			} );
			
		} );
		
	}
	
}

function addDockItem( appName, userId, callback, vars )
{
	//console.log( 'addDockItem( appName, userId, callback ) ', { appName:appName, userId:userId, callback:callback } );
	
	let m = new Module( 'dock' );
	m.onExecuted = function( e, d )
	{
		//console.log( { e:e, d:d } );
		
		if( e == 'ok' )
		{
			if( callback ) callback( true, d, vars );
		}
		else
		{
			if( callback ) callback( false, d, vars );
		}
	}
	m.execute( 'additem', { 
		userID: userId, 
		application: appName, 
		type: '', 
		displayname: '', 
		shortdescription: '' 
	} );
}

function sortDockItem( direction, itemId, userId, callback )
{
	//console.log( 'sortDockItem( direction, itemId, userId, callback ) ', { direction:direction, itemId:itemId, userId:userId, callback:callback } );
	
	// TODO: Update the current sorting to support sortinging another users dock ...
	
	let m = new Module( 'dock' );
	m.onExecuted = function( e, d )
	{
		//console.log( { e:e, d:d } );
		
		if( e == 'ok' )
		{
			if( callback ) callback( true, vars );
		}
		else
		{
			if( callback ) callback( false, vars );
		}
	}
	m.execute( 'sortorder', { userID: userId, itemId: itemId, direction: direction } );
}

function changeAvatar()
{
	let self = this;
	let description =
	{
		triggerFunction: function( item )
		{
			if ( item )
			{
				// Load the image
				let image = new Image();
				image.onload = function()
				{
					//console.log( 'loaded image ... ', item );
					// Resizes the image
					let canvas = ge( 'AdminAvatar' );
					let context = canvas.getContext( '2d' );
					context.drawImage( image, 0, 0, 256, 256 );
					
					ge( 'AdminAvatarArea' ).className = ge( 'AdminAvatarArea' ).className.split( ' fa-user-circle-o' ).join( '' );
					
					// Activate edit mode.
					editMode();
				}
				image.src = getImageUrl( item[ 0 ].Path );
			}
		},
		path: "Mountlist:",
		type: "load",
		title: i18n( 'i18n_fileselectoravatar' ),
		filename: ""
	}
	let d = new Filedialog( description );
}

function removeAvatar()
{
	randomAvatar( ge( 'usFullname' ).value, function( avatar ) 
	{
		let canvas = 0;
		
		try
		{
			canvas = ge( 'AdminAvatar' ).toDataURL();
		}
		catch( e ) {  }
		
		if( ge( 'AdminAvatar' ) && avatar )
		{
			// Only update the avatar if it exists..
			let avSrc = new Image();
			avSrc.src = avatar;
			avSrc.onload = function()
			{
				if( ge( 'AdminAvatar' ) )
				{
					let ctx = ge( 'AdminAvatar' ).getContext( '2d' );
					ctx.drawImage( avSrc, 0, 0, 256, 256 );
				}
			}
		}
	
	} );
}

Sections.user_status_update = function( userid, status, callback )
{
	
	if( userid && status )
	{
		// 0 = Active, 1 = Disabled, 2 = Locked
		
		let on = false;
		
		switch( status )
		{
			// false = Active, true = Disabled
			
			case 1:
			{
				//if( ge( 'usDisabled' ).className.indexOf( 'fa-toggle-off' ) >= 0 )
				if( ge( 'usDisabled' ).checked )
				{
					on = true;
				}
				
				let argsi = JSON.stringify( {
					'type'    : 'write', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_USER_UPDATE_GLOBAL', 
							'PERM_USER_UPDATE_IN_WORKGROUP', 
							'PERM_USER_GLOBAL', 
							'PERM_USER_WORKGROUP' 
						]
					}, 
					'object'   : 'user', 
					'objectid' : userid 
				} );
				
				let f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					//console.log( 'Sections.user_status_update( '+userid+', '+status+' ) ', { e:e, d:d, args: args } );
					
					if( e == 'ok' )
					{
						//Toggle( ge( 'usDisabled' ), false, ( on ? true : false ) );
						//Toggle( ge( 'usLocked'   ), false, false );
						
						ge( 'usDisabled' ).checked = ( on ? true : false );
						ge( 'usLocked'   ).checked = false;
					}
					
					if( callback ) return callback();
				}
				f.execute( 'user/updatestatus', { id: userid, status: ( on ? 1 : 0 ), authid: Application.authId, args: argsi } );	
			}
			break;
			
			// false = Active, true = Locked
			
			case 2:
			{	
				//if( ge( 'usLocked' ).className.indexOf( 'fa-toggle-off' ) >= 0 )
				if( ge( 'usLocked' ).checked )
				{
					on = true;
				}
				
				let argsi = JSON.stringify( {
					'type'    : 'write', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_USER_UPDATE_GLOBAL', 
							'PERM_USER_UPDATE_IN_WORKGROUP', 
							'PERM_USER_GLOBAL', 
							'PERM_USER_WORKGROUP' 
						]
					}, 
					'object'   : 'user', 
					'objectid' : userid 
				} );
				
				let f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					//console.log( 'Sections.user_status_update( '+userid+', '+status+' ) ', { e:e, d:d, args: args } );
					
					if( e == 'ok' )
					{
						//Toggle( ge( 'usLocked'   ), false, ( on ? true : false ) );
						//Toggle( ge( 'usDisabled' ), false, false );
						
						ge( 'usLocked'   ).checked = ( on ? true : false );
						ge( 'usDisabled' ).checked = false;
					}
					
					if( callback ) return callback();
				}
				f.execute( 'user/updatestatus', { id: userid, status: ( on ? 2 : 0 ), authid: Application.authId, args: argsi } );
				
			}
			break;
			
		}
	}
	
}

Sections.userrole_update = function( rid, userid, _this )
{
	let data = '';
	
	if( _this )
	{
		if( _this.checked )
		{
			data = 'Activated';
		}
		
		Toggle( _this, function( on )
		{
			data = ( on ? 'Activated' : '' );
		} );
		
	}
	
	if( rid && userid )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d, args: { id: rid, userid: userid, data: data, authid: Application.authId } } );
		}
		m.execute( 'userroleupdate', { id: rid, userid: userid, data: data, authid: Application.authId } );
	}
};

Sections.user_disk_save = function( userid, did )
{
	//console.log( 'Sections.user_disk_save ', { did : did, userid : userid } );
	
	let elems = {};
			
	let inputs = ge( 'StorageGui' ).getElementsByTagName( 'input' );
	
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
	
	let texts = ge( 'StorageGui' ).getElementsByTagName( 'textarea' );
	
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
	
	let selects = ge( 'StorageGui' ).getElementsByTagName( 'select' );
	
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
		
		let req = { 'Name' : i18n( 'i18n_disk_name_missing' ), 'Type' : i18n( 'i18n_disk_type_missing' ) };
		
		for( var r in req )
		{
			if( elems[r] && !elems[r].value )
			{
				elems[r].focus();
				
				Notify( { title: i18n( 'i18n_disk_error' ), text: req[r] } );
				
				return;
			}
		}
		
		
		
		let data = { Name: elems[ 'Name' ].value };
		
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
		
		// TODO: Make sure we save for the selected user and not the loggedin user ...
		
		if( Application.userId != userid )
		{
			data.userid = userid;
			data.authid = Application.authId;
		}
		
		//console.log( data );
		
		//return;
		
		let m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			//console.log( 'Sections.user_disk_save ', { e:e, d:dat, args:data } );
			
			if( e != 'ok' ) 
			{
				Notify( { title: i18n( 'i18n_disk_error' ), text: i18n( 'i18n_failed_to_edit' ) } );
				return;
			}
			else
			{
				Notify( { title: i18n( 'i18n_disk_success' ), text: i18n( 'i18n_disk_edited' ) } );
			}
			remountDrive( ( elems[ 'Name' ] && elems[ 'Name' ].current ? elems[ 'Name' ].current : data.Name ), data.Name, data.userid, 0, function()
			{
				
				let u = new Module( 'system' );
				u.onExecuted = function( ee, dd )
				{
					let ul = null;
					try
					{
						ul = JSON.parse( dd );
					}
					catch( ee ){  }
				
					ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid, Sections.user_volumeinfo_refresh( ul, userid ) );
				
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
				}
				u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
			
			} );
		}
		
		
		
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

Sections.user_disk_mount = function( devname, userid, _this )
{
	if( devname && userid && _this )
	{
		if( _this.innerHTML.toLowerCase().indexOf( 'unmount' ) >= 0 )
		{
			unmountDrive( devname, userid, 0, function( e, d )
			{
				//console.log( 'unmountDrive( '+devname+', '+userid+' ) ', { e:e, d:d } );
				
				if( e == 'ok' )
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					//console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
					Notify( { title: i18n( 'i18n_unmounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_unmounted' ) } );
					
					let u = new Module( 'system' );
					u.onExecuted = function( ee, dd )
					{
						//console.log( 'mountlist ', { e:ee, d:dd } );
						
						let ul = null;
						try
						{
							ul = JSON.parse( dd );
						}
						catch( ee ) {  }
					
						ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid, Sections.user_volumeinfo_refresh( ul, userid ) );
						
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
			mountDrive( devname, userid, 0, function( e, d )
			{
				//console.log( 'mountDrive( '+devname+', '+userid+' ) ', { e:e, d:d } );
				
				if( e == 'ok' )
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					//console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
					Notify( { title: i18n( 'i18n_mounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_mounted' ) } );
					
					let u = new Module( 'system' );
					u.onExecuted = function( ee, dd )
					{
						//console.log( 'mountlist ', { e:ee, d:dd } );
						
						let ul = null;
						try
						{
							ul = JSON.parse( dd );
						}
						catch( ee ) {  }
					
						ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid, Sections.user_volumeinfo_refresh( ul, userid ) );
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

// TODO: Check why it doesn't work to mount / unmount for other users as admin or with rights ...

function mountDrive( devname, userid, groupid, callback )
{
	if( !groupid ) groupid = 0;
	if( devname )
	{
		let vars = { devname: devname };
		
		// Specific for Pawel's code ... He just wants to forward json ...
		
		if( userid && Application.userId != userid )
		{
			vars.userid = userid;
			vars.authid = Application.authId;
			if( groupid > 0 ) vars.groupid = groupid;
			
			vars.args = JSON.stringify( {
				'type'    : 'write', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : [ 
						'PERM_STORAGE_UPDATE_GLOBAL', 
						'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
						'PERM_STORAGE_GLOBAL', 
						'PERM_STORAGE_WORKGROUP' 
					]
				}, 
				'object'   : 'user', 
				'objectid' : userid 
			} );
		}
		
		let f = new Library( 'system.library' );
		
		f.onExecuted = function( e, d )
		{
			//console.log( 'mountDrive ( device/mount ) ', { vars: vars, e:e, d:d } );
			
			if( callback ) callback( e, d );
		}
		
		f.execute( 'device/mount', vars );
	}
}

function unmountDrive( devname, userid, groupid, callback )
{
	if( !groupid ) groupid = 0;
	
	if( devname )
	{
		let vars = { devname: devname };
		
		// Specific for Pawel's code ... He just wants to forward json ...
		
		if( userid && Application.userId != userid )
		{
			vars.userid = userid;
			vars.authid = Application.authId;
			
			if( groupid > 0 ) vars.groupid = groupid;
			
			vars.args = JSON.stringify( {
				'type'    : 'write', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : [ 
						'PERM_STORAGE_UPDATE_GLOBAL', 
						'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
						'PERM_STORAGE_GLOBAL', 
						'PERM_STORAGE_WORKGROUP' 
					]
				}, 
				'object'   : 'user', 
				'objectid' : userid 
			} );
		}
		
		let f = new Library( 'system.library' );
		
		f.onExecuted = function( e, d )
		{
			//console.log( 'unmountDrive ( device/unmount ) ', { vars: vars, e:e, d:d } );
			
			if( callback ) callback( e, d );
		}
		
		f.execute( 'device/unmount', vars );
	}
}

function remountDrive( oldname, newname, userid, groupid, callback )
{
	if( oldname && newname )
	{
		unmountDrive( oldname, userid, groupid, function( e, d )
		{
			
			mountDrive( newname, userid, groupid, function( e, d )
			{
				
				if( callback ) callback( e, d );
				
			} );
			
		} );
	}
}

function _saveUser( uid, callback )
{
	let args = {  };
	
	let mapping = {
		usFullname : 'fullname',
		usEmail    : 'email',
		usMobile   : 'mobile',
		usUsername : 'username',
		usPassword : 'password'
	};
	
	if( Application.checkAppPermission( [ 
		'PERM_USER_READ_GLOBAL', 
		'PERM_USER_GLOBAL' 
	] ) )
	{
		mapping[ 'usLevel' ] = 'level';
	}
	
	for( var a in mapping )
	{
		let k = mapping[ a ];
		
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
		
		if( ge( a ) )
		{
			args[ k ] = Trim( ge( a ).value );
		}
		
		if( a == 'usMobile' )
		{
			if( ge( 'usMobileCode' ) && ge( 'usMobileCode' ).value )
			{
				args[ k ] = ( ge( 'usMobileCode' ).value + ' ' + args[ k ] );
			}
		}
		
		// Special case, hashed password
		if( a == 'usPassword' )
		{
			args[ k ] = ( 'HASHED' + Sha256.hash( args[ k ] ) );
		}
		
		
	}
	
	if( !args.username )
	{
		return Alert( i18n( 'i18n_you_forgot_username' ), i18n( 'i18n_you_forgot_username_desc' ) );
	}
	
	if( ge( 'usWorkgroups' ) )
	{
		//	
		if( ge( 'usWorkgroups' ).value )
		{
			args.workgroups = ge( 'usWorkgroups' ).value;
		}
		else if( !Application.checkAppPermission( [ 
			'PERM_USER_READ_GLOBAL', 
			'PERM_USER_GLOBAL' 
		] ) )
		{
			Notify( { title: i18n( 'i18n_user_workgroup_missing' ), text: i18n( 'i18n_Adding a User to a Workgroup is required.' ) } );
			
			return;
		}
		
	}
	
	// 1: First Wallpaper update ...
	
	let canvas = ge( 'AdminAvatar' );
	if( canvas )
	{
		let base64 = 0;
		
		try
		{
			base64 = canvas.toDataURL();
		}
		catch( e ) {  }
		
		if( base64 && base64.length > 3000 )
		{
			args.avatar = base64;
		}
	}
	
	// 2: Second Template update ...
	
	if( !uid || ( ge( 'usSetup' ) && ge( 'usSetup' ).value != ge( 'usSetup' ).current ) )
	{
		args.setup = ( ge( 'usSetup' ).value ? ge( 'usSetup' ).value : '0' );
	}
	
	// 3: Third language update ...
	
	if( !uid || ge( 'usLanguage' ) && ge( 'usLanguage' ).value != ge( 'usLanguage' ).current )
	{
		args.language = ge( 'usLanguage' ).value;
	}
	
	
	
	if( uid > 0 )
	{
		args.id = uid;
	}
	
	if( ge( 'UserSaveBtn' ) )
	{
		ge( 'UserSaveBtn' ).restore = ge( 'UserSaveBtn' ).innerHTML;
		ge( 'UserSaveBtn' ).innerHTML = '<i class="fa fa-spinner" aria-hidden="true"></i>';
	}
	
	let m = new Module( 'system' );
	m.forceHTTP = true;
	m.onExecuted = function( server )
	{
		
		try
		{
			server = JSON.parse( server );
		}
		catch( e ) {  }
		
		let e = ( server && server.result ? server.result : {} );
		let d = ( server && server.data   ? server.data   : {} );
		
		if( ShowLog ) console.log( '_saveUser( uid, callback, newuser ) ', { e:e, d:d, args: args, server: server } );
		
		if( initdebug ) console.log( initdebug == 'pretty' ? JSON.stringify( server, null, 4 ) : server );
		
		if( e == 'ok' )
		{
			
			if( !uid )
			{
				Notify( { title: i18n( 'i18n_user_create' ), text: i18n( 'i18n_user_create_succ' ) } );
			}
			else
			{
				Notify( { title: i18n( 'i18n_user_updated' ), text: i18n( 'i18n_user_updated_succ' ) } );
			}
						
			if( callback )
			{
				return callback( d.id ? d.id : uid );
			}
			else
			{
				Sections.accounts_users( 'edit', d.id ? d.id : uid );
			}
			
		}
		else if( d && d.code == 19 && d.response )
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_' + d.response ) } );
			
			if( ge( 'usUsername' ) )
			{
				ge( 'usUsername' ).focus();
			}
		}
		else if( d && d.response )
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: /*i18n( 'i18n_' + */d.response/* )*/ } );
		}
		else
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_user_update_failed' ) } );
		}
		
		if( ge( 'UserSaveBtn' ) && ge( 'UserSaveBtn' ).restore )
		{
			ge( 'UserSaveBtn' ).innerHTML = ge( 'UserSaveBtn' ).restore;
		}
		
	}
	
	if( uid > 0 )
	{
		m.execute( 'user/update', args );
	}
	else
	{
		m.execute( 'user/create', args );
	}
	
}



// delete ----------------------------------------------------------------------------------------------------------- //



function removeApplication( appName, userId, callback, vars )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( ShowLog ) console.log( 'removeApplication ', { e:e, d:d, args: { application: appName, userid: userId, authid: Application.authId } } );
		
		if( e == 'ok' )
		{
			
			removeDockItem( appName, userId, function( ee, dd )
			{
				if( ShowLog ) console.log( 'removeDockItem ', { ee:ee, dd:dd } );
				
				if( callback ) callback( true, d, vars );
				
			} );
			
		}
		else
		{
			if( callback ) callback( false, d, vars );
		}
	}
	m.execute( 'removeuserapplication', { application: appName, userid: userId, authid: Application.authId } );
}

function removeDockItem( appName, userId, callback, vars )
{
	//console.log( 'removeDockItem( appName, userId, callback ) ', { appName:appName, userId:userId, callback:callback } );
	
	let m = new Module( 'dock' );
	m.onExecuted = function( e, d )
	{
		//console.log( { e:e, d:d } );
		
		if( e == 'ok' )
		{
			if( callback ) callback( true, d, vars );
		}
		else
		{
			if( callback ) callback( false, d, vars );
		}
	}
	m.execute( 'removefromdock', { userID: userId, name: appName/*, type: ''*/ } );
}

function updateStartup( userId, callback, vars )
{
	
	if( userId )
	{
		var o = [];
	
		if( ge( 'TempStartup' ) && ge( 'TempStartup' ).value )
		{
			var stars = ge( 'TempStartup' ).value.split( ',' );
			
			if( stars && stars.length > 0 )
			{
				for( var a = 0; a < stars.length; a++ )
				{
					if( stars[a] && stars[a].indexOf( 'launch ' ) >= 0 )
					{
						o.push( stars[a] );
					}
				}
			}
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( ShowLog ) console.log( { e:e, d:d, args: { 
				setting : 'startupsequence', 
				data    : JSON.stringify( o ), 
				userid  : userId, 
				authid  : Application.authId 
			} } );
		
			if( e == 'ok' )
			{
				if( callback ) callback( true, d, vars );
			}
			else
			{
				if( callback ) callback( false, d, vars );
			}
		}
		m.execute( 'setsetting', { 
			setting : 'startupsequence', 
			data    : JSON.stringify( o ), 
			userid  : userId, 
			authid  : Application.authId 
		} );
	}
		
}

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
				
				unmountDrive( devname, userid, 0, function()
				{
					Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
					let m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						//console.log( 'deletedoor', { id:did, e:e, d:d } );
						
						if( e == 'ok' )
						{
						
							let u = new Module( 'system' );
							u.onExecuted = function( ee, dd )
							{
								let ul = null;
								try
								{
									ul = JSON.parse( dd );
								}
								catch( ee ) {  }
							
								ge( 'StorageGui' ).innerHTML = Sections.user_disk_refresh( ul, userid, Sections.user_volumeinfo_refresh( ul, userid ) );
							}
							u.execute( 'mountlist', { userid: userid, authid: Application.authId } );
						
							return;
						}
						try
						{
							let r = JSON.parse( d );						
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

function _removeUser( id, callback )
{
	if( id )
	{
		let m = new Module( 'system' );
		//m.forceHTTP = true;
		m.onExecuted = function( server )
		{
			
			try
			{
				server = JSON.parse( server );
			}
			catch( e ) {  }
			
			let e = ( server && server.result ? server.result : {} );
			let d = ( server && server.data   ? server.data   : {} );
			
			if( ShowLog ) console.log( '_removeUser( id, callback ) ', { e:e, d:d, id:id, server: server } );
			
			if( e == 'ok' )
			{
				Notify( { title: i18n( 'i18n_user_delete' ), text: i18n( 'i18n_user_delete_succ' ) } );
				
				// Refresh users list ...
				
				// TODO: Find a way to remove the user in question from the list ...
				
				if( ge( 'UserListID_' + id ) )
				{
					ge( 'UserListID_' + id ).parentNode.removeChild( ge( 'UserListID_' + id ) );
				}
				
				if( ge( 'AdminUsersCount' ) )
				{
					if( ge( 'AdminUsersCount' ).innerHTML )
					{
						let count = ge( 'AdminUsersCount' ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
					
						if( count && count > 0 )
						{
							let result = ( count - 1 );
						
							if( result >= 0 )
							{
								ge( 'AdminUsersCount' ).innerHTML = '(' + result + ')';
							}
						}
					}
				
				}
				
				if( callback )
				{
					callback( true );
				}
				else
				{ 
			   		cancelUser(  );
				}
			}
			else
			{
				Notify( { title: i18n( 'i18n_user_delete_fail' ), text: i18n( 'i18n_user_delete_failed' ) } );
			}
		}
		m.execute( 'user/delete', { id: id } );
	}
}



// helper functions ------------------------------------------------------------------------------------------------- //



function appendChild( child )
{
	if( child )
	{
		let out = [];
		
		for( var k in child )
		{
			if( child[k] )
			{
				if( child[k]['element'] )
				{
					let div = child[k]['element'];
					
					if( child[k]['child'] )
					{
						let elem = appendChild( child[k]['child'] );
						
						if( elem )
						{
							for( var i in elem )
							{
								if( elem[i] )
								{
									div.appendChild( elem[i] );
								}
							}
						}
					}
					
					out.push( div );
				}
			}
		}
		
		if( out )
		{
			return out;
		}
	}
	
	return false;
}

function removeBtn( _this, args, callback )
{
	
	if( _this )
	{
		closeEdit();
		
		_this.savedState = { 
			className: _this.className, 
			innerHTML: _this.innerHTML, 
			onclick: ( _this.onclick ? _this.onclick : function () {} ) 
		}
		_this.classList.remove( 'IconButton' );
		_this.classList.remove( 'IconToggle' );
		_this.classList.remove( 'ButtonSmall' );
		_this.classList.remove( 'ColorStGrayLight' );
		_this.classList.remove( 'fa-minus-circle' );
		_this.classList.remove( 'fa-trash' );
		//_this.classList.remove( 'NegativeAlt' );
		_this.classList.remove( 'Negative' );
		//_this.classList.add( 'ButtonAlt' );
		_this.classList.add( 'Button' );
		_this.classList.add( 'BackgroundRed' );
		_this.id = ( _this.id ? _this.id : 'EditMode' );
		_this.innerHTML = ( args.button_text ? i18n( args.button_text ) : i18n( 'i18n_delete' ) );
		_this.args = args;
		_this.callback = callback;
		_this.onclick = function(  )
		{
			
			if( this.callback )
			{
				callback( this.args ? this.args : false );
			}
			
		};
	}
	
}

function editMode( close )
{
	if( ge( 'UserEditButtons' ) )
	{
		ge( 'UserEditButtons' ).className = ( close ? 'Closed' : 'Open' );
	}
}

function closeEdit()
{
	if( ge( 'EditMode' ) )
	{
		if( ge( 'EditMode' ) && ge( 'EditMode' ).savedState )
		{
			if( typeof ge( 'EditMode' ).savedState.className != 'undefined' )
			{
				ge( 'EditMode' ).className = ge( 'EditMode' ).savedState.className;
			}
			if( typeof ge( 'EditMode' ).savedState.innerHTML != 'undefined' )
			{
				ge( 'EditMode' ).innerHTML = ge( 'EditMode' ).savedState.innerHTML;
			}
			if( typeof ge( 'EditMode' ).savedState.onclick != 'undefined' )
			{
				ge( 'EditMode' ).onclick = ge( 'EditMode' ).savedState.onclick;
			}
			ge( 'EditMode' ).removeAttribute( 'id' );
		}
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

function SubMenu( _this, close )
{
	if( !close && _this.parentNode.className.indexOf( ' InActive' ) >= 0 )
	{
		_this.parentNode.className = _this.parentNode.className.split( ' InActive' ).join( '' ).split( ' Active' ).join( '' ) + ' Active';
	}
	else if( _this.parentNode.className.indexOf( ' Active' ) >= 0 )
	{
		_this.parentNode.className = _this.parentNode.className.split( ' InActive' ).join( '' ).split( ' Active' ).join( '' ) + ' InActive';
	}
}

function hideStatus( status, show, pnt )
{
	//console.log( "hideStatus( '"+status+"', "+show+", "+pnt+" )" );
	
	if( UsersSettings( 'experiment' ) )
	{
		let s = { Active: 0, Disabled: 1, Locked: 2 };
	
		UsersSettings( 'sortstatus', { 0: s[ status ], 1: show } );
	
		//console.log( UsersSettings( 'sortstatus' ) );
		
		// TODO: Don't reset search query with this ...
		
		searchServer( null, true );
	
		return;
	}
	else
	{
		// Old client side handling Code ...
		
		if( status && ge( 'ListUsersInner' ) )
		{
			let list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
			if( list.length > 0 )
			{
				for( var a = 0; a < list.length; a++ )
				{
					if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
					let span = list[a].getElementsByTagName( 'span' )[0];
				
					if( span )
					{
						if( span.getAttribute( 'status' ).toLowerCase() == status.toLowerCase() )
						{
							let obj = ( pnt ? span.parentNode.parentNode : list[a] );
						
							if( show )
							{
								obj.style.display = '';
							}
							else
							{
								obj.style.display = 'none';
							}
						}
					}
				}
			}
		}
	}
}

function cancelUser( userid )
{
	if( ge( 'UserDetails' ) )
	{
		ge( 'UserDetails' ).innerHTML = '';
		
		scrollengine.unselectLine();
		
		if( !UsersSettings( 'experiment' ) )
		{
			// Remove selected for this user
			if( userid && ge( 'UserListID_' + userid ) )
			{
				ge( 'UserListID_' + userid ).className = ge( 'UserListID_' + userid ).className.split( 'Selected' ).join( '' );
			}
		
			// TODO: Look at this since we changed the user list, onclick doesn't go to the correct one.
			if( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).innerHTML )
			{
				let div = ge( 'ListUsersInner' ).getElementsByTagName( 'div' )[0];
			
				if( div )
				{
					div.skip = true;
					div.click(  );
				}
			}
		}
	}
}

Application.closeAllEditModes = function( act )
{
	
	if( act )
	{
		if( act.keycode )
		{
			
			switch ( act.keycode )
			{
				// Esc
				case 27:
				
					if( ge( 'UserDeleteBtn' ) && ge( 'UserDeleteBtn' ).savedState )
					{
						if( typeof ge( 'UserDeleteBtn' ).savedState.className != 'undefined' )
						{
							ge( 'UserDeleteBtn' ).className = ge( 'UserDeleteBtn' ).savedState.className;
						}
						if( typeof ge( 'UserDeleteBtn' ).savedState.innerHTML != 'undefined' )
						{
							ge( 'UserDeleteBtn' ).innerHTML = ge( 'UserDeleteBtn' ).savedState.innerHTML;
						}
						if( typeof ge( 'UserDeleteBtn' ).savedState.onclick != 'undefined' )
						{
							ge( 'UserDeleteBtn' ).onclick = ge( 'UserDeleteBtn' ).savedState.onclick;
						}
					}
					
					if( ge( 'AdminUsersBtn' ) )
					{
						SubMenu( ge( 'AdminUsersBtn' ), true );
					}
					
					closeEdit();
					
					break;
				default: break;
			}
			
		}
		
		if( act.targ )
		{
		
			if( ge( 'UserDeleteBtn' ) && ge( 'UserDeleteBtn' ).savedState )
			{
			
				if( act.targ.id != 'UserDeleteBtn' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
				{
					
					if( typeof ge( 'UserDeleteBtn' ).savedState.className != 'undefined' )
					{
						ge( 'UserDeleteBtn' ).className = ge( 'UserDeleteBtn' ).savedState.className;
					}
					if( typeof ge( 'UserDeleteBtn' ).savedState.innerHTML != 'undefined' )
					{
						ge( 'UserDeleteBtn' ).innerHTML = ge( 'UserDeleteBtn' ).savedState.innerHTML;
					}
					if( typeof ge( 'UserDeleteBtn' ).savedState.onclick != 'undefined' )
					{
						ge( 'UserDeleteBtn' ).onclick = ge( 'UserDeleteBtn' ).savedState.onclick;
					}
				
				}
			}
			
			if( ge( 'AdminUsersBtn' ) )
			{
				found = false;
				
				let pnt = ge( 'AdminUsersBtn' ).parentNode;
				
				if( pnt )
				{
					let ele = pnt.getElementsByTagName( '*' );
					
					if( ele.length > 0 )
					{
						for( var a = 0; a < ele.length; a++ )
						{
							if( ele[a] && ele[a] == act.targ )
							{
								found = true;
							}
						}
					}
				}
				
				if( !found && ( act.targ.id != 'AdminUsersBtn' || act.targ.id != 'AdminUsersSubMenu' ) && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
				{
					SubMenu( ge( 'AdminUsersBtn' ), true );
				}
			}
			
			if( ge( 'EditMode' ) && ge( 'EditMode' ).savedState )
			{
				
				if( act.targ.id != 'EditMode' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
				{
					closeEdit();
				}
				
			}
			
		}
	}
	
}

// Manage server requests
var RequestQueue = {
	
	ServerBusy : false, 
	ServerRequestQueue : [],  
	
	Set: function( func, obj, ready )
	{
		
		// If ready check is requested and server is busy return false
		if( ready && this.ServerBusy )
		{
			return false;
		}
		
		if( !this.ServerRequestQueue.length )
		{
			this.ServerRequestQueue.push( { func: func, obj: obj } );
			
			this.Run();
		}
		else
		{
			this.ServerRequestQueue.push( { func: func, obj: obj } );
		}
		
		
	},
	
	Run: function()
	{
		if( this.ServerRequestQueue )
		{
			for( let key in this.ServerRequestQueue )
			{
				if( this.ServerRequestQueue[key] && this.ServerRequestQueue[key].func )
				{
					// Let the function know the server is now busy with a request
					this.ServerBusy = true;
					
					let _this = this;
					
					this.ServerRequestQueue[key].key = key;
					
					this.ServerRequestQueue[key].func( function( key )
					{
						if( _this.ServerRequestQueue[key] )
						{
							_this.Delete( key );
						}
						
						// Let the function know the server is not busy with any requests ...
						_this.ServerBusy = false;
						
						// Run the request queue again, and check for requests in queue ...
						_this.Run();
						
					}, key, this.ServerRequestQueue[key].obj );
					
					return;
				}
			}
		}
	},
	
	Delete: function( key )
	{
		let out = [];
		
		if( this.ServerRequestQueue )
		{
			for( let i in this.ServerRequestQueue )
			{
				if( this.ServerRequestQueue[i] && ( !key || key != i ) )
				{
					out.push( this.ServerRequestQueue[i] );
				}
			}
		}
		
		this.ServerRequestQueue = out;
	}
	
}



