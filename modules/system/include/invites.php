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

global $Config;

error_reporting( E_ALL & ~E_NOTICE );
ini_set( 'display_errors', 1 );

include_once( 'php/include/helpers.php' );
include_once( 'php/classes/mailserver.php' );

$serverToken = false;
if( $adminUser = $SqlDatabase->fetchObject( '
	SELECT u.* FROM FUser u, FUserToGroup fug, FUserGroup g
	WHERE
		g.Name = "Admin" AND fug.UserID = u.ID AND fug.UserGroupID = g.ID
		LIMIT 1
' ) )
{
	$serverToken = $adminUser->ServerToken;
}

$reinvite = false; // In case we are reinviting

if( $args->command )
{
	$Conf = parse_ini_file( 'cfg/cfg.ini', true );
	
	$ConfShort = new stdClass();
	$ConfShort->SSLEnable = $Conf[ 'Core' ][ 'SSLEnable' ];
	$ConfShort->FCPort    = $Conf[ 'Core' ][ 'port' ];
	$ConfShort->FCHost    = $Conf[ 'FriendCore' ][ 'fchost' ];
	
	// Base url --------------------------------------------------------------------
	$port = '';
	if( $ConfShort->FCHost == 'localhost' && $ConfShort->FCPort )
	{
		$port = ':' . $ConfShort->FCPort;
	}
	// Apache proxy is overruling port!
	if( isset( $Conf[ 'Core' ][ 'ProxyEnable' ] ) &&
		$Conf[ 'FriendCore' ][ 'ProxyEnable' ] == 1 )
	{
		$port = '';
	}

	$baseUrl = ( isset( $Conf[ 'Core' ][ 'SSLEnable' ] ) && 
		$Conf[ 'Core' ][ 'SSLEnable' ] == 1 ? 'https://' : 'http://' 
	) .
	$Conf[ 'FriendCore' ][ 'fchost' ] . $port;
	
	switch( $args->command )
	{
		
		case 'generateinvite':
			
			// generateinvite (args: workgroups=1,55,325,4)
			
			$data = new stdClass();
			$data->app  = 'FriendChat';
			$data->mode = 'presence';
			$data->description = 'Update relation between user and other users';
			
			if( isset( $args->args->workgroups ) && $args->args->workgroups )
			{
				if( $groups = $SqlDatabase->FetchObjects( '
					SELECT ID, Name FROM FUserGroup 
					WHERE Type = "Workgroup" AND ID IN ( ' . $args->args->workgroups . ' ) 
					ORDER BY ID ASC 
				' ) )
				{
					$data->workgroups = $groups;
				}
				else
				{
					die( 'fail<!--separate-->{"Response":"Could not find these workgroups: ' . $args->args->workgroups . '"}' );
				}
			}
			
			$usr = new dbIO( 'FUser' );
			$usr->ID = $User->ID;
			if( $usr->Load() )
			{
				$data->userid     = $usr->ID;
				$data->uniqueid   = $usr->UniqueID;
				$data->username   = $usr->Name;
				$data->fullname   = $usr->FullName;
				
				$f = new dbIO( 'FTinyUrl' );
				$f->Source = ( $baseUrl . '/system.library/user/addrelationship?data=' . urlencode( json_encode( $data ) ) );
				if( $f->Load() )
				{
					die( 'ok<!--separate-->{"Response":"Invite link found","ID":"' . $f->ID . '","Hash":"' . $f->Hash . '","Link":"' . buildUrl( $f->Hash, $Conf, $ConfShort ) . '","Expire":"' . $f->Expire . '"}' );
				}
				else
				{
					$f->UserID = $User->ID;
			
					do
					{
						$hash = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) );
						$f->Hash = substr( $hash, 0, 8 );
					}
					while( $f->Load() );
			
					$f->DateCreated = strtotime( date( 'Y-m-d H:i:s' ) );
					$f->Save();
				}
				
				if( $f->ID > 0 )
				{
					die( 'ok<!--separate-->{"Response":"Invite link successfully created","ID":"' . $f->ID . '","Hash":"' . $f->Hash . '","Link":"' . buildUrl( $f->Hash, $Conf, $ConfShort ) . '","Expire":"' . $f->Expire . '"}' );
				}
			}
			
			die( 'fail<!--separate-->{"Response":"Could not generate invite link"}' );
			
			break;
			
		case 'getinvites':
			
			// getinvites -> gives [{id:32,workgroups:[1,5,32,56]},{...}]
			
			$found = false;
			
			if( $links = $SqlDatabase->FetchObjects( $q = '
				SELECT * FROM FTinyUrl 
				WHERE UserID = ' . $User->ID . ' AND Source LIKE "%/system.library/user/addrelationship%" 
				ORDER BY ID ASC 
			' ) )
			{
				$out = []; $found = true;
				
				foreach( $links as $f )
				{
					if( $f && $f->Source && $f->Hash )
					{
						if( $json = json_decode( decodeUrl( $f->Source ) ) )
						{
							// Filter by group ID
							if( isset( $args->args->groupId ) )
							{
								$found = false;
								if( isset( $json->data->workgroups ) )
								{
									foreach( $json->data->workgroups as $w )
									{
										if( $w->ID == $args->args->groupId )
										{
											$found = true;
											break;
										}
									}
								}
								if( !$found )
									continue;
							}
							
							// Skip the personal invites ... unless listall is defined
							if( isset( $json->contact ) && $json->contact && !isset( $args->args->listall ) )
							{
								continue;
							}
							
							$obj = new stdClass();
							$obj->ID         = $f->ID;
							$obj->Link       = buildUrl( $f->Hash, $Conf, $ConfShort );
							$obj->Contact    = ( isset( $json->contact          ) ? $json->contact          : false );
							$obj->Workgroups = ( isset( $json->data->workgroups ) ? $json->data->workgroups : false );
							$obj->UserID     = ( isset( $json->data->userid     ) ? $json->data->userid     : null  );
							$obj->UniqueID   = ( isset( $json->data->uniqueid   ) ? $json->data->uniqueid   : null  );
							$obj->Username   = ( isset( $json->data->username   ) ? $json->data->username   : null  );
							$obj->FullName   = ( isset( $json->data->fullname   ) ? $json->data->fullname   : null  );
							$obj->App        = ( isset( $json->data->app        ) ? $json->data->app        : null  );
							$obj->Mode       = ( isset( $json->data->mode       ) ? $json->data->mode       : null  );
							
							$out[] = $obj;
						}
					}
				}
				
				if( $out )
				{
					die( 'ok<!--separate-->' . json_encode( $out ) );
				}
			}
			
			die( 'ok<!--separate-->[]' );
			
			break;
			
		case 'removeinvite':
			
			// removeinvite (args: ids=1 or args: ids=1,55,2)
			if( isset( $args->args->ids ) && $args->args->ids )
			{
				if( $SqlDatabase->Query( 'DELETE FROM FTinyUrl WHERE ID IN (' . intval( $args->args->ids, 10 ) . ') ' ) )
				{
					$SqlDatabase->query( '
						DELETE FROM FQueuedEvent
						WHERE InviteLinkID IN (' . intval( $args->args->ids, 10 ) . ') 
					' );
					
					// Included from queuedeventresponse.php
					if( isset( $response ) )
					{
						$response->message = 'Invite link was deleted via ID.';
						goto bottomOfInvites;
					}
					if( !$args->skip ) die( 'ok<!--separate-->{"Response":"Invite link with ids: ' . $args->args->ids . ' was successfully deleted"}' );
				}
			}
			else if( isset( $args->args->hash ) && $args->args->hash )
			{
				// TODO: Look at this ... don't remove invite link if it's a general invite link to connect to the inviter or a group ...
				if( $SqlDatabase->Query( 'DELETE FROM `FTinyUrl` WHERE `Hash`="' . $SqlDatabase->_link->real_escape_string( $args->args->hash ) . '"' ) )
				{
					// Included from queuedeventresponse.php
					if( isset( $response ) )
					{
						$response->message = 'Invite link was deleted via HASH.';
						goto bottomOfInvites;
					}
					if( !isset( $args->skip ) )
						die( 'ok<!--separate-->{"Response":"Invite link with hash: ' . $args->args->hash . ' was successfully deleted"}' );
				}
			}
			else
			{
				die( 'fail<!--separate-->' . print_r( $args, 1 ) );
			}
			
			if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Could not delete invite link(s)"}' );
			// Included from queuedeventresponse.php
			if( isset( $response ) )
			{
				$response->message = 'Could not delete invite links.';
				goto bottomOfInvites;
			}
			
			break;
		
		// Remove an already pending invite
		
		case 'removependinginvite':
			
			$eventId = intval( $args->args->eventId, 10 );
			
			$n = new dbIO( 'FQueuedEvent' );
			$n->ID = $eventId;
			if( $eventId && $n->Load() )
			{
				if( $n->InviteLinkID > 0 )
				{
					$SqlDatabase->query( '
						DELETE FROM FTinyUrl 
						WHERE ID = \'' . $n->InviteLinkID . '\' 
					' );
				}
				
				$SqlDatabase->query( '
					DELETE FROM FQueuedEvent
					WHERE ID = \'' . $eventId . '\'
				' );
				
				// TODO: die ok or fail ?
			}
			
			break;
		
		case 'verifyinvite':
			
			// verifyinvite (args: hash=123d4h)
			
			// TODO: Verify and remove personal invites, keep the general invites ...
			if( isset( $args->args->hash ) && $args->args->hash )
			{
				if( $f = $SqlDatabase->FetchObject( '
					SELECT * FROM FTinyUrl 
					WHERE `Hash` = "' . $SqlDatabase->_link->real_escape_string( $args->args->hash ) . '" AND `Source` LIKE "%/system.library/user/addrelationship%" 
					ORDER BY ID ASC LIMIT 1
				' ) )
				{
					if( $f->Source )
					{
						if( $f->Expire == 0 || $f->Expire > time( ) )
						{
							if( $json = json_decode( decodeUrl( $f->Source ) ) )
							{
								// Working on adding user to group
								if( $json->data->workgroups )
								{
									foreach( $json->data->workgroups as $group )
									{
										if( $group->ID )
										{
											if( !FriendCoreQuery( '/system.library/group/addusers', 
											[
												'id'    => $group->ID,
												'users' => $User->ID
											] ) )
											{
												die( 'fail<!--separate-->{"Response":"[ /system.library/group/addusers ] fail from friendcore, contact server admin ...."}' );
											}
											else
											{
												$m = new dbIO( 'FMetaData' );
												$m->Key = 'ResolvedUserInvite';
												$m->ValueString = $args->args->hash;
												$m->DataTable = 'FUserGroup';
												$m->DataID = $group->ID;
												$m->ValueNumber = $User->ID;
												$m->Save();
												
												// Extended
												$u = new dbIO( 'FMetaData' );
												$u->Key = 'ResolvedUserData';
												$u->ValueString = date( 'Y-m-d H:i:s' );
												$u->DataTable = 'FMetaData';
												$u->DataID = $m->ID;
												$u->ValueNumber = $f->UserID;
												$u->Save();
												
												$SqlDatabase->query( '
													DELETE FROM FQueuedEvent q
													WHERE q.TargetUserID = \'' . $User->ID . '\' AND q.TargetGroupID = \'' . $group->ID . '\' AND q.Status IN ( "unseen" ) 
												' );
											}
										}
									}
								}
								
								if( isset( $json->data->userid ) && isset( $json->data->mode ) )
								{
									if( $relation = $SqlDatabase->FetchObject( '
										SELECT 
											s.ID AS SourceID, s.Name AS SourceName, s.FullName AS SourceFullName, 
											s.Email AS SourceEmail, s.UniqueID AS SourceUniqueID, s.Status AS SourceStatus, 
											c.ID AS ContactID, c.Name AS ContactName, c.FullName AS ContactFullName, 
											c.Email AS ContactEmail, c.UniqueID AS ContactUniqueID, c.Status AS ContactStatus 
										FROM 
											FUser s, FUser c 
										WHERE 
												s.ID = ' . $json->data->userid . ' AND s.Status = 0 
											AND c.ID = ' . $User->ID . ' AND c.Status = 0 
									' ) )
									{
										// Adding relationship between user and contact
										if( $result = FriendCoreQuery( '/system.library/user/addrelationship', 
										[
											'mode'       => $json->data->mode,
											'sourceid'   => $relation->SourceUniqueID,
											'contactids' => json_encode( [ $relation->ContactUniqueID ] ),
											'servertoken'  => $serverToken
										] ) )
										{
											if( strstr( $result, 'ok<!--separate-->' ) )
											{
												// TODO: Delete certain invite links when invite is complete ...
												
												if( isset( $json->contact ) && $json->contact && $f->ID > 0 )
												{
													$m = new dbIO( 'FMetaData' );
													$m->Key = 'ResolvedUserInvite';
													$m->ValueString = $args->args->hash;
													$m->DataTable = 'FUser';
													$m->DataID = $json->data->userid;
													$m->ValueNumber = $User->ID;
													$m->Save();
													
													// Extended
													$u = new dbIO( 'FMetaData' );
													$u->Key = 'ResolvedUserData';
													$u->ValueString = date( 'Y-m-d H:i:s' );
													$u->DataTable = 'FMetaData';
													$u->DataID = $m->ID;
													$u->ValueNumber = $f->UserID;
													$u->Save();
													
													$SqlDatabase->query( '
														DELETE FROM FTinyUrl 
														WHERE ID = \'' . $f->ID . '\' 
													' );
												}
											
												// Remove event
												$h = $SqlDatabase->_link->real_escape_string( $args->args->hash );
												if( isset( $args->args->eventid ) )
													$SqlDatabase->query( 'DELETE FROM `FQueuedEvent` WHERE ActionAccepted LiKE "%\"' . $h . '\"%"' );
												$SqlDatabase->query( '
													DELETE FROM FTinyUrl 
													WHERE `Hash` = "' . $h . '"
												' );
												
												// Add user to group
												if( isset( $json->data->workgroups ) )
												{
													$user_id = isset( $json->contact->ID ) ? $json->contact->ID : $User->ID;
													
													foreach( $json->data->workgroups as $wg )
													{
														$r = FriendCoreQuery( '/system.library/group/addusers', 
														[
															'id'       => $wg->ID,
															'users'   => $user_id,
															'servertoken'  => $serverToken
														] );
													}
												}
												
												// Included from queuedeventresponse.php
												if( isset( $response ) )
												{
													$response->message = 'Added a user relationship.';
													goto bottomOfInvites;
												}
											}
											if( !$args->skip ) die( $result );
											
										}
										else
										{
											die( 'fail<!--separate-->{"Response":"[ /system.library/user/addrelationship ] fail from friendcore, contact server admin ...."}' );
										}
									}
									else
									{
										die( 'fail<!--separate-->{"Response":"Couldn\'t find the active users to connect a relation between the inviter and the invitee, contact server admin ..."}' );
									}
								}
								else
								{
									die( 'fail<!--separate-->{"Response":"Source data is corrupt [1]."}' );
								}
							}
							else
							{
								die( 'fail<!--separate-->{"Response":"Source data is corrupt [2]."}' );
							}
						}
						else
						{
							die( 'fail<!--separate-->{"Response":"Invite hash is not valid anymore, it has expired ..."}' );
						}
					}
					else
					{
						die( 'fail<!--separate-->{"Response":"Source data is corrupt [3]."}' );
					}
				}
				else
				{
					die( 'fail<!--separate-->{"Response":"Invite hash: ' . $args->args->hash . ' is not valid."}' );
				}
			}
			
			if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Could not verify inviteHash and add relation."}' );
			
			break;
		
		
		// Get pending invites with names
		
		case 'getpendinginvites':
			
			if( !isset( $args->args->groupId ) )
				die( 'fail<!--separate-->' );
			
			$invids = []; $out = [];
			
			$reason = new stdClass();
			
			$n = new dbIO( 'FQueuedEvent' );
			if( $events = $n->find( '
				SELECT * FROM 
					FQueuedEvent 
				WHERE 
					UserID=\'' . $User->ID . '\' AND 
					TargetGroupID=\'' . intval( $args->args->groupId, 10 ) . '\' AND 
					`Type`=\'interaction\' AND
					( `Status`=\'unseen\' OR `Status`=\'seen\' )
			' ) )
			{
				$userInfo = [];
				foreach( $events as $e )
				{
					$userInfo[] = $e->TargetUserID;
					$s = new stdClass();
					$s->EventID = $e->ID;
					$s->InviteLinkID = $e->InviteLinkID;
					$s->UserID = $e->TargetUserID;
					$s->TargetGroupID = $e->TargetGroupID;
					$out[] = $s;
					$invids[$s->InviteLinkID] = $s->InviteLinkID;
				}
				if( $rows = $SqlDatabase->fetchObjects( 'SELECT ID, Fullname, Email FROM FUser WHERE ID IN ( ' . implode( ',', $userInfo ) . ' )' ) )
				{
					foreach( $rows as $row )
					{
						foreach( $out as $k=>$v )
						{
							if( $v->UserID == $row->ID )
							{
								$out[$k]->Fullname = $row->Fullname;
								$out[$k]->Email = $row->Email;
								break;
							}
						}
					}
				}
				// 
				//if( count( $out ) )
				//{
				//	die( 'ok<!--separate-->' . json_encode( $out ) );
				//}
				//$reason->response = -1;
				//$reason->message = 'Failed to find any queued events that were pending.';
				//die( 'fail<!--separate-->' . json_encode( $reason ) );
			}
			
			if( isset( $args->args->listall ) )
			{
				if( $links = $SqlDatabase->FetchObjects( '
					SELECT * FROM FTinyUrl 
					WHERE ' . ( count( $invids ) ? 'ID NOT IN ( ' . implode( ',', $invids ) . ' ) AND ' : '' ) . '
					UserID = ' . $User->ID . ' AND Source LIKE "%/system.library/user/addrelationship%" AND Source LIKE "%&contact=%" 
					ORDER BY ID ASC 
				' ) )
				{
					foreach( $links as $f )
					{
						if( $f && $f->Source && $f->Hash )
						{
							if( $json = json_decode( decodeUrl( $f->Source ) ) )
							{
								if( !$json->data || !$json->contact ) continue;
							
								$groupid = []; $found = false;
							
								if( isset( $json->data->workgroups ) )
								{
									foreach( $json->data->workgroups as $w )
									{
										$groupid[$w->ID] = $w->ID;
									
										// Filter by group ID
										if( isset( $args->args->groupId ) && $w->ID == $args->args->groupId )
										{
											$found = true;
											break;
										}
									}
								}
							
								if( isset( $args->args->groupId ) && !$found ) continue;
							
							    $gname = '';
							    
							    $obj = new stdClass();
								$obj->Hash          = $f->Hash;
								$obj->EventID       = 0;
								$obj->InviteLinkID  = $f->ID;
								$obj->UserID        = ( isset( $json->contact->ID       ) ? $json->contact->ID       : false                                );
								$obj->TargetGroupID = ( isset( $args->args->groupId     ) ? $args->args->groupId     : ( count( $groupid ) ? $groupid : 0 ) );
								$obj->Fullname      = ( isset( $json->contact->FullName ) ? $json->contact->FullName : false                                );
								$obj->Email         = ( isset( $json->contact->Email    ) ? $json->contact->Email    : false                                );
								
								if( $group = $SqlDatabase->FetchObject( '
					                SELECT ID, Name FROM FUserGroup 
					                WHERE Type = "Workgroup" AND ID=\'' .  $obj->TargetGroupID . '\' 
					                ORDER BY ID ASC 
				                ' ) )
				                {
					                $gname = $group->Name;
				                }
								
								$obj->LinkUrl       = $baseUrl . '/webclient/index.html#invite=' . $f->Hash . 'BASE64' . 
														base64_encode( '{"user":"' . utf8_decode( $User->FullName ) . '","hash":"' . $f->Hash . '","group":"' . $gname . '"}' );
								$out[] = $obj;
							}
						}
					}
				}
			}
			
			if( count( $out ) )
			{
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			
			$reason->response = -1;
			$reason->message = 'Failed to find any queued events.';
			die( 'fail<!--separate-->' . json_encode( $reason ) );
			
			break;
		
		// Just resend an existing invite
		case 'resendinvite':
			$reinvite = true;
			// Then send invite
		
		case 'sendinvite':
			
			if( !isset( $args->args->userid ) && !$args->args->userid && !isset( $args->args->email ) && !$args->args->email )
			{
				die( 'fail<!--separate-->{"Response":"userid or email is required ..."}' );
			}
			
			$contact = new stdClass(); $gname = ''; $gid = 0;
			
			$data = new stdClass();
			$data->app  = 'FriendChat';
			$data->mode = 'presence';
			$data->description = 'Update relation between user and other users';
			
			if( isset( $args->args->workgroups ) && $args->args->workgroups )
			{
				if( $groups = $SqlDatabase->FetchObjects( '
					SELECT ID, Name FROM FUserGroup 
					WHERE Type = "Workgroup" AND ID IN ( ' . $args->args->workgroups . ' ) 
					ORDER BY ID ASC 
				' ) )
				{
					$gname = $groups[0]->Name;
					$gid   = $groups[0]->ID;
					
					$data->workgroups = $groups;
				}
				else
				{
					die( 'fail<!--separate-->{"Response":"Could not find these workgroups: ' . $args->args->workgroups . '"}' );
				}
			}
			
			if( isset( $args->args->userid ) && $args->args->userid )
			{
				if( !$contact = $SqlDatabase->FetchObject( '
					SELECT ID, Name, FullName, Email 
					FROM FUser 
					WHERE ID = \'' . $args->args->userid . '\' 
					ORDER BY ID ASC 
					LIMIT 1
				' ) )
				{
					die( 'fail<!--separate-->{"Response":"Could not find user: ' . $args->args->userid . '"}' );
				}
			}
			else if( isset( $args->args->email ) && $args->args->email )
			{
				$contact = new stdClass();
				$contact->Email = $args->args->email;
				$contact->FullName = $args->args->fullname;
				
				$mx = new Mailer(  );
				if( !$mx->validateMX( $contact->Email ) )
				{
					die( 'fail<!--separate-->{"Response":"Email is not valid: MX was not found."}' );
				}
			}
			
			// Loads user and avatar
			if( $usr = $SqlDatabase->FetchObject( '
				SELECT f.ID, f.Name, f.FullName, f.Email, f.UniqueID, f.Status, s.Data AS Avatar 
				FROM FUser f 
					LEFT JOIN FSetting s ON 
					(
						 	 s.Type = "system" 
						 AND s.Key = "avatar" 
						 AND s.UserID = ' . $User->ID . '
					)
				WHERE f.ID = ' . $User->ID . ' 
			' ) )
			{
				$data->userid     = $usr->ID;
				$data->uniqueid   = $usr->UniqueID;
				$data->username   = $usr->Name;
				$data->fullname   = $usr->FullName;
				
				$hash = false; $online = false; $found = false;
				
				// Generate invite hash (tiny url)
				$f = new dbIO( 'FTinyUrl' );
				$f->Source = ( $baseUrl . '/system.library/user/addrelationship?data=' . urlencode( json_encode( $data ) ) . '&contact=' . urlencode( json_encode( $contact ) ) );
				if( !$f->Load() )
				{
					$f->UserID = $User->ID;
					
					do
					{
						$f->Hash = substr( md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) ), 0, 8 );
					}
					while( $f->Load() );
					
					$f->DateCreated = strtotime( date( 'Y-m-d H:i:s' ) );
					$f->Save();
				}
				else
				{
					// When reinviting, just re-use the thing
					if( $reinvite )
					{
						$found = true;
					}
				    // If the invite is over a week old, just allow reinvite
				    else if( strtotime( $f->DateCreated ) > strtotime( time() ) - ( 60 * 60 * 24 * 7 ) )
				    {
					    $found = true;
					}
					// So when the invite is old and we are trying to make a new one, delete the old one
					else
					{
					    $f->delete();
					}
				}
				if( $f->ID > 0 )
				{
					$hash = $f->Hash;
				}
				else
				{
					die( 'fail<!--separate-->{"response":-1,"message":"Could not load invite record."}' );
				}
				
				if( !$hash )
				{
					die( 'fail<!--separate-->{"response":-1,"message":"Could not read invite hash."}' );
				}
				
				$Logger->log( '[sendinvite] Getting contact information for queued event.' );
				
				if( $contact->ID > 0 )
				{
					// Check if user is online ...
					if( !$online && ( $res1 = FriendCoreQuery( '/system.library/user/activewslist',
					[
						'usersonly' => true,
						'userid' => $contact->ID
					] ) ) )
					{
						if( $dat = json_decode( $res1 ) )
						{
							if( isset( $dat->userlist[0]->username ) && $dat->userlist[0]->username == $contact->Name )
							{
								$online = true;
							}
						}
					}
					
					$Logger->log( '[sendinvite] Making queued event.' );
					
					// Send a notification message			
					$n = new dbIO( 'FQueuedEvent' );
					$n->UserID = $usr->ID;
					$n->TargetUserID = $contact->ID;
					$n->TargetGroupID = $gid;
					$n->InviteLinkID = $f->ID;
					$n->Load();
					$n->Title = ( isset( $args->args->title ) ? $args->args->title : ( $gname ? 'Invitation to join' : 'Invitation to connect' ) );
					$n->Type = 'interaction';
					$n->Status = 'unseen';
					$n->Message = ( isset( $args->args->message ) ? $args->args->message : ( $usr->FullName . ( $gname ? ' invited you to join ' . $gname : ' invites to you connect on Friend Chat.' ) ) );
					$n->ActionAccepted = '{"module":"system","command":"verifyinvite","args":{"hash":"'.$hash.'"},"skip":"true"}';
					$n->ActionRejected = '{"module":"system","command":"removeinvite","args":{"hash":"'.$hash.'"},"skip":"true"}';
					if( !$n->Load() )
					{
						$n->Date = date( 'Y-m-d H:i' );
						if( !$n->Save() )
						{
							// 
							
							// Delete personal invite link on fail and try again ...
							
							if( $f->ID > 0 )
							{
								$f->Delete();
							}
							
							die( 'fail<!--separate-->{"response":-1,"message":"Could not register Invitation notification in database ..."}' );
						}
					}
				}
				else
				{
					$Logger->log( '[sendinvite] Making queued event without contact relation.' );
					
					// Send a notification message			
					$n = new dbIO( 'FQueuedEvent' );
					$n->UserID = $usr->ID;
					$n->Date = date( 'Y-m-d H:i:s' );
					$n->TargetUserID = 0;
					$n->TargetGroupID = $gid;
					$n->InviteLinkID = $f->ID;
					$n->Save();
					
					$Logger->log( '[sendinvite] Event saved: ' . $n->ID );
				}
				
				// Send email if not online or if email is specified ...
				if( !$online )
				{
					// We have already sent a link, and we don't want to reinvite
					if( $found && !$reinvite )
					{
						die( 'fail<!--separate-->{"response":-1,"message":"Invitation already sent, try removing the pending invite and resend."}' );
					}
					
					// Set up mail content!
					if( isset( $Conf[ 'Mail' ][ 'TemplateDir' ] ) )
					{
						$tplDir = $Conf[ 'Mail' ][ 'TemplateDir' ];
						$cnt = file_get_contents( $tplDir . "/base_email_template.html" );
					}
					else
					{
						$cnt = file_get_contents( "php/templates/mail/base_email_template.html" );
					}
				
					$repl = new stdClass(); $baserepl = new stdClass();
			
					$repl->baseUrl = $baserepl->baseUrl = $baseUrl;
				
					$repl->url = ( $baseUrl . '/webclient/index.html#invite=' . $hash . 'BASE64' . base64_encode( '{"user":"' . utf8_decode( $usr->FullName ) . '","hash":"' . $hash . '","group":"' . $gname . '"}' ) );
					
					$repl->sitename = ( isset( $Conf[ 'Registration' ][ 'reg_sitename' ] ) ? $Conf[ 'Registration' ][ 'reg_sitename' ] : 'Friend Sky' );
					$repl->user     = $usr->FullName;
					$repl->group    = $gname;
					$repl->email    = $usr->Email;
					$repl->avatar   = ( $baseUrl . '/public/' . $hash . '/avatar' );
					
					// TODO: Get avatar / group info somewhere public or with access code / invite token ...
					
					if( isset( $Conf[ 'Mail' ][ 'TemplateDir' ] ) )
					{
						$tplDir = $Conf[ 'Mail' ][ 'TemplateDir' ];
						$baserepl->body = doReplacements( file_get_contents( $tplDir . ( $gname ? "/group_invite_email_template.html" : "/invite_email_template.html" ) ), $repl );
					}
					else
					{
						$baserepl->body = doReplacements( file_get_contents( $gname ? "php/templates/mail/group_invite_email_template.html" : "php/templates/mail/invite_email_template.html" ), $repl );
					}
					
					$cnt = doReplacements( $cnt, $baserepl );
					
					// Notify the user!
					$mail = new Mailer(  );
					$mail->isHTML = true;
					$mail->debug = 0;
					$mail->setReplyTo( $Conf[ 'FriendMail' ][ 'friendmail_user' ], ( isset( $Conf[ 'FriendMail' ][ 'friendmail_name' ] ) ? $Conf[ 'FriendMail' ][ 'friendmail_name' ] : 'Friend Software Corporation' ) );
					$mail->setFrom( $Conf[ 'FriendMail' ][ 'friendmail_user' ] );
					$mail->setSubject( utf8_decode( $usr->FullName ) . ( $gname ? ' invited you to join ' . utf8_decode( $gname ) : ' invites you to connect on ' . $repl->sitename ) );
					$mail->addRecipient( $contact->Email, ( $contact->FullName ? $contact->FullName : false ) );
					$mail->setContent( utf8_decode( $cnt ) );
					if( !$mail->send() )
					{
						// ...
						
						// TODO: Look at this, if email fails still have the notification active ....
						
						// Delete personal invite link on fail and try again ...
						
						//if( $f->ID > 0 )
						//{
						//	$f->Delete();
						//}
						
						die( 'fail<!--separate-->{"response":-1,"message":"Could not send e-mail."}' );
					}
					die( 'ok<!--separate-->Mail sent!' );	
				}
				die( 'ok<!--separate-->{"Response":"Invitation notification registered in database id: ' . ( $n->ID ? $n->ID : 0 ) . '"}' );
			}
			die( 'fail<!--separate-->{"Response":"Could not send invite"}' );
			break;
		
	}
	
}

if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Fail! command not recognized ..."}' );

function doReplacements( $str, $replacements )
{
	foreach( $replacements as $k=>$v )
	{
		if( is_object( $v ) )
		{
			if( $v->type == 'urlobject' )
			{
				$v->data = base64_encode( $v->data );
				if( $v->contentType )
				{
					$v->data = 'data:' . $v->contentType . ';base64,' . $v->data;
				}
			}
			$str = str_replace( '{' . $k . '}', $v->data, $str );
		}
		else
		{
			$str = str_replace( '{' . $k . '}', $v, $str );
		}
	}
	return $str;
}

function buildURL( $hash, $conf, $confshort )
{
	
	$port = '';
	if( $confshort->FCHost == 'localhost' && $confshort->FCPort )
	{
		$port = ':' . $confshort->FCPort;
	}
	// Apache proxy is overruling port!
	if( isset( $conf[ 'Core' ][ 'ProxyEnable' ] ) &&
		$conf[ 'FriendCore' ][ 'ProxyEnable' ] == 1 )
	{
		$port = '';
	}
	
	$baseUrl = ( isset( $conf[ 'Core' ][ 'SSLEnable' ] ) && 
		$conf[ 'Core' ][ 'SSLEnable' ] == 1 ? 'https://' : 'http://' 
	) .
	$conf[ 'FriendCore' ][ 'fchost' ] . $port;
	
	if( file_exists( 'php/scripts/invite.php' ) )
	{
		return ( $baseUrl . '/invite/' . $hash );
	}
	return ( $baseUrl . '/webclient/index.html#invite=' . $hash );
}

function decodeURL( $source = false )
{
	if( $source )
	{
		if( !( ( strstr( $source, 'http://' ) || strstr( $source, 'https://' ) ) && strstr( $source, '?' ) ) )
		{
			$source = urldecode( $source );
		}
		if( ( strstr( $source, 'http://' ) || strstr( $source, 'https://' ) ) && strstr( $source, '?' ) )
		{
			if( $parts = explode( '?', $source ) )
			{
				if( $parts[0] )
				{
					$data = new stdClass();
					
					$data->url = $parts[0];
				
					if( $parts[1] )
					{
						foreach( explode( '&', $parts[1] ) as $part )
						{
							if( strstr( $part, '=' ) )
							{
								if( $var = explode( '=', $part ) )
								{
									if( $var[1] && ( $json = json_decode( urldecode( $var[1] ) ) ) )
									{
										$data->{$var[0]} = $json;
									}
									else
									{
										$data->{$var[0]} = ( $var[1] ? urldecode( $var[1] ) : '' );
									}
								}
							}
						}
					}
					return json_encode( $data );
				}
			}
		}
		else
		{
			return urldecode( $source );
		}
	}
	return false;
}

bottomOfInvites:

// The bottom

?>
