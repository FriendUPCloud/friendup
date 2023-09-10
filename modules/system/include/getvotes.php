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
		$total = $SqlDatabase->fetchObject( 'SELECT COUNT(*) AS T FROM FSetting WHERE `Type`="vote" AND `Data`="1" AND `Key`="' . $vote->Key . '"' );
		$votesOut[ $vote->Key ] = [
			mine => $vote->Data,
			total => $total->T
		];
	}
	
	die( 'ok<!--separate-->' . json_encode( $votesOut ) );
}
die( 'fail<!--separate-->{"message":"Could not find any votes.","response":"-1"}' );

?>
