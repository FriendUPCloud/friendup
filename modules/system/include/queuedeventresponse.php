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

global $SqlDatabase, $User;

error_reporting( E_ALL & ~E_NOTICE );
ini_set( 'display_errors', 1 );

$o = new dbIO( 'FQueuedEvent' );
$o->ID = intval( $args->args->eventid, 10 );
if( $o->Load() )
{
	$response = new stdClass();
	
	if( $args->args->response === false )
	{		
		$o->Status = 'rejected';
		if( isset( $o->ActionRejected ) )
		{
			if( $action = json_decode( $o->ActionRejected ) )
			{
				$action->module = str_replace( '.', '', $action->module );
				if( file_exists( 'modules/' . $action->module . '/module.php' ) )
				{
					$args = $action;
					include( 'modules/' . $action->module . '/module.php' );
					if( !isset( $response->message ) )
						$response->message = 'Successfully executed module call.';
					$response->flag = 'rejected';
				}
			}
		}
	}
	else if( $args->args->response === true )
	{
		$o->Status = 'accepted';
		if( isset( $o->ActionAccepted ) )
		{
			if( $action = json_decode( $o->ActionAccepted ) )
			{
				$action->module = str_replace( '.', '', $action->module );
				if( file_exists( 'modules/' . $action->module . '/module.php' ) )
				{
					$args = $action;
					include( 'modules/' . $action->module . '/module.php' );
					if( !isset( $response->message ) )
						$response->message = 'Successfully executed module call.';
					$response->flag = 'accepted';
				}
			}
		}
	}
	// TODO: Make sure you don't overwrite $o in the files that is included ...
	if( $o->Save() ) 
	{
		$response->response = 1;
	}
	else $response->response = -1;
	
	die( 'ok<!--separate-->' . json_encode( $response ) );
}

die( 'fail<!--separate-->{"response":-1,"message":"Failed to find queued event."}' );


?>
