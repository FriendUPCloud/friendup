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
				
				console.log( data );
				
				if( data )
				{
					var perm = data;
					
					if( info.role.Permissions )
					{
						var roleperm = info.role.Permissions;
						
						for( var i in perm )
						{
							for( var ii in perm[i].Permissions )
							{
								for( var r in roleperm )
								{
									if( roleperm[r].Key && roleperm[r].Key == perm[i].Name )
									{
										if( typeof perm[i].Permissions[ii] == "string" )
										{
											if( perm[i].Permissions[ii].split( 'App ' )[1] )
											{
												if( roleperm[r].Permission == perm[i].Permissions[ii].split( 'App ' )[1].trim() )
												{
													//console.log( perm[i] );
													console.log( roleperm[r] );
													
													perm[i].Permissions[ii] = {
														Permission  : perm[i].Permissions[ii].split( 'App ' )[1].trim(), 
														Name        : perm[i].Permissions[ii].split( 'App ' )[1].trim(), 
														Description : "", 
														Data        : roleperm[r].Data, 
														ID          : roleperm[r].ID 
													};
													
													console.log( '[1]', perm[i].Permissions[ii] );
												}
											}
										}
										else if( typeof perm[i].Permissions[ii] == "object" )
										{
											if( typeof perm[i].Permissions[ii].Data == "undefined" && perm[i].Permissions[ii].Name && perm[i].Permissions[ii].Permission )
											{
												if( roleperm[r].Permission == perm[i].Permissions[ii].Permission )
												{
													//console.log( perm[i] );
													console.log( roleperm[r] );
													
													perm[i].Permissions[ii].Data = roleperm[r].Data;
												
													console.log( '[2]', perm[i].Permissions[ii] );
												}
											}
										}
										else
										{
											//console.log( perm[i].Permissions[ii] );
										}
									}
								}
							}
						}
					}
				}
				else
				{
					// Will be removed ... just for testing purposes ...
					
					/*var perm = [
						{ 
							app : "Users", name : "Users", description : "", permissions : [
								{ 
									permission : "USERS_READ", name : "Read", description : "", data: "Activated" 
								},
								{ 
									permission : "USERS_WRITE", name : "Write", description : "", data: "Activated" 
								},
								{ 
									permission : "USERS_DELETE", name : "Delete", description : "", data: "Activated" 
								}
							] 
						},
						{ 
							app : "Liberator", name : "Liberator", description : "", permissions : [
								{ 
									permission : "USERS_READ", name : "Read", description : "", data: "Activated" 
								},
								{ 
									permission : "USERS_WRITE", name : "Write", description : "", data: "Activated" 
								},
								{ 
									permission : "USERS_DELETE", name : "Delete", description : "", data: false 
								}
							] 
						},
						{ 
							app : "Server", name : "Server", description : "", permissions : [
								{ 
									permission : "USERS_READ", name : "Read", description : "", data: false 
								},
								{ 
									permission : "USERS_WRITE", name : "Write", description : "", data: false 
								},
								{ 
									permission : "USERS_DELETE", name : "Delete", description : "", data: false 
								}
							] 
						},
						{ 
							app : "Mimetypes", name : "Mimetypes", description : "", permissions : [
								{ 
									permission : "USERS_READ", name : "Read", description : "", data: false 
								},
								{ 
									permission : "USERS_WRITE", name : "Write", description : "", data: false 
								},
								{ 
									permission : "USERS_DELETE", name : "Delete", description : "", data: false 
								}
							] 
						}
					];*/
				}
				
				console.log( perm );
				
				apl = '';
				
				if( perm )
				{
					for( var a in perm )
					{
						if( perm[a].Permissions && perm[a].Name )
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
						
							for( var k in perm[a].Permissions )
							{
								if( typeof perm[a].Permissions[k] == "object" )
								{
									var obj = perm[a].Permissions[k];
								}
								else
								{
									if( !perm[a].Permissions[k].split( 'App ' )[1] )
									{
										continue;
									}
									
									var obj = {
										Permission  : perm[a].Permissions[k].split( 'App ' )[1].trim(), 
										Name        : perm[a].Permissions[k].split( 'App ' )[1].trim(), 
										Description : "", 
										Data        : ""
									};
								}
								
								sw = sw == 2 ? 1 : 2;
								
								var rid = info.role.ID;
								var pem = obj.Permission;
								var key = perm[a].Name;
								
								apl += '<div class="HRow">';
								apl += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + obj.Name + '</div>';
								apl += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
								apl += '<button onclick="Sections.updatepermission('+rid+',\''+pem+'\',\''+key+'\','+null+',this)" class="IconButton IconSmall ButtonSmall FloatRight' + ( obj.Data ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
								apl += '</div>';
								apl += '</div>';
							}
						
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
				
				function( info )
				{
					if( typeof info.role == 'undefined' && typeof info.permission == 'undefined' ) return;
					
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

//console.log( 'Sections.userroleadd =', Sections.userroleadd );
//console.log( 'Sections.userroledelete =', Sections.userroledelete );
//console.log( 'Sections.userroleupdate =', Sections.userroleupdate );
//console.log( 'Sections.accounts_roles =', Sections.accounts_roles );
//console.log( 'Sections.checkpermission =', Sections.checkpermission );

