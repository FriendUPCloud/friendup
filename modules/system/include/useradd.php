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

global $Logger;
$prevlevel = $level;

$LogThis = false;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID' . $args->authid ), [ 
		'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
		'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
				
				//die( 'fail<!--separate-->' . json_encode( $perm ) );
			}
			
			// Permission granted.
			
			if( $perm->response == 1 )
			{
				
				$level = 'Admin';
				
			}
		}
	}
}

if( $level == 'Admin' )
{
	// Make sure we have the "User" type group
	// TODO: This should not strictly be necessary when adding a user..
	$g = new dbIO( 'FUserGroup' );
	$g->Name = 'User';
	$g->Load();
	$g->Save();
	
	if( $g->ID > 0 )
	{
		if( $LogThis ) $Logger->log( "\n-\n" );
		
		if( $LogThis ) $Logger->log( print_r( $args, 1  ) );
		
		$uargs = Array(
			'sessionid' => $args->sessionid,
			'authid'    => $args->authid,
			// Requirements!
			'username'  => $args->args->username,
			'password'  => $args->args->password,
			'level'     => $args->args->level
		);
		
		if( $LogThis ) $Logger->log( 'Creating: ' . print_r( $uargs, 1 ) );
		
		$res = fc_query( '/system.library/user/create', $uargs );
		if( $LogThis ) $Logger->log( 'Result from create: ' . $res );
		
		// Unexpected error!
		if( !$res ) die( 'fail<!--separate-->{"response":"100","message":"Failed to create user."}' );
		
		list( $code, $message ) = explode( '<!--separate-->', $res );
		
		if( $LogThis ) $Logger->log( 'More importantly: ' . $code . ' -> ' . $message );
		
		$message = json_decode( $message );
		
		if( $LogThis ) $Logger->log( 'Parsed json message: ' . print_r( $message, 1 ) );
		
		// Just pass the error code
		if( $code != 'ok' )
			die( $res );
		
		// Create the new user
		if( $LogThis ) $Logger->log( 'Trying to load user: ' . $message->id );
		$u = new dbIO( 'FUser' );
		$u->Load( $message->id );

		if( $u->ID > 0 )
		{
			if( $LogThis ) $Logger->log( 'User was created, now adding user to workgroup.' );
			//$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $u->ID . '\', \'' . $g->ID . '\' )' );
				
			// TODO: Should be a check if the user that is creating this new user has access to add users to defined workgroup(s) before saving ... 
			
			// TODO: It's required to add user with a workgroup if the user adding is not Admin and have rolepermissions ...
			
			if( $prevlevel == 'User' || isset( $args->args->workgroups ) )
			{
				if( !isset( $args->args->workgroups ) || !$args->args->workgroups )
				{
					die( 'fail<!--separate-->{"response":"Adding a User to a Workgroup is required.","code":"20"}'  );
				}
				else if( $wgr = explode( ',', $args->args->workgroups ) )
				{
					foreach( $wgr as $gid )
					{
						$nestedArgs = new stdClass();
						$nestedArgs->type = 'write';
						$nestedArgs->context = 'application';
						$nestedArgs->authid = $args->authid;
						$nestedArgs->data = new stdClass();
						$nestedArgs->data->permission = [ 
							'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
							'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
						];
						$nestedArgs->object = 'workgroup';
						$nestedArgs->objectid = $gid;
						
						$nestedArgs = json_encode( $nestedArgs );
						
						$w_args = [
							'sessionid' => $args->sessionid,
							'id'        => intval( $gid   ), 
							'users'     => intval( $u->ID ),
							'args'      => $nestedArgs
						];
						
						// If you wanna know what's going on.
						if( $LogThis ) $Logger->log( 'Added nested arguments: ' . print_r( $w_args, 1 ) );
						
						if( $res = fc_query( '/system.library/group/addusers', $w_args ) )
						{
							$resp = explode( '<!--separate-->', $res );
							
							if( $resp[0] == 'fail' )
							{
							
								// 
								$err = 'fail<!--separate-->' . ( $resp[1] ? $resp[1] : '' ) . ' [] debug: ' . print_r( $perm,1 ) . ' [] args: ' . print_r( $w_args,1 ); 
								if( $LogThis ) $Logger->log( $err );
								die( $err );
							}
							else
							{
								if( $LogThis ) $Logger->log( 'Added user to workgroup ' . $gid );
							}
						
						}
						else
						{
							if( $LogThis ) $Logger->log( 'Could not add user to workgroup ' . $gid );
						}
					}
				}
			}
			
			if( $LogThis ) $Logger->log( 'Completed user ' . $user->Name .'..' );
			die( 'ok<!--separate-->' . $u->ID );
		}
		else
		{
			if( $LogThis ) $Logger->log( 'User was not created (' . $message->id . ') - or could not load from database.' );
		}
	}
}
die( 'fail<!--separate-->{"response":"user add failed"}'  );

// Helper functions ...
function fc_query( $command = '', $args = false, $method = 'POST', $headers = false )
{
	global $Config, $Logger;	
	
	$LogThis = false;
	
	$curl = curl_init();

	$usePort = ( $Config->FCHost == 'localhost' || $Config->FCOnLocalhost ) && $Config->FCPort;
	$server = ( $Config->SSLEnable ? 'https://' : 'http://' ) . $Config->FCHost . ( $usePort ? ( ':' . $Config->FCPort ) : '' );
	
	$url = ( $server . $command );
	
	if( $url && strstr( $url, '?' ) )
	{
		$thispath = $url;
		$url = explode( '?', $url );
	
		if( isset( $url[1] ) )
		{
			if( strstr( $url[1], '&' ) && strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '&', $url[1] );
			
				foreach( $url[1] as $k=>$p )
				{
					if( strstr( $url[1][$k], '=' ) )
					{
						$url[1][$k] = explode( '=', $url[1][$k] );
					
						if( isset( $url[1][$k][1] ) )
						{
							$url[1][$k][1] = urlencode( $url[1][$k][1] );
						}
					
						$url[1][$k] = implode( '=', $url[1][$k] );
					}
				}
			
				$url[1] = implode( '&', $url[1] );
			}
			else if( strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '=', $url[1] );
			
				if( isset( $url[1][1] ) )
				{
					$url[1][1] = urlencode( $url[1][1] );
				}
			
				$url[1] = implode( '=', $url[1] );
			}
		}
	
		$url = implode( '?', $url );
	}

	curl_setopt( $curl, CURLOPT_URL, $url );
	curl_setopt( $curl, CURLOPT_EXPECT_100_TIMEOUT_MS, false );

	if( $headers )
	{
		curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
	}

	if( $method != 'POST' )
	{
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
	}
	
	// TODO: Turn this off when SSL is working ...
	curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
	curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
	
	if( $args )
	{
		if( is_object( $args ) )
		{
			$args = array(
				'args' => urlencode( json_encode( $args ) )
			);
		}
		else if( is_string( $args ) )
		{
			$args = array(
				'args' => urlencode( $args )
			);
		}
	
		curl_setopt( $curl, CURLOPT_POST, true );
		curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
	}
	
	if( $LogThis ) $Logger->log( 'Curl Init: ' . $url . ' ', print_r( $args,1 ) );
	
	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

	$output = curl_exec( $curl );

	$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	if( $LogThis ) $Logger->log( 'Curl HttpCode: ', print_r( $httpCode,1 ) );
	
	curl_close( $curl );

	return $output;
}

?>
