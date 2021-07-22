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

$o = new dbIO( 'FQueuedEvent' );
if( $o->Load( $args->args->eventId ) )
{
	$response = new stdClass();
	
	if( $args->args->response === false )
	{
		$o->Status = 'rejected';
		if( isset( $o->ActionRejected ) )
		{
			if( $action = json_decode( $o->ActionRejected ) )
			{
				if( file_exists( 'modules/' . $action->module . '.php' ) )
				{
					$args = $action->args;
					include( 'modules/' . $action->module . '.php' );
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
				if( file_exists( 'modules/' . $action->module . '.php' ) )
				{
					$args = $action->args;
					include( 'modules/' . $action->module . '.php' );
				}
			}
		}
	}
	$o->Save();
	die( 'ok<!--separate-->' . $response );
}

die( 'fail<!--separate-->{"response":-1,"message":"Failed to find queued event."}' );


?>
