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

/*
    This module call sets an announcement which are relevant for a user, be it
    directly or through a workgroup.
    
    This module call will be deprecated in the future by Friend Core using a 
    websocket call once an announcement has been designated.
*/

if( isset( $args->args->payload ) && isset( $args->args->type ) )
{
    $i = new dbIO( 'FAnnouncement' );
    $i->OwnerUserID = $User->ID;
    $i->CreatedTime = date( 'Y-m-d H:i:s' );
    
    $i->Payload = $args->args->payload;

    if( isset( $args->args->receiver ) )
    {
        $us = new dbIO( 'FUser' );
        if( !$us->load( $args->args->receiver ) )
        {
            die( 'fail<!--separate-->{"message":-1,"response":"Failed to load user."}' );
        }
        $i->UserID = $us->ID;
    }
    
    // Add to workgroup
    if( isset( $args->args->workgroup ) )
    {
        $wg = new dbIO( 'FUserGroup' );
        if( !$wg->load( $args->args->workgroup ) )
        {
            die( 'fail<!--separate-->{"message":-1,"response":"Failed to load workgroup."}' );
        }
        $i->GroupID = $wg->ID;
    }
    
    // Filter by known types
    switch( $args->args->type )
    {
        case 'calendar-event':
        case 'notification':
        case 'text-message':
            break;
        default:
            die( 'fail' );
    }
    
    $i->Type = $args->args->type;
    
    if( $i->Save() )
    {
        die( 'ok' );
    }
}


die( 'fail' );

?>
