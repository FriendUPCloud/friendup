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

$settings = new stdClass();
$settings->Date = date( 'Y-m-d H:i:s' );

$userid = $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID;

if( isset( $args->args->settings ) )
{
	$failed = true;
	foreach ( $args->args->settings as $set )
	{
		$s = new dbIO( 'FSetting' );
		$s->Type = 'system';
		$s->Key = $set;
		$s->UserID = $userid;
		if( $s->Load() )
		{
			$json = false;
			if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
			{
				$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
			}
			if( $json && $d = json_decode( $json ) )
			{
				$settings->$set = $d;
			}
			else if( $d = json_decode( $s->Data ) )
			{
				$settings->$set = $d;
			}
			else $settings->$set = $s->Data;
			$failed = false;
		}
	}
	if( !$failed ) 
		die( 'ok<!--separate-->' . json_encode( $settings ) );
	else
		die('fail<!--separate-->{"response":"settings not found"}');
}
else if ( isset( $args->args->setting ) )
{
	$set = $args->args->setting;
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = $args->args->setting;
	$s->UserID = $userid;
	if( $s->Load() )
	{
		$json = false;
		if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
		{
			$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
		}
		if( $json && $d = json_decode( $json ) )
		{
			$settings->$set = $d;
		}
		else if( $d = json_decode( $s->Data ) )
		{
			$settings->$set = $d;
		}
		else $settings->$set = $s->Data;
		die( 'ok<!--separate-->' . json_encode( $settings ) );
	}
	die( 'fail<!--separate-->{"response":"setting not found"}' );
}

die( 'fail<!--separate-->{"response":"fatal error in getsetting - no setting(s) parameter given"}' );

?>
