<?php
/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

function CheckAppPermission( $key, $appName )
{
	global $SqlDatabase, $User, $level;
	
	if( $level == 'Admin' ) return true;
	
	$permissions = GetAppPermissions( $appName );
	
	if( isset( $permissions->{ $key } ) && $permissions->{ $key } )
	{
		return $permissions->{ $key };
	}
	
	return false;
}

/**
 * Get app permissions
 *
 * Gets the permissions for a specific application, optionally for a user other
 * than the user who is logged in by session id.
**/
function GetAppPermissions( $appName, $UserID = false )
{
	global $SqlDatabase, $User;
	
	if( !$appName ) return false;

	// Specific or session based userid?
	$UserID = ( $UserID ? $UserID : $User->ID );
	
	// Fetch permissions from user based on role relations
	if( $rows = $SqlDatabase->FetchObjects( $q = '
		SELECT 
			p.*, 
			ug.Name AS RoleName, 
			ug2.ID AS GroupID, 
			ug2.Type AS GroupType, 
			ug2.Name AS GroupName 
		FROM 
			FUserToGroup fug,
			FUserGroup ug, 
			FUserGroup ug2, 
			FUserRolePermission p 
		WHERE 
				fug.UserID = ' . $UserID . ' 
			AND 
			(
				(	
					ug.ID = fug.UserGroupID 
				)
				OR
				(
					ug.ID IN ( SELECT fgg.ToGroupID FROM FGroupToGroup fgg WHERE fgg.FromGroupID = fug.UserGroupID ) 
				) 
			)
			AND ug.Type = "Role" 
			AND ug2.ID = fug.UserGroupID 
			And p.RoleID = ug.ID 
			AND p.Key ' . ( strstr( $appName, '","' ) ? 'IN (' . $appName . ')' : '= "' . $appName . '"' ) . ' 
		ORDER BY 
			p.ID 
	' ) )
	{
		$found = false; 
		
		$wgs = new stdClass();
		$pem = new stdClass();
		
		// Fetch workgroups where user is a member
		if( $wgroups = $SqlDatabase->FetchObjects( $q2 = '
			SELECT 
				g.ID, g.Name, g.ParentID, g.UserID, u.UserID AS WorkgroupUserID 
			FROM 
				FUserGroup g, 
				FUserToGroup u 
			WHERE 
					g.Type = \'Workgroup\' 
				AND u.UserID = \'' . $UserID . '\' 
				AND u.UserGroupID = g.ID 
			ORDER BY 
				g.Name ASC 
		' ) )
		{
			// Link to wgs for quick lookups
			foreach( $wgroups as $wg )
			{
				$wgs->{ $wg->ID } = $wg;
			}
		}
		
		// Go through all roles and set permissions
		foreach( $rows as $v )
		{
			if( $v->Permission )
			{
				$found = true;
				
				// If this key is already set
				if( isset( $pem->{ $v->Permission } ) )
				{
					$pem->{ $v->Permission }[] = $v;
				}
				// Just set key with value
				else
				{
					$pem->{ $v->Permission } = array( $v );
				}
			}
		}
		
		if( $found )
		{
			return $pem;
		}
	}
	
	return false;
}

/**
 * Determine if the user may have access here through a role
 * This function allows abstract permission checks which may require the
 * system to test multiple permissions depending on object $type and permission
 * type. But it makes it much more elegant for developers who need to use the 
 * system in their own code.
**/
function CheckPermission( $type, $identifier, $permission = false )
{
	global $SqlDatabase;
	
	// Permission on user
	if( $type == 'user' )
	{	
		// Check if the user has global user's access
		if( $rpermTest = CheckAppPermission( 'PERM_USER_GLOBAL', 'Admin' ) )
		{
			return true;
		}
		// Check if the user has access to a user through workgroups
		else if( $rpermTest = CheckAppPermission( 'PERM_USER_WORKGROUP', 'Admin' ) )
		{
			// Create the correct SQL
			$workgroups = array();
			foreach( $rpermTest as $t )
			{
				if( isset( $t->Data ) )
				{
					$workgroups[] = $t->Data;
				}
			}
			if( $test = $SqlDatabase->FetchObject( '
				SELECT u.ID FROM 
					FUser u,
					FUserToGroup ug,
					FUserGroup g
				WHERE
					u.ID = \'' . $identifier . '\' AND
					ug.UserID = u.ID AND
					ug.UserGroupID = g.ID AND
					g.ID IN ( ' . implode( ',', $workgroups ) . ' )
			' ) )
			{
				return true;
			}
		}
	}
	return false;
}





function Permissions( $type, $context, $name, $data = false, $object = false, $objectid = 0, $listdetails = false )
{
	global $SqlDatabase, $User;	
	
	// Seems we only have two different specifications of permissions GLOBAL and WORKGROUP for now, but for example many different apps within the Admin app that needs to be more specified.
	
	// TODO: MAKE THIS FUNCTION SIMPLER AND FASTER ONCE TIME RESTRAINT IS LESS, BUT FOR NOW JUST COMPLETE IN ORDER TO MAKE IT WORK !!!!!
	
	// Get user level
	if( $level = $SqlDatabase->FetchObject( '
		SELECT g.Name FROM FUserGroup g, FUserToGroup ug
		WHERE
			g.Type = \'Level\' AND
			ug.UserID=\'' . $User->ID . '\' AND
			ug.UserGroupID = g.ID
	' ) )
	{
		$level = $level->Name;
	}
	else $level = 'User';
	
	$pem = new stdClass(); $arr = [];
	
	// If Permission data is set filter only the requested permissions.
	if( $data )
	{
		
		// Hackypatchy ...
		
		if( !isset( $data->permission ) && !is_object( $data ) )
		{
			$obj = new stdClass();
			$obj->permission = $data;
			
			$data = $obj;
		}
		
		$data->permission = ( is_string( $data->permission ) && strstr( $data->permission, '","' ) ? explode( ',', $data->permission ) : $data->permission );
		
		if( is_object( $data->permission ) || is_array( $data->permission ) )
		{
			foreach( $data->permission as $str )
			{
				$arr[$str] = true; 
				
				$pem->{ $str } = false;
			}
		}
		else if( is_string( $data->permission ) )
		{
			$arr[$data->permission] = true; 
			
			$pem->{ $data->permission } = false;
		}
		
	}
	
	$debug = new stdClass();
	$debug->type        = $type;
	$debug->context     = $context;
	$debug->name        = $name;
	$debug->data        = $data;
	$debug->object      = $object;
	$debug->objectid    = $objectid;
	$debug->listdetails = $listdetails;
	$debug->level       = $level;
	
	// authid method of getting the Application Name and checking if the user has access to it.
	 
	if( $name && strstr( $name, 'AUTHID' ) )
	{
		
		if( $app = $SqlDatabase->FetchObject( $q = '
			SELECT 
				a.*, u.UserID, u.Permissions, u.AuthID 
			FROM 
				FUserApplication u, FApplication a 
			WHERE 
				u.AuthID = "' . str_replace( 'AUTHID', '', $name ) . '" AND u.UserID = ' . $User->ID . ' AND a.ID = u.ApplicationID 
			ORDER BY a.ID DESC 
		' ) )
		{
			//
			
			$name = ''; $debug->name = '';
			
			if( $app->Name )
			{
				$name = $app->Name;
				
				$debug->name   = $app->Name;
				$debug->authid = $app->AuthID;
			}
		}
		else
		{
			$debug->name = '';
			
			$debug->authid = str_replace( 'AUTHID', '', $name );
			
			$out = new stdClass();
			$out->response = -1;
			$out->message = 'Permission denied.';
			$out->reason = 'Permission to use the App with this authid doesn\'t match ...';
			
			$out->debug = $debug;
			
			return $out;
		}
	}
	
	// TODO: If we need some data output for permissions we might have to move this further down, but more data will have to be specified first.
	
	if( $level == 'Admin' )
	{
		$out = new stdClass();
		$out->response = 1;
		$out->message = 'Permission granted.';
		$out->data = new stdClass();
		
		if( $data && $data->permission )
		{
			foreach( $pem as $k=>$v )
			{
				$pem->{ $k } = true;
			}
			
			$out->data->permissions = $pem;
		}
		
		$out->data->workgroups = '*';
		$out->data->users = '*';
		
		$out->debug = $debug;
		
		return $out;
	}
	
	
	
	// TODO: Create support for checking permissions based on what app the request was sent from, as fallback use an argument like authid, if not defined fallback to ignore permissions
	//if( !$authid ) return false;
	
	switch( $context )
	{
		
		// App Permission Handler ...
		
		case 'application':
			
			if( $name )
			{
				// TODO: Check if permissions are defined or not by using authid to identify the App name ... if permission is not defined return access granted ...
				
				if( !$rows = $SqlDatabase->FetchObject( $q = '
					SELECT p.* 
					FROM FUserRolePermission p 
					WHERE p.Key ' . ( strstr( $name, '","' ) ? 'IN (' . $name . ')' : '= "' . $name . '"' ) . ' 
					ORDER BY p.ID 
					LIMIT 1 
				' ) )
				{
					// Skip this rolepermission function ... for now.
					return false;
				}
				
				// Fetch permissions from user based on role relations
				if( $rows = $SqlDatabase->FetchObjects( $q = '
					SELECT 
						p.*, 
						ug.Name AS RoleName, 
						ug2.ID AS GroupID, 
						ug2.Type AS GroupType, 
						ug2.Name AS GroupName 
					FROM 
						FUserToGroup fug,
						FUserGroup ug, 
						FUserGroup ug2, 
						FUserRolePermission p 
					WHERE 
							fug.UserID = ' . $User->ID . ' 
						AND 
						(
							(	
								ug.ID = fug.UserGroupID 
							)
							OR
							(
								ug.ID IN ( SELECT fgg.ToGroupID FROM FGroupToGroup fgg WHERE fgg.FromGroupID = fug.UserGroupID ) 
							) 
						)
						AND ug.Type = "Role" 
						AND ug2.ID = fug.UserGroupID 
						And p.RoleID = ug.ID 
						AND p.Key ' . ( strstr( $name, '","' ) ? 'IN (' . $name . ')' : '= "' . $name . '"' ) . ' 
					ORDER BY 
						p.ID 
				' ) )
				{
					$found = false; 
					
					// TODO: Make support for hirarkial workgroups with many parentid levels ...
					
					$workgroups = []; $groupdetails = []; $userdetails = []; 
					
					// TODO: Have to look at this, it's to specific ...
					$sysadmin = [ 
						'USER_GLOBAL'      => false, 
						'WORKGROUP_GLOBAL' => false
					];
					
					// TODO: Are we missing the loggedin users own UserID and Workgroups in the list ???
					
					// Go through all roles and set permissions
					foreach( $rows as $v )
					{
						if( $v->Permission )
						{
							
							// If Permission listed doesn't match requested Permission skip to the next in the list. 
							if( $data && $data->permission && !isset( $arr[$v->Permission] ) )
							{
								continue;
							}
							
							// If this key is already set
							if( isset( $pem->{ $v->Permission } ) )
							{
								$pem->{ $v->Permission }[] = $v;
							}
							// Just set key with value
							else
							{
								$pem->{ $v->Permission } = array( $v );
							}
							
							// Workgroups that this User has access to ...
							
							if( strstr( $v->Permission, '_WORKGROUP' ) && $v->Data )
							{
								$workgroups[$v->Data] = $v->Data;
							}
							
							// If we find a global sett wildcard
							
							if( strstr( $v->Permission, '_WORKGROUP' ) && !$v->Data )
							{
								$sysadmin[ 'WORKGROUP_GLOBAL' ] = true;
							}
							else if( strstr( $v->Permission, '_GLOBAL' ) && !$v->Data )
							{
								$sysadmin[ 'USER_GLOBAL' ] = true;
							}
							
							$found = true;
						}
					}
					
					// UserID's that this User has access to ...
					
					if( $workgroups && is_array( $workgroups ) || $sysadmin[ 'WORKGROUP_GLOBAL' ] )
					{
						
						// TODO: Connect user or users to groups or group ...
						
						if( $rows = $SqlDatabase->FetchObjects( '
							SELECT g.* 
							FROM `FUserGroup` g 
							WHERE g.Type = "Workgroup" 
							' . ( $sysadmin[ 'WORKGROUP_GLOBAL' ] ? '' : '
							AND ( g.ID IN (' . implode( ',', $workgroups ) . ') OR g.ParentID IN (' . implode( ',', $workgroups ) . ') ) 
							' ) . '
							ORDER BY g.ID ASC 
						' ) )
						{
							foreach( $rows as $v )
							{
								$workgroups[$v->ID] = $v->ID;
								
								// Needed for pawel code ...
					
								if( $listdetails )
								{
									$gr = new stdClass;
								
									if( $object == 'workgroup' && $objectid )
									{
										if( $objectid == $v->ID )
										{
											$gr->groupid  = $v->ID;
											$gr->userid   = $v->UserID;
											$gr->parentid = $v->ParentID;
											$gr->name     = $v->Name;
											$gr->type     = $v->Type;
											$gr->status   = $v->Status;
											$gr->users    = [];
										}
									}
									else
									{
										$gr->ID       = $v->ID;
										$gr->userid   = $v->UserID;
										$gr->parentid = $v->ParentID;
										$gr->name     = $v->Name;
										$gr->type     = $v->Type;
										$gr->status   = $v->Status;
									}
						
									if( $gr )
									{
										$groupdetails[$v->ID] = $gr;
									}
								}
							}
						}
						
						
						
						
						if( $rows = $SqlDatabase->FetchObjects( '
							SELECT 
								g.ID, ug.UserID, g.Name AS Workgroup 
							FROM 
								`FUserGroup` g, 
								`FUserToGroup` ug 
							WHERE 
									g.Type = "Workgroup" 
								' . ( $sysadmin[ 'WORKGROUP_GLOBAL' ] ? '' : '
								AND ( g.ID IN (' . implode( ',', $workgroups ) . ') OR g.ParentID IN (' . implode( ',', $workgroups ) . ') ) 
								' ) . '
								AND ug.UserGroupID = g.ID 
							ORDER BY 
								ug.UserID ASC 
						' ) )
						{
							$users = [];
							
							foreach( $rows as $v )
							{
								$users[$v->UserID] = $v->UserID;
							}
							
							// Needed for pawel code ...
							
							if( $listdetails && $users )
							{
								// TODO: Connect user or users to groups or group ...
								
								if( $usr = $SqlDatabase->FetchObjects( '
									SELECT u.ID, u.UniqueID, u.Name, u.FullName, u.Status 
									FROM `FUser` u 
									WHERE u.ID IN (' . implode( ',', $users ) . ') 
									AND u.Status != 1 
									ORDER BY u.ID ASC 
								' ) )
								{
									foreach( $usr as $u )
									{
										$us = new stdClass;
										
										if( $object == 'user' && $objectid )
										{
											if( $objectid == $u->ID )
											{
												$us->id       = $u->ID;
												$us->uuid     = $u->UniqueID;
												$us->name     = $u->Name;
												$us->fullname = $u->FullName;
												$us->status   = $u->Status;
											}
										}
										else
										{
											$us->id       = $u->ID;
											$us->uuid     = $u->UniqueID;
											$us->name     = $u->Name;
											$us->fullname = $u->FullName;
											$us->status   = $u->Status;
										}
										
										if( $us )
										{
											$userdetails[$u->ID] = $us;
										}
									}
								}
								
								if( $groupdetails && $userdetails )
								{
									foreach( $rows as $v )
									{
										if( isset( $groupdetails[$v->ID]->users ) && isset( $userdetails[$v->UserID] ) )
										{
											$groupdetails[$v->ID]->users[] = $userdetails[$v->UserID];
										}
									}
								}
							}
						}
					}
					
					
					// TODO: Have to look at this, it's to specific ...
					if( $sysadmin[ 'WORKGROUP_GLOBAL' ] )
					{
						$workgroups = '*';
					}
					
					if( $sysadmin[ 'USER_GLOBAL' ] )
					{
						$users = '*';
					}
					
					
					
					// TODO: This must be specified ...
					
					switch( $type )
					{
						
						
						
						case 'owner':
							
							
							
							break;
						
						
						
						case 'admin':
							
							
							
							break;
						
						
						
						case 'read':
							
							
							
							break;
						
						
						
						case 'execute':
							
							
							
							break;
							
							
						
						case 'write':
							
							
							
							break;
						
						
						
						case 'delete':
							
							
							
							break;
						
						
						// List all ( owner, admin, read, execute, write, delete ) ...
						
						case 'get':
						default:
							
							
							
							break;
							
					}
					
					
					
					// This is only used if it's a specific workgroup or user ...
					if( $object )
					{
						switch( $object )
						{
							case 'workgroup':
								
								if( isset( $workgroups[$objectid] ) || $workgroups == '*' )
								{
									$out = new stdClass();
									$out->response = 1;
									$out->message = 'Permission granted.';
									
									// TODO: Might have to add some more data here ... need a usecase ...
									
									$out->data = new stdClass();
									$out->data->workgroups = (string)$objectid;
									
									// Needed for pawel code ...
									
									if( $listdetails == 'workgroup' || $listdetails == 'workgroups' )
									{
										$out->data->details = new stdClass();
										$out->data->details->group = ( isset( $groupdetails[$objectid] ) ? $groupdetails[$objectid] : false );
									}
									
									$out->debug = $debug;
									
									return $out;
								}
								
								break;
								
							case 'user':
								
								if( isset( $users[$objectid] ) || $users == '*' || ( $objectid && $User->ID == $objectid ) )
								{
									$out = new stdClass();
									$out->response = 1;
									$out->message = 'Permission granted.';
									
									// TODO: Might have to add some more data here ... need a usecase ...
									
									$out->data = new stdClass();
									$out->data->users = (string)$objectid;
									
									// Needed for pawel code ...
									
									if( $listdetails == 'user' || $listdetails == 'users' )
									{
										$out->data->details = new stdClass();
										$out->data->details->user = ( isset( $userdetails[$objectid] ) ? $userdetails[$objectid] : false );
									}
									
									$out->debug = $debug;
									
									return $out;
								}
								
								break;
								
							default:
								
								$out = new stdClass();
								$out->response = -1;
								$out->message = 'Permission denied.';
								$out->reason = 'Supported object missing ...';
								
								$out->debug = $debug;
								
								return $out;
								
								break;
						}
						
						if( !$objectid )
						{
							$out = new stdClass();
							$out->response = -1;
							$out->message = 'Permission denied.';
							$out->reason = 'Required objectid missing ...';
							
							$out->debug = $debug;
						}
						else
						{
							$out = new stdClass();
							$out->response = -1;
							$out->message = 'Permission denied.';
							$out->reason = 'You don\'t have access ...';
							
							$out->debug = $debug;
						}
						
						return $out;
					}
					
					
					
					if( $found && $pem )
					{
						$out = new stdClass();
						$out->response = 1;
						$out->message = 'Permission granted.';
						$out->data = new stdClass();
						$out->data->permissions = $pem;
						
						if( $workgroups )
						{
							$out->data->workgroups = ( is_array( $workgroups ) ? implode( ',', $workgroups ) : $workgroups );
							
							if( $listdetails == 'workgroup' || $listdetails == 'workgroups' )
							{
								$array = [];
								
								if( $groupdetails )
								{
									foreach( $groupdetails as $v ) $array[] = $v;
								}
								
								$out->data->details = new stdClass();
								$out->data->details->groups = $array;
							}
						}
						
						if( $users )
						{
							$out->data->users = ( is_array( $users ) ? implode( ',', $users ) : $users );
							
							if( $listdetails == 'user' || $listdetails == 'users' )
							{
								$array = [];
								
								if( $userdetails )
								{
									foreach( $userdetails as $v ) $array[] = $v;
								}
								
								$out->data->details = new stdClass();
								$out->data->details->users = $array;
							}
						}
						
						$out->debug = $debug;
						
						return $out;
					}
						
				}
				
				$out = new stdClass();
				$out->response = -1;
				$out->message = 'Permission denied.';
				$out->reason = 'You don\'t have access ...';
				
				$out->debug = $debug;
				
				return $out;
				
			}
			
			$out = new stdClass();
			$out->response = -1;
			$out->message = 'Permission denied.';
			$out->reason = 'Required name missing ...';
			
			$out->debug = $debug;
			
			return $out;
			
			break;
			
		// Default to error message about missing context ...
		
		default:
			
			$out = new stdClass();
			$out->response = -1;
			$out->message = 'Permission denied.';
			$out->reason = 'Required context missing ...';
			
			$out->debug = $debug;
			
			return $out;
			
			break;
			
	}
	
	$out = new stdClass();
	$out->response = -1;
	$out->message = 'Permission denied.';
	$out->reason = 'Something went very wrong ...';
	
	$out->debug = $debug;
	
	return $out;
	
}



?>
