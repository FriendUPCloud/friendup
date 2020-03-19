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


$prevlevel = $level;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ] ) )
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
	$userid = false;
	$args = [ 
		'sessionid' => $args->sessionid, 
		'username'  => ( isset( $args->args->username ) ? $args->args->username : 'Unnamed user' );, 
		'password'  => md5( rand(0,999) + microtime() ),
		'fullname'  => 'Unnamed user',
		'level'		=> 'User'
	];

	$res = fc_query( '/system.library/user/create', $args )
	$resp = explode( '<!--separate-->', $res );
	if( $resp[0] == 'ok' && isset( $resp[1] )  )
	{
		try
		{
			$rs = json_decode( $resp[1] );
			if( $rs->create == 'success' && isset( $rs->id ) ) $userid = $rs->id;
		}
		catch(Exception $e )
		{
			die('fail<!--separate-->USER_CREATION_FAILED');
		}
	}
	
	// TODO: Should be a check if the user that is creating this new user has access to add users to defined workgroup(s) before saving ... 
	// TODO: It's required to add user with a workgroup if the user adding is not Admin and have rolepermissions ...
	if( $userid && ( $prevlevel == 'User' || isset( $args->args->workgroups ) ) )
	{
		if( !isset( $args->args->workgroups ) || !$args->args->workgroups )
		{
			die( 'fail<!--separate-->{"response":"Adding a User to a Workgroup is required.","code":"20"}'  );
		}
		else if( $wgr = explode( ',', $args->args->workgroups ) )
		{
			foreach( $wgr as $gid )
			{
				
				$args = [ 
					'sessionid' => $args->sessionid, 
					'id'        => intval( $gid   ), 
					'users'     => intval( $userid ),
					'args'      => urlencode( '{
						"type"    : "write", 
						"context" : "application", 
						"authid"  : "' . $args->authid . '", 
						"data"    : { 
							"permission" : [ 
								"PERM_USER_GLOBAL", 
								"PERM_USER_WORKGROUP" 
							]
						}, 
						"object"   : "workgroup", 
						"objectid" : "' . $gid . '" 
					}' )
				];
				
				/*$args = [ 
					'sessionid' => $args->sessionid, 
					'id'        => intval( $gid   ), 
					'users'     => intval( $u->ID ),
					'args'      => urlencode( '{
						"type"    : "write", 
						"context" : "application", 
						"authid"  : "' . $args->authid . '", 
						"data"    : { 
							"permission" : [ 
								"PERM_USER_GLOBAL", 
								"PERM_USER_WORKGROUP" 
							]
						}
					}' )
				];*/
				
				if( $res = fc_query( '/system.library/group/addusers', $args ) )
				{
					$resp = explode( '<!--separate-->', $res );
					
					if( $resp[0] == 'fail' )
					{
					
						// 
						
						die( 'fail<!--separate-->' . ( $resp[1] ? $resp[1] : '' ) . ' [] debug: ' . print_r( $perm,1 ) . ' [] args: ' . print_r( $args,1 )  );
					}
				
				}
			}
		}
	}

	die( 'ok<!--separate-->' . $userid );
}
}
die( 'fail<!--separate-->{"response":"user add failed"}'  );

// Helper functions ...
function fc_query( $command = '', $args = false, $method = 'POST', $headers = false )
{
	global $Config;	
	
	$curl = curl_init();
	
	$server = ( $Config->SSLEnable ? 'https://' : 'http://' ) . $Config->FCHost . ( $Config->FCHost == 'localhost' && $Config->FCPort ? ':' . $Config->FCPort : '' );
	
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

	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

	$output = curl_exec( $curl );

	$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	curl_close( $curl );

	return $output;
}

?>
