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

/*******************************************************************************
*                                                                              *
* This file manages the app "convos", and handles actions related to contacts, *
* messaging, message related shared files, thumbnails and push notifications.  *
*                                                                              *
*******************************************************************************/

global $Logger;

ini_set( 'max_execution_time', '300' ); // Die after 5 minutes

// Send a message
function sendUserMsg( $msg )
{
	global $User, $Config;
	
	$arr = []; $n = 0;
	foreach( $msg as $k=>$m )
	{
		if( $k == 'msg' )
		{
			$m = addslashes( $m );
		}
		$arr[ $k ] = $m;
	}
	
	FriendCall( ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/user/session/sendmsg/?servertoken=' . $User->ServerToken,
		false, $arr );
}

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
    if( is_string( $args->args ) && !json_decode( $args->args ) )
    {
        die( 'fail<!--separate-->{"message":"Could not interpret call.","response":0}' );
    }
    if( isset( $args->args->outgoing ) )
    {
        //error_log( '[convos.php] Incoming messages.' );
        
        // Prepare successful response
        $response->response = '1';
        $response->message = 'Stored message(s).';
        $response->messages = [];
        
        $topicTest = false;
        
        foreach( $args->args->outgoing as $out )
        {
            // Do not save empty messages.
            if( !trim( $out->message ) ) continue;
            
            $o = new dbIO( 'Message' );
            $o->UniqueUserID = $User->UniqueID;
            $o->RoomID = 0;
            $o->RoomType = $out->type ? $out->type : 'jeanie';
            $o->ParentID = $out->type == 'jeanie' ? $out->targetId : 0;
            if( isset( $out->targetId ) )
            {
                $o->TargetID = $out->targetId;
                
                // Update sessions
                if( $o->RoomType == 'dm-user' )
                {
                    $SqlDatabase->query( 'UPDATE MessageSession SET ActivityDate=\'' . date( 'Y-m-d H:i:s' ) . '\', PrevDate=\'1970-01-01 12:00:00\' WHERE UniqueUserID=\'' . $SqlDatabase->_link->real_escape_string( $o->TargetID ) . '\'' );
                    
                    // Check if user haven't been online for a while
                    $cf = isset( $GLOBALS[ 'configfilesettings' ] ) ? $GLOBALS[ 'configfilesettings' ] : false;
                    if( $cf && isset( $cf[ 'Security' ] ) && isset( $cf[ 'Security' ][ 'push_system' ] ) )
					{		                
		                $targetUser = new dbUser();
		                $targetUser->UniqueID = $o->TargetID;
		                if( $targetUser->Load() )
		                {
				            $options = new stdClass();
				            $options->Condition = 'activity';
				            $options->Seconds = 150; // 2.5 minutes since last activity
				            $message = new stdClass();
				            $message->Title = $User->FullName . ' - Friend OS';
				            $message->Body = $out->message;
				            $message->Application = 'Convos';
				            $message->ApplicationData = '{"uuid":"' . $User->UniqueID . '","type":"dm-user"}';
				            $User->WebPush( $targetUser, $options, $message );
			            }
		            }
                }
            }
            $o->DateUpdated = date( 'Y-m-d H:i:s' );
            $o->Date = date( 'Y-m-d H:i:s', $out->timestamp );
            $o->Message = $out->message;
            $o->Save();
            
            if( $out->type == 'jeanie' && !$topicTest )
            {
            	$topicTest = true;
            	$p = new dbIO( 'Message' );
            	if( $p->Load( $o->ParentID ) )
            	{
            		if( $p->Message == 'Start of history.' )
            		{
            			$p->Message = $o->Message;
            			$p->Save();
            		}
            	}
            }
            
            //error_log( '[convos.php] Saved the message - got ID: ' . $o->ID );
            
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
                $Logger->log( 'Added message. ' . strlen( $out->message ) );
            }
            else
            {
            	$Logger->log( 'Failed to add message. ' . strlen( $out->message ) );
            }
        }
        
        if( count( $response->messages ) > 0 )
        {
            // Update sessions
            $SqlDatabase->query( 'UPDATE MessageSession SET ActivityDate=\'' . date( 'Y-m-d H:i:s' ) . '\', PrevDate=\'1970-01-01 12:00:00\' WHERE UniqueUserID=\'' . $User->UniqueID . '\'' );
        
            if( !isset( $args->args->method ) )
            {
                die( 'ok<!--separate-->' . json_encode( $response ) );
            }
        }
        if( !isset( $args->args->method ) )
        {
            die( 'fail<!--separate-->{"response":0,"message":"Failed to store message(s)."}' );
        }
    }
    if( isset( $args->args->method ) )
    {
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
            	$limiter = '';
            	if( isset( $args->args->startMessage ) && isset( $args->args->mode ) && $args->args->mode == 'history' )
            	{
            		$limiter = ' AND m.ID < ' . intval( $args->args->startMessage, 10 );
            	}
            
            	// Get all messages by paging
            	if( $args->args->roomType == '*' )
            	{
            		// Pages start on 0, then 1, 2, 3 etc (multiplied by 100)
            		$page = isset( $args->args->page ) ? intval( $args->args->page, 10 ) : 0;
            		$rows = $SqlDatabase->FetchObjects( $q = ( '
            			SELECT m.*, owner.ID AS `FlatUserID`, owner.UniqueID, owner.FullName AS `Name` FROM Message m, FUser u, FUser owner
            			WHERE
            				(
		        				m.RoomType = \'dm-user\' AND 
				                ( 
				                    ( 
				                        m.UniqueUserID = \'' . $User->UniqueID . '\' AND 
				                        m.UniqueUserID = u.UniqueID AND
				                        owner.UniqueID = m.UniqueUserID
				                    )
				                    OR
				                    (
				                        m.UniqueUserID != \'' . $User->UniqueID . '\' AND
				                        m.UniqueUserID = u.UniqueID AND
				                        m.TargetID = \'' . $User->UniqueID . '\' AND
				                        owner.UniqueID = m.UniqueUserID
				                    )
				                )
			                )
			                OR
			                (
			                	m.RoomType = \'chatroom\' AND 
				                ( 
				                    m.UniqueUserID = u.UniqueID AND
				                    m.TargetID != \'' . $User->UniqueID . '\' AND
				                    owner.UniqueID = m.UniqueUserID
				                )
			                )
            			ORDER BY m.ID DESC LIMIT ' . ( $page * 100 ) . ', 100
            		' ) );
            	}
                else if( $args->args->roomType == 'jeanie' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                        SELECT 
                            m.ID, m.Seen, m.Message, m.Date, u.Name, u.FullName, u.UniqueID FROM `Message` m, FUser u 
                        WHERE
                            m.RoomType = \'jeanie\' AND m.UniqueUserID=\'' . $User->UniqueID . '\' AND
                            m.ParentID = \'' . ( isset( $args->args->cid ) ? $SqlDatabase->_link->real_escape_string( $args->args->cid ) : '0' ) . '\' AND m.UniqueUserID = u.UniqueID' . $lastId . '
                        ' . $limiter . '
                        ORDER BY 
                            m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
                else if( $args->args->roomType == 'dm-contact' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                    SELECT 
                        m.ID, m.Seen, m.Message, m.Date, u.Name, u.UniqueID FROM `Message` m, FContact u 
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
                    ' . $limiter . '
                    ORDER BY 
                        m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
                else if( $args->args->roomType == 'dm-user' )
                {
                    $rows = $SqlDatabase->FetchObjects( '
                    SELECT 
                        m.ID, m.Seen, m.Message, m.Date, u.Name, u.FullName, u.UniqueID FROM `Message` m, FUser u 
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
                    ' . $limiter . '
                    ORDER BY 
                        m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
                else if( $args->args->roomType == 'chatroom' )
                {
                	$rows = $SqlDatabase->FetchObjects( '
                    SELECT 
                        m.ID, m.Seen, m.Message, m.Date, u.Name, u.FullName, u.UniqueID FROM `Message` m, FUser u 
                    WHERE
                        m.RoomType = \'chatroom\' AND 
                        ( 
                            m.UniqueUserID = u.UniqueID AND
                            m.TargetID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->cid ) . '\'
                        )' . $lastId . '
                    ' . $limiter . '
                    ORDER BY 
                        m.Date DESC, m.ID DESC LIMIT 50
                    ' );
                }
            }
            // We got rows!
            $tz = date_default_timezone_get();
            if( $rows && count( $rows ) > 0 )
            {
                $outlist = [];
                foreach( $rows as $k=>$v )
                {
                    $out = new stdClass();
                    $out->ID = $v->ID;
                    if( isset( $v->FlatUserID ) )
                    	$out->FlatUserID = $v->FlatUserID;
                	if( isset( $v->Name ) )
	                    $out->Name = $v->Name;
                    if( isset( $v->Name ) )
	                    $out->FullName = $v->FullName;
                    $out->Message = $v->Message;
                    $out->Date = $v->Date;
                    $out->Timezone = $tz;
                    $out->Timestamp = strtotime( $v->Date );
                    $out->Own = false;
                    $out->Seen = $v->Seen;
                    if( isset( $v->UniqueID ) )
	                    if( $v->UniqueID == $User->UniqueID )
    	                    $out->Own = true;
                    $outlist[] = $out;
                }
                die( 'ok<!--separate-->{"response":1,"messages":' . json_encode( $outlist ) . '}' );
            }
            // We got messages instead from the args->outgoing
            else if( isset( $response->messages ) )
            {
                die( 'ok<!--separate-->' . json_encode( $response ) );
            }
            die( 'fail<!--separate-->{"response":0,"message":"Failed to retrieve messages."}' );
        }
        else if( $args->args->method == 'message-edit' ) 
        {
        	$m = new dbIO( 'Message' );
        	if( $m->Load( $args->args->mid ) )
        	{
        		if( $m->UniqueUserID == $User->UniqueID )
        		{
        			$m->Message = urldecode( $args->args->message );
        			$m->DateUpdated = date( 'Y-m-d H:i:s' );
        			$m->Save();
        			die( 'ok<!--separate-->{"message":"Message updated.","response":1}' );
        		}
        	}
        	die( 'fail<!--separate-->{"message":"Could not update message.","response":-1}' );
        }
        else if( $args->args->method == 'message-seen' )
        {
        	$vet = [];
        	foreach( $args->args->messages as $m )
        		$vet[] = intval( $m, 10 );
        	
        	if( count( $vet ) > 0 )
        	{
        		// Get users
        		if( $users = $SqlDatabase->fetchObjects( '
        			SELECT u.* FROM FUser u, `Message` m 
        			WHERE 
        				u.UniqueID = m.UniqueUserID AND 
        				m.ID IN ( ' . implode( ',', $vet ) . ' )
        		' ) )
        		{
        			foreach( $users as $user )
        			{
        				// Notify user that we invited them!
						$msg = new stdClass();
						$msg->appname = 'Convos';
						$msg->dstuniqueid = $user->UniqueID;
						$sub = new stdClass();
						$sub->type = 'update-seen';
						$sub->messages = $vet;
						$msg->msg = json_encode( $sub );
						sendUserMsg( $msg );
        			}
    			}
        		
		    	$outstr = 'UPDATE `Message` SET `Seen`=\'1\' WHERE `Seen` != \'1\' AND `ID` IN ( ' . implode( ',', $vet ) . ' )';
		    	$SqlDatabase->query( $outstr );
		    	
		    	die( 'ok' );
	    	}
	    	die( 'fail' );
        }
        // Get public groups
        else if( $args->args->method == 'public_groups' )
        {
        	$key = $SqlDatabase->_link->real_escape_string( $args->args->searchString );
        	$page = intval( $args->args->page, 10 );
        	if( $rows = $SqlDatabase->fetchObjects( '
        		SELECT * FROM FUserGroup fug
        		WHERE
        			fug.Type = "chatroom" AND
        			fug.Status = 1 AND
        			( fug.Name LIKE "%' . $key . '%" OR fug.Description LIKE "%' . $key . '%" )
    			ORDER BY
    				fug.Name ASC
    			LIMIT ' . $page . ',' . ( $page + 100 ) . '
        	' ) )
        	{
        		$out = [];
        		foreach( $rows as $r )
        		{
        			$o = new stdClass();
        			$o->Name = $r->Name;
        			$o->Description = $r->Description;
        			$o->UniqueID = $r->UniqueID;
        			$o->FlatUserID = $r->UniqueID;
        			$o->Type = 'chatroom';
        			if( $cnt = $SqlDatabase->fetchObject( 'SELECT COUNT(*) AS CNT FROM FUserToGroup fug WHERE fug.UserGroupID=\'' . $r->ID . '\'' ) )
        			{
        				$o->Count = $cnt->CNT;
    				}
        			$out[] = $o;
        		}
        		die( 'ok<!--separate-->' . json_encode( $out ) );
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'join-room' )
        {
        	$o = new dbIO( 'FUserGroup' );
        	$o->UniqueID = $args->args->cid;
        	if( $o->Load() )
        	{
        		// Open group
        		if( $o->Status == 1 )
        		{
        			$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $User->ID . '\', \'' . $o->ID . '\' )' );
        			die( 'ok<!--separate-->' );
        		}
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'delete-chatroom' )
        {
            $o = new dbIO( 'FUserGroup' );
            $o->UniqueID = $args->args->gid;
            if( $o->Load() )
            {
                if( $o->UserID == $User->ID && $o->Type == 'chatroom' )
                {
                    // Delete user relations
                    $SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $o->ID . '\'' );
                    // Remove group
                    $o->Delete();
                    die( 'ok<!--separate-->{"message":"Chatroom deleted.","response":"1"}' );
                }
            }
            die( 'fail<!--separate-->{"message":"Chatroom not found.","response":"-1"}' );
        }
        // Get the original file OR
        // Get an attachment on ID
        else if( $args->args->method == 'getattachment' || $args->args->method == 'getoriginal' || $args->args->method == 'getupload' )
        {
        	// Check share
        	$o = new dbIO( 'FShared' );
        	if( $o->Load( $args->args->attachment ) )
        	{
        		if( $o->Mode == 'attachment' )
        		{
        			if( $o->SharedType == 'chatroom' )
        			{
						// Check we're in group
						if( $g = $SqlDatabase->fetchObject( '
							SELECT g.* FROM FUserToGroup ug, FUserGroup g
							WHERE
								ug.UserGroupID = \'' . $o->SharedID . '\' AND
								ug.UserID = \'' . $User->ID . '\' AND
								ug.UserGroupID = g.ID
						' ) )
						{
							$u = new dbIO( 'FUser' );
							if( $u->Load( $o->OwnerUserID ) )
							{
								$f = new File( $o->Data );
								
								$part = explode( '.', $o->Data );
								$part = array_pop( $part );
								switch( strtolower( $part ) )
								{
									case 'png':
										$part = 'png';
									case 'jpeg':
									case 'jpg':
										$part = 'jpg';
										break;
									case 'gif':
										$part = 'gif';
										break;
									case 'pdf':
										$ext = 'pdf';
										$part = false;
										break;
									default:
										$part = false;
										break;
								}
								
								$f->SetAuthContext( 'servertoken', $u->ServerToken );
								if( $args->args->method == 'getattachment' )
								{
									$flags = new stdClass();
									$flags->width = 512; $flags->height = 512;
									$f->SetPostProcessor( 'thumbnail', $flags );
								}
								else
								{
									if( $part )
									{
										FriendHeader( 'Content-type: image/' . $part );
										$f->LoadStreaming( $o->Data );
										die();
									}
									else if( isset( $ext ) && $ext == 'pdf' )
									{
										FriendHeader( 'Content-type: applicaoition/pdf' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										$f->LoadStreaming( $o->Data );
										die();
									}
									else
									{
										FriendHeader( 'Content-type: application/octet-stream' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										$f->LoadStreaming( $o->Data );
										die();
									}
								}
								if( $f->Load( $o->Data ) )
								{	
									if( $part )
									{
										FriendHeader( 'Content-type: image/' . $part );
										die( $f->_content );
									}
									else if( isset( $ext ) && $ext == 'pdf' )
									{
										FriendHeader( 'Content-type: application/pdf' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										die( $f->_content );
									}
									else
									{
										FriendHeader( 'Content-type: application/octet-stream' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										die( $f->_content );
									}
								}
								die( 'fail<!--separate-->' );
							}
						}
					}
					else if( $o->SharedType == 'dm-user' )
					{
						// Check we're in the same group
						if( $g = $SqlDatabase->fetchObject( '
							SELECT ug.* FROM FUserToGroup ug, FUserToGroup ug2
							WHERE
								ug.UserGroupID = ug2.UserGroupID AND
								ug.UserID = \'' . $User->ID . '\' AND
								ug2.UserID = \'' . $o->SharedID . '\'
							LIMIT 1
						' ) )
						{
							$u = new dbIO( 'FUser' );
							if( $u->Load( $o->OwnerUserID ) )
							{
								$f = new File( $o->Data );
								
								$part = explode( '.', $o->Data );
								$part = array_pop( $part );
								switch( strtolower( $part ) )
								{
									case 'png':
										$part = 'png';
									case 'jpeg':
									case 'jpg':
										$part = 'jpg';
										break;
									case 'gif':
										$part = 'gif';
										break;
									case 'pdf':
										$ext = 'pdf';
										$part = false;
										break;
									default:
										$part = false;
										break;
								}
								
								$f->SetAuthContext( 'servertoken', $u->ServerToken );
								if( $args->args->method == 'getattachment' )
								{
									$flags = new stdClass();
									$flags->width = 512; $flags->height = 512;
									$f->SetPostProcessor( 'thumbnail', $flags );
								}
								else
								{
									if( $part )
									{
										FriendHeader( 'Content-type: image/' . $part );
										$f->LoadStreaming( $o->Data );
										die();
									}
									else if( isset( $ext ) && $ext == 'pdf' )
									{
										FriendHeader( 'Content-type: applicaoition/pdf' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										$f->LoadStreaming( $o->Data );
										die();
									}
									else
									{
										FriendHeader( 'Content-type: application/octet-stream' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										$f->LoadStreaming( $o->Data );
										die();
									}
								}
								if( $f->Load( $o->Data ) )
								{
									if( $part )
									{
										FriendHeader( 'Content-type: image/' . $part );
										die( $f->_content );
									}
									else if( isset( $ext ) && $ext == 'pdf' )
									{
										FriendHeader( 'Content-type: applicaoition/pdf' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										die( $f->_content );
									}
									else
									{
										FriendHeader( 'Content-type: application/octet-stream' );
										FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
										die( $f->_content );
									}
								}
							}
						}
					}
					else if( $o->SharedType == 'jeanie' )
					{
						$f = new File( $o->Data );
						
						$part = explode( '.', $o->Data );
						$part = array_pop( $part );
						switch( strtolower( $part ) )
						{
							case 'png':
								$part = 'png';
							case 'jpeg':
							case 'jpg':
								$part = 'jpg';
								break;
							case 'gif':
								$part = 'gif';
								break;
							case 'pdf':
								$ext = 'pdf';
								$part = false;
								break;
							default:
								$part = false;
								break;
						}
						
						if( $args->args->method == 'getattachment' )
						{
							$flags = new stdClass();
							$flags->width = 512; $flags->height = 512;
							$f->SetPostProcessor( 'thumbnail', $flags );
						}
						else
						{
							if( $part )
							{
								FriendHeader( 'Content-type: image/' . $part );
								$f->LoadStreaming( $o->Data );
								die();
							}
							else if( isset( $ext ) && $ext == 'pdf' )
							{
								FriendHeader( 'Content-type: applicaoition/pdf' );
								FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
								$f->LoadStreaming( $o->Data );
								die();
							}
							else
							{
								FriendHeader( 'Content-type: application/octet-stream' );
								FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
								$f->LoadStreaming( $o->Data );
								die();
							}
						}
						if( $f->Load( $o->Data ) )
						{
							if( $part )
							{
								FriendHeader( 'Content-type: image/' . $part );
								die( $f->_content );
							}
							else if( isset( $ext ) && $ext == 'pdf' )
							{
								FriendHeader( 'Content-type: application/pdf' );
								FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
								die( $f->_content );
							}
							else
							{
								FriendHeader( 'Content-type: application/octet-stream' );
								FriendHeader( 'Content-disposition: download; filename="' . $f->Filename . '"' );
								die( $f->_content );
							}
						}
					}
				}
    		}
			die( 'fail<!--separate-->{"message":"Could not find attachment.","response":-1}' );
        }
        else if( $args->args->method == 'onlinestatus' )
        {
        	$ar = '';
        	$a = 0;
        	foreach( $args->args->users as $u )
        	{
        		if( $a != 0 )
        			$ar .= ',';
        		$a++;
        		$ar .= '"' . $u . '"';
        	}
        	if( $us = $SqlDatabase->fetchObjects( '
        		SELECT FullName, LoginTime, LastActionTime, UniqueID FROM FUser WHERE UniqueID IN ( ' . $ar . ' )
        	' ) )
        	{
        		$status = [];
        		$now = mktime();
        		foreach( $us as $u )
        		{
        			$o = new stdClass();
        			$o->Name = $u->FullName;
        			$o->UniqueID = $u->UniqueID;
        			$o->OnlineStatus = 'offline';
        			$o->Diff = $now - $u->LastActionTime;
        			if( $o->Diff <= 300 )
        			{
        				$o->OnlineStatus = 'online';
        			}
    				$status[] = $o;
        		}
        		die( 'ok<!--separate-->' . json_encode( $status ) );
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'addupload' )
        {
        	$f = new File( $args->args->path );
        	$f->Load( $args->args->path );
        	
        	// Set sharing on group
        	if( isset( $args->args->groupId ) )
        	{
		    	$g = new dbIO( 'FUserGroup' );
				$g->UniqueID = $args->args->groupId;
				if( $g->Load() )
				{
					$o = new dbIO( 'FShared' );
					$o->OwnerUserID = $User->ID;
					$o->SharedType = 'chatroom';
					$o->SharedID = $g->ID;
					$o->Mode = 'attachment';
					$o->Data = $args->args->path;
					if( !$o->Load() )
						$o->DateCreated = date( 'Y-m-d H:i:s' );
					$o->DateTouched = date( 'Y-m-d H:i:s' );
					$o->Save();
					if( $o->ID > 0 )
					{
						$args = new stdClass();
						if( $args->args->type == 'pdf' || $args->args->type == 'file' )
							$args->method = 'getupload';
						else $args->method = 'getattachment';
						$args->attachment = $o->ID;
						$args = json_encode( $args );
						$url = '/system.library/module/?module=system&command=convos&args=' . urlencode( $args );
						die( 'ok<!--separate-->{"message":"Attachment uploaded.","response":1,"type":"' . $args->args->type . '","url":"' . $url . '"}' );
					}
				}
			}
			// Set sharing on user
			else if( isset( $args->args->userId ) )
			{
				$g = new dbIO( 'FUser' );
				$g->UniqueID = $args->args->userId;
				if( $g->Load() )
				{
					$o = new dbIO( 'FShared' );
					$o->OwnerUserID = $User->ID;
					$o->SharedType = 'dm-user';
					$o->SharedID = $g->ID;
					$o->Mode = 'attachment';
					$o->Data = $args->args->path;
					if( !$o->Load() )
						$o->DateCreated = date( 'Y-m-d H:i:s' );
					$o->DateTouched = date( 'Y-m-d H:i:s' );
					$o->Save();
					if( $o->ID > 0 )
					{
						$args = new stdClass();
						$args->method = 'getattachment';
						$args->attachment = $o->ID;
						$args = json_encode( $args );
						$url = '/system.library/module/?module=system&command=convos&args=' . urlencode( $args );
						die( 'ok<!--separate-->{"message":"Attachment uploaded.","response":1,"type":"' . $args->args->type . '","url":"' . $url . '"}' );
					}
				}
			}
			// Set sharing on AI
			else if( isset( $args->args->context ) && $args->args->context == 'jeanie' )
			{
				$o = new dbIO( 'FShared' );
				$o->OwnerUserID = $User->ID;
				$o->SharedType = 'jeanie';
				$o->SharedID = 0;
				$o->Mode = 'attachment';
				$o->Data = $args->args->path;
				if( !$o->Load() )
					$o->DateCreated = date( 'Y-m-d H:i:s' );
				$o->DateTouched = date( 'Y-m-d H:i:s' );
				$o->Save();
				if( $o->ID > 0 )
				{
					$args = new stdClass();
					$args->method = 'getattachment';
					$args->attachment = $o->ID;
					$args = json_encode( $args );
					$url = '/system.library/module/?module=system&command=convos&args=' . urlencode( $args );
					die( 'ok<!--separate-->{"message":"Attachment uploaded.","response":1,"type":"' . $args->args->type . '","url":"' . $url . '"}' );
				}
			}
        	die( 'fail<!--separate-->{"response":0,"message":"Failed to load attachment."}' );
        }
        else if( $args->args->method == 'kickuser' )
        {
        	if( !isset( $args->args->gid ) ) die( 'fail<!--separate-->{"response":-1,"message":"Invalid call."}' );
        	$g = new dbIO( 'FUserGroup' );
        	$g->UserID = $User->ID; 
        	$g->UniqueID = $args->args->gid;
        	if( $g->Load() && isset( $args->args->uid ) )
        	{
        		$u = new dbIO( 'FUser' );
        		$u->UniqueID = $args->args->uid;
        		if( $u->Load() )
        		{
        			$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $u->ID . '\' AND UserGroupID=\'' . $g->ID . '\'' );
        			die( 'ok<!--separate-->{"response":1,"message":"User removed from group."}' );
    			}
        	}
        	die( 'fail<!--separate-->{"response":-1,"message":"Nothing to do."}' );
        }
        else if( $args->args->method == 'getrooms' )
        {
        	if( $rows = $SqlDatabase->fetchObjects( '
        		SELECT y.* FROM
        			FUserGroup y, FUserToGroup l
    			WHERE
    				l.UserID = \'' . $User->ID . '\' AND
    				l.UserGroupID = y.ID AND
    				y.Type = \'chatroom\'
				ORDER BY
					y.Name ASC
        	' ) )
        	{
        		$out = [];
        		$isset = [];
        		foreach( $rows as $row )
        		{
        			// Filter duplicates!
        			if( isset( $isset[ $row->ID ] ) )
        				continue;
        			$isset[ $row->ID ] = true;
        			$o = new stdClass();
        			$o->UniqueID = $row->UniqueID;
        			$o->Name = $row->Name;
        			$o->Description = $row->Description;
        			$o->Own = false;
        			if( $row->UserID == $User->ID )
        				$o->Own = true;
        			$out[] = $o;
        		}
        		die( 'ok<!--separate-->' . json_encode( $out ) );
        	}
        	die( 'fail<!--separate-->{"message":"You have no chat room.","response":-1}' );
        }
        else if( $args->args->method == 'get-group' )
        {
        	$l = new dbIO( 'FUserGroup' );
        	$l->UniqueID = $args->args->cid;
        	if( $l->Load() )
        	{
        		$o = new stdClass();
        		$o->UniqueID = $l->UniqueID;
        		$o->Name = $l->Name;
        		$o->Description = $l->Description;
        		$o->Status = $l->Status;
        		die( 'ok<!--separate-->' . json_encode( $o ) );
        	}
        	die( 'fail<!--separate-->{"message":"No such group.","response":-1}' );
        }
        else if( $args->args->method == 'chatroom-status' )
        {
        	$l = new dbIO( 'FUserGroup' );
        	$l->UniqueID = $args->args->cid;
        	if( $l->Load() )
        	{
        		$l->Status = $args->args->status;
        		if( $l->Save() )
	        		die( 'ok<!--separate-->' . json_encode( $o ) );
        	}
        	die( 'fail<!--separate-->{"message":"No such group.","response":-1}' );
        }
        // Sets a share parameter for an image and shares it with the group
        else if( $args->args->method == 'setroomavatar' )
        {
        	// Share file with group
        	if( $args->args->groupId )
        	{
		    	$f = new File( $args->args->path );
		    	if( $f->Load( $args->args->path ) )
		    	{
		    		$g = new dbIO( 'FUserGroup' );
		    		$g->UniqueID = $args->args->groupId;
		    		if( $g->Load() )
		    		{
						$o = new dbIO( 'FShared' );
						$o->OwnerUserID = $User->ID;
						$o->SharedType = 'chatroom';
						$o->SharedID = $g->ID;
						$o->Mode = 'room-avatar';
						if( !$o->Load() )
							$o->DateCreated = date( 'Y-m-d H:i:s' );
						if( $o->OwnerUserID != $User->ID )
						{
							die( 'fail<!--separate-->{"message":"User mismatch bug.","response":-1}' );
						}
						$o->Data = $args->args->path;
						$o->DateTouched = date( 'Y-m-d H:i:s' );
						$o->Save();
						if( $o->ID > 0 )
						{
							die( 'ok<!--separate-->{"message":"Shared image.","response":1}' );
						}
		    		}
		    	}
	    	}
        	die( 'fail<!--separate-->{"message":"Could not set chat room avatar.","response":-1}' );
        }
        // Gets a room avatar
        else if( $args->args->method == 'getroomavatar' )
        {
        	// Check if the user is in the group
        	if( $g = $SqlDatabase->fetchObject( $q = ( '
        		SELECT g.* FROM FUserGroup g, FUserToGroup ug
        		WHERE 
        			ug.UserID = \'' . $User->ID . '\' AND
        			g.ID = ug.UserGroupID AND
        			g.UniqueID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->groupid ) . '\'
        	' )) )
        	{
		    	$o = new dbIO( 'FShared' );
				$o->SharedType = 'chatroom';
				$o->SharedID = $g->ID;
				$o->Mode = 'room-avatar';
				if( $o->Load() )
				{
					$n = new dbIO( 'FUser' );
					if( $n->Load( $o->OwnerUserID ) )
					{
						$f = new File( $o->Data );
						$f->SetAuthContext( 'servertoken', $n->ServerToken );
						if( $f->Load( $o->Data ) )
						{
							ob_clean();
							$ext = explode( '.', $o->Data );
							$ext = strtolower( array_pop( $ext ) );
							switch( $ext )
							{
								case 'png':
									FriendHeader( 'Content-Type: image/png' );
									break;
								case 'jpg':
								case 'jpeg':
									FriendHeader( 'Content-Type: image/jpeg' );
									break;
								case 'gif':
									FriendHeader( 'Content-Type: image/gif' );
									break;
							}
									
							die( $f->_content );
						}
					}	
				}
			}
			die( '' );
        }
        else if( $args->args->method == 'addroom' )
        {
        	// Support parent
        	$parentSet = false;
        	if( isset( $args->args->parent ) )
        	{
        		$l = new dbIO( 'FUserGroup' );
        		$l->UserID = $User->ID;
        		$l->ID = $args->args->parent;
        		if( $l->Load() )
        		{
        			$parentSet = $l;
        		}
        	}
        	$o = new dbIO( 'FUserGroup' );
        	$o->UserID = $User->ID;
        	$o->ParentID = $parentSet ? $parentSet->ID : 0;
        	$o->Name = $parentSet ? ( $parentSet->Name . ' chat' ) : $args->args->roomName;
        	$o->Description = $args->args->roomDescription;
        	$o->Type = 'chatroom';
        	$o->Status = 0;
        	$o->UniqueID = hash( 'sha256', 'chatroom|' . $o->Name . '|' . $User->ID . '|' . mktime() );
        	$o->Save();
        	if( $o->ID > 0 )
        	{
        		// Link user
        		$SqlDatabase->Query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $User->ID . '\', \'' . $o->ID . '\' )' );
        		die( 'ok<!--separate-->{"UniqueID":"' . $o->UniqueID . '"}' );
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'createtopic' )
        {
        	$o = new dbIO( 'Message' );
        	$o->RoomID = 0;
        	$o->RoomType = 'jeanie';
        	$o->ParentID = 0;
        	$o->UniqueUserID = $User->UniqueID;
        	$o->TargetID = 0;
        	$o->Message = 'Start of history.';
        	$o->Date = date( 'Y-m-d H:i:s' );
        	$o->DateUpdated = $o->Date;
        	$o->Save();
        	if( $o->ID > 0 )
        	{
        		die( 'ok<!--separate-->{"message":"Successfully created topic.","topicid","' . $o->ID . '","response":1}' );
        	}
        	die( 'fail<!--separate-->{"message":"Failed to create topic.","response",-1}' );
        }
        else if( $args->args->method == 'topics' )
        {
        	if( $rows = $SqlDatabase->fetchObjects( '
        		SELECT * FROM `Message` m WHERE 
        			m.RoomID = 0 AND m.RoomType = \'jeanie\' AND
        			m.ParentID = 0 AND m.UniqueUserID = \'' . $User->UniqueID . '\'
    			ORDER BY DateUpdated DESC
        	' ) )
        	{
        		$out = [];
        		foreach( $rows as $row )
        		{
		    		$o = new stdClass();
		    		$o->ID = $row->ID;
		    		$o->Fullname = substr( $row->Message, 0, 128 );
		    		$o->Date = $row->Date;
		    		$o->DateUpdated = $row->DateUpdated;
		    		$o->RoomType = 'jeanie';
		    		
		    		$out[] = $o;
	    		}
	    		die( 'ok<!--separate-->{"response":1,"topics":' . json_encode( $out ) . '}' );
        	}
        	die( 'fail<!--separate-->{"message":"Failed to find topics.","response",-1}' );
        }
        // Get the events for the user
        else if( $args->args->method == 'getevents' )
        {
        	if( $rows = $SqlDatabase->fetchObjects( '
        		SELECT 
        			e.*, g.Name AS GroupName, u.FullName 
    			FROM 
        			FQueuedEvent e, FUserGroup g, FUser u
        		WHERE
        			e.TargetUserID=\'' . $User->ID . '\' AND
        			( e.Status = \'pending\' OR e.Status = \'seen\' ) AND
        			e.Type = \'chatroom-invite\' AND
        			g.ID = e.TargetGroupID AND
        			u.ID = e.UserID
        		ORDER BY
        			e.Date DESC
        	' ) )
        	{
        		$out = [];
        		foreach( $rows as $row )
        		{
        			$n = new stdClass();
        			$n->Title = $row->Title;
        			$n->Message = $row->Message;
        			$n->Groupname = $row->GroupName;
        			$n->ID = $row->ID;
        			$n->User = $row->FullName;
        			$out[] = $n;
        		}
        		die( 'ok<!--separate-->' . json_encode( $out ) );
        	}
        	die( 'fail<!--separate-->{"message":"Unknown parameters.","response":-1}' );
        }
        // Accept an invite
        else if( $args->args->method == 'accept-invite' )
        {
        	$o = new dbIO( 'FQueuedEvent' );
        	$o->TargetUserID = $User->ID;
        	$o->ID = $args->args->inviteId;
        	if( $o->Load() )
        	{
        		if( $o->Status == 'done' ) 
        			die( 'fail<!--separate-->{"message":"Already processed.","response":-1}' );
        		
        		$o->Status = 'done';
        		$o->Save();
        		
        		$uo = new dbIO( 'FUser' );
        		$uo->Load( $o->UserID );
        		
        		$g = new dbIO( 'FUserGroup' );
        		$g->Load( $o->TargetGroupID );
        		
        		// Notify user that we invited them!
        		$msg = new stdClass();
        		$msg->appname = 'Convos';
        		$msg->dstuniqueid = $uo->UniqueID;
        		$sub = new stdClass();
        		$sub->groupId = $g->UniqueID;
        		$sub->type = 'accept-invite';
        		$sub->message = 'i18n_accepted_invite';
        		$sub->fullname = $User->FullName;
        		$msg->msg = json_encode( $sub );
        		sendUserMsg( $msg );
        		
        		$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $User->ID . '\', \'' . $o->TargetGroupID . '\' )' );
        		die( 'ok<!--separate-->{"message":"Invite accepted.","response":1}' );
        	}
        	die( 'ok<!--separate-->{"message":"Invite error.","response":-1}' );
        }
        // Reject an invite
        else if( $args->args->method == 'reject-invite' )
        {
        	$o = new dbIO( 'FQueuedEvent' );
        	$o->TargetUserID = $User->ID;
        	$o->ID = $args->args->inviteId;
        	if( $o->Load() )
        	{
        		if( $o->Status == 'done' ) 
        			die( 'fail<!--separate-->{"message":"Already processed.","response":-1}' );
        		
        		$o->Delete();
        		
        		die( 'ok<!--separate-->{"message":"Invite rejected.","response":1}' );
        	}
        	die( 'ok<!--separate-->{"message":"Invite error.","response":-1}' );
        }
        // Invite a user to a chat room group
        else if( $args->args->method == 'invite' )
        {
        	if( !isset( $args->args->groupId ) || !isset( $args->args->userId ) )
        	{
        		die( 'fail<!--separate-->{"message":"Unknown parameters.","response":-1}' );
        	}
        	
        	// Fetch target
        	$t = new dbIO( 'FUser' );
        	$t->UniqueID = $args->args->userId;
        	if( $t->Load() )
        	{
        		$g = new dbIO( 'FUserGroup' );
        		$g->UniqueID = $args->args->groupId;
        		if( $g->Load() )
        		{
					$o = new dbIO( 'FQueuedEvent' );
					$o->UserID = $User->ID;
					$o->TargetGroupID = $g->ID;
					$o->TargetUserID = $t->ID;
					$o->Type = 'chatroom-invite';
					$o->Load(); // Fix multiple
					$o->Date = date( 'Y-m-d H:i:s' );
					$o->Status = 'pending';
					$o->Title = 'i18n_invite_to_chatroom';
					$o->Message = 'i18n_invite_to_chatroom_desc';
					$o->ActionSeen = 'none';
					$o->ActionAccepted = 'none';
					$o->ActionRejected = 'none';
					$o->Save();
					if( $o->ID > 0 )
					{
						die( 'ok<--separate-->{"message":"Invite was sent.","response":1}' );
					}
					else
					{
						die( 'fail<!--separate-->{"message":"Failed to save invite.","response":-1}' );
					}
				}
	    	}
	    	die( 'fail<!--separate-->{"message":"Unknown contact.","response":-1}' );
        }
        else if( $args->args->method == 'room-description' )
        {
        	$g = new dbIO( 'FUserGroup' );
        	$g->UserID = $User->ID;
        	$g->UniqueID = $args->args->cid;
        	if( $g->Load() )
        	{
        		$g->Description = $args->args->desc;
        		if( $g->Save() )
        		{
        			die( 'ok<!--separate-->{"message":"Chatroom changed.","response":1}' );
    			}
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'rename-chatroom' )
        {
        	$g = new dbIO( 'FUserGroup' );
        	$g->UserID = $User->ID;
        	$g->UniqueID = $args->args->cid;
        	if( $g->Load() )
        	{
        		$g->Name = $args->args->newname;
        		if( $g->Save() )
        		{
        			die( 'ok<!--separate-->{"message":"Chatroom renamed.","response":1}' );
    			}
        	}
        	die( 'fail<!--separate-->' );
        }
        else if( $args->args->method == 'leavegroup' )
        {
        	$g = new dbIO( 'FUserGroup' );
        	$g->UniqueID = $args->args->cid;
        	if( $g->Load() )
        	{
        		if( $g->UserID == $User->ID ) die( 'fail' );
	        	$SqlDatabase->query( 'DELETE FROM FUserToGroup fug WHERE fug.UserID=\'' . $User->ID . '\' AND fug.UserGroupID=\'' . $g->ID . '\'' );
        	}
        	die( 'ok' );
        }
        else if( $args->args->method == 'deletemessage' )
        {
        	$m = new dbIO( 'Message' );
        	if( $m->Load( $args->args->mid ) )
        	{
		    	if( $m->UniqueUserID == $User->UniqueID )
		    	{
		    		$m->delete();
		    		
		    		die( 'ok<!--separate-->{"message":"Message deleted.","response":1}' );
		    	}
	    	}
        	die( 'fail<!--separate-->{"message":"Message count not be deleted.","response":-1}' );
        }
        else if( $args->args->method == 'contacts' )
        {
            $filterA = $filterB = $groupSpec = $groupContacts = '';
            if( isset( $args->args->filter ) )
            {
                $f = $SqlDatabase->_link->real_escape_string( trim( $args->args->filter ) );
                $filterA = ' AND ( u.Name LIKE "%' . $f . '%" OR u.FullName LIKE "%' . $f . '%" )';
                $filterB = ' AND ( f.Firstname LIKE "%' . $f . '%" OR f.Lastname LIKE "%' . $f . '%" )';
            }
            
            if( isset( $args->args->groupid ) )
            {
            	$groupSpec = ' AND ug.UniqueID = \'' . $SqlDatabase->_link->real_escape_string( $args->args->groupid ) . '\'';
            	$groupContacts = ' 1 = 2 AND '; // Cancel getting contacts here
            }
            
            $rows = $SqlDatabase->FetchObjects( '
                SELECT * FROM (
                    SELECT 
                        u.UniqueID AS `ID`,
                        u.ID AS `UserID`,
                        "User" as `Type`,
                        u.Name as `Nickname`,
                        u.FullName as `Fullname`,
                        u.LastActionTime,
                        u.LoginTime
                    FROM FUser u, FUserToGroup mes, FUserToGroup fug, FUserGroup ug
                    WHERE
                            ( ug.Type = "Workgroup" OR ug.Type = "chatroom" )
                        AND mes.UserGroupID = ug.ID
                        AND mes.UserID = \'' . $User->ID . '\'
                        AND fug.UserGroupID = ug.ID
                        AND fug.UserID = u.ID' . $groupSpec . '
                        AND fug.UserID != mes.UserID' . $filterA . '
                ) a UNION (
                    SELECT 
                        f.ID AS `ID`,
                        "" AS `UserID`,
                        "Contact" AS `Type`,
                        f.Firstname as `Nickname`,
                        CONCAT( f.Firstname, f.Lastname ) AS `Fullname`,
                        1 AS `LastActionTime`,
                        1 AS `LoginTime`
                    FROM FContact f
                    WHERE
                    	' . $groupContacts . '
                        f.OwnerUserID = \'' . $User->ID . '\'' . $filterB . '
                )
                ORDER BY LastActionTime DESC, LoginTime DESC, Fullname ASC
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
        //error_log( '[convos.php] Hang up. ' . $UserSession->SessionID );
        break;
    }
    sleep( 1 );
}
if( $row )
{
   // We've seen the changes
   if( $sess->ID )
   {
       $sess->ActivityDate = date( 'Y-m-d H:i:s' );
       $sess->PrevDate = $sess->ActivityDate;
       $sess->Save();
       //error_log( '[convos.php] Activity, saving session! -> ' . $UserSession->SessionID );
   }
   else
   {
       //error_log( '[convos.php] We got activity!! ' . $User->Name );
   }
   die( 'ok<!--separate-->{"message":"We got activity after long poll","response":200}' );
}
die( 'fail<!--separate-->{"message":"No event.","response":-1}' );

?>
