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

$response = new stdClass();

if( isset( $args->args ) )
{
    if( isset( $args->args->outgoing ) )
    {
        // Prepare successful response
        $response->response = '1';
        $response->message = 'Stored message(s).';
        $response->messages = [];
        
        foreach( $args->args->outgoing as $out )
        {
            $o = new dbIO( 'Message' );
            $o->UniqueUserID = $User->UniqueID;
            $o->RoomID = 0;
            $o->RoomType = 'jeanie';
            $o->ParentID = 0;
            $o->DateUpdated = date( 'Y-m-d H:i:s' );
            $o->Date = date( 'Y-m-d H:i:s', $out->timestamp );
            $o->Message = $out->message;
            $o->Save();
            
            // Add to response
            if( $o->ID > 0 )
            {
                $s = new stdClass();
                $s->Date = $o->Date;
                $s->Message = $o->Message;
                $s->Username = $User->Name;
                $s->Avatar = 'default';
                $s->Own = true;
                $response->messages[] = $s;
            }
        }
        
        if( count( $response->messages ) > 0 )
        {
            die( 'ok<!--separate-->' . json_encode( $response ) );
        }
        die( 'fail<!--separate-->{"response":0,"message":"Failed to store message(s)."}' );
    }
    if( isset( $args->args->method ) )
    {
        if( $args->args->method == 'messages' )
        {
            $rows = false;
            if( isset( $args->args->roomType ) && $args->args->roomType == 'jeanie' )
            {
                $rows = $SqlDatabase->FetchObjects( '
                    SELECT m.Message, m.Date, u.Name, u.UniqueID FROM `Message` m, FUser u WHERE
                    m.RoomType = \'jeanie\' AND m.UniqueUserID=\'' . $User->UniqueID . '\' AND
                    m.UniqueUserID = u.UniqueID
                    ORDER BY m.Date ASC, m.ID ASC LIMIT 50
                ' );
            }
            // We got rows!
            if( $rows && count( $rows ) > 0 )
            {
                $outlist = [];
                foreach( $rows as $k=>$v )
                {
                    $out = new stdClass();
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
            die( 'fail<!--separate-->{"response":0,"message":"Failed to retrieve messages.' );
        }
    }
}


// Hold until we get an event
$eventCount = 0;
do
{
}
while( !$eventCount );
die( 'fail<!--separate-->{"message":"No event.","response":-1}' );

?>
