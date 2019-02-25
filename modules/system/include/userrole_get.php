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
	
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT 
			g.* 
		FROM 
			FUserGroup g 
		WHERE 
			g.Type = "Role" 
			' . ( isset( $args->args->userid ) ? 'AND g.UserID = ' . $args->args->userid : '' ) . '
		ORDER BY 
			g.Name 
	' ) )
	{
		foreach( $rows as $row )
		{
			$o = new stdClass();
			$o->ID = $row->ID;
			$o->UserID = $row->UserID;
			$o->ParentID = $row->ParentID;
			$o->Name = $row->Name;
			
			if( $perms = $SqlDatabase->FetchObjects( '
				SELECT 
					p.ID, p.Permission, p.Data 
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
	
	die( 'fail<!--separate-->{"message":"Please specify the name or id of your role.","response":-1}' );
}

$d = new dbIO( 'FUserGroup' );

if( isset( $args->args->id ) )
{
	$d->Load( $args->args->id );
	
	if( $perms = $SqlDatabase->FetchObjects( '
		SELECT 
			p.ID, p.Permission, p.Data 
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
