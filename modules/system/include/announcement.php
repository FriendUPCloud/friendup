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

global $SqlDatabase, $User;

function saveAnnouncement( $o, $type, $id )
{
    global $User, $SqlDatabase;
    
    $i = new dbIO( 'FAnnouncement' );
    $i->OwnerUserID = $User->ID;
    $i->CreatedTime = date( 'Y-m-d H:i:s' );
    $i->Payload = $o->args->payload;

    if( $type == 'user' )
    {
        $us = new dbIO( 'FUser' );
        if( !$us->load( $id ) )
        {
            return 'fail<!--separate-->{"message":-1,"response":"Failed to load user."}';
        }
        $i->UserID = $us->ID;
    }
    
    // Add to workgroup
    if( $type == 'workgroup' )
    {
        $wg = new dbIO( 'FUserGroup' );
        if( !$wg->load( $id ) )
        {
           return 'fail<!--separate-->{"message":-1,"response":"Failed to load workgroup."}';
        }
        $i->GroupID = $wg->ID;
    }
    
    // Filter by known announcement types
    switch( $o->args->type )
    {
        case 'calendar-event':
        case 'notification':
        case 'text-message':
            break;
        default:
            return 'fail';
    }
    
    $i->Type = $o->args->type;
    $i->CreateTime = date( 'Y-m-d H:i:s' );
    
    if( $i->Save() )
    {
        return 'ok';
    }
    return 'fail';
}

// We got a method!
if( isset( $args->args->method ) && isset( $args->args->announcementid ) )
{
    // We want to set a status on this announcement
    if( $args->args->method == 'status' )
    {
        $an = new dbIO( 'FAnnouncement' );
        if( $an->load( $args->args->announcementid ) )
        {
            $st = new dbIO( 'FAnnouncementStatus' );
            $st->AnnouncementID = $an->ID;
            $st->UserID = $User->ID;
            $st->Status = $args->args->status;
            // Only 'read' status is available now
            if( $st->Status == 'read' )
            {
                if( $st->Save() )
                {
                    die( 'ok' );
                }
            }
        }
    }
    die( 'fail' );
}

if( isset( $args->args->payload ) && isset( $args->args->type ) )
{
    // Store both user and workgroup announcements and recall failures or successes
    $retArray = [];
    if( $args->args->users )
    {
        foreach( $args->args->users as $user )
        {
            $retArray[] = saveAnnouncement( $args, 'user', (int)$user );
        }
    }
    if( $args->args->workgroups )
    {
        foreach( $args->args->workgroups as $workgroup )
        {
            $retArray[] = saveAnnouncement( $args, 'workgroup', (int)$workgroup );
        }
    }
    if( !count( $retArray ) )
    {
        die( 'fail<!--separate-->{"message":-1,"response":"Failed to save announcements."}' );
    }
    else
    {
        $fails = $oks = 0;
        foreach( $retArray as $ret )
        {
            if( substr( $ret, 0, 4 ) == 'fail' )
                $fails++;
            else $oks++;
        }
        die( 'ok<!--separate-->{"message":1,"response":"Successfully stored announcements.","failures":"' . $fails . '","successful":"' . $oks . '"}' );
    }
}


die( 'fail' );

?>
