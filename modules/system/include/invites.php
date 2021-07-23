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
				
				if( $f->ID > 0)
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
							$obj = new stdClass();
							$obj->ID         = $f->ID;
							$obj->Link       = buildUrl( $f->Hash, $Conf, $ConfShort );
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
				if( $SqlDatabase->Query( 'DELETE FROM FTinyUrl WHERE ID IN (' . $args->args->ids . ') ' ) )
				{
					if( !$args->skip ) die( 'ok<!--separate-->{"Response":"Invite link with ids: ' . $args->args->ids . ' was successfully deleted"}' );
				}
			}
			else if( isset( $args->args->hash ) && $args->args->hash )
			{
				if( $SqlDatabase->Query( 'DELETE FROM FTinyUrl WHERE Hash = "' . $args->args->hash . '"' ) )
				{
					if( !$args->skip ) die( 'ok<!--separate-->{"Response":"Invite link with hash: ' . $args->args->hash . ' was successfully deleted"}' );
				}
			}
			
			if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Could not delete invite link(s)"}' );
			
			break;
		
		case 'verifyinvite':
			
			// verifyinvite (args: hash=123d4h)
			
			if( isset( $args->args->hash ) && $args->args->hash )
			{
				if( $f = $SqlDatabase->FetchObject( '
					SELECT * FROM FTinyUrl 
					WHERE Hash = "' . $args->args->hash . '" AND Source LIKE "%/system.library/user/addrelationship%" 
					ORDER BY ID ASC LIMIT 1
				' ) )
				{
					if( $f->Source )
					{
						if( $f->Expire == 0 || $f->Expire > time( ) )
						{
							if( $json = json_decode( decodeUrl( $f->Source ) ) )
							{
								
								// TODO: Add support for adding to workgroup(s) when that is ready ...
								
								//if( $json->data->workgroups )
								//{
								//
								//}
								
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
										if( $result = FriendCoreQuery( '/system.library/user/addrelationship', 
										[
											'mode'       => $json->data->mode,
											'sourceid'   => $relation->SourceUniqueID,
											'contactids' => json_encode( [ $relation->ContactUniqueID ] )
										] ) )
										{
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
					die( 'fail<!--separate-->{"Response":"Invite hash is not valid."}' );
				}
			}
			
			if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Could not verify inviteHash and add relation."}' );
			
			break;
		
		case 'sendinvite':
			
			$contact = new stdClass();
			
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
			
			// TODO: Make support for sending invites by email to users who doesn't exists yet ... $args->email / $args->fullname then perhaps?
			
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
			
			if( isset( $args->args->email ) && $args->args->email )
			{
				$contact = new stdClass();
				$contact->Email = $args->args->email;
				$contact->FullName = $args->args->fullname;
			}
			
			// TODO: send invite without having to register it, or just use the default invite link ...
			
			// So how to find out if user is online ??? and how to send notification ... using friendcore ...
			
			// TODO: Make the email sendout first ....
			
			
			
			
			
			$usr = new dbIO( 'FUser' );
			$usr->ID = $User->ID;
			if( $usr->Load() )
			{
				$data->userid     = $usr->ID;
				$data->uniqueid   = $usr->UniqueID;
				$data->username   = $usr->Name;
				$data->fullname   = $usr->FullName;
				
				
				$hash = false; $online = false;
				
				
				// TODO: See when we need this stuff below ...
				
				$f = new dbIO( 'FTinyUrl' );
				$f->Source = ( $baseUrl . '/system.library/user/addrelationship?data=' . urlencode( json_encode( $data ) ) );
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
				
				$invitelink = buildUrl( $hash, $Conf, $ConfShort );
				
				$msg = ($usr->FullName.' invites to you connect here on Friend Sky, a great collaboration platform that\'s free to use Invite Link: <a target="_BLANK" href="'.$invitelink.'">'.$invitelink.'</a>');
				
				
				// Check if user is online ...
				
				if( $res1 = FriendCoreQuery( '/system.library/user/activewslist',
				[
					'usersonly' => true,
					'userid' => $contact->ID
				] ) )
				{
					if( $dat = json_decode( $res1 ) )
					{
						if( isset( $dat->userlist[0]->username ) && $dat->userlist[0]->username == $contact->Name )
						{
							$online = true;
						}
					}
				}
				
				// Send a notification message if online ...
				
				if( $online && !isset( $args->args->email ) )
				{
					//$jsn = '{"message":"'.$invitelink.'","accept":"/system.library/module/?module=system&command=verifyinvite&args='.urlencode('{"hash":"'.$hash.'"}').'","decline":"/system.library/module/?module=system&command=removeinvite&args='.urlencode('{"hash":"'.$hash.'"}').'"}';
					
					//if( $res2 = FriendCoreQuery( '/system.library/user/servermessage', 
					//[
					//	'message' => ($usr->FullName.' invites to you connect here on Friend Sky, a great collaboration platform that\'s free to use Invite Link: '.$invitelink),
					//	'userid' => $contact->ID
					//] ) )
					//{
						// Sent ...
						
					//	die( 'Message sent? ' . $res2 );
					//}
					
					
					
					$n = new dbIO( 'FQueuedEvent' );
					$n->UserID = $usr->ID;
					$n->TargetUserID = $contact->ID;
					$n->TargetGroupID = 0;
					$n->Title = ( isset( $args->args->title ) ? $args->args->title : 'Invitation to connect' );
					$n->Type = 'interaction';
					$n->Date = date( 'Y-m-d H:i' );
					$n->Status = 'unseen';
					$n->Message = ( isset( $args->args->message ) ?$args->args->message : ( $usr->FullName.' invites to you connect on Friend Chat.' ) );
					$n->ActionAccepted = '{"module":"system","command":"verifyinvite","args":{"hash":"'.$hash.'"},"skip":"true"}';
					$n->ActionRejected = '{"module":"system","command":"removeinvite","args":{"hash":"'.$hash.'"},"skip":"true"}';
					if( $n->Load() )
					{
						die( 'fail<!--separate-->notification event already exists ...' );
					}
					if( $n->Save() )
					{
						die( 'ok<!--separate-->notification event stored id: ' . $n->ID );
					}
					
					die( 'Fail to send message to user ...' );
				}
				
				// Send email ...
				
				else
				{
					
					
					// Set up mail content!
					//$cnt = file_get_contents( "$basePath/mail_templates/base_email_template.html" );
					
					$repl = new stdClass(); $baserepl = new stdClass();
				
					$repl->baseUrl = $baserepl->baseUrl = $baseUrl;
					
					$repl->url = $invitelink;
					
					// TODO: Check this ...
					//$baserepl->unsubscribe = $baseUrl . '/unsubscribe/' . base64_encode( '{"id":"' . $usr->ID . '","email":"' . $usr->Email . '","userid":"' . $usr->UserID . '","username":"' . $usr->Username . '"}' );
					
					$repl->sitename = ( isset( $Conf[ 'Registration' ][ 'reg_sitename' ] ) ? $Conf[ 'Registration' ][ 'reg_sitename' ] : 'Friend Sky' );
					$repl->user     = $usr->Fullname;
					$repl->email    = $usr->Email;
					
					//$baserepl->body = doReplacements( file_get_contents( "$basePath/mail_templates/activate_account_email_template.html"  ), $repl );
					
					//$cnt = doReplacements( $cnt, $baserepl );
					
					
					
					// Notify the user!
					$mail = new Mailer(  );
					$mail->isHTML = true;
					$mail->debug = 0;
					$mail->setReplyTo( $Conf[ 'FriendMail' ][ 'friendmail_user' ], ( isset( $Conf[ 'FriendMail' ][ 'friendmail_name' ] ) ? $Conf[ 'FriendMail' ][ 'friendmail_name' ] : 'Friend Software Corporation' ) );
					$mail->setFrom( $Conf[ 'FriendMail' ][ 'friendmail_user' ] );
					$mail->setSubject( 'Invite Link' );
					$mail->addRecipient( ( $contact->Email ? $contact->Email : $usr->Email ), ( $contact->FullName ? $contact->FullName : $usr->FullName ) );
					$mail->setContent( utf8_decode( $msg/*$cnt*/ ) );
					if( !$mail->send() )
					{
						// ...
						
						die( 'fail<!--separate-->{"response":-1,"message":"Could not send e-mail."}' );
					}
					
					die( 'ok<!--separate-->Mail sent!' );
					
				}
				
				
				
			}
			
			/* <HR><H2>system.library/user/activelwsist</H2>Get active user list, all users have working websocket connections
			*
			* @param sessionid - (required) session id of logged user
			* @param usersonly - if set to 'true' get unique user list
			* @return all users in JSON list when success, otherwise error code
			*/
			
			/**
			*
			* <HR><H2>system.library/user/servermessage</H2>Send message to all User sessions
			*
			* @param message - (required) message which will be delivered
			* @return fail or ok response
			*/
			/// @endcond
			
			die( 'fail<!--separate-->{"Response":"Could not send invite"}' );
			
			break;
		
	}
	
}

if( !$args->skip ) die( 'fail<!--separate-->{"Response":"Fail! command not recognized ..."}' );

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

?>
