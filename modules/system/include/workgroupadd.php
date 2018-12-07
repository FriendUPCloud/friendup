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

if( isset( $args->args->ValueNumber ) && isset( $args->args->ValueString ) )
{
	$m = new dbIO( 'FMetaData' );
	$m->DataTable = 'FUserGroup';
	$m->ValueNumber = $args->args->ValueNumber;
	$m->ValueString = $args->args->ValueString;
	if( !$m->Load() )
	{
		// Get the fusergroup object
		$o = new dbIO( 'FUserGroup' );
		$o->Type     = 'Workgroup';
		$o->ParentID = ( $args->args->ParentID ? $args->args->ParentID : null );
		$o->Name     = $args->args->Name;
		$o->UserID   = $User->ID;
		$o->Save();
		
		if( $o->ID > 0 )
		{
			// Add external data relation to workgroups
		
			$m->DataID = $o->ID;
			$m->Save();
			
			if( $args->args->MetaData && $m->ID )
			{
				// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
			}
			
			// Add user connected to this workgroup
		
			$SqlDatabase->query( '
			INSERT INTO FUserToGroup 
				( UserID, UserGroupID ) 
				VALUES 
				( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $User->ID ) . '\', \'' . $o->ID . '\' )
			' );
		
			die( 'ok<!--separate-->' . $o->ID );
		}
	}
}
else if( $level == 'Admin' )
{
	// Get the fusergroup object
	$o = new dbIO( 'FUserGroup' );
	$o->Type     = 'Workgroup';
	$o->ParentID = ( $args->args->ParentID ? $args->args->ParentID : null );
	$o->Name     = $args->args->Name;
	$o->UserID   = $User->ID;
	$o->Save();
	
	if( $o->ID > 0 && $args->args->Setup )
	{
		if( $setup = $SqlDatabase->FetchObject( '
			SELECT g.ID, g.Name, g.UserID 
			FROM `FUserGroup` g 
			WHERE g.Type = \'Setup\' AND g.ID = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Setup ) . '\' 
		' ) )
		{
			$s = new dbIO( 'FUserGroup' );
			$s->Type = 'SetupGroup';
			$s->UserID = $o->ID;
			$s->Load();
			$s->Name = $args->args->Setup;
			$s->Save();
		}
	}
	
	// Insert members
	if( $o->ID > 0 && isset( $args->args->Members ) )
	{
		$mems = explode( ',', $args->args->Members );
		foreach( $mems as $m )
		{
			if( $m <= 0 ) continue;
			$SqlDatabase->query( '
			INSERT INTO FUserToGroup 
				( UserID, UserGroupID ) 
				VALUES 
				( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $m ) . '\', \'' . $o->ID . '\' )
			' );
		}
		die( 'ok<!--separate-->' . $o->ID );
	}
}
die( 'fail' );

?>
