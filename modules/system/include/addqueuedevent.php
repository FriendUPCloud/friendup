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

// Need message|type
if( !( isset( $args->args->message ) && isset( $args->args->type ) ) )
	die( 'fail<!--separate-->{"response":-1,"message":"You need to add a message and type in order to add to queue."}' );

// Need targetuser
if( !isset( $args->args->targetuser ) )
	die( 'fail<!--separate-->{"response":-1,"message":"You need to add a targetuser in order to add to queue."}' );

$a_a = isset( $args->args->actionaccepted ) ? $args->args->actionaccepted : '';
$a_r = isset( $args->args->actionrejected ) ? $args->args->actionrejected : '';
$a_s = isset( $args->args->actionseen )     ? $args->args->actionseen     : '';

$o = new dbIO( 'FQueuedEvent' );
$o->UserID         = $User->ID;
$o->Message        = $args->args->message;
$o->Type           = strtolower( $args->args->type ); // TODO: Filter known types!
$o->TargetUserID   = $args->args->targetuser ? $args->args->targetuser : 0;
$o->Date           = date( 'Y-m-d H:i:s' );
$o->Status         = 'unseen';
$o->ActionSeen     = $a_s;
$o->ActionAccepted = $a_a;
$o->ActionRejected = $a_r;

if( $o->Save() )
{
	die( 'ok<!--separate-->{"response":1,"message":"Event was successfully queued."}' );
}
die( 'fail<!--separate-->{"response":-1,"message":"Could not store queued event."}' );

?>
