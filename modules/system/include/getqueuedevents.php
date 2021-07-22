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
	SELECT * FROM FQueuedEvent e LEFT JOIN FUserToGroup UG ON ( UG.UserID = \'' . $User->ID . '\' AND e.TargetGroupID = UG.UserGroupID )
	WHERE 
		e.TargetGroupID = UG.UserGroupID OR
		e.TargetUserID = \'' . $User->ID . '\'
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}

die( 'fail<!--separate-->{"response":-1,"message":"No queued events found."}' );

?>
