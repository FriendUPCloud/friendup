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

$saved = 0;

if( isset( $args->args->path ) && isset( $args->args->share ) && isset( $args->args->type ) )
{
	$part = explode( ':', $args->args->share );
	$part = $part[1];
	
	if( $args->args->type == 'group' )
	{
		if( $group = $SqlDatabase->fetchObject( '
			SELECT g.* FROM FUserGroup g, FUser u, FUserToGroup ug
			WHERE
				g.ID = ug.UserGroupID AND
				u.ID = ug.UserID AND
				u.ID = \'' . $User->ID . '\' AND
				g.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $part ) . '"
		' ) )
		{
			$d = new dbIO( 'FShared' );
			$d->OwnerUserID = $User->ID;
			$d->SharedType = 'group';
			$d->SharedID = $group->ID;
			$d->Data = $args->args->path;
			$d->Mode = isset( $args->args->mode ) ? $args->args->mode : 'rw';
			if( !$d->Load() )
			{
				$d->DateTouched = $d->DateCreated = date( 'Y-m-d H:i:s' );
			}
			else
			{
				$d->DateTouched = date( 'Y-m-d H:i:s' );
			}
			if( $d->Save() )
				$saved++;
		}
	}
	else if( $args->args->type == 'user' )
	{
		if( $user = $SqlDatabase->fetchObject( '
			SELECT u.* FROM FUser u
			WHERE
				u.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $part ) . '"
		' ) )
		{
			$d = new dbIO( 'FShared' );
			$d->OwnerUserID = $User->ID;
			$d->SharedType = 'user';
			$d->SharedID = $user->ID;
			$d->Data = $args->args->path;
			$d->Mode = isset( $args->args->mode ) ? $args->args->mode : 'rw';
			if( !$d->Load() )
			{
				$d->DateTouched = $d->DateCreated = date( 'Y-m-d H:i:s' );
			}
			else
			{
				$d->DateTouched = date( 'Y-m-d H:i:s' );
			}
			if( $d->Save() )
				$saved++;
		}
	}
}
// Make sure we have a path and items!
else if( isset( $args->args->path ) && isset( $args->args->items ) )
{
	if( substr( $args->args->path, 0, 7 ) == 'Shared:' )
		die( 'fail<!--separate-->{"message":"Unable to share a shared file.","response":"-1"}' );
	
	// Remove old!
	$SqlDatabase->query( 'DELETE FROM FShared WHERE OwnerUserID=\'' . $User->ID . '\' AND `Data`="' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path ) . '"' );

	if( isset( $args->args->items->group ) && count( $args->args->items->group ) )
	{
		$groups = $args->args->items->group;
		foreach( $groups as $itm )
		{
			$d = new dbIO( 'FShared' );
			$d->OwnerUserID = $User->ID;
			$d->SharedType = 'group';
			$d->SharedID = $itm->id;
			$d->Data = $args->args->path;
			// Defaults to read and write
			$d->Mode = isset( $args->args->mode ) ? $args->args->mode : 'rw';
			if( !$d->Load() )
			{
				$d->DateTouched = $d->DateCreated = date( 'Y-m-d H:i:s' );
			}
			else
			{
				$d->DateTouched = date( 'Y-m-d H:i:s' );
			}
			if( $d->Save() )
				$saved++;
		}
	}
	if( isset( $args->args->items->user ) && count( $args->args->items->user ) )
	{
		$users = $args->args->items->user;
		foreach( $users as $itm )
		{
			$d = new dbIO( 'FShared' );
			$d->OwnerUserID = $User->ID;
			$d->SharedType = 'user';
			$d->SharedID = $itm->id;
			$d->Data = $args->args->path;
			// Defaults to read and write
			$d->Mode = isset( $args->args->mode ) ? $args->args->mode : 'rw';
			if( !$d->Load() )
			{
				$d->DateTouched = $d->DateCreated = date( 'Y-m-d H:i:s' );
			}
			else
			{
				$d->DateTouched = date( 'Y-m-d H:i:s' );
			}
			if( $d->Save() )
				$saved++;
		}
	}
}

if( $saved )
{
	die( 'ok<!--separate-->{"message":"Sharing info set","response":"1","count":"' . $saved . '"}' );
}

die( 'fail<!--separate-->{"message":"No file share info set.","response":"-1"}' );

?>
