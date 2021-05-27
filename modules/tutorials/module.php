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

include_once( 'php/friend.php' );
include_once( 'php/classes/file.php' );

if( $args->command == 'get' )
{
	$s = new dbIO( 'FSetting' );
	$s->UserID = $User->ID;
	$s->Type = 'Tutorial';
	$s->Key = 'Tutorial';
	if( !$s->Load() )
	{
		$s->Data = 1;
		$s->Save();
	}
	else if( $s->Data == 'stop' )
	{
		die( 'fail<!--separate-->{"response":"333","message":"End of tutorials."}' );
	}
	else if( $s->Data < 1 )
	{
		$s->Data = 1;
		$s->Save();
	}
	if( file_exists( 'modules/tutorials/data/' . $s->Data ) )
	{
		if( file_exists( 'modules/tutorials/data/' . $s->Data . '/tutorial.html' ) )
		{
			$d = new stdClass();
			$d->response = 'Tutorial number ' . $s->Data;
			$defaultButtons = file_get_contents( 'modules/tutorials/data/default_buttons.html' );
			$d->data = base64_encode( file_get_contents( 'modules/tutorials/data/' . $s->Data . '/tutorial.html' ) . $defaultButtons );
			die( 'ok<!--separate-->' . json_encode( $d ) );
		}
	}
	die( 'fail<!--separate-->{"response":"404","message":"Out of tutorials."}' );
}
else if( $args->command == 'gettutorials' )
{
	$num = 2;
	$str = '';
	while( file_exists( 'modules/tutorials/data/' . $num ) )
	{
		if( file_exists( 'modules/tutorials/data/' . $num . '/tutorial.html' ) )
		{
			$str .= '<div class="Tutorial BackgroundDefault"><div>';
			$str .= file_get_contents( 'modules/tutorials/data/' . $num . '/tutorial.html' );
			$str .= '</div></div>';
		}
		$num++;
	}
	if( $num > 1 )
	{
		die( 'ok<!--separate-->{"data":"' . base64_encode( $str ) . '"}' );
	}
}
else if( $args->command == 'gettutorial' )
{
	if( isset( $args->args->number ) )
	{
		$filename = 'modules/tutorials/data/' . $args->args->number . '/tutorial_large.html';
		if( file_exists( $filename ) )
		{
			$str = file_get_contents( $filename );
			die( 'ok<!--separate-->{"data":"' . base64_encode( $str ) . '"}' );
		}
	}
}
else if( $args->command == 'getimage' )
{
	if( isset( $args->number ) )
	{
		$filename = 'modules/tutorials/data/' . $args->number . '/image.jpg';
		if( file_exists( $filename ) )
		{
			FriendHeader( 'Content-type', 'image/jpeg' );
			readfile( $filename );
			die();
		} 
	}
}
else if( $args->command == 'increment' )
{
	$s = new dbIO( 'FSetting' );
	$s->UserID = $User->ID;
	$s->Type = 'Tutorial';
	$s->Key = 'Tutorial';
	if( $s->Load() )
	{
		if( $s->Data == 'stop' )
			return 'fail';
		$s->Data = intval( $s->Data ) + 1;
		$s->Save();
	}
	die( 'ok' );
}
else if( $args->command == 'stop' )
{
	$s = new dbIO( 'FSetting' );
	$s->UserID = $User->ID;
	$s->Type = 'Tutorial';
	$s->Key = 'Tutorial';
	$s->Load();
	$s->Data = 'stop';
	if( $s->Save() )
	{
		die( 'ok<!--separate-->{"response":"0","message":"Stopping tutorials."}' );
	}
}

// Catch all
die( 'fail<!--separate-->{"response":"0","message":"Unknown call."}' );

?>
