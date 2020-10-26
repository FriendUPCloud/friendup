/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for friendrds users management

Sections.applications_friendrds_users = function( cmd, extra )
{

	switch( cmd )
	{
		
		case 'details':
			
			//loading( extra );
			
			break;
		
		case 'edit':
			
			if( extra )
			{
				edit( extra );
			}
			
			break;
		
		case 'create':
			
			create();
			
			break;
		
		case 'update':
			
			if( extra )
			{
				update( extra );
			}
			
			break;
		
		case 'remove':
			
			if( extra )
			{
				remove( extra );
			}
			
			break;
		
		case 'cancel':
			
			cancel();
			
			break;
		
		case 'refresh':
			
			refresh( extra );
			
			break;
		
		default:
			
			initMain();
			
			break;
		
	}
	
	// read --------------------------------------------------------------------------------------------------------- //
	
	function list( callback, obj, showall )
	{
		
		var args = {  
			count   : true, 
			authid  : Application.authId 
		};
		
		if( !showall )
		{
			args.query   = UsersSettings( 'searchquery' ); 
			args.sortby  = UsersSettings( 'sortby'      ); 
			args.orderby = UsersSettings( 'orderby'     ); 
			args.limit   = UsersSettings( 'limit'       );
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var users = null;
			
			if( e == 'ok' )
			{
				try
				{
					users = JSON.parse( d );
					
					if( users )
					{
						for( var k in users )
						{
							if( users[ k ].ID )
							{
								users[ k ].Avatar = '/system.library/module/?module=system&command=getavatar&userid=' + users[ k ].ID + ( users[ k ].Image ? '&image=' + users[ k ].Image : '' ) + '&width=30&height=30&authid=' + Application.authId;
							}
						}
					}
				}
				catch( e )
				{
					console.log( { e:e, d:d, args:args } );
				}
			}
			
			console.log( 'listUsers( callback, obj ) ', { e:e, d:(users?users:d), args:args } );
			
			if( callback )
			{
				return callback( e, users, obj );
			}
			
			return users;
		}
		m.execute( 'listusers', args );
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	// helper functions --------------------------------------------------------------------------------------------- //
	
	function appendChild( child )
	{
		if( child )
		{
			var out = [];
			
			for( var k in child )
			{
				if( child[k] )
				{
					if( child[k]['element'] )
					{
						var div = child[k]['element'];
						
						if( child[k]['child'] )
						{
							var elem = appendChild( child[k]['child'] );
							
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
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	
	
	var func = {
					
		userids : function ( users )
		{
			// TODO: Look at this ...
			
			var ids = {};
			
			if( users )
			{
				for( var a in users )
				{
					if( users[a] && users[a].id )
					{
						ids[ users[a].id ] = true;
					}
				}
			}
			
			return ids;
			
		}( [] ),
		
		updateids : function ( mode, key, value )
		{
			
			switch( mode )
			{
				
				// TODO: Check this ...
				
				case 'users':
					
					if( key )
					{
						this.userids[ key ] = value;
					}
					
					if( ge( 'WorkgroupUsers' ) )
					{
						if( this.userids )
						{
							var arr = [];
							
							for( var a in this.userids )
							{
								if( this.userids[a] )
								{
									arr.push( a );
								}
							}
							
							ge( 'WorkgroupUsers' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
						}
					}
					
					break;
					
			}
			
		},
		
		mode : { users : 'list' },
		
		// Users --------------------------------------------------------------------------------------------
		
		users : function ( func, users, options )
		{
			
			// Editing Users
			
			var init =
			{
				
				func : this,
				
				ids  : this.userids,
				
				head : function ( hidecol )
				{
					
					if( ge( 'AdminUsersContainer' ) )
					{
						var inp = ge( 'AdminUsersContainer' ).getElementsByTagName( 'input' )[0];
						inp.value = '';
					}
					
					if( ge( 'UsersSearchCancelBtn' ) && ge( 'UsersSearchCancelBtn' ).classList.contains( 'Open' ) )
					{
						ge( 'UsersSearchCancelBtn' ).classList.remove( 'Open' );
						ge( 'UsersSearchCancelBtn' ).classList.add( 'Closed' );
					}
					
					// TODO: Look at this ...
					
					var o = ge( 'UsersGui' ); if( o ) o.innerHTML = '<input type="hidden" id="WorkgroupUsers">';
					
					this.func.updateids( 'users' );
					
					if( ShowLog ) console.log( 'userids: ', this.ids );
					
					var divs = appendChild( [ 
						{ 
							'element' : function() 
							{
								var d = document.createElement( 'div' );
								//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
								d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
								return d;
							}(),
							'child' : 
							[ 
								{ 
									'element' : function( _this ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'PaddingSmall HContent40 FloatLeft';
										d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
										d.ele = this;
										d.onclick = function(  )
										{
											_this.sortusers( 'FullName' );
										};
										return d;
									}( this ) 
								}, 
								{ 
									'element' : function( _this ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'PaddingSmall HContent25 FloatLeft Relative';
										d.innerHTML = '<strong>' + i18n( 'i18n_username' ) + '</strong>';
										d.ele = this;
										d.onclick = function(  )
										{
											_this.sortusers( 'Name' );
										};
										return d;
									}( this )
								},
								{ 
									'element' : function( _this ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Relative';
										d.innerHTML = '<strong>' + i18n( 'i18n_status' ) + '</strong>';
										d.ele = this;
										d.onclick = function(  )
										{
											_this.sortusers( 'Status' );
										};
										return d;
									}( this )
								},
								{ 
									'element' : function() 
									{
										var d = document.createElement( 'div' );
										d.className = 'PaddingSmall HContent15 FloatLeft Relative';
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
								d.id = 'UsersInner';
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
				
				list : function ( users )
				{
					
					// TODO: Refresh and list only added users to workgroups because of server search ...
					
					if( users ) console.log( 'users list: ', users );
					
					var list = ( users ? users : list );
					
					var ii = 0;
					
					if( list )
					{
						this.head();
						
						var o = ge( 'UsersInner' ); if( o ) o.innerHTML = '';
						
						this.func.mode[ 'users' ] = 'list';
						
						for( var k in list )
						{
							if( list[k] && list[k].ID )
							{
								var found = false;
								
								if( this.ids && this.ids[ list[k].ID ] )
								{
									found = true;
								}
								
								if( !found/* || list[k].Status == 1*/ ) continue;
								
								var status = [ 'Active', 'Disabled', 'Locked' ];
								
								var divs = appendChild( [
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow ' + status[ ( list[k].Status ? list[k].Status : 0 ) ];
											d.id = ( 'UserListID_' + list[k].ID );
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'TextCenter PaddingSmall HContent10 FloatLeft Ellipsis';
													return d;
												}(),
												 'child' : 
												[ 
													{ 
														'element' : function() 
														{
															var d = document.createElement( 'span' );
															d.setAttribute( 'FullName', list[k].FullName );
															d.setAttribute( 'Name', list[k].Name );
															d.setAttribute( 'Status', status[ ( list[k].Status ? list[k].Status : 0 ) ] );
															//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
															d.className = 'IconSmall fa-user-circle-o avatar';
															d.style.position = 'relative';
															return d;
														}(), 
														 'child' : 
														[ 
															{
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	if( list[k].Avatar )
																	{
																		d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																		d.style.backgroundSize = 'contain';
																		d.style.backgroundPosition = 'center center';
																		d.style.backgroundRepeat = 'no-repeat';
																		d.style.position = 'absolute';
																		d.style.top = '0';
																		d.style.left = '0';
																		d.style.width = '100%';
																		d.style.height = '100%';
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
													d.className = 'PaddingSmall HContent30 FloatLeft Ellipsis';
													d.innerHTML = '<span>' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</span>';
													return d;
												}() 
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
													d.innerHTML = '<span>' + ( list[k].Name ? list[k].Name : '' ) + '</span>';
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Ellipsis';
													d.innerHTML = '<span>' + ( status[ ( list[k].Status ? list[k].Status : 0 ) ] ) + '</span>';
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
														'element' : function( ids, id, func ) 
														{
															if( Application.checkAppPermission( [ 
																'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
																'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
																'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
															] ) )
															{
																if( !options || !options['actions'] || options['actions']['list'] )
																{
																	if( options['actions']['list'] )
																	{
																		console.log( options['actions']['list'] );
																	}
																	else
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																
																			var pnt = this.parentNode.parentNode;
																	
																			// TODO: Look at this ...
																	
																			removeBtn( this, { ids: ids, id: id, func: func, pnt: pnt }, function ( args )
																			{
																	
																				if( ShowLog ) console.log( 'removeUser( '+args.id+', '+info.ID+', callback, vars )' );
																	
																				removeUser( args.id, info.ID, function( e, d, vars )
																				{
																		
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, false );
																			
																						if( vars.pnt )
																						{
																							vars.pnt.innerHTML = '';
																						}
																				
																						if( ge( 'AdminUsersCount' ) )
																						{
																							if( ge( 'AdminUsersCount' ).innerHTML )
																							{
																								var count = ge( 'AdminUsersCount' ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
																						
																								if( count && count > 0 )
																								{
																									var result = ( count - 1 );
				
																									if( result >= 0 )
																									{
																										ge( 'AdminUsersCount' ).innerHTML = '(' + result + ')';
																									}
																								}
																							}
																						}
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																		
																				}, { uid: args.id, func: func, pnt: pnt } );
																	
																			} );
																
																		};
																		return b;
																	}
																}
															}
														}( this.ids, list[k].ID, this.func ) 
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
								
								ii++;
							}
						
						}
						
					}
					
					if( ge( 'AdminUsersCount' ) )
					{
						ge( 'AdminUsersCount' ).innerHTML = '(' + ii + ')';
					}
					
					if( ge( 'AdminUsersContainer' ) )
					{
						var inp = ge( 'AdminUsersContainer' ).getElementsByTagName( 'input' )[0];
						inp.onkeyup = function( e )
						{
							init.searchusers( this.value );
						}
					}
					if( ge( 'UsersSearchCancelBtn' ) )
					{
						ge( 'UsersSearchCancelBtn' ).onclick = function( e )
						{
							init.searchusers( false );
							inp.value = '';
						}
					}
						
				},
				
				edit : function ( users )
				{
					
					// TODO: Make support for populating the users list based on new server data on the go, like on users main ...
					
					if( users ) console.log( 'users edit: ', users );
					
					var list = ( users ? users : list );
					
					if( list )
					{
						
						// TODO: Find a way to only list head if not listed before, don't add multiple times, because of server search feature ...
						
						this.head();
						
						var o = ge( 'UsersInner' ); if( this.func.mode[ 'users' ] != 'edit' ) o.innerHTML = '';
						
						this.func.mode[ 'users' ] = 'edit';
						
						for( var k in list )
						{
							if( list[k] && list[k].ID )
							{
								if( !ge( 'UserListID_' + list[k].ID ) )
								{
									
									var toggle = false;
								
									if( this.ids && this.ids[ list[k].ID ] )
									{
										toggle = true;
									}
								
									//if( list[k].Status == 1 ) continue;
								
									var status = [ 'Active', 'Disabled', 'Locked' ];
								
									var divs = appendChild( [
										{ 
											'element' : function() 
											{
												var d = document.createElement( 'div' );
												d.className = 'HRow ' + status[ ( list[k].Status ? list[k].Status : 0 ) ];
												d.id = ( 'UserListID_' + list[k].ID );
												return d;
											}(),
											'child' : 
											[ 
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'TextCenter PaddingSmall HContent10 FloatLeft Ellipsis';
														return d;;
													}(),
													 'child' : 
													[ 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'span' );
																d.setAttribute( 'FullName', list[k].FullName );
																d.setAttribute( 'Name', list[k].Name );
																d.setAttribute( 'Status', status[ ( list[k].Status ? list[k].Status : 0 ) ] );
																//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
																d.className = 'IconSmall fa-user-circle-o avatar';
																d.style.position = 'relative';
																return d;
															}(), 
															 'child' : 
															[ 
																{
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		if( list[k].Avatar )
																		{
																			d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																			d.style.backgroundSize = 'contain';
																			d.style.backgroundPosition = 'center center';
																			d.style.backgroundRepeat = 'no-repeat';
																			d.style.position = 'absolute';
																			d.style.top = '0';
																			d.style.left = '0';
																			d.style.width = '100%';
																			d.style.height = '100%';
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
														d.className = 'PaddingSmall HContent30 FloatLeft Ellipsis';
														d.innerHTML = '<span>' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</span>';
														return d;
													}() 
												}, 
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
														d.innerHTML = '<span>' + ( list[k].Name ? list[k].Name : '' ) + '</span>';
														return d;
													}() 
												},
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Ellipsis';
														d.innerHTML = '<span>' + ( status[ ( list[k].Status ? list[k].Status : 0 ) ] ) + '</span>';
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
															'element' : function( ids, id, func ) 
															{
																if( !options || !options['actions'] || options['actions']['edit'] )
																{
																	if( options['actions']['edit'] )
																	{
																		console.log( options['actions']['edit'] );
																	}
																	else
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																
																			// TODO: Look at this ...
																	
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																	
																				if( ShowLog ) console.log( 'addUser( '+id+', '+info.ID+', callback, vars )' );
																	
																				addUser( id, info.ID, function( e, d, vars )
																				{
																		
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, true );
																			
																						vars._this.classList.remove( 'fa-toggle-off' );
																						vars._this.classList.add( 'fa-toggle-on' );
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																		
																				}, { uid: id, func: func, _this: this } );
																	
																			}
																			else
																			{
																	
																				if( ShowLog ) console.log( 'removeUser( '+id+', '+info.ID+', callback, vars )' );
																	
																				removeUser( id, info.ID, function( e, d, vars )
																				{
																		
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, false );
																			
																						vars._this.classList.remove( 'fa-toggle-on' );
																						vars._this.classList.add( 'fa-toggle-off' );
																				
																						if( ge( 'AdminUsersCount' ) )
																						{
																							if( ge( 'AdminUsersCount' ).innerHTML )
																							{
																								var count = ge( 'AdminUsersCount' ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
																						
																								if( count && count > 0 )
																								{
																									var result = ( count - 1 );
				
																									if( result >= 0 )
																									{
																										ge( 'AdminUsersCount' ).innerHTML = '(' + result + ')';
																									}
																								}
																							}
																						}
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																		
																				}, { uid: id, func: func, _this: this } );
																	
																			}
																		};
																		return b;
																	}
																}
															}( this.ids, list[k].ID, this.func ) 
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
								else
								{
									// Add to the field that is allready there ... But we also gotto consider sorting the list by default or defined sorting ...
									
									
								}
								
							}
						
						}
						
					}
					
					if( ge( 'AdminUsersCount' ) )
					{
						ge( 'AdminUsersCount' ).innerHTML = ( list && list.Count ? '(' + list.Count + ')' : '(0)' );
					}
					
					// TODO: No need to keep adding every time ...
					
					var inp = ge( 'AdminUsersContainer' ).getElementsByTagName( 'input' )[0];
					inp.onkeyup = function( e )
					{
						init.searchusers( this.value, true );
					}
					ge( 'UsersSearchCancelBtn' ).onclick = function( e )
					{
						init.searchusers( false );
						inp.value = '';
					}
					
				},
				
				searchusers : function ( filter, server )
				{
					
					if( !filter )
					{
						UsersSettings( 'searchquery', filter );
					}
					
					if( ge( 'UsersInner' ) )
					{
						var list = ge( 'UsersInner' ).getElementsByTagName( 'div' );

						if( list.length > 0 )
						{
							for( var a = 0; a < list.length; a++ )
							{
								if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;

								var span = list[a].getElementsByTagName( 'span' )[0];

								if( span )
								{
									var param = [
										( " " + span.getAttribute( 'fullname' ).toLowerCase() + " " ), 
										( " " + span.getAttribute( 'name' ).toLowerCase() + " " )
									];
									
									if( !filter || filter == ''  
									|| span.getAttribute( 'fullname' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									)
									{
										list[a].style.display = '';
	
										var div = list[a].getElementsByTagName( 'div' );
	
										if( div.length )
										{
											for( var i in div )
											{
												if( div[i] && div[i].className && ( div[i].className.indexOf( 'fullname' ) >= 0 || div[i].className.indexOf( 'name' ) >= 0 ) )
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
						
						if( ge( 'UsersSearchCancelBtn' ) )
						{
							if( !filter && ( ge( 'UsersSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'UsersSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'UsersSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'UsersSearchCancelBtn' ).classList.add( 'Closed' );
							}
							
							else if( filter != '' && ( ge( 'UsersSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'UsersSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'UsersSearchCancelBtn' ).classList.remove( 'Closed' );
								ge( 'UsersSearchCancelBtn' ).classList.add( 'Open' );
							}
						}
					}
					
					if( filter.length < 3 || filter.length < UsersSettings( 'searchquery' ).length || filter == UsersSettings( 'searchquery' ) || !server ) return;
					
					UsersSettings( 'reset', true );
					
					UsersSettings( 'searchquery', filter );
					
					console.log( 'try getting server data ... ', { filter:filter, searchquery:UsersSettings( 'searchquery' ) } );
					
					
					
					//console.log( filter + ' < ' + UsersSettings( 'searchquery' ) );

					if( filter.length < UsersSettings( 'searchquery' ).length )
					{
						return;
					}
					
					listUsers( function( res, users )
					{
						
						console.log( 'search users ', users );
						
						// TODO: Finish before implementing
						
						//init.refresh( users );
						
					} );
					
				},
				
				sortusers : function ( sortby )
				{

					//

					var _this = ge( 'UsersInner' );

					if( _this )
					{
						var orderby = ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' );

						var list = _this.getElementsByTagName( 'div' );

						if( list.length > 0 )
						{
							var output = [];
							
							var custom = { 
								'Status' : { 
									'ASC'  : { 'locked' : 0, 'active' : 1, 'disabled' : 2 }, 
									'DESC' : { 'locked' : 0, 'disabled' : 1, 'active' : 2 } 
								},
								'LoginTime' : 'timestamp' 
							};
							
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
								
								if( !override && orderby == 'DESC' ) 
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
				
				refresh : function ( users )
				{
					
					switch( this.func.mode[ 'users' ] )
					{
						
						case 'list':
							
							this.list( users );
							
							break;
							
						case 'edit':
							
							this.edit( users );
							
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
					
					init.list( users );
					
					break;
					
				case 'edit':
					
					// TODO: Add init stuff ...
					
					init.edit( users );
					
					break;
					
				case 'refresh':
					
					init.refresh( users );
					
					break;
				
				default:
					
					// TODO: Look at this ...
					
					//if( !options || !options['actions'] || options['actions']['add'] )
					
					var etn = ge( 'UsersEdit' );
					if( etn )
					{
						if( Application.checkAppPermission( [ 
							'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
							'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
							'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
						] ) )
						{
							etn.onclick = function( e )
							{
					
								init.edit( users );
					
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
			
					var btn = ge( 'UsersEditBack' );
					if( btn )
					{
						btn.onclick = function( e )
						{
					
							init.list( users );
					
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
					
					// Show listed users ... 
					
					init.list( users );
					
					break;
					
			}
			
		}
		
		// Other funcs ...
		
	};
	
	
	
	function initMain()
	{
		console.log( 'initMain()' );
		
		var checkedGlobal = Application.checkAppPermission( 'PERM_FRIENDRDS_GLOBAL' );
		var checkedWorkgr = Application.checkAppPermission( 'PERM_FRIENDRDS_WORKGROUP' );
		
		if( checkedGlobal || checkedWorkgr )
		{
			
			var str = '';
			
			// TODO: Add hamburger menu ...
			
			str += '<div id="AdminUsersContainer">';
			str += '	<div class="HRow BackgroundNegative Negative Padding">';
			str += '		<div class="PaddingSmall HContent40 FloatLeft">';
			str += '			<button class="IconButton IconSmall ButtonSmall Negative FloatLeft fa-arrow-circle-left Closed" id="UsersEditBack"></button>';
			str += '			<h3 class="NoMargin FloatLeft">';
			str += '				<strong>' + i18n( 'i18n_users' ) + ' </strong>';
			str += '				<span id="AdminUsersCount">(0)</span>';
			str += '			</h3>';
			str += '		</div>';
			str += '		<div class="PaddingSmall HContent45 FloatLeft Relative">';
			str += '			<button class="IconButton IconSmall ButtonSmall fa-times-circle Closed" style="position:absolute;right:0;margin-top:-2px;margin-right:-2px;" id="UsersSearchCancelBtn"></button>';
			str += '			<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_search' ) + '" style="padding-right:21px">';
			str += '		</div>';
			str += '		<div class="PaddingSmall HContent15 FloatLeft Relative">';
			str += '			<button class="IconButton IconSmall ButtonSmall Negative FloatRight fa-plus-circle Open" id="UsersEdit"></button>';
			str += '		</div>';
			str += '	</div>';
			str += '	<div id="UsersGui"></div>';
			str += '</div>';
			
			var o = ge( 'FriendRDSUsersList' ); if( o ) o.innerHTML = str;
			
			// Get the user list
			list( function( res, dat )
			{
				//console.log( { e:res, d:dat } );
				
				// TODO: Send in functions for adding, editing, deleting users ... and also column listings ...
				
				func.users( 'edit', dat, { 
					'columns' : [ 'FullName', 'Name', 'Status', 'LoginTime' ], 
					'actions' : { 
						'add'  : false, 
						'list' : false, 
						'edit' : 'editUsers' 
					}
				} );
				
				
				
				Friend.responsive.pageActive = ge( 'FriendRDSUsersList' );
				Friend.responsive.reinit();
				
			} );
			
		}
		else
		{
			var o = ge( 'FriendRDSUsersList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
		}
		
	}
	
	
};

