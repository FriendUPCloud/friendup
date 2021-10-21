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
	
	$data = $s->Data;
	if( substr( $data, 0, 1 ) == '"' && substr( $data, -1, 1 ) == '"' )
	{
		$data = substr( $data, 1, strlen( $data ) - 2 );
	}
	if( $d = json_decode( $data ) )
	{
		$list = $d;
	
		if( count( $list ) )
		{
		
			$out = [];
			
			foreach( $list as $l )
			{
				if( trim( $l ) != trim( $args->args->item ) )
				{
					$out[] = $l;
				}
			}
			
			$s->Data = json_encode( $out );
			$s->Save();
			
			
			die( 'ok<!--separate-->{"response":1,"message":"Startup sequence was saved"}' );
		}
	}
	else
	{
		die( 'fail<!--separate-->{"response":0,"message":"Could not decode startup sequence data."}<!--separate-->' . $data );
	}
}
die( 'fail<!--separate-->{"response":0,"message":"Startup sequence was not saved due to error"}' );

?>
