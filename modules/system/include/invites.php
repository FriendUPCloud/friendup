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

error_reporting( E_ALL & ~E_NOTICE );
ini_set( 'display_errors', 1 );

if( $args->command )
{
	
	$baseUrl = ( $conf->SSLEnable ? 'https://' : 'http://' ) . $conf->FCHost . ( $conf->FCPort && $conf->ProxyEnable == 0 ? ( ':' . $conf->FCPort ) : '' );
	
	switch( $args->command )
	{
		
		case 'generateinvite':
			
			$data = new stdClass();
			$data->app  = 'FriendChat';
			$data->mode = 'presence';
			$data->description = 'Update relation between user and other users';
			
			if( isset( $args->args->workgroups ) && $args->args->workgroups )
			{
				if( !$groups = $SqlDatabase->FetchObjects( '
					SELECT ID FROM FUserGroup 
					WHERE Type = "Workgroup" AND ID IN ( ' . $args->args->workgroups . ' ) 
					ORDER BY ID ASC 
				' ) )
				{
					die( '{"result":"fail","data":{"response":"could not find these workgroups: ' . $args->args->workgroups . '"}}' );
				}
				
				$data->workgroups = $args->args->workgroups;
			}
			
			$usr = new dbIO( 'FUser' );
			$usr->ID = $User->ID;
			if( $usr->Load() )
			{
				$data->userid     = $usr->ID;
				$data->username   = $usr->Name;
				$data->contactids = $usr->UniqueID;
				
				$f = new dbIO( 'FTinyUrl' );
				$f->Source = ( $baseUrl . '/system.library/user/addrelationship?data=' . urlencode( json_encode( $data ) ) );
				if( $f->Load() )
				{
					die( '{"result":"ok","data":{"response":"source for invite link is already in database","id":"' . $f->ID . '","hash":"' . $f->Hash . '","url":"' . buildUrl( $f->Hash, $Config ) . '","expire":"' . $f->Expire . '"}}' );
				}
			
				$f->UserID = $User->ID;
			
				do
				{
					$hash = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) );
					$f->Hash = substr( $hash, 0, 8 );
				}
				while( $f->Load() );
			
				$f->DateCreated = strtotime( date( 'Y-m-d H:i:s' ) );
				$f->Save();
			
				if( $f->ID > 0 )
				{
					die( '{"result":"ok","data":{"response":"invite link successfully created","id":"' . $f->ID . '","hash":"' . $f->Hash . '","url":"' . buildUrl( $f->Hash, $Config ) . '","expire":"' . $f->Expire . '"}}' );
				}
			}
			
			die( '{"result":"fail","data":{"response":"could not generate invite link"}}' );
			
			break;
			
		case 'getinvites':
			
			die( '[getinvites] ' . print_r( $args,1 ) );
			
			break;
			
		case 'deleteinvites':
		
			die( '[deleteinvites] ' . print_r( $args,1 ) );
			
			break;
	
	}
	
}

die( '{"result":"fail","data":{"response":"fail command not recognized ..."}}' );

function buildURL( $hash, $conf )
{
	$proto = $conf->SSLEnable ? 'https://' : 'http://';
	$host = $conf->FCHost;
	$port = $conf->FCPort ? ( ':' . $conf->FCPort ) : '';
	if( $conf->ProxyEnable == 1 )
		$port = '';
	$url = $proto . $host . $port . '/webclient/index.html#invite=' . $hash;
	return $url;
}

?>
