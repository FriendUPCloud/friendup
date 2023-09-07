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

if( $votes = $SqlDatabase->fetchObjects( '
	SELECT * FROM FSetting WHERE `Type`="vote" AND UserID=\'' . $User->ID . '\'
	ORDER BY ID DESC
' ) )
{
	$votesOut = [];
	foreach( $votes as $vote )
	{
		$votesOut[ $vote->Key ] = $vote->Data;
	}
	
	die( 'ok<!--separate-->' . json_encode( $votesOut ) );
}
die( 'fail<!--separate-->{"message":"Could not find any votes.","response":"-1"}' );

?>
