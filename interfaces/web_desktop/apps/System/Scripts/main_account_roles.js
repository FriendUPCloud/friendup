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
			var info = {};
			
			// Go through all data gathering until stop
			var loadingSlot = 0;
			
			var loadingList = [
				
				// Load roleinfo
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						console.log( 'userroleget', { e:e, d:d } );
						info.role = null;
						if( e != 'ok' ) return;
						
						try
						{
							info.role = JSON.parse( d );
						}
						catch( e )
						{
							return;
						}
						
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'userroleget', { id: extra, authid: Application.authId } );
				},
				
				// Load system permissions
				function()
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						console.log( 'getsystempermissions', { e:e, d:d } );
						info.permission = null;
						if( e != 'ok' ) return;
						
						try
						{
							info.permission = JSON.parse( d );
						}
						catch( e ) 
						{
							return;
						}
						loadingList[ ++loadingSlot ]( info );
					}
					m.execute( 'getsystempermissions', { authid: Application.authId } );
				},
				
				/*// Load workgroups
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						console.log( 'workgroups', { e:e, d:d } );
						info.workgroups = null;
						//if( e != 'ok' ) return;
						
						try
						{
							info.workgroups = JSON.parse( d );
						}
						catch( e )
						{
							return;
						}
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'workgroups', { authid: Application.authId } );
				},*/
				
				// Then, finally, show role details
				function( info )
				{
					if( typeof info.role == 'undefined' && typeof info.permission == 'undefined'/* && typeof info.workgroups == 'undefined'*/ ) return;
					
					initRoleDetails( info );
				}
				
			];
			
			loadingList[ 0 ]();
			
			
			return;
		}
	}
	
	
	
	// Get the user list -------------------------------------------------------
		
	if( Application.checkAppPermission( 'ROLE_READ' ) )
	{
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			let roles = null;
			
			try
			{
				roles = JSON.parse( d );
			}
			catch( e ) {  }
			
			var o = ge( 'RoleList' ); if( o ) o.innerHTML = '';
			
			var divs = appendChild( [ 
				{
					'element' : function() 
					{
						var d = document.createElement( 'div' );
						d.className = 'OverflowHidden BorderRadius Elevated';
						d.id = 'AdminRoleContainer';
						return d;
					}(),
					'child' : 
					[ 
						{ 
							'element' : function(  ) 
							{
								var d = document.createElement( 'div' );
								d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight';
								return d;
							}(), 
							'child' : 
							[ 
								{
									'element' : function(  ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'HContent30 InputHeight FloatLeft';
										return d;
									}(),
									'child' : 
									[ 
										{
											'element' : function(  ) 
											{
												var b = document.createElement( 'button' );
												b.id = 'RoleEditBack';
												b.className = 'IconButton IconMedium ButtonSmall Negative FloatLeft fa-arrow-circle-left Closed';
												return b;
											}()
										},
										{
											'element' : function(  ) 
											{
												var h = document.createElement( 'h3' );
												h.className = 'NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft';
												h.innerHTML = '<strong>' + i18n( 'i18n_roles' ) + ' </strong><span id="AdminRoleCount">(' + ( roles ? roles.length : '0' ) + ')</span>';
												return h;
											}()
										}
									]
								},
								{
									'element' : function(  ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'PaddingSmall HContent60 FloatLeft Relative';
										return d;
									}(),
									'child' : 
									[ 
										{
											'element' : function(  ) 
											{
												var b = document.createElement( 'button' );
												b.id = 'RoleSearchCancelBtn';
												b.className = 'IconButton IconSmall ButtonSmall fa-times-circle Closed';
												b.style = 'position:absolute;right:0;margin-top:-2px;';
												b.onclick = function(  )
												{
													searchtemplates( false );
													var inp = ge( 'AdminRoleContainer' ).getElementsByTagName( 'input' )[0];
													inp.value = '';
												}
												return b;
											}()
										},
										{
											'element' : function(  ) 
											{
												var i = document.createElement( 'input' );
												i.type = 'text';
												i.className = 'FullWidth';
												i.placeholder = i18n( 'i18n_search' );
												i.style = 'padding-right:21px';
												i.onkeyup = function(  )
												{
													searchroles( this.value );
												}
												return i;
											}()
										}
									]
								},
								{
									'element' : function(  ) 
									{
										var d = document.createElement( 'div' );
										d.className = 'HContent10 FloatLeft Relative';
										return d;
									}(),
									'child' : 
									[ 
										{
											'element' : function(  ) 
											{
												if( Application.checkAppPermission( 'ROLE_CREATE' ) )
												{
													var b = document.createElement( 'button' );
													b.className = 'IconButton IconMedium ButtonSmall Negative FloatRight fa-plus-circle Open';
													b.onclick = function()
													{
														edit(  );
													};
													return b;
												}
											}()
										}
									]
								}
							]
						},
						{
							'element' : function(  ) 
							{
								var d = document.createElement( 'div' );
								d.className = 'List';
								d.id = 'RoleGui';
								return d;
							}(),
							'child' : 
							[
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
											'element' : function(  ) 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
												d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
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
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
												d.innerHTML = '<strong></strong>';
												return d;
											}( this )
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
										d.className = 'List HRow PaddingTop PaddingBottom';
										d.id = 'RoleInner';
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
					if( divs[i] )
					{
						o.appendChild( divs[i] );
					}
				}
			}
			
			var list = ge( 'RoleInner' ); if( list ) list.innerHTML = '';
			
			if( roles )
			{
				
				// TODO: List workgroups ParentID = 0 and then the roles below ...
				
				for( var k in roles )
				{
					
					if( roles[k] && roles[k].ID && roles[k].Name )
					{
						
						var divs = appendChild( [ 
							{
								'element' : function()
								{
									var d = document.createElement( 'div' );
									d.className = 'HRow';
									d.id = 'RoleID_' + roles[k].ID;
									d.roleid = roles[k].ID;
									
									if( Application.checkAppPermission( 'ROLE_READ' ) )
									{
										d.onclick = function()
										{
											Sections.accounts_roles( 'edit', this.roleid );
											//edit( this.roleid, this );
										};
									}
									
									return d;
								}(),
								'child' : 
								[
									{
										'element' : function()
										{
											var d = document.createElement( 'div' );
											d.className = 'TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis';
											d.innerHTML = '<span name="' + roles[k].Name + '" class="IconMedium fa-user-circle-o"></span>';
											return d;
										}()
									},
									{
										'element' : function()
										{
											var d = document.createElement( 'div' );
											d.className = 'HContent80 InputHeight FloatLeft PaddingSmall Ellipsis';
											d.innerHTML = roles[k].Name;
											return d;
										}()
									},
									{
										'element' : function()
										{
											var d = document.createElement( 'div' );
											d.className = 'HContent10 InputHeight FloatLeft PaddingSmall';
											return d;
										}()
									}
								]
							}
						] );
						
						if( divs )
						{
							for( var i in divs )
							{
								if( divs[i] )
								{
									list.appendChild( divs[i] );
								}
							}
						}
					}
					
				}
				
			}
			
			// Search ...............
			
			var searchroles = function ( filter, server )
			{
				
				if( ge( 'RoleInner' ) )
				{
					var list = ge( 'RoleInner' ).getElementsByTagName( 'div' );
					
					if( list.length > 0 )
					{
						for( var a = 0; a < list.length; a++ )
						{
							if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
							
							var span = list[a].getElementsByTagName( 'span' )[0];
							
							if( span )
							{
								
								if( !filter || filter == '' 
								|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
								)
								{
									list[a].style.display = '';
									
									if( list[a].parentNode && list[a].parentNode.parentNode && list[a].parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
									{
										list[a].style.display = '';
										list[a].parentNode.style.display = '';
									}
								}
								else if( list[a] && list[a].className )
								{
									list[a].style.display = 'none';
								}
							}
						}

					}
					
					if( ge( 'RoleSearchCancelBtn' ) )
					{
						if( !filter && ( ge( 'RoleSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RoleSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
						{
							ge( 'RoleSearchCancelBtn' ).classList.remove( 'Open' );
							ge( 'RoleSearchCancelBtn' ).classList.add( 'Closed' );
							
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
						
						else if( filter != '' && ( ge( 'RoleSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RoleSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
						{
							ge( 'RoleSearchCancelBtn' ).classList.remove( 'Closed' );
							ge( 'RoleSearchCancelBtn' ).classList.add( 'Open' );
						}
					}
				}
				
			};
			
			// Sort .............
			
			var sortroles = function ( sortby, orderby )
			{
				
				//
				
				var _this = ge( 'RoleInner' );
				
				if( _this )
				{
					orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
					
					var list = _this.getElementsByTagName( 'div' )[0].getElementsByTagName( 'div' );
					
					if( list.length > 0 )
					{
						var output = [];
						
						var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
						
						for( var a = 0; a < list.length; a++ )
						{
							if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
							
							var span = list[a].getElementsByTagName( 'span' )[0];
							
							if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' && span.getAttribute( sortby.toLowerCase() ) )
							{
								// TODO: Fix this ...
								
								//console.log( list[a] );
								
								if( !list[a].className )
								{
									var obj = { 
										sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
										content : list[a]
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
			
			sortroles( 'Name', 'ASC' );
			
			// --- Old code below --- //
			
			/*// Types of listed fields
			var types = {
				Edit: '10',
				Name: '80'
			};
		
		
			// List by level
			var levels = [ 'User' ];
		
		
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = i18n( 'i18n_roles' );
			o.appendChild( h2 );
		
			// List headers
			var header = document.createElement( 'div' );
			header.className = 'List';
			var headRow = document.createElement( 'div' );
			headRow.className = 'HRow BackgroundNegativeAlt Negative PaddingTop PaddingBottom';
			for( var z in types )
			{
				var borders = '';
				var d = document.createElement( 'div' );
				if( z != 'Edit' )
					//borders += ' BorderRight';
				if( a < roleList.length - a )
					borders += ' BorderBottom';
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmallLeft PaddingSmallRight HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
				if( z == 'Edit' ) z = '&nbsp;';
				d.innerHTML = '<strong' + ( z != '&nbsp;' ? '' : '' ) + '>' + ( z != '&nbsp;' ? i18n( 'i18n_header_role_' + z ) : '&nbsp;' ) + '</strong>';
				headRow.appendChild( d );
			}
		
			if( Application.checkAppPermission( 'ROLE_CREATE' ) )
			{
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
			
				d.innerHTML = '<button type="button" class="FullWidth IconSmall fa-plus NoBorders NoPadding IconButton Negative"> </button>';
			
				//d.innerHTML = '<button class="IconButton IconSmall ButtonSmall fa-plus-circle"></button>';
		
				d.onclick = function(){ Sections.userroleadd( 'Unnamed role' ) };
				headRow.appendChild( d );
			}
		
			header.appendChild( headRow );
			o.appendChild( header );
			
			function setROnclick( r, uid )
			{
				if( Application.checkAppPermission( 'ROLE_READ' ) )
				{
					r.onclick = function()
					{
						Sections.accounts_roles( 'edit', uid );
					}
				}
			}
		
			// List out roles
		
			var list = document.createElement( 'div' );
			list.className = 'List';
			var sw = 2;
			for( var b = 0; b < levels.length; b++ )
			{
				if( roleList )
				{
					for( var a = 0; a < roleList.length; a++ )
					{
						sw = sw == 2 ? 1 : 2;
						var r = document.createElement( 'div' );
						setROnclick( r, roleList[ a ].ID );
						r.className = 'HRow ';
			
						var icon = '<span class="IconSmall fa-user"></span>';
						roleList[ a ][ 'Edit' ] = icon;
				
						for( var z in types )
						{
							var borders = '';
							var d = document.createElement( 'div' );
							if( z != 'Edit' )
							{
								d.className = '';
								//borders += ' BorderRight';
							}
							else d.className = 'TextCenter';
							//if( a < roleList.length - a )
							//	borders += ' BorderBottom';
							d.className += ' HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft PaddingSmall Ellipsis' + borders;
							d.innerHTML = ( roleList[a][ z ] ? roleList[a][ z ] : '-' );
							r.appendChild( d );
						}
			
						// Add row
						list.appendChild( r );
					}
				}
			}
		
			o.appendChild( list );*/
		
			Friend.responsive.pageActive = ge( 'RoleList' );
			Friend.responsive.reinit();
		}
		m.execute( 'userroleget', { authid: Application.authId } );
		
	}
	else
	{
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		var h2 = document.createElement( 'h2' );
		h2.innerHTML = '{i18n_permission_denied}';
		o.appendChild( h2 );
	}
	
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
		if( ( i == 0 && !Application.checkAppPermission( 'ROLE_UPDATE' ) ) || ( i == 1 && !Application.checkAppPermission( 'ROLE_DELETE' ) ) )
		{
			continue;
		}
		
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
			//console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleadd', { name: input, authid: Application.authId } );
	}
};

Sections.userroledelete = function( rid )
{
	if( rid )
	{
		Confirm( i18n( 'i18n_deleting_role' ), i18n( 'i18n_deleting_role_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					console.log( { e:e, d:d, args: { id: rid, authid: Application.authId } } );
			
					ge( 'RoleDetails' ).innerHTML = '';
			
					// refresh
					Sections.accounts_roles();
				}
				m.execute( 'userroledelete', { id: rid, authid: Application.authId } );
			}
		} );
	}
};

Sections.userroleupdate = function( rid, input, perms, refresh )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
			
			// refresh details also ...
			if( refresh )
			{
				Sections.accounts_roles( 'edit', rid );
			}
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ), authid: Application.authId } );
	}
};

Sections.removepermission = function( rid, pem, key, data, _this )
{
	if( rid && pem && key && _this )
	{
		var perms = [ { command: 'delete', name: pem, key: key, data: data } ];
		
		Confirm( i18n( 'i18n_deleting_permission' ), i18n( 'i18n_deleting_permission_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				Sections.userroleupdate( rid, null, perms, true );
			}
			
		} );
	}
};

Sections.addpermission = function( rid, key, _this )
{
	var pem  = ge( 'RolePermissionList_' + key ).value;
	
	if( ge( 'RoleParameterInput_' + key ) && ge( 'RoleParameterInput_' + key ).style.display != 'none' )
	{
		var data = ge( 'RoleParameterInput_' + key ).value;
	}
	else
	{
		var data = ge( 'RoleWorkgroupList_' + key ).value;
	}
	
	if( rid && key && pem && _this )
	{
		var perms = [ { name: pem, key: key, data: data } ];
		
		Sections.userroleupdate( rid, null, perms, true );
	}
};

Sections.updatepermission = function( rid, pem, key, data, _this )
{
	if( _this )
	{
		Toggle( _this, function( on )
		{
			data = ( on ? 'Activated' : '' );
		} );
	}
	
	if( rid && pem && key )
	{
		var perms = [ { name : pem, key : key, data : data } ];
		
		Sections.userroleupdate( rid, null, perms );
	}
};

Sections.togglepermission = function( rid, pem, key, _this )
{
	//if( _this )
	//{
	//	Toggle( _this, function( on )
	//	{
	//		data = ( on ? 'Activated' : '' );
	//	} );
	//}
	
	if( rid && pem && key && _this )
	{
		if( !_this.checked )
		{
			var perms = [ { command: 'delete', name: pem, key: key } ];
		}
		else
		{
			var perms = [ { name: pem, key: key } ];
		}
		
		console.log( 'Sections.togglepermission', { rid: rid, perms: perms, _this: _this } );
		
		Sections.userroleupdate( rid, null, perms );
	}
};

Sections.checkpermission = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input, authid: Application.authId } );
	}
};



