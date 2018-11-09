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

$devname = reset( explode( ':', $args->args->path ) );

$fname = end( explode( ':', $args->args->path ) );
if( strstr( '/', $fname ) )
	$fname = end( explode( '/', $fname ) );

// TODO: Add more security and checks!
$o = new DbIO( 'FFileShared' );
$o->Path = $args->args->path;
$o->Devname = $devname;
$o->Name = $fname;
$o->UserID = $User->ID;
$o->DstUserSID = 'Public';
$o->Load();
$o->Save();

// Success?
if( $o->ID > 0 )
	die( 'ok<!--separate-->' . $o->ID );

die( 'fail' );

?>
