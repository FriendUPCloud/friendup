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
	
	var data    = ( info.permission ? info.permission : {} );
	var role    = ( info.role ? info.role : {} );
	var wgroups = ( info.workgroups ? info.workgroups : [] );
	
	var apps    = ( info.applications ? info.applications : {} );
	
	let uuid    = ''/*(info.ID?'_'+info.ID:'')*/;
	
	console.log( [ data, info, wgroups, apps ] );
	
	if( data )
	{
		var perm = data;
		
	}
	
	
	
	// Get the user details template
	var d = new File( 'Progdir:Templates/account_role_details.html' );
	
	// Add all data for the template
	d.replacements = {
		id               : ( info.ID          ? info.ID          : '' ),
		role_name        : ( role.Name        ? role.Name        : '' ),
		role_description : ( role.Description ? role.Description : '' ),
		permissions      : ''
	};
	
	// Add translations
	d.i18n();
	d.onLoad = function( data )
	{
		ge( 'RoleDetails' ).innerHTML = data;
		
		
		if( !info.ID )
		{
			
			ge( 'RoleDeleteBtn'+uuid ).style.display = 'none';
			
			ge( 'AdminApplicationContainer'+uuid ).style.display = 'none';
			
		}
		else
		{
			ge( 'RoleEditButtons'+uuid ).className = 'Closed';
			
			if( ge( 'RoleBasicDetails'+uuid ) )
			{
				var inps = ge( 'RoleBasicDetails'+uuid ).getElementsByTagName( '*' );
				if( inps.length > 0 )
				{
					for( var a = 0; a < inps.length; a++ )
					{
						if( inps[ a ].id && [ 
							'RoleName'+uuid, 
							'RoleDescription'+uuid 
						].indexOf( inps[ a ].id ) >= 0 )
						{
							( function( i ) {
								i.onclick = function( e )
								{
									if( ge( 'RoleEditButtons' ) )
									{
										ge( 'RoleEditButtons' ).className = 'Open';
									}
								}
							} )( inps[ a ] );
						}
					}
				}
			}
			
		}
		
		var bg1  = ge( 'RoleSaveBtn'+uuid );
		if( bg1 ) 
		{
			if( 
			( info.ID && Application.checkAppPermission( 'ROLE_UPDATE' ) ) || 
			( !info.ID && Application.checkAppPermission( 'ROLE_CREATE' ) ) 
			)
			{
				bg1.onclick = function( e )
				{
					// Save role ...
					
					if( info.ID )
					{
						if( ShowLog || 1==1 ) console.log( '// save role' );
						
						Sections.accounts_roles( 'update', { wid: info.GroupID, rid: info.ID, callback: function ( e, d )
						{
							
							console.log( 'update ... refresh ... ', { e:e, d:d } );
							
							if( e && d && d.roleid )
							{
								Sections.workgrouproleupdate( d.roleid, info.GroupID, true, function()
								{
									
									Sections.accounts_roles( 'refresh', { wid: info.GroupID, rid: d.roleid } );
									
								} );
							}
							
						} } );
						
					}
					else
					{
						if( ShowLog || 1==1 ) console.log( '// create role' );
						
						Sections.accounts_roles( 'create', { wid: info.GroupID, callback: function ( e, d )
						{
							
							console.log( 'create ... refresh ... ', { e:e, d:d } );
							
							if( e && d && d.roleid )
							{
								Sections.workgrouproleupdate( d.roleid, info.GroupID, true, function()
								{
									
									Sections.accounts_roles( 'refresh', { wid: info.GroupID, rid: d.roleid } );
									
								} );
							}
							
						} } );
						
					}
				}
			}
			else
			{
				bg1.style.display = 'none';
			}
		}
		var bg2  = ge( 'RoleCancelBtn'+uuid );
		if( bg2 ) bg2.onclick = function( e )
		{
			if( info.ID )
			{
				
				if( ge( 'RoleEditButtons' ) )
				{
					ge( 'RoleEditButtons' ).className = 'Closed';
				}
				
			}
			else
			{
				
				Sections.accounts_roles( 'refresh' );
				
			}
		}
		var bg4  = ge( 'RoleDeleteBtn'+uuid );
		if( bg4 )
		{
			if( Application.checkAppPermission( 'ROLE_DELETE' ) )
			{
				
				bg4.onclick = function( e )
				{
	
					// Delete role ...
				
					if( info.ID )
					{
						if( ShowLog ) console.log( '// delete role' );
						
						removeBtn( this, { wid: info.GroupID, rid: info.ID, button_text: 'i18n_delete_role', }, function ( args )
						{
							
							if( ShowLog || 1==1 ) console.log( '// delete role' );
							
							Sections.workgrouproleupdate( info.ID, info.GroupID, false, function()
							{
								
								Sections.accounts_roles( 'delete', { wid: args.wid, rid: args.rid, callback: function ( e, d )
								{
							
									console.log( 'delete ... refresh ... ', { e:e, d:d } );
								
									if( e )
									{
										Sections.accounts_roles( 'refresh' );
									}
							
								} } );
								
							} );
							
						} );
					}
				
				};
				
			}
			else
			{
				bg4.style.display = 'none';
			}
		}
		
		
		
		function onLoad ( data )
		{
				
			var func = {
				
				appids : function ( soft )
				{
					var ids = {};
					
					if( soft )
					{
						// TODO: Add object data because devs can add pems with same name but different key or app ...
						
						if( ShowLog ) console.log( 'soft ', soft );
						
						var i = 0;
						
						for( var a in soft )
						{
							if( soft[a] && soft[a].RolePermissions )
							{
								ids[ a ] = soft[a].RolePermissions;
							}
						}
					}
					
					return ids;
					
				}( perm ),
				
				updateids : function ( mode, key, value )
				{
					
					switch( mode )
					{
						
						case 'applications':
							
							// TODO: Collect real perm data here and add to ids ... not use that ...
							
							if( this.appids )
							{
								var arr = []; var i = 0; var found = false;
								
								for( var a in this.appids )
								{
									if( this.appids[a] )
									{
										if( key && a.toLowerCase() == key.toLowerCase() )
										{
											this.appids[a] = ( value ? value : false ); found = true;
										}
										
										if( this.appids[a] )
										{
											arr.push( a );
										}
									}
									
									i++;
								}
								
								if( key && value && !found )
								{
									arr.push( key );
									
									this.appids[ key ] = value; 
								}
								
								if( ShowLog || 1==1 ) console.log( 'applications ', this.appids );
								
								if( ge( 'RoleApplications' ) )
								{
									ge( 'RoleApplications' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
								}
							}
							else if( key && value )
							{
								this.appids[ key ] = value;
								
								if( ge( 'RoleApplications' ) )
								{
									ge( 'RoleApplications' ).setAttribute( 'value', value );
								}
							}
							
							break;
							
					}
					
				},
				
				queue : {},
				
				loaded : {},
				
				mode : { applications : 'list', permissions : 'list' },
				
				// Applications ------------------------------------------------------------------------------------
				
				applications : function ( func, data )
				{
					
					// Editing applications
					
					var init =
					{
						
						func : this,
						
						data : ( data ? data : null ),
						
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
								
								if( perm )
								{
									for( var a in perm )
									{
										if( perm[a] && perm[a].Name )
										{
											var permissions = false;
											
											for( var k in apps )
											{
												if( perm[a] && perm[a].AppPermissions && perm[a].Name == apps[k].Name && this.ids[apps[k].Name] )
												{
													permissions = perm[a];
													
													break;
												}
											}
											
											if( !permissions ) continue;
											
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
																	'element' : function( ids, permissions, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																		
																			var pnt = this.parentNode.parentNode;
																		
																			removeBtn( this, { ids: ids, permissions: permissions, func: func, pnt: pnt }, function ( args )
																			{
																			
																				args.func.updateids( 'applications', args.permissions.Name, false );
																				
																				//if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																				console.log( args.permissions );
																				
																				if( args.permissions.AppPermissions )
																				{
																					for( var a in args.permissions.AppPermissions )
																					{
																						
																						if( args.permissions.AppPermissions[a].Permissions )
																						{
																						
																							for( var b in args.permissions.AppPermissions[a].Permissions )
																							{
																								var id  = args.permissions.AppPermissions[a].Permissions[b];
																								var key = args.permissions.Name;
																								
																								if( id && key )
																								{
																									Sections.togglepermission( info.ID, id, key, null, 'delete' );
																								}
																								
																							}
																						
																						}
																					}
																				}
																				
																				if( args.func )
																				{
																					
																					console.log( 'Remove from permissions list' );
																					
																					args.func.applications( 'refresh' );
																					
																					args.func.permissions( 'remove', args.permissions.Name );
																					
																				}
																			
																			} );
																		
																		};
																		return b;
																	}( this.ids, permissions, this.func ) 
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
										var permissions = false; var toggle = false;
										
										if( perm )
										{
											for( var a in perm )
											{
												if( perm[a] && perm[a].AppPermissions && perm[a].Name == apps[k].Name )
												{
													permissions = perm[a];
												}
												
												if( perm[a] && perm[a].AppPermissions && perm[a].Name == apps[k].Name && this.ids[apps[k].Name] )
												{
													toggle = true;
												}
											}
										}
										
										if( !permissions ) continue;
										
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
																'element' : function( ids, permissions, func ) 
																{
																	
																	var b = CustomToggle( 'aid_'+permissions.Name, 'FloatRight', null, function (  )
																	{
																		
																		if( this.checked )
																		{
																			
																			// TODO: Collect real perm data here and add to ids ... nd use that ...
																			
																			func.updateids( 'applications', permissions.Name, permissions );
																			
																			//if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																			
																			console.log( permissions );
																			
																			if( permissions.AppPermissions )
																			{
																				for( var a in permissions.AppPermissions )
																				{
																					
																					if( permissions.AppPermissions[a].Permissions )
																					{
																					
																						for( var b in permissions.AppPermissions[a].Permissions )
																						{
																							var id  = permissions.AppPermissions[a].Permissions[b];
																							var key = permissions.Name;
																							
																							if( id && key )
																							{
																								Sections.togglepermission( info.ID, id, key, null );
																							}
																							
																						}
																					
																					}
																				}
																				
																				if( func )
																				{
																					console.log( 'fetch latest ...' );
																					
																					console.log( 'Add to permissions list' );
																					
																					Sections.accounts_roles( 'permissions', { rid: info.ID, callback: function ( pems )
																					{
																						
																						if( pems )
																						{
																							func.permissions( 'init', pems[permissions.Name] );
																							func.permissions( 'refresh' );
																						}
																						
																					} } );
																				}
																				
																			}
																			
																		}
																		else
																		{
																			
																			func.updateids( 'applications', permissions.Name, false );
																			
																			//if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																			
																			console.log( permissions );
																			
																			if( permissions.AppPermissions )
																			{
																				for( var a in permissions.AppPermissions )
																				{
																					
																					if( permissions.AppPermissions[a].Permissions )
																					{
																					
																						for( var b in permissions.AppPermissions[a].Permissions )
																						{
																							var id  = permissions.AppPermissions[a].Permissions[b];
																							var key = permissions.Name;
																							
																							if( id && key )
																							{
																								Sections.togglepermission( info.ID, id, key, null, 'delete' );
																							}
																							
																						}
																					
																					}
																				}
																				
																				if( func )
																				{
																					
																					console.log( 'Remove from permissions list' );
																					
																					func.permissions( 'remove', permissions.Name );
																					
																				}
																				
																			}
																			
																		}
																		
																	}, ( toggle ? true : false ), 1 );
																	
																	return b;
																}( this.ids, permissions, this.func ) 
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
							
							if( this.loaded[ 'applications' ] )
							{
								for( var a in this.loaded[ 'applications' ] )
								{
									this.loaded[ 'applications' ][ a ].refresh();
								}
							}
							else
							{
								init.refresh();
							}
							
							break;
						
						case 'init': default:
							
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
							
							if( !this.loaded[ 'applications' ] )
							{
								this.loaded[ 'applications' ] = [];
							}
							
							this.loaded[ 'applications' ].push( init );
							
							break;
							
					}
					
				},
				
				// Permissions ------------------------------------------------------------------------------------
				
				permissions : function ( func, data )
				{
					
					var init =
					{
						
						func : this,
						
						data : ( data ? data : null ),
						
						pems : ( data && data.Name && data.RolePermissions ? data.RolePermissions : {} ),
						
						ids  : this.appids,
						
						head : function ( data )
						{
							
							this.data = ( data ? data : this.data );
							
							//console.log( this.data );
							
							if( this.data )
							{
								
								var str = '';
								
								str += '<div class="MarginTop OverflowHidden BorderRadius Elevated">';
								str += '	<div class="HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight">';
								str += '		<div class="PaddingSmall HContent100 InputHeight FloatLeft">';
								str += '			<h3 class="NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft">';
								str += '				<strong>' + i18n( this.data.Name ) + '</strong>';
								str += '			</h3>';
								str += '		</div>';
								str += '	</div>';
								str += '	<div id="PermissionGui_' + this.data.Name + '"></div>';
								str += '</div>';
								
								if( !ge( 'PermissionGui_' + this.data.Name ) )
								{
									var head = ge( 'AdminPermissionContainer' ); if( head ) head.innerHTML += str;
								}
							
								var o = ge( 'PermissionGui_' + this.data.Name ); if( o ) o.innerHTML = '';
							
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
										'element' : function( name )
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow Box Padding';
											d.id = 'PermissionInner_' + name;
											return d;
										}( this.data.Name )
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
							
						},
						
						list : function ( data, callback, args )
						{
							
							this.func.mode[ 'permissions' ] = 'list';
							
							this.data = ( data ? data : this.data );
							
							if( this.data )
							{
								
								this.head();
								
								var o = ge( 'PermissionInner_' + this.data.Name ); o.innerHTML = '';
								
								if( this.data.AppPermissions && this.data.Name )
								{
									
									for( var k in this.data.AppPermissions )
									{
										
										var permission = {
											'create' : { 
												id     : ( this.data.AppPermissions[k].Permissions[0] ), 
												toggle : ( this.data.RolePermissions && this.data.RolePermissions[ this.data.AppPermissions[k].Permissions[0] ] ? true : false )
											},
											'read'   : { 
												id     : ( this.data.AppPermissions[k].Permissions[1] ), 
												toggle : ( this.data.RolePermissions && this.data.RolePermissions[ this.data.AppPermissions[k].Permissions[1] ] ? true : false ) 
											},
											'update' : { 
												id     : ( this.data.AppPermissions[k].Permissions[2] ), 
												toggle : ( this.data.RolePermissions && this.data.RolePermissions[ this.data.AppPermissions[k].Permissions[2] ] ? true : false ) 
											},
											'delete' : { 
												id     : ( this.data.AppPermissions[k].Permissions[3] ), 
												toggle : ( this.data.RolePermissions && this.data.RolePermissions[ this.data.AppPermissions[k].Permissions[3] ] ? true : false ) 
											}
										};
										
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
														'element' : function( name ) 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmall HContent40 InputHeight FloatLeft Ellipsis';
															d.innerHTML = '<strong class="PaddingSmallRight">' + i18n( name ) + '</strong>';
															return d;
														}( this.data.AppPermissions[k].Name ) 
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
																	
																	//console.log( id + '_' + key, toggle );
																	
																	var b = CustomToggle( id + '_' + key, null, null, function (  )
																	{
																		
																		if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																		{
																		
																			if( this.checked )
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																			else
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																		
																		}
																		
																	}, ( toggle ? true : false ), 1 );
																	
																	return b;
																	
																}( permission['create'].id, this.data.Name, permission['create'].toggle ) 
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
																	
																	//console.log( id + '_' + key, toggle );
																	
																	var b = CustomToggle( id + '_' + key, null, null, function (  )
																	{
																	
																		if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																		{
																		
																			if( this.checked )
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																			else
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																		
																		}
																	
																	}, ( toggle ? true : false ), 1 );
																	
																	return b;
																	
																}( permission['read'].id, this.data.Name, permission['read'].toggle ) 
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
																	
																	//console.log( id + '_' + key, toggle );
																	
																	var b = CustomToggle( id + '_' + key, null, null, function (  )
																	{
																	
																		if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																		{
																		
																			if( this.checked )
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																			else
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																		
																		}
																	
																	}, ( toggle ? true : false ), 1 );
																	
																	return b;
																	
																}( permission['update'].id, this.data.Name, permission['update'].toggle ) 
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
																	
																	//console.log( id + '_' + key, toggle );
																	
																	var b = CustomToggle( id + '_' + key, null, null, function (  )
																	{
																	
																		if( Application.checkAppPermission( 'ROLE_UPDATE' ) )
																		{
																		
																			if( this.checked )
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																			else
																			{
																				Sections.togglepermission( info.ID, id, key, this );
																			}
																		
																		}
																	
																	}, ( toggle ? true : false ), 1 );
																	
																	return b;
																	
																}( permission['delete'].id, this.data.Name, permission['delete'].toggle ) 
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
							
							if( callback )
							{
								
								setTimeout( function (  )
								{
									callback( args ); 
								}, 10 );
								
							}
								
						},
						
						remove : function ( data )
						{
							
							if( data )
							{
								var o = ge( 'PermissionGui_' + data );
								
								if( o && o.parentNode && o.parentNode.parentNode )
								{
									o.parentNode.parentNode.removeChild( o.parentNode );
								}
								
							}
							
						},
						
						refresh : function ( data )
						{
							
							// TODO: Create an array of current scopes and refresh either all or some based on refresh info ...
							
							//console.log( '[4] refresh ...' );
							
							switch( this.func.mode[ 'permissions' ] )
							{
								
								// TODO: Refresh specific based on scope ...
								
								case 'list':
									
									this.list( data );
									
									break;
									
							}
							
						}
						
					};
					
					switch( func )
					{
						
						case 'head':
							
							init.head( data );
							
							break;
							
						case 'list':
							
							init.list( data );
							
							break;
						
						case 'remove':
							
							if( this.loaded[ 'permissions' ] )
							{
								for( var a in this.loaded[ 'permissions' ] )
								{
									if( this.loaded[ 'permissions' ][ a ] )
									{
										var name = a;
									
										if( this.loaded[ 'permissions' ][ a ].data && this.loaded[ 'permissions' ][ a ].data.Name )
										{
											name = this.loaded[ 'permissions' ][ a ].data.Name;
										}
									
										if( name == data )
										{
											this.loaded[ 'permissions' ][ a ].remove( data );
											this.loaded[ 'permissions' ][ a ] = false;
										}
										
									}
								}
								
								var arr = [];
								
								for( var b in this.loaded[ 'permissions' ] )
								{
									if( this.loaded[ 'permissions' ][ b ] )
									{
										arr.push( this.loaded[ 'permissions' ][ b ] );
									}
								}
								
								this.loaded[ 'permissions' ] = arr;
								
							}
							else
							{
								init.remove( data );
							}
							
							break;
						
						case 'refresh':
							
							if( this.loaded[ 'permissions' ] )
							{
								console.log( 'refresh ... ', this.loaded[ 'permissions' ] );
								
								for( var a in this.loaded[ 'permissions' ] )
								{
									var name = a;
									
									if( this.loaded[ 'permissions' ][ a ].data && this.loaded[ 'permissions' ][ a ].data.Name )
									{
										name = this.loaded[ 'permissions' ][ a ].data.Name;
									}
									
									if( name && data && data[ name ] )
									{
										this.loaded[ 'permissions' ][ a ].refresh( data[ name ] );
									}
									else
									{
										this.loaded[ 'permissions' ][ a ].refresh(  );
									}
								}
							}
							else
							{
								init.refresh( data );
							}
							
							break;
						
						case 'queue':
							
							if( !this.loaded[ 'permissions' ] )
							{
								this.loaded[ 'permissions' ] = [];
							}
							
							this.loaded[ 'permissions' ].push( init );
							
							if( !this.queue[ 'permissions' ] )
							{
								this.queue[ 'permissions' ] = [];
							}
							
							this.queue[ 'permissions' ].push( { 
								num   : this.queue[ 'permissions' ].length, 
								queue : this.queue[ 'permissions' ], 
								init  : init, 
								data  : data, 
								run   : function (  ) 
								{
									
									this.init.list( this.data, function ( args )
									{
										
										if( args.queue && args.queue[args.num+1] )
										{
											args.queue[args.num+1].run();
										}
										else
										{
											args.queue = {};
										}
										
									}, { num: this.num, queue: this.queue } );
									
								} 
							} );
							
							break;
						
						case 'init': default:
							
							// Show listed permissions ... 
							
							if( this.queue[ 'permissions' ] )
							{
								this.queue[ 'permissions' ][0].run();
							}
							else
							{
								if( !this.loaded[ 'permissions' ] )
								{
									this.loaded[ 'permissions' ] = [];
								}
								
								// Refresh added as a hack, because some problems with input fields for some reason ...
								
								init.list( data, function(){ init.refresh(); console.log( 'refresh ...' ); } );
							
								this.loaded[ 'permissions' ].push( init );
								
							}
							
							break;
							
					}
					
				}
				
			};
			
			// TODO: Add scopes to refresh ...
			
			func.applications();
			
			if( perm )
			{
				for( var a in perm )
				{
					if( perm[a] && perm[a].AppPermissions && perm[a].Name && role.Permissions && role.Permissions[perm[a].Name] )
					{
						// TODO: Add scopes to refresh ...
						
						func.permissions( 'init', perm[a] );
					}
				}
				
				//func.permissions( 'init' );
			}
			
		}
		
		// Run onload functions ....
			
		onLoad();
		
		
		
		// Responsive framework
		Friend.responsive.pageActive = ge( 'RoleDetails' );
		Friend.responsive.reinit();
	}
	d.load();
}

//function checkRoleSelect( key, _this )
//{
//	if( !_this.value || ( _this.value && _this.value.toLowerCase().indexOf( 'workgroup' ) >= 0 && _this.value.toLowerCase().indexOf( 'global' ) <= 0 ) )
//	{
//		ge( 'RoleWorkgroupList_'  + key ).setAttribute( 'style', 'display:inline' );
//		ge( 'RoleParameterInput_' + key ).setAttribute( 'style', 'display:none'   );
//	}
//	else
//	{
//		ge( 'RoleWorkgroupList_'  + key ).setAttribute( 'style', 'display:none'   );
//		ge( 'RoleParameterInput_' + key ).setAttribute( 'style', 'display:inline' );
//	}
//}

