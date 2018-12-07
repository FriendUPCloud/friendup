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

if( isset( $args->args->ID ) && isset( $args->args->ValueNumber ) && isset( $args->args->ValueString ) )
{
	$m = new dbIO( 'FMetaData' );
	$m->DataTable = 'FUserGroup';
	$m->ValueNumber = $args->args->ValueNumber;
	$m->ValueString = $args->args->ValueString;
	if( $m->Load() )
	{
		// Get the fusergroup object
		$o = new dbIO( 'FUserGroup' );
		$o->ID = $args->args->ID;
		$o->Type = 'Workgroup';
		if( $o->Load() )
		{
			if( isset( $args->args->Delete ) )
			{
				// If request is to delete, delete the current user from the workspace
				
				if( $o->ID > 0 )
				{
					if( $SqlDatabase->FetchObject( '
						SELECT * FROM FUserToGroup 
						WHERE UserID = \'' . $User->ID . '\' AND UserGroupID = \'' . $o->ID . '\' 
					' ) )
					{
						$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $User->ID . '\' AND UserGroupID=\'' . $o->ID . '\'' );
					}
					
					die( 'ok<!--separate-->' . $o->ID );
				}
			}
			else
			{
				$o->ParentID = ( isset( $args->args->ParentID ) ? $args->args->ParentID : $o->ParentID );
				$o->Name     = ( $args->args->Name && $args->args->Name != $o->Name ? $args->args->Name : $o->Name );
				$o->Save();
				
				if( $o->ID > 0 )
				{
					// Add external data relation to workgroups
				
					//$m->ValueData = $args->args->ValueData;
					$m->Save();
				
					// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
				
					// Add user connected to this workgroup
				
					if( !$SqlDatabase->FetchObject( '
						SELECT * FROM FUserToGroup 
						WHERE UserID = \'' . $User->ID . '\' AND UserGroupID = \'' . $o->ID . '\' 
					' ) )
					{
						$SqlDatabase->query( '
						INSERT INTO FUserToGroup 
							( UserID, UserGroupID ) 
							VALUES 
							( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $User->ID ) . '\', \'' . $o->ID . '\' )
						' );
					}
				
					die( 'ok<!--separate-->' . $o->ID );
				}
			}
		}
	}
}
else if( $level == 'Admin' )
{
	if( isset( $args->args->userid ) && $args->args->userid > 0 && isset( $args->args->workgroups ) )
	{
		if( $wgs = $SqlDatabase->FetchObjects( '
			SELECT 
				g.ID, 
				g.Name, 
				ug.UserID 
			FROM 
				`FUserGroup` g 
					LEFT JOIN `FUserToGroup` ug ON 
					(
							ug.UserID = \'' . $args->args->userid . '\' 
						AND g.ID = ug.UserGroupID 
					) 
			WHERE g.Type = "Workgroup" 
			ORDER BY g.Name ASC 
		' ) )
		{
			foreach( $wgs as $wg )
			{
				//
				
				if( in_array( $wg->ID, $args->args->workgroups ) )
				{
					if( !$wg->UserID )
					{
						$SqlDatabase->query( '
						INSERT INTO FUserToGroup 
							( UserID, UserGroupID ) 
							VALUES 
							( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->userid ) . '\', \'' . $wg->ID . '\' ) 
						' );
					}
				}
				else if( $wg->UserID > 0 )
				{
					$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $wg->UserID . '\' AND UserGroupID=\'' . $wg->ID . '\'' );
				}
			}
			
			die( 'ok' );
		}
	}
	else
	{
		// Get the fusergroup object and update the name
		$o = new dbIO( 'FUserGroup' );
		if( $o->Load( $args->args->ID ) )
		{
			$o->ParentID = ( isset( $args->args->ParentID ) ? $args->args->ParentID : $o->ParentID );
			$o->Name     = ( $args->args->Name && $args->args->Name != $o->Name ? $args->args->Name : $o->Name );
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
		
			// Update members, delete old and insert anew
			$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $o->ID . '\'' );
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
	}
}
die( 'fail' );

?>
