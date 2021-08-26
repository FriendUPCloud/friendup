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
$o = new DbIO( 'FUserGroup' );
if( $level != 'Admin' )
	$o->UserID = $User->ID;
$o->ID = $args->args->id;

if( $o->Load() )
{
	// Get members
	$mems = $SqlDatabase->FetchObjects( '
		SELECT u.ID, u.FullName FROM FUser u, FUserToGroup ug, FUserGroup g
		WHERE 
			ug.UserGroupID = \'' . $o->ID . '\' AND
			ug.UserGroupID = g.ID AND
			g.Type = \'Workgroup\' AND
			u.ID = ug.UserID
		ORDER BY u.FullName ASC
	' );

	$on = new stdClass();
	$on->Name = $o->Name;
	$on->ParentID = $o->ParentID;
	$on->ID = $o->ID;
	$on->Members = $mems ? $mems : false;
	$on->Description = $o->Description;
	
	// TODO: WARNING!
	// As you can see, there is a strange thing here with workgroup templates
	// called "setups" here. They are connected on UserGroupID (UserID).
	// probably a special case that needs to be cleaned up!
	
	if( $sts = $SqlDatabase->FetchObjects( '
		SELECT g.ID, g.Name, g.ParentID, ug.UserID
		FROM 
			`FUserGroup` g 
				LEFT JOIN `FUserGroup` ug ON 
				(
						ug.Name = g.ID 
					AND ug.Type = \'SetupGroup\' 
					AND ug.UserID = \'' . $o->ID . '\' 
				)
		WHERE g.Type = \'Setup\' 
		ORDER BY g.Name ASC 
	' ) )
	{
		$on->Setup = $sts;
	}
	
	die( 'ok<!--separate-->' . json_encode( $on ) );
}

die( 'fail<!--separate-->{"response":"unauthorized access in workgroupget"}' );

?>
