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

$userConn = 'LEFT'; // <- show all workgroups

// Just show connected groups?
if( isset( $args->args->connected ) )
{
	$userConn = 'RIGHT';
}

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT 
		g.ID, g.Name, g.ParentID, g.UserID, u.UserID AS WorkgroupUserID, m.ValueNumber, m.ValueString 
	FROM 
		FUserGroup g 
			' . $userConn . ' JOIN FUserToGroup u ON 
			( 
					u.UserID = \'' . $User->ID . '\' 
				AND u.UserGroupID = g.ID 
			) 
			LEFT JOIN FMetaData m ON 
			( 
					m.DataTable = "FUserGroup" 
				AND m.DataID = g.ID 
			) 
	WHERE `Type`=\'Workgroup\' 
	' . ( isset( $args->args->ParentID ) ? '
	AND `ParentID` = \'' . $args->args->ParentID . '\' 
	' : '' ) . '
	ORDER BY `Name` ASC 
' ) )
{
	foreach( $rows as $row )
	{
		// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
	}	
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'ok<!--separate-->[]' );

?>
