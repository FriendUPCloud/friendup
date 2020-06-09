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

// Make sure we have a path and items!
if( isset( $args->args->path ) && isset( $args->args->items ) )
{
	$saved = 0;
	foreach( $args->args->items as $itm )
	{
		$d = new dbIO( 'FShared' );
		$d->OwnerUserID = $User->ID;
		$d->SharedType = $itm->type;
		$d->SharedID = $itm->id;
		$d->Data = $args->args->path;
		// Defaults to read and write
		$d->Mode = isset( $args->args->mode ) ? $args->args->mode : 'rw';
		if( !$d->Load() )
		{
			$d->DateModified = $d->DateCreated = date( 'Y-m-d H:i:s' );
		}
		else
		{
			$d->DateModified = date( 'Y-m-d H:i:s' );
		}
		$d->Save();
		$saved++;
	}
	die( 'ok<!--separate-->{"message":"Sharing info set","response":"1","count":"' . $saved . '"}' );
}

die( 'fail<!--separate-->{"message":"No file share info set.","response":"-1"}' );

?>
