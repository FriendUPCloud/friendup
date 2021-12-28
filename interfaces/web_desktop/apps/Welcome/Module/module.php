<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

global $SqlDatabase, $User;

if( $args->args->command == 'checkstartup' )
{
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = 'startupsequence';
	$s->UserID = $User->ID;
	if( $s->Load() )
	{
		$json = false;
		$list = false;
		$data = $s->Data;
		
		if( substr( $data, 0, 1 ) == '"' )
		{
			$data = substr( $data, 1, strlen( $data ) - 2 );
		}
		
		if( $d = json_decode( $data ) )
			$list = $d;
	
		if( $list )
		{
			foreach( $list as $l )
			{
				if( trim( $l ) == 'launch ' . $args->args->appName )
				{
					die( 'ok<!--separate-->{"message":"It exists.","response":1}' );
				}
			}
		}
	}
}

die( 'fail<!--separate-->{"message":"Not groovy.","response":-1}' );

?>
