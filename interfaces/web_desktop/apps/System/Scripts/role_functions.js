/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Show the form
function initRoleDetails( info )
{
	// System
	
	// Modules
	
	// Apps
	
	var data = info.permission;
	var wgroups = info.workgroups;
	
	var apps = [];
	
	console.log( [ data, info.role ] );
	
	if( data )
	{
		var perm = data;
		
		if( info.role.Permissions )
		{
			var roleperm = info.role.Permissions;
			
			for( var i in perm )
			{
				for( var ii in perm[i].AppPermissions )
				{
					for( var r in roleperm )
					{
						if( roleperm[r].Key && roleperm[r].Key == perm[i].Name )
						{
							
							if( typeof perm[i].AppPermissions[ii] == 'string' )
							{
								if( perm[i].AppPermissions[ii].split( 'App ' )[1] )
								{
									if( roleperm[r].Permission == perm[i].AppPermissions[ii].split( 'App ' )[1].trim() )
									{
										//console.log( perm[i] );
										if( ShowLog ) console.log( roleperm[r] );
										
										perm[i].AppPermissions[ii] = {
											id          : perm[i].AppPermissions[ii].split( 'App ' )[1].trim(), 
											parameter   : "", 
											description : "", 
											data        : roleperm[r].Data
										};
										
										if( ShowLog ) console.log( '[1]', perm[i].AppPermissions[ii] );
										
										// New method ----
										
										if( !perm[i].RolePermissions )
										{
											perm[i].RolePermissions = {};
										}
										
										if( !perm[i].RolePermissions[ roleperm[r].ID ] )
										{
											perm[i].RolePermissions[ roleperm[r].ID ] = {
												id          : perm[i].AppPermissions[ii].split( 'App ' )[1].trim(), 
												parameter   : '', 
												description : '', 
												data        : roleperm[r].Data
											};
										}
									}
									
								}
							}
							else if( typeof perm[i].AppPermissions[ii] == 'object' )
							{
								if( perm[i].AppPermissions[ii].id )
								{
									if( roleperm[r].Permission == perm[i].AppPermissions[ii].id )
									{
										if( typeof perm[i].AppPermissions[ii].data == 'undefined' )
										{
											//console.log( perm[i] );
											if( ShowLog ) console.log( roleperm[r] );
										
											perm[i].AppPermissions[ii].data = roleperm[r].Data;
										
											if( ShowLog ) console.log( '[2]', perm[i].AppPermissions[ii] );
										}
										
										// New method ----
									
										if( !perm[i].RolePermissions )
										{
											perm[i].RolePermissions = {};
										}
										
										if( !perm[i].RolePermissions[ roleperm[r].ID ] )
										{
											perm[i].RolePermissions[ roleperm[r].ID ] = {
												id          : perm[i].AppPermissions[ii].id, 
												parameter   : perm[i].AppPermissions[ii].parameter, 
												description : '', 
												data        : roleperm[r].Data
											};
										}
									}
									
								}
								
							}
							else
							{
								//console.log( perm[i].AppPermissions[ii] );
							}
						}
					}
				}
			}
		}
	}
	
	if( ShowLog ) console.log( perm );
	
	apl = '';
	
	if( 1!=1 && perm )
	{
		for( var a in perm )
		{
			if( perm[a].AppPermissions && perm[a].Name )
			{
				var sw = 2;
				
				apl += '<div class="Wrapper collapse">';
			
				apl += '<div class="HRow">';
				apl += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis"><strong>' + perm[a].Name + '</strong></div>';
				apl += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
				apl += '<button onclick="Expand(this,3)" class="IconButton IconSmall ButtonSmall FloatRight fa-chevron-right"></button>';
				apl += '</div>';
				apl += '</div>';
				
				apl += '<div class="List">';
			
				for( var k in perm[a].AppPermissions )
				{
					if( typeof perm[a].AppPermissions[k] == "object" )
					{
						var obj = perm[a].AppPermissions[k];
					}
					else
					{
						if( !perm[a].AppPermissions[k].split( 'App ' )[1] )
						{
							continue;
						}
						
						var obj = {
							id          : perm[a].AppPermissions[k].split( 'App ' )[1].trim(), 
							parameter   : "", 
							description : "", 
							data        : ""
						};
					}
					
					sw = sw == 2 ? 1 : 2;
					
					var rid = info.role.ID;
					var pem = obj.id;
					var key = perm[a].Name;
					
					apl += '<div class="HRow">';
					apl += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + i18n( 'i18n_' + obj.id ) + '</div>';
					apl += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
					apl += '<button onclick="Sections.updatepermission('+rid+',\''+pem+'\',\''+key+'\','+null+',this)" class="IconButton IconSmall ButtonSmall FloatRight' + ( obj.data ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
					apl += '</div>';
					apl += '</div>';
				}
			
				apl += '</div>';
			
				apl += '</div>';
			}
		}
	}
	
	// old method will not be used so new method under ...
	
	apl = '';
	
	if( 1!=1 && perm )
	{
		for( var a in perm )
		{
			if( perm[a].AppPermissions && perm[a].Name )
			{
				var sw = 2;
				
				apl += '<div class="Wrapper collapse">';
			
				apl += '<div class="HRow">';
				apl += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis"><strong>' + perm[a].Name + '</strong></div>';
				apl += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
				//apl += '<button onclick="Expand(this,3)" class="IconButton IconSmall ButtonSmall FloatRight fa-chevron-right"></button>';
				apl += '</div>';
				apl += '</div>';
				
				apl += '<div class="">';
				
				
				
				
				
				if( perm[a].RolePermissions )
				{
					for( var li in perm[a].RolePermissions )
					{
						if( typeof perm[a].RolePermissions[li] == "object" )
						{
							var obj2 = perm[a].RolePermissions[li];
						}
						else
						{
							if( !perm[a].RolePermissions[li].split( 'App ' )[1] )
							{
								continue;
							}
					
							var obj2 = {
								id          : perm[a].RolePermissions[li].split( 'App ' )[1].trim(), 
								parameter   : "", 
								description : "", 
								data        : ""
							};
						}
					
					
						//if( !obj2.data ) continue;
					
					
						var rid  = info.role.ID;
						var pem  = obj2.id;
						var key  = perm[a].Name;
						var data = obj2.data;
					
					
						apl += '<div class="HRow">';
						//apl += '<div class="PaddingSmall HContent55 FloatLeft Ellipsis"><select class="FullWidth">';
						apl += '<div class="PaddingSmall HContent55 FloatLeft Ellipsis">';
					
						//apl += '<option> - - - </option>';
					
						for( var k in perm[a].AppPermissions )
						{
							if( typeof perm[a].AppPermissions[k] == "object" )
							{
								var obj = perm[a].AppPermissions[k];
							}
							else
							{
								if( !perm[a].AppPermissions[k].split( 'App ' )[1] )
								{
									continue;
								}
						
								var obj = {
									id          : perm[a].AppPermissions[k].split( 'App ' )[1].trim(), 
									parameter   : "", 
									description : "", 
									data        : ""
								};
							}
					
							sw = sw == 2 ? 1 : 2;
					
							//var rid = info.role.ID;
							//var pem = obj.id;
							//var key = perm[a].Name;
						
							//apl += '<option' + ( obj2.id == obj.id ? ' selected="selected"' : '' ) + '>' + ( 'i18n_' + obj.id ) + '</option>';
						
							if( obj2.id == obj.id )
							{
								apl += '<div class="PaddingSmall">' + i18n( 'i18n_' + obj.id ) + '</div>';
							}
						}
				
						//apl += '</select></div>';
						apl += '</div>';
						//apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis"><select class="FullWidth">';
						apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis">';
						
						var found = false;
						
						if( wgroups && wgroups.length )
						{
							//apl += '<option> - - - </option>';
							//apl += '<div class="PaddingSmall"> - - - </div>';
						
							for( var k in wgroups )
							{
								if( wgroups[k].ID == data )
								{
									apl += '<div class="PaddingSmall">' + wgroups[k].Name + '</div>';
									
									found = true;
								}
								//apl += '<option>' + wgroups[k].Name + '</option>';
							}
						}
						
						if( !found && data != 0 )
						{
							//apl += '<div class="PaddingSmall" title="' + data + '">' + data + '</div>';
							apl += '<input value="' + data + '" class="FullWidth" onclick="this.select()">';
						}
						
						//apl += '</select></div>';
						apl += '</div>';
						apl += '<div class="PaddingSmall HContent10 TextCenter FloatLeft Ellipsis">';
						//apl += '<button onclick="javascript:void(0)" class="IconButton IconSmall ButtonSmall FloatRight fa-toggle-off"></button>';
						//apl += '<strong>(-)</strong>';
						apl += '<button class="IconButton IconSmall ButtonSmall FloatRight fa-minus-circle" onclick="Sections.removepermission('+rid+',\''+pem+'\',\''+key+'\',\''+data+'\',this)"></button>';
						apl += '</div>';
						apl += '</div>';
				
					}
				}
				
				
				
				
				
				
				
				apl += '<div class="HRow">';
				apl += '<div class="PaddingSmall HContent55 FloatLeft Ellipsis"><select id="RolePermissionList_' + key + '" class="FullWidth" onchange="checkRoleSelect(\'' + key + '\',this)">';
				
				apl += '<option value=""> - - - </option>';
				
				for( var k in perm[a].AppPermissions )
				{
					if( typeof perm[a].AppPermissions[k] == "object" )
					{
						var obj = perm[a].AppPermissions[k];
					}
					else
					{
						if( !perm[a].AppPermissions[k].split( 'App ' )[1] )
						{
							continue;
						}
						
						var obj = {
							id          : perm[a].AppPermissions[k].split( 'App ' )[1].trim(), 
							parameter   : "", 
							description : "", 
							data        : ""
						};
					}
					
					sw = sw == 2 ? 1 : 2;
					
					//var rid = info.role.ID;
					//var pem = obj.id;
					//var key = perm[a].Name;
					
					apl += '<option value="' + obj.id + '">' + i18n( 'i18n_' + obj.id ) + '</option>';
				}
				
				apl += '</select></div>';
				apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis">';
				apl += '<select id="RoleWorkgroupList_' + key + '" class="FullWidth" style="display:inline">';
				
				if( wgroups && wgroups.length )
				{
					apl += '<option value=""> - - - </option>';
					
					for( var k in wgroups )
					{
						apl += '<option value="' + wgroups[k].ID + '">' + wgroups[k].Name + '</option>';
					}
				}
				
				apl += '</select>';
				apl += '<input id="RoleParameterInput_' + key + '" class="FullWidth" placeholder="Ex. [1,2,3] or {1:1,2:2,3:3}" style="display:none">';
				apl += '</div><div class="PaddingSmall HContent10 TextCenter FloatLeft Ellipsis">';
				//apl += '<button onclick="javascript:void(0)" class="IconButton IconSmall ButtonSmall FloatRight fa-toggle-off"></button>';
				//apl += '<strong>(+)</strong>';
				apl += '<button class="IconButton IconSmall ButtonSmall FloatRight fa-plus-circle" onclick="Sections.addpermission('+rid+',\''+key+'\',this)"></button>';
				apl += '</div>';
				apl += '</div>';
				
				//apl += '<div class="HRow">&nbsp;</div>';
				
				
				
				apl += '<div class="HRow">';
				//apl += '<button onclick="javascript:void(0)" class="IconSmall FloatRight">Save</button>';
				//apl += '<button class="IconButton IconSmall ButtonSmall FloatRight fa-edit" onclick=""></button>';
				apl += '</div>';
				
				
				
				apl += '</div>';
			
				apl += '</div>';
			}
		}
	}
	
	
	
	// Another NEW NEW method :) .......................................................................................
	
	apl = '';
	
	if( perm )
	{
		for( var a in perm )
		{
			if( perm[a].AppPermissions && perm[a].Name )
			{
				var sw = 2;
				
				apl += '<div class="Wrapper collapse">';
				
				apl += '	<div class="HRow">';
				apl += '		<div class="PaddingSmall HContent100 FloatLeft Ellipsis"><strong>' + perm[a].Name + '</strong></div>';
				apl += '	</div>';
				
				apl += '	<div class="">';
							
				for( var k in perm[a].AppPermissions )
				{
					
					sw = sw == 2 ? 1 : 2;
					
					apl += '	<div class="HRow">';
					apl += '		<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
					apl += '			<span>' + i18n( /*'i18n_' + */perm[a].AppPermissions[k].Name ) + '</span>';
					apl += '		</div>';
					
					if( perm[a].AppPermissions[k].Permissions )
					{
						for( var c in perm[a].AppPermissions[k].Permissions )
						{
							if( perm[a].AppPermissions[k].Permissions[c] )
							{
								let pem = {
									nam : ( perm[a].AppPermissions[k].Permissions[c] ), 
									key : ( perm[a].Name ), 
									act : ( info.role.Permissions[perm[a].Name] && info.role.Permissions[perm[a].Name][perm[a].AppPermissions[k].Permissions[c]] ? true : false ) 
								};
								
								apl += '	<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
								
								if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
								{
									apl += '	<input type="checkbox"'+( pem.act ? ' checked="checked"' : '' )+' name="'+pem.nam+'" onclick="Sections.togglepermission('+info.role.ID+',\''+pem.nam+'\',\''+pem.key+'\',this )"/>';
								}
								else
								{
									apl += '	<input type="checkbox"'+( pem.act ? ' checked="checked"' : '' )+' name="'+pem.nam+'" disabled="disabled"/>';
								}
								
								apl += '		<span>' + i18n( 'i18n_' + pem.nam ) + '</span>';
								apl += '	</div>';
							}
						}
					}
					
					apl += '	</div>';
					
				}
				
				apl += '		<div class="HRow"></div>';
				
				apl += '	</div>';
			
				apl += '</div>';
				
			}
		}
	}
	
	
	// Get the user details template
	var d = new File( 'Progdir:Templates/account_role_details.html' );
	
	// Add all data for the template
	d.replacements = {
		id: info.role.ID,
		role_name: info.role.Name,
		role_description: ( info.role.Description ? info.role.Description : '' ),
		permissions: apl
	};
	
	// Add translations
	d.i18n();
	d.onLoad = function( data )
	{
		ge( 'RoleDetails' ).innerHTML = data;
		
		
		function onLoad ( data )
		{
				
			var func = {
				
				appids : function ( soft )
				{
					var ids = {};
					
					if( soft )
					{
						if( ShowLog ) console.log( 'soft ', soft );
						
						var i = 0;
						
						for( var a in soft )
						{
							if( soft[a] && soft[a][0] )
							{
								ids[ i++ ] = soft[a];
							}
						}
					}
					
					return ids;
					
				}( null/*soft*/ ),
				
				updateids : function ( mode, key, value )
				{
					
					switch( mode )
					{
						
						case 'applications':
							
							if( this.appids )
							{
								var arr = []; /*var ids = {};*/ var i = 0; var found = false;
								
								for( var a in this.appids )
								{
									if( this.appids[a] && this.appids[a][0] )
									{
										if( key && this.appids[a][0].toLowerCase() == key.toLowerCase() )
										{
											this.appids[a] = ( value ? value : false ); found = true;
										}
										
										if( this.appids[a] && this.appids[a][0] )
										{
											arr.push( this.appids[a][0] + '_' + this.appids[a][1] );
											
											//ids[ i++ ] = this.appids[a];
										}
									}
									
									i++;
								}
								
								if( key && value && !found )
								{
									if( value[0] )
									{
										arr.push( value[0] + '_' + value[1] );
										
										/*ids[ i++ ] = value;*/
										
										this.appids[ i++ ] = value; 
									}
								}
								
								if( ShowLog ) console.log( 'applications ', this.appids );
								
								if( ge( 'RoleApplications' ) )
								{
									ge( 'RoleApplications' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
								}
							}
							else if( key && value )
							{
								this.appids[0] = value;
								
								if( ge( 'RoleApplications' ) && value[0] )
								{
									ge( 'RoleApplications' ).setAttribute( 'value', value[0] + '_' + value[1] );
								}
							}
							
							break;
							
					}
					
				},
				
				mode : { applications : 'list' },
				
				// Applications ------------------------------------------------------------------------------------
				
				applications : function ( func )
				{
					
					// Editing applications
					
					var init =
					{
						
						func : this,
						
						ids  : this.appids,
						
						head : function (  )
						{
							
							var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
							inp.value = '';
							
							if( ge( 'ApplicationSearchCancelBtn' ) && ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) )
							{
								ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
							}
							
							var o = ge( 'ApplicationGui' ); if( o ) o.innerHTML = '<input type="hidden" id="RoleApplications">';
							
							this.func.updateids( 'applications' );
							
							var divs = appendChild( [ 
								{ 
									'element' : function() 
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow BackgroundNegative Negative Padding';
										return d;
									}(),
									'child' : 
									[ 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
												d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
												d.style.cursor = 'pointer';
												d.onclick = function(  )
												{
													sortApps( 'Name' );
												};
												return d;
											}() 
										}, 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
												d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
												d.style.cursor = 'pointer';
												d.onclick = function(  )
												{
													sortApps( 'Category' );
												};
												return d;
											}()
										},
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
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
								
								var o = ge( 'ApplicationInner' ); o.innerHTML = '';
								
								if( this.ids )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a][0] )
										{
											var found = false;
											
											for( var k in apps )
											{
												if( this.ids[a] && this.ids[a][0] == apps[k].Name )
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
																		d.setAttribute( 'Name', apps[k].Name ? apps[k].Name : 'n/a' );
																		d.setAttribute( 'Category', apps[k].Category ? apps[k].Category : 'n/a' );
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
																d.innerHTML = '<strong class="PaddingSmallRight">' + ( apps[k].Name ? apps[k].Name : 'n/a' ) + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + ( apps[k].Category ? apps[k].Category : 'n/a' ) + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'HContent15 FloatLeft';
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
																			
																				args.func.updateids( 'applications', args.name, false );
																				
																				if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																			
																				/*updateApplications( details.ID, function( e, d, vars )
																				{
																				
																					if( e && vars )
																					{
																					
																						if( vars.pnt )
																						{
																							vars.pnt.innerHTML = '';
																						}
																		
																						if( vars.func )
																						{
																							
																						}
																					
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																				
																				}, { pnt: args.pnt, func: args.func } );*/
																			
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
								
								var o = ge( 'ApplicationInner' ); o.innerHTML = '';
								
								for( var k in apps )
								{
									if( apps[k] && apps[k].Name )
									{
										var found = false;
										
										if( this.ids )
										{
											for( var a in this.ids )
											{
												if( this.ids[a] && this.ids[a][0] == apps[k].Name )
												{
													found = true;
												}
											}
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
															return d;;
														}(),
														 'child' : 
														[ 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'span' );
																	d.setAttribute( 'Name', apps[k].Name ? apps[k].Name : 'n/a' );
																	d.setAttribute( 'Category', apps[k].Category ? apps[k].Category : 'n/a' );
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
															d.innerHTML = '<strong class="PaddingSmallRight">' + ( apps[k].Name ? apps[k].Name : 'n/a' ) + '</strong>';
															return d;
														}() 
													}, 
													{ 
														'element' : function() 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
															d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + ( apps[k].Category ? apps[k].Category : 'n/a' ) + '</span>';
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
																	
																	var b = CustomToggle( 'aid_'+name, 'FloatRight', null, function (  )
																	{
																		
																		if( this.checked )
																		{
																			
																			func.updateids( 'applications', name, [ name, '0' ] );
																			
																			if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																			
																			/*updateApplications( details.ID, function( e, d, vars )
																			{
																				
																				if( e && vars )
																				{
																					
																					vars._this.checked = true;
																					
																					if( vars.func )
																					{
																						
																					}
																					
																				}
																				else
																				{
																					if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					
																					vars._this.checked = false;
																					
																				}
																				
																			}, { _this: this, func: func } );*/
																			
																		}
																		else
																		{
																			
																			func.updateids( 'applications', name, false );
																			
																			if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																			
																			/*updateApplications( details.ID, function( e, d, vars )
																			{
																				
																				if( e && vars )
																				{
																					
																					vars._this.checked = false;
																					
																					if( vars.func )
																					{
																						
																					}
																					
																				}
																				else
																				{
																					if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					
																					vars._this.checked = true;
																					
																				}
																				
																			}, { _this: this, func: func } );*/
																			
																		}
																		
																	}, ( found ? true : false ), 1 );
																	
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
								
								// Sort default by Name ASC
								this.sortapps( 'Name', 'ASC' );
								
							}
							
						},
						
						searchapps : function ( filter, server )
						{
							
							if( ge( 'ApplicationInner' ) )
							{
								var list = ge( 'ApplicationInner' ).getElementsByTagName( 'div' );

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

							var _this = ge( 'ApplicationInner' );

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
							
							var etn = ge( 'ApplicationEdit' );
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
					
							var btn = ge( 'ApplicationEditBack' );
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
							
							var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
							inp.onkeyup = function( e )
							{
								init.searchapps( this.value );
							}
							ge( 'ApplicationSearchCancelBtn' ).onclick = function( e )
							{
								init.searchapps( false );
								inp.value = '';
							}
							
							// Show listed applications ... 
							
							init.list();
							
							break;
							
					}
					
				},
				
				// Permissions ------------------------------------------------------------------------------------
				
				permissions : function ( func )
				{
					
					var init =
					{
						
						func : this,
						
						ids  : this.appids,
						
						head : function (  )
						{
							
							var str = '';
							
							str += '<div class="MarginTop OverflowHidden BorderRadius Elevated">';
							str += '	<div class="HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight">';
							str += '		<div class="PaddingSmall HContent100 InputHeight FloatLeft">';
							str += '			<h3 class="NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft">';
							str += '				<strong>' + i18n( 'i18n_system' ) + '</strong>';
							str += '			</h3>';
							str += '		</div>';
							str += '	</div>';
							str += '	<div id="PermissionGui"></div>';
							str += '</div>';
							
							var head = ge( 'AdminPermissionContainer' ); if( head ) head.innerHTML = str;
							
							var o = ge( 'PermissionGui' ); if( o ) o.innerHTML = '';
							
							this.func.updateids( 'permissions' );
							
							var divs = appendChild( [ 
								{ 
									'element' : function() 
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow BackgroundNegative Negative Padding';
										return d;
									}(),
									'child' : 
									[ 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
												d.innerHTML = '<strong>' + i18n( 'permission' ) + '</strong>';
												return d;
											}() 
										}, 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
												d.innerHTML = '<strong>' + i18n( 'create' ) + '</strong>';
												return d;
											}()
										}, 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
												d.innerHTML = '<strong>' + i18n( 'read' ) + '</strong>';
												return d;
											}()
										}, 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
												d.innerHTML = '<strong>' + i18n( 'update' ) + '</strong>';
												return d;
											}()
										}, 
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
												d.innerHTML = '<strong>' + i18n( 'delete' ) + '</strong>';
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
										d.id = 'PermissionInner';
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
							
							this.func.mode[ 'permissions' ] = 'list';
							
							if( perm )
							{
								this.head();
								
								var o = ge( 'PermissionInner' ); o.innerHTML = '';
								
								
								
								for( var a in perm )
								{
									
									if( perm[a].AppPermissions && perm[a].Name )
									{
										
										for( var k in perm[a].AppPermissions )
										{
											
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
																d.className = 'PaddingSmall HContent40 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<strong class="PaddingSmallRight">' + i18n( perm[a].AppPermissions[k].Name ) + '</strong>';
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
																	'element' : function( id, key, toggle ) 
																	{
																		
																		var b = CustomToggle( id, null, null, function (  )
																		{
																			
																			if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																			{
																			
																				if( this.checked )
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																				else
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																			
																			}
																			
																		}, ( toggle ? true : false ), 1 );
																		
																		return b;
																	}( perm[a].AppPermissions[k].Permissions[0], perm[a].Name, ( info.role.Permissions[perm[a].Name] && info.role.Permissions[perm[a].Name][perm[a].AppPermissions[k].Permissions[0]] ? true : false ) ) 
																}
															]
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
																	'element' : function( id, key, toggle ) 
																	{
																		
																		var b = CustomToggle( id, null, null, function (  )
																		{
																		
																			if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																			{
																			
																				if( this.checked )
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																				else
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																			
																			}
																		
																		}, ( toggle ? true : false ), 1 );
																		
																		return b;
																	}( perm[a].AppPermissions[k].Permissions[1], perm[a].Name, ( info.role.Permissions[perm[a].Name] && info.role.Permissions[perm[a].Name][perm[a].AppPermissions[k].Permissions[1]] ? true : false ) ) 
																}
															]
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
																	'element' : function( id, key, toggle ) 
																	{
																		
																		var b = CustomToggle( id, null, null, function (  )
																		{
																		
																			if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																			{
																			
																				if( this.checked )
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																				else
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																			
																			}
																		
																		}, ( toggle ? true : false ), 1 );
																		
																		return b;
																	}( perm[a].AppPermissions[k].Permissions[2], perm[a].Name, ( info.role.Permissions[perm[a].Name] && info.role.Permissions[perm[a].Name][perm[a].AppPermissions[k].Permissions[2]] ? true : false ) ) 
																}
															]
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
																	'element' : function( id, key, toggle ) 
																	{
																		
																		var b = CustomToggle( id, null, null, function (  )
																		{
																		
																			if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																			{
																			
																				if( this.checked )
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																				else
																				{
																					Sections.togglepermission( info.role.ID, id, key, this );
																				}
																			
																			}
																		
																		}, ( toggle ? true : false ), 1 );
																		
																		return b;
																	}( perm[a].AppPermissions[k].Permissions[3], perm[a].Name, ( info.role.Permissions[perm[a].Name] && info.role.Permissions[perm[a].Name][perm[a].AppPermissions[k].Permissions[3]] ? true : false ) ) 
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
						
						refresh : function (  )
						{
							
							switch( this.func.mode[ 'permissions' ] )
							{
								
								case 'list':
									
									this.list();
									
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
							
						case 'refresh':
							
							init.refresh();
							
							break;
						
						default:
							
							// Show listed permissions ... 
							
							init.list();
							
							break;
							
					}
					
				}
				
			};
			
			func.applications();
			func.permissions();
			
		}
		
		// Run onload functions ....
			
		onLoad();
		
		
		
		// Responsive framework
		Friend.responsive.pageActive = ge( 'RoleDetails' );
		Friend.responsive.reinit();
	}
	d.load();
}

function checkRoleSelect( key, _this )
{
	if( !_this.value || ( _this.value && _this.value.toLowerCase().indexOf( 'workgroup' ) >= 0 && _this.value.toLowerCase().indexOf( 'global' ) <= 0 ) )
	{
		ge( 'RoleWorkgroupList_'  + key ).setAttribute( 'style', 'display:inline' );
		ge( 'RoleParameterInput_' + key ).setAttribute( 'style', 'display:none'   );
	}
	else
	{
		ge( 'RoleWorkgroupList_'  + key ).setAttribute( 'style', 'display:none'   );
		ge( 'RoleParameterInput_' + key ).setAttribute( 'style', 'display:inline' );
	}
}

