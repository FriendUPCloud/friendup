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
		$perms = count( $args->args->permissions );
		foreach( $args->args->permissions as $perm )
		{
			$p = new dbIO( 'FUserRolePermission' );
			$p->Name = $perm;
			$p->RoleID = $d->ID;
			$p->Load();
			$p->Save();
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
	else if( $namechange )
	{
		die( 'ok<!--separate-->{"message":"Role updated. Name changed.","response":1}' );
	}
}

die( 'fail<!--separate-->{"message":"Role not found.","response":-1}' );

?>
