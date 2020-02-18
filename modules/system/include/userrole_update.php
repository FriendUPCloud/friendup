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

global $SqlDatabase, $Logger, $User;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	// Must be admin
	if( $level != 'Admin' )
	die( '404' );
}
else
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_ROLE_GLOBAL', 'PERM_ROLE_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//
			
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
		}
	}
}



// Need one or the other
if( !isset( $args->args->name ) && !isset( $args->args->id ) )
{
	die( 'fail<!--separate-->{"message":"Please specify the name or id of your role.","response":-1}' );
}

$namechange = false;

$d = new dbIO( 'FUserGroup' );

// Load by id
if( isset( $args->args->id ) )
{
	$d->Load( $args->args->id );
	
	// Update name
	if( isset( $args->args->name ) )
	{
		$d->Name = trim( $args->args->name );
		if( $d->save() )
		{
			$namechange = true;
		}
	}
}
// Load by name
else
{
	$d->Type = 'Role';
	$d->Name = trim( $args->args->name );
	$d->Load();
}

// Did we get one?
if( $d->ID > 0 )
{
	if( isset( $args->args->permissions ) )
	{
		if( $perms = count( $args->args->permissions ) )
		{
			foreach( $args->args->permissions as $perm )
			{
				if( $perm->name && $perm->key )
				{
					if( isset( $perm->command ) && $perm->command == 'delete' )
					{
						$p = new dbIO( 'FUserRolePermission' );
						$p->Permission = $perm->name;
						$p->Key        = $perm->key;
						$p->RoleID     = $d->ID;
						$p->Data       = ( $perm->data && !is_string( $perm->data ) ? json_encode( $perm->data ) : ( !$perm->data ? '0' : $perm->data ) );
						if( $p->Load() )
						{
							$p->Delete();
						}
					}
					else
					{
						$p = new dbIO( 'FUserRolePermission' );
						$p->Permission = $perm->name;
						$p->Key        = $perm->key;
						$p->RoleID     = $d->ID;
						$p->Data       = ( $perm->data && !is_string( $perm->data ) ? json_encode( $perm->data ) : ( !$perm->data ? '0' : $perm->data ) );
						$p->Load();
						$p->Save();
					}
				}
			}
		}
		
		if( $namechange )
		{
			die( 'ok<!--separate-->{"message":"Role updated. Permissions saved. Name changed.","response":3}' );
		}
		else
		{
			die( 'ok<!--separate-->{"message":"Role updated. Permissions saved.","response":2}' );
		}
	}
	else if( isset( $args->args->userid ) )
	{
		// Built out support for setting user to a Role ...
		// TODO: Review code and update documentation ...
		
		// TODO: Add support for adding specific Workgroup ID in addition ...
		
		if( $args->args->userid )
		{
			// Set user on role if data has activate value
			
			if( isset( $args->args->data ) && $args->args->data )
			{
				if( !$SqlDatabase->FetchObject( '
					SELECT * FROM FUserToGroup 
					WHERE UserID = \'' . $args->args->userid . '\' AND UserGroupID = \'' . $d->ID . '\' 
				' ) )
				{
					$SqlDatabase->query( '
					INSERT INTO FUserToGroup 
						( UserID, UserGroupID ) 
						VALUES 
						( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->userid ) . '\', \'' . $d->ID . '\' )
					' );
				}
			}
			
			// Remove user on role if data has no activate value
			
			else
			{
				$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $args->args->userid . '\' AND UserGroupID=\'' . $d->ID . '\'' );
			}
			
			if( $namechange )
			{
				die( 'ok<!--separate-->{"message":"User on role updated. Role name changed.","response":5}' );
			}
			else
			{
				die( 'ok<!--separate-->{"message":"User on role updated.","response":4}' );
			}
		}
		
		die( 'fail<!--separate-->{"message":"Missing parameters.","response":-1}' );
	}
	else if( isset( $args->args->groupid ) )
	{
		// Built out support for setting group to a Role ...
		// TODO: Review code and update documentation ...
		
		if( $args->args->groupid )
		{
			// Set user on role if data has activate value
			
			if( isset( $args->args->data ) && $args->args->data )
			{
				if( !$SqlDatabase->FetchObject( '
					SELECT * FROM FGroupToGroup 
					WHERE FromGroupID = \'' . $args->args->groupid . '\' AND ToGroupID = \'' . $d->ID . '\' 
				' ) )
				{
					$SqlDatabase->query( '
					INSERT INTO FGroupToGroup 
						( FromGroupID, ToGroupID ) 
						VALUES 
						( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->groupid ) . '\', \'' . $d->ID . '\' )
					' );
				}
			}
			
			// Remove group on role if data has no activate value
			
			else
			{
				$SqlDatabase->query( 'DELETE FROM FGroupToGroup WHERE FromGroupID=\'' . $args->args->groupid . '\' AND ToGroupID=\'' . $d->ID . '\'' );
			}
			
			if( $namechange )
			{
				die( 'ok<!--separate-->{"message":"Workgroup on role updated. Role name changed.","response":7}' );
			}
			else
			{
				die( 'ok<!--separate-->{"message":"Workgroup on role updated.","response":6}' );
			}
		}
		
		die( 'fail<!--separate-->{"message":"Missing parameters.","response":-1}' );
	}
	else if( $namechange )
	{
		die( 'ok<!--separate-->{"message":"Role updated. Name changed.","response":1}' );
	}
}

die( 'fail<!--separate-->{"message":"Role not found.","response":-1}' );

?>
