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

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->Key = 'startupsequence';
$s->UserID = $User->ID;
if( $s->Load() )
{
	$json = false;
	$list = [];
	
	if( $d = json_decode( $s->Data ) )
		$list = $d;
	
	$list[] = $args->args->item;
	
	$s->Data = json_encode( $out );
	$s->Save();
	
	die( 'ok<!--separate-->{"response":1,"message":"Startup sequence was saved"}' );
}
die( 'fail<!--separate-->{"response":0,"message":"Startup sequence was not saved due to error"}' );

?>
