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
	
		if( $d = json_decode( $s->Data ) )
			$list = $d;
	
		if( $list )
		{
			foreach( $list as $l )
			{
				if( trim( $l ) == 'launch Welcome' )
				{
					die( 'ok<!--separate-->{"message":"It exists.","response":1}' );
				}
			}
		}
	}
}

die( 'fail<!--separate-->{"message":"Not groovy.","response":-1}' );

?>
