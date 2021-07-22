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

// Just fetch all queued events either by workgroup or user

if( $rows = $SqlDatabase->fetchObjects( '
	SELECT e.* FROM FQueuedEvent e 
	WHERE 
		e.TargetUserID = \'' . $User->ID . '\'
' ) )
{
	// Set events as seen
	$ids = [];
	foreach( $rows as $row )
	{
		$ids[] = $row->ID;
	}
	$SqlDatabase->query( 'UPDATE FQueuedEvent SET Status="seen" WHERE ID IN ( ' . implode( ',', $ids ) . ' )' );
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}

die( 'fail<!--separate-->{"response":-1,"message":"No queued events found."}' );

?>
