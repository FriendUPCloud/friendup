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

// Must be admin
if( $level != 'Admin' )
	die( '404' );

if( !isset( $args->args->name ) && !isset( $args->args->id ) )
{
	// We need a listout of all Roles ... so no arguments is then allowed ...
	
	$out = array();
	
	if( $rows = $SqlDatabase->FetchObjects( $q = '
		SELECT 
			g.*, u.UserID AS UserRoleID, w.FromGroupID AS WorkgroupRoleID 
		FROM 
			FUserGroup g 
				LEFT JOIN FUserToGroup u ON 
				( 
						u.UserGroupID = g.ID 
					AND u.UserID = ' . ( isset( $args->args->userid ) && $args->args->userid ? $args->args->userid : 'NULL' ) . ' 
				)
				LEFT JOIN FGroupToGroup w ON
				(
						w.ToGroupID = g.ID 
					AND w.FromGroupID = ' . ( isset( $args->args->groupid ) && $args->args->groupid ? $args->args->groupid : 'NULL' ) . ' 
				) 
		WHERE 
			g.Type = "Role" 
		ORDER BY 
			g.Name 
	' ) )
	{
		foreach( $rows as $row )
		{
			$o = new stdClass();
			$o->ID          = $row->ID;
			$o->UserID      = $row->UserRoleID;
			$o->WorkgroupID = $row->WorkgroupRoleID;
			$o->ParentID    = $row->ParentID;
			$o->Name        = $row->Name;
			
			if( $perms = $SqlDatabase->FetchObjects( '
				SELECT 
					p.ID, p.Permission, p.Key, p.Data 
				FROM 
					FUserRolePermission p 
				WHERE 
					p.RoleID = ' . $row->ID . ' 
				ORDER BY 
					p.ID 
			' ) )
			{
				$o->Permissions = $perms;
			}
			
			$out[] = $o;
		}
		
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
	
	die( 'fail<!--separate-->{"message":"No roles listed or on user.","response":-1}' );
}



$d = new dbIO( 'FUserGroup' );

if( isset( $args->args->id ) )
{
	$d->Load( $args->args->id );
	
	if( $perms = $SqlDatabase->FetchObjects( '
		SELECT 
			p.ID, p.Permission, p.Key, p.Data 
		FROM 
			FUserRolePermission p 
		WHERE 
			p.RoleID = ' . $d->ID . ' 
		ORDER BY 
			p.ID 
	' ) )
	{
		$d->Permissions = $perms;
	}
	
}
else
{
	$d->Type = 'Role';
	$d->Name = trim( $args->args->name );
	$d->Load();
}

if( $d->ID > 0 )
{
	die( 'ok<!--separate-->' . json_encode( $d ) );
}

die( 'fail<!--separate-->{"message":"Role not found.","response":-1}' );

?>
