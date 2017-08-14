<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
		if( $row->LoggedTime + 25 < $now )
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
