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

global $SqlDatabase, $Config, $Logger;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID );
}
else
{
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_APPLICATION_CREATE_GLOBAL', 'PERM_APPLICATION_CREATE_IN_WORKGROUP', 
		'PERM_APPLICATION_UPDATE_GLOBAL', 'PERM_APPLICATION_UPDATE_IN_WORKGROUP', 
		'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
			
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
				{
					$userid = intval( $args->args->userid );
				}
			
			}
		}
	}
}

require_once( 'php/classes/dbio.php' );

if( !function_exists( 'findInSearchPaths' ) )
{
	function findInSearchPaths( $app )
	{
		$ar = array(
			'repository/',
			'resources/webclient/apps/'
		);
		foreach ( $ar as $apath )
		{
			if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
			{
				return $apath . $app;
			}
		}
		return false;
	}
}

if( isset( $args->args->application ) && $args->args->application )
{
	if( $path = findInSearchPaths( $args->args->application ) )
	{
		if( file_exists( $path . '/Config.conf' ) )
		{
			$f = file_get_contents( $path . '/Config.conf' );
			// Path is dynamic!
			$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
			
			// Store application!
			$a = new dbIO( 'FApplication' );
			$a->UserID = $userid;
			$a->Name = $args->args->application;
			if( !$a->Load() )
			{
				$a->DateInstalled = date( 'Y-m-d H:i:s' );
				$a->Config = $f;
				$a->Permissions = 'UGO';
				$a->DateModified = $a->DateInstalled;
				$a->Save();
			}
			
			// Pre-install applications
		
			if( $a->ID > 0 )
			{
				if( $a->Config && ( $cf = json_decode( $a->Config ) ) )
				{
					if( isset( $cf->Permissions ) && $cf->Permissions )
					{
						$perms = [];
						foreach( $cf->Permissions as $p )
						{
							$perms[] = [$p,(strtolower($p)=='door all'?'all':'')];
						}
						
						// TODO: Get this from Config.ini in the future, atm set nothing
						$da = new stdClass();
						$da->domain = '';
						
						// Collect permissions in a string
						$app = new dbIO( 'FUserApplication' );
						$app->ApplicationID = $a->ID;
						$app->UserID = $a->UserID;
						if( !$app->Load() )
						{
							$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
							$app->Permissions = json_encode( $perms );
							$app->Data = json_encode( $da );
							$app->Save();
						}
						
						if( $app->ID > 0 )
						{
							die( 'ok<!--separate-->{"message":"Successfully added application to user."}' );
						}
						die( 'fail<!--separate-->{"message":"Failed to load and/or save user application instance."}' );
					}
					die( 'fail<!--separate-->{"message":"Could not find permissions in application config."}<!--separate-->' . $a->Config );
				}
				die( 'fail<!--separate-->{"message":"Could not decode JSON config."}' );
			}
			die( 'fail<!--separate-->{"message":"Could not find application ID."}' );
		}
		die( 'fail<!--separate-->{"message":"Could not find application config."}' );
	}
	die( 'fail<!--separate-->{"message":"Could not find application in search paths."}' );
}

die( 'fail<!--separate-->{"message":"Could not find application name."}' );

?>
