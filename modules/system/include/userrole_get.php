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
					AND u.UserID = ' . ( isset( $args->args->userid ) && $args->args->userid ? intval( $args->args->userid, 10 ) : 'NULL' ) . ' 
				)
				LEFT JOIN FGroupToGroup w ON
				(
						w.ToGroupID = g.ID 
					AND w.FromGroupID = ' . ( isset( $args->args->groupid ) && $args->args->groupid ? intval( $args->args->groupid, 10 ) : 'NULL' ) . ' 
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
				// Create clean permission objects without database crap
				$o->Permissions = array();
				$keys = array( 'ID', 'Permission', 'Key', 'Data' );
				foreach( $perms as $perm )
				{
					$co = new stdClass();
					foreach( $keys as $kk )
					{
						$co->$kk = $perm->$kk;
					}
					$o->Permissions[] = $co;
				}
			}
			
			// Add to list
			$out[] = $o;
		}
		
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
	
	die( 'fail<!--separate-->{"message":"No roles listed or on user.","response":-1}' );
}

// Just fetch by id
$fin = false;
$d = new dbIO( 'FUserGroup' );

if( isset( $args->args->id ) )
{
	if( $d->Load( $args->args->id ) )
	{
		// Sanitized copy
		$fin = new stdClass();
		foreach( $d->_fieldnames as $f )
			$fin->$f = $d->$f;
		
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
			// Create clean permission objects without database crap
			$fin->Permissions = array();
			$keys = array( 'ID', 'Permission', 'Key', 'Data' );
			foreach( $perms as $perm )
			{
				$co = new stdClass();
				foreach( $keys as $kk )
				{
					$co->$kk = $perm->$kk;
				}
				$fin->Permissions[] = $co;
			}
		}
	}
	
}
else
{
	$d->Type = 'Role';
	$d->Name = trim( $args->args->name );
	if( $d->Load() )
	{
		// Sanitized copy
		$fin = new stdClass();
		foreach( $d->_fieldnames as $f )
			$fin->$f = $d->$f;
	}
}

if( $fin && $fin->ID > 0 )
{
	die( 'ok<!--separate-->' . json_encode( $fin ) );
}

die( 'fail<!--separate-->{"message":"Role not found.","response":-1}' );

?>
