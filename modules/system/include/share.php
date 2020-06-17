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

global $SqlDatabase, $Logger, $User;

// TODO: Could be authid is banned!? =)
if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

// Some checks!
if( !$args->args->userid )
{
	die( 'fail<!--separate-->{"message":"Missing userid to share item.","response":"-1"}' );
}

// Sharing to a new temporary user?
if( $args->args->userid == 'new' )
{
	// TODO: Create user
	die( 'fail<!--separate-->{"message":"Unable to create new share user.","response":"-1"}' );
	//$args->args->userid = $newuser->ID;
}

// Check if the user exists
if( $suser = $SqlDatabase->fetchObject( 'SELECT * FROM FUser WHERE ID=\'' . intval( $args->args->userid, 10 ) . '\'' ) )
{
	// Check if the owner's shared drive exists
	$shareddrive = $SqlDatabase->fetchObject( '
		SELECT * FROM
			Filesystem f
		WHERE
			f.UserID=\'' . $User->ID . '\' AND
			f.Type=\'SharedDrive\'
	' );
	// The drive doesn't exist? Create it
	if( !$shareddrive )
	{
		$shareddrive = CreateSharedDrive( $User->ID );
		if( !$shareddrive )
		{
			die( 'fail<!--separate-->{"message":"Could not create shared drive.","response":"-1"}' );
		}
	}
	$targetshared = $SqlDatabase->fetchObject( '
		SELECT * FROM
			Filesystem f
		WHERE
			f.UserID=\'' . intval( $args->args->userid . '\' AND
			f.Type=\'SharedDrive\'
	' );
	if( !$targetshared )
	{
		$targetshared = CreateSharedDrive( $User->ID );
		if( !$targetshared )
		{
			die( 'fail<!--separate-->{"message":"Could not create shared drive for target.","response":"-1"}' );
		}
	}
	// If we get to this point there's no problemo!
	
	
}
else
{
	die( 'fail<!--separate-->{"message":"This user or workgroup does not exist.","response":"-1"}' );
}

if( isset( $args->args->type ) )
{
	switch( $args->args->type )
	{
		// Share a file
		case 'file':
			$mode = 'r';
			if( $args->args->mode )
			{
				if( $args->args->mode == 'rw' )
				{
					$mode = 'rw';
				}
			}
			
			$filePath = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path );
			
			$SqlDatabase->query( '
				INSERT INTO `FShared`
				( OwnerUserID, SharedUserID, Data, Mode, DateCreated, DateTouched )
				VALUES
				(
					\'' . $User->ID . '\',
					\'' . $suser->ID . '\',
					\'' . $filePath . '\',
					\'' . $mode . '\',
					NOW(),
					NOW()
				)	
			' );
			break;
		case 'application':
			break;
	}
}


die( 'fail<!--separate-->{"message":"Could not share item.","response":"-1"}' );

?>
