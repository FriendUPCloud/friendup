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

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_STORAGE_GLOBAL', 'PERM_STORAGE_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//
			
				if( isset( $args->args->userid ) && $User->ID != $args->args->userid )
				{
					die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
				}
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 )
			{			
				// If we have GLOBAL Access || TODO: Look at this when do we list admin filesystems only GLOBAL?
			
				if( $perm->data->users == '*' )
				{
					$level = 'Admin';
				}
			}
		}
	}
}



$out = [];
$mode = 'default';
if( $args->args->mode )
	$mode = $args->args->mode;
if( $dir = opendir( 'devices/DOSDrivers' ) )
{
	while( $f = readdir( $dir ) )
	{
		if( $f{0} == '.' ) continue;

		if( !file_exists( $fn = 'devices/DOSDrivers/' . $f . '/sysinfo.json' ) )
			continue;
		$o = file_get_contents( $fn );
		if( !( $o = json_decode( $o ) ) ) continue;

		// If we're listing all, don't check level (can't add admin file systems anyway)
		if( $mode != 'all' )
		{
			// Admin filesystems can only be added by admin..
			if( $o->group == 'Admin' && $level != 'Admin' )
				continue;
		}

		// Find default label
		if( file_exists( 'devices/DOSDrivers/' . $f . '/icon.svg' ) )
		{
			$o->iconLabel = base64_encode( file_get_contents( 'devices/DOSDrivers/' . $f . '/icon.svg' ) );
		}
		
		if( isset( $o->icon ) && file_exists( 'devices/DOSDrivers/' . $f . '/' . $o->icon ) )
		{
			$o->hasIcon = 'true';
		}
		else
		{
			$o->hasIcon = 'false';
		}

		$out[] = $o;
	}
	closedir( $dir );
}
if( count( $out ) > 0 )
{
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail<!--separate-->{"response":"types failed"}' );
//die( 'ok<!--separate-->[{"type":"treeroot","literal":"Treeroot"},{"type":"local","literal":"Local filesystem"},{"type":"corvo","literal":"MySQL Based Filesystem"},{"type":"website","literal":"Mount websites as doors"}]' );

?>
