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
					die( '{"result":"fail","data":{"response":"could not find these workgroups: ' . $args->args->workgroups . '"}}' );
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
					die( '{"result":"ok","data":{"response":"invitelink found","id":"' . $f->ID . '","hash":"' . $f->Hash . '","invitelink":"' . buildUrl( $f->Hash, $Conf, $ConfShort ) . '","expire":"' . $f->Expire . '"}}' );
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
					die( '{"result":"ok","data":{"response":"invitelink successfully created","id":"' . $f->ID . '","hash":"' . $f->Hash . '","invitelink":"' . buildUrl( $f->Hash, $Conf, $ConfShort ) . '","expire":"' . $f->Expire . '"}}' );
				}
			}
			
			die( '{"result":"fail","data":{"response":"could not generate invitelink"}}' );
			
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
						if( $json = decodeUrl( $f->Source ) )
						{
							$obj = new stdClass();
							$obj->id         = $f->ID;
							$obj->invitelink = buildUrl( $f->Hash, $Conf, $ConfShort );
							$obj->workgroups = ( isset( $json->source->data->workgroups ) ? $json->source->data->workgroups : [] );
							$obj->userid     = ( isset( $json->source->data->userid     ) ? $json->source->data->userid     : null );
							$obj->uniqueid   = ( isset( $json->source->data->uniqueid   ) ? $json->source->data->uniqueid   : null );
							$obj->username   = ( isset( $json->source->data->username   ) ? $json->source->data->username   : null );
							$obj->fullname   = ( isset( $json->source->data->fullname   ) ? $json->source->data->fullname   : null );
							$obj->mode       = ( isset( $json->source->data->mode       ) ? $json->source->data->mode       : null );
							$obj->app        = ( isset( $json->source->data->app        ) ? $json->source->data->app        : null );
							
							$out[] = $obj;
						}
					}
				}
				
				if( $out )
				{
					die( '{"result":"ok","data":{"response":"invite links successfully fetched","invites":' . json_encode( $out ) . '}}' );
				}
			}
			
			die( '{"result":"ok","data":{"response":"no invite links in database","invites":[],"debug":"' . $q . ' [] ' . ( $found ? print_r( $links, 1 ) : '' ) . '"}}' );
			
			break;
			
		case 'deleteinvites':
			
			// deleteinvites (args: ids=1 or args: ids=1,55,2)
			
			if( isset( $args->args->ids ) && $args->args->ids )
			{
				if( $SqlDatabase->Query( 'DELETE FROM FTinyUrl WHERE IN IN (' . $args->args->ids . ') ' ) )
				{
					die( '{"result":"ok","data":{"response":"invite link with ids: ' . $args->args->ids . ' was successfully deleted"}}' );
				}
			}
			else if( isset( $args->args->hash ) && $args->args->hash )
			{
				if( $SqlDatabase->Query( 'DELETE FROM FTinyUrl WHERE Hash = "' . $args->args->hash . '"' ) )
				{
					die( '{"result":"ok","data":{"response":"invite link with hash: ' . $args->args->hash . ' was successfully deleted"}}' );
				}
			}
			
			die( '{"result":"fail","data":{"response":"could not delete invite link(s)"}}' );
			
			break;
	
	}
	
}

die( '{"result":"fail","data":{"response":"fail command not recognized ..."}}' );

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
