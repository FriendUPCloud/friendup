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
				
				//System
				//Modules
				//Apps
				
				var data = info.permission;
				var wgroups = info.workgroups;
				
				console.log( data );
				
				if( data )
				{
					var perm = data;
					
					if( info.role.Permissions )
					{
						var roleperm = info.role.Permissions;
						
						console.log( roleperm );
						
						for( var i in perm )
						{
							for( var ii in perm[i].AppPermissions )
							{
								for( var r in roleperm )
								{
									if( roleperm[r].Key && roleperm[r].Key == perm[i].Name )
									{
										
										if( typeof perm[i].AppPermissions[ii] == "string" )
										{
											if( perm[i].AppPermissions[ii].split( 'App ' )[1] )
											{
												if( roleperm[r].Permission == perm[i].AppPermissions[ii].split( 'App ' )[1].trim() )
												{
													//console.log( perm[i] );
													console.log( roleperm[r] );
													
													perm[i].AppPermissions[ii] = {
														id          : perm[i].AppPermissions[ii].split( 'App ' )[1].trim(), 
														parameter   : "", 
														description : "", 
														data        : roleperm[r].Data
													};
													
													console.log( '[1]', perm[i].AppPermissions[ii] );
													
													// New method ----
													
													if( !perm[i].RolePermissions )
													{
														perm[i].RolePermissions = {};
													}
													
													if( !perm[i].RolePermissions[ roleperm[r].ID ] )
													{
														perm[i].RolePermissions[ roleperm[r].ID ] = {
															id          : perm[i].AppPermissions[ii].split( 'App ' )[1].trim(), 
															parameter   : "", 
															description : "", 
															data        : roleperm[r].Data
														};
													}
												}
												
											}
										}
										else if( typeof perm[i].AppPermissions[ii] == "object" )
										{
											if( perm[i].AppPermissions[ii].id )
											{
												if( roleperm[r].Permission == perm[i].AppPermissions[ii].id )
												{
													if( typeof perm[i].AppPermissions[ii].data == "undefined" )
													{
														//console.log( perm[i] );
														console.log( roleperm[r] );
													
														perm[i].AppPermissions[ii].data = roleperm[r].Data;
													
														console.log( '[2]', perm[i].AppPermissions[ii] );
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
															description : "", 
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
				
				console.log( perm );
				
				apl = '';
				
				if( perm )
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
								apl += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + ( 'i18n_' + obj.id ) + '</div>';
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
				
				if( perm )
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
											apl += '<div class="PaddingSmall">' + ( 'i18n_' + obj.id ) + '</div>';
										}
									}
							
									//apl += '</select></div>';
									apl += '</div>';
									//apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis"><select class="FullWidth">';
									apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis">';
								
									if( wgroups && wgroups.length )
									{
										//apl += '<option> - - - </option>';
										//apl += '<div class="PaddingSmall"> - - - </div>';
									
										for( var k in wgroups )
										{
											if( wgroups[k].ID == data )
											{
												apl += '<div class="PaddingSmall">' + wgroups[k].Name + '</div>';
											}
											//apl += '<option>' + wgroups[k].Name + '</option>';
										}
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
							apl += '<div class="PaddingSmall HContent55 FloatLeft Ellipsis"><select id="RolePermissionList_' + key + '" class="FullWidth">';
							
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
							apl += '<div class="PaddingSmall HContent35 FloatLeft Ellipsis"><select id="RoleWorkgroupList_' + key + '" class="FullWidth">';
							
							if( wgroups && wgroups.length )
							{
								apl += '<option value=""> - - - </option>';
								
								for( var k in wgroups )
								{
									apl += '<option value="' + wgroups[k].ID + '">' + wgroups[k].Name + '</option>';
								}
							}
							
							apl += '</select></div>';
							apl += '<div class="PaddingSmall HContent10 TextCenter FloatLeft Ellipsis">';
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
					
					// Responsive framework
					Friend.responsive.pageActive = ge( 'RoleDetails' );
					Friend.responsive.reinit();
				}
				d.load();
			}
			
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
					u.execute( 'userroleget', { id: extra } );
				},
				
				function()
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
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
					m.execute( 'getsystempermissions' );
				},
				
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
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
					u.execute( 'workgroups' );
				},
				
				function( info )
				{
					if( typeof info.role == 'undefined' && typeof info.permission == 'undefined' && typeof info.workgroups == 'undefined' ) return;
					
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
		
		//if( e != 'ok' ) return;
		var userList = null;
		try
		{
			userList = JSON.parse( d );
		}
		catch( e )
		{
			//return;
		}
		
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		// Types of listed fields
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
		
		//d.innerHTML = '<button class="IconButton IconSmall ButtonSmall fa-plus-circle"></button>';
		
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
			if( userList )
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

Sections.userroleupdate = function( rid, input, perms, refresh )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
			
			// refresh details also ...
			if( refresh )
			{
				Sections.accounts_roles( 'edit', rid );
			}
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ) } );
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
	var data = ge( 'RoleWorkgroupList_' + key ).value;
	
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
};



