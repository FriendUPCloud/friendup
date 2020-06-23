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

global $SqlDatabase;

if( isset( $args->args->path ) )
{
	if( isset( $args->args->userid ) )
	{
		$share = new dbIO( 'FShared' );
		$share->SharedID = $args->args->userid;
		$share->SharedType = 'user';
		$share->Data = $args->args->path;
		$share->OwnerUserID = $User->ID;
		if( $share->Load() )
		{
			$share->Delete();
			die( 'ok<!--separate-->' );
		}
	}
	else if( isset( $args->args->groupid ) )
	{
		$share = new dbIO( 'FShared' );
		$share->SharedID = $args->args->groupid;
		$share->SharedType = 'group';
		$share->Data = $args->args->path;
		$share->OwnerUserID = $User->ID;
		if( $share->Load() )
		{
			$share->Delete();
			die( 'ok<!--separate-->' );
		}
	}
}

die( 'fail<!--separate-->' );

?>
