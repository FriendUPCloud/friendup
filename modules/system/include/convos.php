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

ini_set( 'max_execution_time', '300' ); // Die after 5 minutes

$response = new stdClass();

// Check chat session
$sess = new dbIO( 'MessageSession' );
$sess->SessionID = $UserSession->SessionID;
$sess->UniqueUserID = $User->UniqueID;
if( !$sess->Load() )
{
    $sess->PrevDate = date( 'Y-m-d H:i:s' );
    $sess->ActivityDate = $sess->PrevDate;
    $sess->Save();
}

if( isset( $args->args ) )
{
    if( isset( $args->args->outgoing ) )
    {
        //error_log( '[convos.php] Incoming messages.' );
        
        // Prepare successful response
        $response->response = '1';
        $response->message = 'Stored message(s).';
        $response->messages = [];
        
        foreach( $args->args->outgoing as $out )
        {
            // Do not save empty messages.
            if( !trim( $out->message ) ) continue;
            
            $o = new dbIO( 'Message' );
            $o->UniqueUserID = $User->UniqueID;
            $o->RoomID = 0;
            $o->RoomType = $out->type ? $out->type : 'jeanie';
            $o->ParentID = 0;
            if( isset( $out->targetId ) )
            {
                $o->TargetID = $out->targetId;
                
                // Update sessions
                if( $o->RoomType == 'dm-user' )
                {
                    $SqlDatabase->query( 'UPDATE MessageSession SET ActivityDate=\'' . date( 'Y-m-d H:i:s' ) . '\', PrevDate=\'1970-01-01 12:00:00\' WHERE UniqueUserID=\'' . $SqlDatabase->_link->real_escape_string( $o->TargetID ) . '\'' );
                }
            }
            $o->DateUpdated = date( 'Y-m-d H:i:s' );
            $o->Date = date( 'Y-m-d H:i:s', $out->timestamp );
            $o->Message = $out->message;
            $o->Save();
            
            // Add to response
            if( $o->ID > 0 )
            {
                $s = new stdClass();
                $s->ID = $o->ID;
                $s->Name = $User->Name;
                $s->Date = $o->Date;
                $s->Message = $o->Message;
                $s->Avatar = 'default';
                $s->Own = true;
                $response->messages[] = $s;
            }
        }
        
        if( count( $response->messages ) > 0 )
        {
            // Update sessions
            $SqlDatabase->query( 'UPDATE MessageSession SET ActivityDate=\'' . date( 'Y-m-d H:i:s' ) . '\', PrevDate=\'1970-01-01 12:00:00\' WHERE UniqueUserID=\'' . $User->UniqueID . '\'' );
        
            die( 'ok<!--separate-->' . json_encode( $response ) );
        }
        die( 'fail<!--separate-->{"response":0,"message":"Failed to store message(s)."}' );
    }
    if( isset( $args->args->method ) )
    {
        //error_log( '[convos.php] Method start.' );
        if( $args->args->method == 'messages' )
        {
            $rows = false;
            
            $lastId = '';
            if( isset( $args->args->lastId ) )
            {
                $lastId = ' AND m.ID > ' . $args->args->lastId;
            }
            
            if( isset( $args->args->roomType ) )
            {
                if( $args->args->roomType == 'jeanie' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                        SELECT 
                            m.ID, m.Message, m.Date, u.Name, u.UniqueID FROM `Message` m, FUser u 
                        WHERE
                            m.RoomType = \'jeanie\' AND m.UniqueUserID=\'' . $User->UniqueID . '\' AND
                            m.UniqueUserID = u.UniqueID' . $lastId . '
                        ORDER BY 
                            m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
                else if( $args->args->roomType == 'dm-contact' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                    SELECT 
                        m.ID, m.Message, m.Date, u.Name, u.UniqueID FROM `Message` m, FContact u 
                    WHERE
                        m.RoomType = \'dm-contact\' AND 
                        ( 
                            ( 
                                m.UniqueUserID = \'' . $User->UniqueID . '\' AND 
                                m.UniqueUserID = u.UniqueID AND
                                m.TargetID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->cid ) . '\'
                            )
                            OR
                            (
                                m.UniqueUserID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->cid ) . '\' AND
                                m.UniqueUserID != \'' . $User->UniqueID . '\' AND
                                m.TargetID = \'' . $User->UniqueID . '\'
                            )
                        )
                        u.ID = m.TargetID' . $lastId . '
                    ORDER BY 
                        m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
                else if( $args->args->roomType == 'dm-user' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                    SELECT 
                        m.ID, m.Message, m.Date, u.Name, u.UniqueID FROM `Message` m, FUser u 
                    WHERE
                        m.RoomType = \'dm-user\' AND 
                        ( 
                            ( 
                                m.UniqueUserID = \'' . $User->UniqueID . '\' AND 
                                m.UniqueUserID = u.UniqueID AND
                                m.TargetID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->cid ) . '\'
                            )
                            OR
                            (
                                m.UniqueUserID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->cid ) . '\' AND
                                m.UniqueUserID != \'' . $User->UniqueID . '\' AND
                                u.UniqueID = m.UniqueUserID AND
                                m.TargetID = \'' . $User->UniqueID . '\'
                            )
                        )' . $lastId . '
                    ORDER BY 
                        m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
            }
            // We got rows!
            if( $rows && count( $rows ) > 0 )
            {
                $outlist = [];
                foreach( $rows as $k=>$v )
                {
                    $out = new stdClass();
                    $out->ID = $v->ID;
                    $out->Name = $v->Name;
                    $out->Message = $v->Message;
                    $out->Date = $v->Date;
                    $out->Own = false;
                    if( $v->UniqueID == $User->UniqueID )
                        $out->Own = true;
                    $outlist[] = $out;
                }
                die( 'ok<!--separate-->{"response":1,"messages":' . json_encode( $outlist ) . '}' );
            }
            die( 'fail<!--separate-->{"response":0,"message":"Failed to retrieve messages."}' );
        }
        else if( $args->args->method == 'contacts' )
        {
            $rows = $SqlDatabase->FetchObjects( '
                SELECT * FROM (
                    SELECT 
                        u.UniqueID AS `ID`,
                        "User" as `Type`,
                        u.Name as `Nickname`,
                        u.FullName as `Fullname`
                    FROM FUser u, FUserToGroup mes, FUserToGroup fug, FUserGroup ug
                    WHERE
                            ug.Type = "Workgroup"
                        AND mes.UserGroupID = ug.ID
                        AND mes.UserID = \'' . $User->ID . '\'
                        AND fug.UserGroupID = ug.ID
                        AND fug.UserID = u.ID
                        AND fug.UserID != mes.UserID
                ) a UNION (
                    SELECT 
                        f.ID AS `ID`,
                        "Contact" AS `Type`,
                        f.Firstname as `Nickname`,
                        CONCAT( f.Firstname, f.Lastname ) AS `Fullname`
                    FROM FContact f
                    WHERE
                        f.OwnerUserID = \'' . $User->ID . '\'
                )
                ORDER BY Fullname ASC
            ' );
            if( $rows && count( $rows ) > 0 )
            {
                die( 'ok<!--separate-->{"response":1,"contacts":' . json_encode( $rows ) . '}' );
            }
            die( 'fail<!--separate-->{"response":0,"message":"Failed to retrieve contacts."}' );
        }
        die( 'fail<!--separate-->{"response":0,"message":"Unknown method."}' );
    }
}

/* If we end up here in the module call, it means we are ready to longpoll    */

// Hold until we get an event
$retries = 10;
while( !( $row = $SqlDatabase->FetchObject( '
    SELECT * FROM MessageSession WHERE SessionID=\'' . $UserSession->SessionID . '\' AND ActivityDate != PrevDate
' ) ) )
{
    //error_log( '[convos.php] We are in long polling for ' . $User->Name . ' (' . $UserSession->SessionID . ')' );
    if( $retries-- < 0 )
    {
        //error_log( '[convos.php] Hang up.' );
        break;
    }
    sleep( 1 );
}
if( $row )
{
   // Next time is different
   if( $sess->ID )
   {
       $sess->ActivityDate = date( 'Y-m-d H:i:s' );
       $sess->PrevDate = '1970-01-01 12:00:00';
       $sess->Save();
   }
   //error_log( '[convos.php] We got activity!! ' . $User->Name );
   die( 'ok<!--separate-->{"message":"We got activity after long poll","response":200}' );
}
die( 'fail<!--separate-->{"message":"No event.","response":-1}' );

?>
