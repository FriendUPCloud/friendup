<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

// Include basic functionality
include( 'friend.php' );

// Get quest user slots
if( $rows = $SqlDatabase->FetchObjects( '
	SELECT * FROM FUser u, FUserToGroup utg, FUserGroup ug
	WHERE
		u.ID = utg.UserID AND ug.ID = utg.UserGroupID AND
		ug.Type = \'Level\' AND ug.Name = \'Guest\'
' ) )
{
	$guest = false;
	$now = mktime();
	foreach( $rows as $row )
	{
		if( $row->LastLoginTime + 25 < $now )
		{
			$guest = $row;
			break;
		}
	}
	
	// Give no more guest slots...
	if( !$guest )
	{
		$f = file_get_contents( 'build/resources/webclient/templates/guests_spent.html' );
		die( $f );
	}
	
	if( preg_match( '/\/guests\/([^\/]+)/i', $argv[1], $m ) )
	{
		$vars = end( explode( $m[0] . '/', $argv[1] ) );
		$redirect = '?app=' . $m[1] . '&sessionid=' . $guest->SessionID . '&' . $vars;
		die( '<script> document.location.href = \'/webclient/app.html' . $redirect . '\'; </script>' );
	}
}

?>
