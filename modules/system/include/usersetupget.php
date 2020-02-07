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

// Only admins can get workgroups by id!
if( $level == 'Admin' && $args->args->id )
{
	if( $row = $SqlDatabase->FetchObject( '
		SELECT g.ID, g.Name, g.Description, s.Data 
		FROM `FUserGroup` g, `FSetting` s 
		WHERE g.ID = \'' . $args->args->id . '\' AND g.Type = \'Setup\'
		AND s.UserID = g.ID AND s.Type = \'setup\' AND s.Key = \'usergroup\' 
		ORDER BY g.Name ASC 
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}
die( 'fail' );

?>
