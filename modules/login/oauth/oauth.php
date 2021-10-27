<?php

$data = '';

if( isset( $GLOBALS['argv'][2] ) && $GLOBALS['argv'][2] )
{
	$obj = new stdClass();
	
	if( $opath = explode( '&', $GLOBALS['argv'][2] ) )
	{
		foreach( $opath as $v )
		{
			if( $v = explode( '=', $v ) )
			{
				$obj->{$v[0]} = $v[1];
			}
		}
	}
	
	if( isset( $obj->state ) )
	{
		if ( !function_exists( 'hex2bin' ) ) 
		{
			function hex2bin( $str ) 
			{
				$sbin = "";
				$len = strlen( $str );
				for ( $i = 0; $i < $len; $i += 2 ) 
				{
				    $sbin .= pack( "H*", substr( $str, $i, 2 ) );
				}
				
				return $sbin;
			}
		}
		
		$decoded = hex2bin( $obj->state );
		$t2 = explode('::',$decoded);
		if( is_array( $t2 ) && count($t2) > 2 )
		{
			$obj->friend_userid = intval( $t2[0] );
			$obj->friend_mountname = $t2[1];
			$obj->friend_sessionid = $t2[2];
			$obj->friend_serverurl = $t2[3];
			$obj->friend_drive     = $t2[4];
		}
	}
	
	if( isset( $obj->friend_drive ) )
	{
		switch( $obj->friend_drive )
		{
			case 'GoogleDrive':
				
				// TODO: Move this to googledrive door when there is time ...
				
				$cfg = file_exists( 'cfg/cfg.ini' ) ? parse_ini_file( 'cfg/cfg.ini', true ) : [];
				
				if( is_array($cfg) && isset( $cfg['GoogleDriveAPI']['client_id'] ) )
				{
					$sysinfo = $cfg['GoogleDriveAPI'];
				}
				else if( is_array($cfg) && isset( $cfg['GoogleAPI']['client_id'] ) )
				{
					$sysinfo = $cfg['GoogleAPI'];
				}
				else
				{
					die( 'invalid cfg.ini' );
				}
				
				$gdrive_classes_location = 'devices/DOSDrivers/GoogleDrive/Google/vendor/autoload.php';
				
				if( file_exists( $gdrive_classes_location ) && isset( $obj->code ) )
				{
					require_once( $gdrive_classes_location );
					
					//if we have a code we want to create a token from it...
					$client = new Google_Client();
					$client->setApplicationName( $sysinfo['project_id'] );
					$client->setClientId( $sysinfo['client_id'] );
					$client->setClientSecret( $sysinfo['client_secret'] );	
					$client->setDeveloperKey( $sysinfo['key'] );
					$client->setIncludeGrantedScopes( true );
					$client->addScope( Google_Service_Drive::DRIVE );
					//$client->setState( rawurlencode( bin2hex( $statevar ) ) );
					$client->setAccessType( 'offline' );
					$client->setApprovalPrompt('force');
					$client->setRedirectUri( $obj->friend_serverurl );
					
					//authenticate
					if( $client->authenticate( $obj->code ) )
					{
						if( $token = $client->getAccessToken() )
						{
							$data = ( '&access=' . urlencode( json_encode( $token ) ) );
						}
						else
						{
							$obj->error = 'couldn\'t get access_token ... ';
						}
					}
					else
					{
						$obj->error = 'couldn\'t authenticate ...';
					}
				}
				
				break;
		
			default:
		
				die( ' ... ' );
		
				break;
		}
	}
	
	if( isset( $obj->debug ) )
	{
		die( print_r( $obj,1 ) );
	}
}

if( file_exists( dirname(__FILE__) . '/templates/oauth.html' ) )
{
	die( str_replace( '{data}', $data, file_get_contents( dirname(__FILE__) . '/templates/oauth.html' ) ) );
}

die();

?>
