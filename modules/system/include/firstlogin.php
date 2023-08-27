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

global $Logger, $User;

// Install an app
function InstallApp( $user_id, $app_name )
{
	global $Logger;
	
	if( $path = FindAppInSearchPaths( $app_name ) )
	{
		if( file_exists( $path . '/Config.conf' ) )
		{
			$f = file_get_contents( $path . '/Config.conf' );
			
			// Path is dynamic!
			$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );

			// Store application!
			$a = new dbIO( 'FApplication' );
			$a->Config = $f;
			$a->UserID = $user_id;
			$a->Name = $app_name;
			$a->Permissions = 'UGO';
			$a->DateInstalled = date( 'Y-m-d H:i:s' );
			$a->DateModified = $a->DateInstalled;
			$a->Save();
			if( $a->ID > 0 )
			{
				$Logger->log( 'App installation OK, id is ' . $a->ID );
			}
		}
	}
}

// Create server token required by certain doors
if( !Trim( $User->ServerToken ) )
{
	$token = hash( 'sha256', $User->FullName . rand(0,999) . mktime() . rand( 0,999 ) );
	$SqlDatabase->query( 'UPDATE FUser SET ServerToken="' . $token . '" WHERE ID=\'' . $User->ID . '\'' );
}

$userid = ( isset( $args->args->userid ) ? $args->args->userid : $User->ID );

// Check if the user is in quarantine
if( $quar = $SqlDatabase->fetchObject( 'SELECT q.* FROM UserQuarantine q, FUser u WHERE u.ID = q.UserID AND u.LoginTime=0 AND q.Verified=\'0\' AND q.UserID=\'' . intval( $userid, 10 ) . '\'' ) )
{
	die( 'fail<!--separate-->{"message":"Can not update a quarantined user.","response":-1}' );
}

// Check workgroup specific expansion
// Load user's workgroups
if( $wgroups = $SqlDatabase->FetchObjects( '
	SELECT ug.Name FROM FUserGroup ug, FUserToGroup ugu, FUser u
	WHERE
		ug.Type = \'Workgroup\' AND u.ID = \'' . $userid . '\' AND 
		ugu.UserID = u.ID AND ug.ID = ugu.UserGroupID
' ) )
{
	// Check each workgroup
	foreach( $wgroups as $wgroup )
	{
		$wkey = strtolower( str_replace( ' ', '_', $wgroup->Name ) );
		// Is the script already run?
		$cr = new dbIO( 'FSetting' );
		$cr->Type = 'system';
		$cr->Key = 'firstlogin_' . $wkey;
		$cr->UserID = $userid;
		if( !$cr->Load() )
		{
			// Load custom script for this workgroup
			if( file_exists( 'cfg/firstlogin_' . $wkey . '.php' ) )
			{
				require( 'cfg/firstlogin_' . $wkey . '.php' );
				// The script has run, register it
				$cr->Save();
			}
		}
		
		// Check post login for this workgroup
		if( file_exists( 'cfg/postlogin_' . $wkey . '.php' ) )
		{
			// Variables used for post login
			$postLogin = new stdClass();
			$postLogin->Workgroup = str_replace( ' ', '_', $wgroup->Name );
			$postLogin->FriendUser = $User->Name;
			require( 'cfg/postlogin_' . $wkey . '.php' );
		}
	}
}

// Prevent wizard for user
if( isset( $Config ) && isset( $Config->preventwizard ) && $Config->preventwizard == 1 )
{
	$cr = new dbIO( 'FSetting' );
	$cr->UserID = $userid;
	$cr->Type = 'system';
	$cr->Key = 'wizardrun';
	$cr->Load();
	$cr->Data = '1';
	$cr->Save();
}

// Check that it really is first login
$cr = new dbIO( 'FSetting' );
$cr->Type = 'system';
$cr->Key = 'firstlogin';
$cr->UserID = $userid;
if( !$cr->Load() || ( isset( $args->args->force ) && $args->args->force ) )
{
	$doNotDie = true;
	
	// Check for expansion
	if( file_exists( 'cfg/firstlogin.php' ) )
	{
		require( 'cfg/firstlogin.php' );
	}
	// Do defaults
	else
	{
		require( __DIR__ . '/firstlogin.defaults.php' );
	}
	
	// This one is there for the first user to be upgraded to recent settings
	$oldUser = $User;
	$User = new stdClass();
	$User->ID = $userid;
	include( __DIR__ . '/upgradesettings.php' );
	$User = $oldUser;
	
	// Now we had first login!
	if( !isset( $args->args->force ) || !$args->args->force )
	{
		$cr->Data = date( 'Y-m-d H:i:s' );
		$cr->Save();
	}
}


