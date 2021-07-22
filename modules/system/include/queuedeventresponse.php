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
	
}

die( 'fail<!--separate-->{"response":-1,"message":"Failed to find queued event."}' );


?>
