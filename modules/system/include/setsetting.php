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

$o = new dbIO( 'FSetting' );
$o->UserID = $User->ID;
$o->Type = 'system';
$o->Key = $args->args->setting;
$o->Load();

$d = $args->args->data{0};
if( $d == '{' || $d == '[' )
	$d = json_encode( $args->args->data );
else $d = $args->args->data;

$o->Data = $d;
$o->Save();

die( 'ok' );

?>
