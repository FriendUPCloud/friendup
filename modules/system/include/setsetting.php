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

$userid = $User->ID;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	if( $level == 'Admin' && $args->args->userid )
	{
		$userid = $args->args->userid;
	}
}
else
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ], 'user', ( isset( $args->args->userid ) ? $args->args->userid : $userid ) ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				die( 'fail<!--separate-->' . json_encode( $perm ) );
			}
			
			// Permission granted. GLOBAL or WORKGROUP specific ...
			
			if( $perm->response == 1 )
			{
				// If user has GLOBAL or WORKGROUP access to this user
				
				if( isset( $args->args->userid ) && $args->args->userid )
				{
					$userid = intval( $args->args->userid );
				}
			}
		}
	}
}



$o = new dbIO( 'FSetting' );
$o->UserID = $userid;
$o->Type = 'system';
$o->Key = $args->args->setting;
$o->Load();

$d = false;

if( is_string( $args->args->data ) )
{
	$d = $args->args->data{0};
}
// TODO: Look at this one ... why does it want to json encode to string when it's allready a string ??? ^-*
if( $d == '{' || $d == '[' )
{
	$d = json_encode( $args->args->data );
}
else $d = $args->args->data;

$o->Data = ( is_array( $d ) || is_object( $d ) ? json_encode( $d ) : $d );
$o->Save();

// Save image blob as filename hash on user
if( $o->ID > 0 && $o->Key == 'avatar' && $o->Data && $o->UserID > 0 )
{
	$u = new dbIO( 'FUser' );
	$u->ID = $o->UserID;
	if( $u->Load() )
	{
		$u->Image = md5( $o->Data );
		$u->Save();
	}
}

die( 'ok' );

?>
