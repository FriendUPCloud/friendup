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

if( isset( $args->args->paths ) )
{
	$fixed = [];
	foreach( $args->args->paths as $p )
	{
		$fixed[] = mysqli_real_escape_string( $SqlDatabase->_link, $p );
	}
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT DISTINCT(`Data`) FROM FShared WHERE `Data` IN ( "' . implode( '","', $fixed ) . '" ) AND OwnerUserID=\'' . $User->ID . '\'
	' ) )
	{
		$out = []; foreach( $rows as $r ) $out[] = $r->Data;
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
}

die( 'fail<!--separate-->' );

?>
