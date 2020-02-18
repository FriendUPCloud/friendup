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

