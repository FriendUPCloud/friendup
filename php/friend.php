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

/******************************************************************************\
*                                                                              *
* FriendPS PHP API v1.3                                                        *
* (c) 2015-2023, Friend Software Labs AS                                       *
* mail: info@friendos.com                                                      *
*                                                                              *
\******************************************************************************/

ob_start();
flush();

set_time_limit( 10 ); // Replace this one later in the script if you need to!

define( 'FRIEND_VERSION', 'v1.3.0' );

// Separator aware json encode/decode
function friend_json_encode( $object )
{
	$s = json_encode( $object );
	$s = str_replace( '<!--separate-->', '<!--alien_separator-->', $s );
	return $s;
}

function friend_json_decode( $string )
{
	$string = str_replace( '<!--alien_separator-->', '<!--separate-->', $string );
	return json_decode( $string );
}

function jsUrlEncode( $in )
{ 
	$out = '';
	$len = strlen( $in );
	for( $i = 0; $i < $len; $i++ )
	{
		$hex = dechex( ord( $in[ $i ] ) );
		if( $hex == '' ) $out = $out . urlencode( $in[ $i ] );
		else $out = $out . '%' . ( ( strlen( $hex ) == 1 ) ? ( '0' . strtoupper( $hex ) ) : ( strtoupper( $hex ) ) );
	}
	return str_replace(
		array( '+', '_', '.', '-' ),
		array( '%20', '%5F', '%2E', '%2D' ),
		$out
	);
}

// Connects to friend core! You must build the whole query after the fc path
function FriendCall( $queryString = false, $flags = false, $post = false, $returnCurl = false )
{
	global $Config;
	$ch = curl_init();
	// Direct to server
	if( !$queryString )
		$queryString = ( $Config->SSLEnable ? 'https://' : 'http://' ) . ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort;
	// Short hand
	else if( substr( $queryString, 0, 16 ) == '/system.library/' )
	{
		$base = ( $Config->SSLEnable ? 'https://' : 'http://' ) . ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort;
		$queryString = $base . $queryString;
	}
	curl_setopt( $ch, CURLOPT_URL, $queryString );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt( $ch, CURLOPT_EXPECT_100_TIMEOUT_MS, false );
	
	if( isset( $flags ) && $flags )
	{
		foreach( $flags as $k=>$v )
		{
			curl_setopt( $ch, $k, $v );
		}
	}
	if( $Config->SSLEnable )
	{
		curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
		curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
	}
	if( isset( $post ) && $post )
	{
		curl_setopt( $ch, CURLOPT_POST, true );
		curl_setopt( $ch, CURLOPT_POSTFIELDS, $post );
	}
	
	if( $returnCurl )
		return $ch;
		
	$result = curl_exec( $ch );
	curl_close( $ch );
	return $result;
}

// Output headers in a readable format
$friendHeaders = [];
function FriendHeader( $header )
{
	global $friendHeaders;
	
	// Get content type and content
	$headerA = explode( ':', $header );
	if( count( $headerA ) <= 1 )
		return false;
		
	list( $type, $content ) = explode( ':', $header );
	$type = trim( $type );
	$content = trim( $content );
	
	// Move through the headers
	if( count( $friendHeaders ) > 0 )
	{
		foreach( $friendHeaders as $k=>$head )
		{
			// Overwrite it
			if( $k == $type )
			{
				$friendHeaders[$k] = $content;
				return true;
			}
		}
	}
	// Add it
	$friendHeaders[$type] = $content;
	return true;
}

function FriendHeaderFlush()
{
	global $friendHeaders;
	if( count( $friendHeaders ) > 0 )
	{
		// Get current data
		// Write data with headers
		echo "---http-headers-begin---\n";
		foreach( $friendHeaders as $k=>$v )
			echo "$k: $v\n";
		echo "---http-headers-end---\n";
		flush();
		
		$friendHeaders = [];
	}
}

// Authenticate applications on users
function AuthenticateApplication( $appName, $UserID, $searchGroups = false )
{
	global $SqlDatabase, $User, $level, $Config;
	
	if( !$searchGroups )
	{
		if( !( $groups = $SqlDatabase->FetchObjects( '
			SELECT ug.Name 
			FROM 
				FUserGroup ug, FUserToGroup utg 
			WHERE 
				utg.UserID=\'' . $UserID . '\' AND utg.UserGroupID = ug.ID
		' ) ) )
		{
			return 'fail<!--separate-->User with no group can not use apps.';
		}
		$searchGroups = array(); 
		foreach( $groups as $g )
		{
			$searchGroups[] = $g->Name;
		}
	}
		
	// Do we have a project?
	if( strtolower( substr( $appName, -4, 4 ) ) == '.apf' )
	{
		include_once( 'php/classes/file.php' );
		$f = new File( $appName );
		if( $f->Load() )
		{
			return 'ok<!--separate-->' . $f->GetContent();
		}
		return 'fail<!--separate-->{"Error":"Can not find file."}';
	}
	else
	{
		$fn = FindAppInSearchPaths( $appName );
		if( !file_exists( $fn . '/Config.conf' ) )
		{
			return 'fail<!--separate-->{"Error":"No config for this app."}';
		}
		if( !( $conf = json_decode( file_get_contents( $fn . '/Config.conf' ) ) ) )
			return 'fail<!--separate-->{"Error":"Bad config for this app."}';
		// Can we run it?
		
		$conf->ConfFilename = $fn . '/Config.conf';
		
		$found = false;
		if( isset( $conf->UserGroups ) )
		{
			foreach( $conf->UserGroups as $ug )
			{
				if( in_array( $ug, $searchGroups ) )
				{
					$found = true;
					break;
				}
			}
			if( !$found ) return 'fail<!--separate-->{"Error":"Has no permission for this app."}';
		}
		return 'ok<!--separate-->' . json_encode( $conf );
	}
	return 'fail<!--separate-->{"Error":"Can not understand query."}';
}

// Get the default theme, based on override
function getDefaultTheme()
{
	global $configfilesettings;
	if( isset( $configfilesettings[ 'FriendCore' ] ) && isset( $configfilesettings[ 'FriendCore' ][ 'friendTheme' ] ) )
	{
		$th = $configfilesettings[ 'FriendCore' ][ 'friendTheme' ];
		if( file_exists( 'resources/themes/' . $th ) )
		{
			return $th;
		}
	}
	return 'friendup13';
}

// Find apps and search path..
function FindAppInSearchPaths( $app )
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

// Get arguments from argv
if( isset( $argv ) && isset( $argv[1] ) )
{
	// Parameters from path
	if( $argv[1][0] == '/' && substr( $argv[1], 0, 5 ) == '/tmp/' && !strstr( $argv[1], '..' ) )
	{
		$filename = $argv[1];
		$argv[1] = file_get_contents( $filename );
		unlink( $filename );
	}
	
	// Got crap in the start of the args list
	if( $argv[1][0] == '{' )
	{
		$argv[1] = explode( '&module=', $argv[1] );
		$argv[1] = 'module=' . $argv[1][1];
	}
	// POST JSON
	// TODO: This should be refactored, it is ugly
	if( strstr( $argv[1], '?post_json=' ) )
	{
		$argv[1] = str_replace( '?post_json=', '&post_json=', $argv[1] );
	}
	$argAr = [ $argv[1] ];
	if( isset( $argv[2] ) )
	{
		$argAr[] = $argv[2];
	}
	foreach( $argAr as $arg )
	{
		if( $args = explode( '&', $arg ) )
		{
			/*
				special case for large amount of data in request; Friend Core creates a file for us to read and parse here
			*/
			if( count( $args ) == 1 )
			{
				$argso = explode( '=', $args[ 0 ] );
				$args1 = $argso;
				if( array_shift( $argso ) == 'friendrequestparameters' )
				{
					$dataset = file_get_contents( end( $args1 ) );
					$args = explode( '&', $dataset );
				}
			}

			$num = 0;
			$kvdata = new stdClass();
			foreach ( $args as $arg )
			{
				// Keyed value
				if( trim( $arg ) && strstr( $arg, '=' ) )
				{
					list( $key, $value ) = explode( '=', $arg );
					if( isset( $key ) && isset( $value ) )
					{
						if( substr( $value, 0, 13 ) == '<!--base64-->' )
						{
							$value = trim( base64_decode( substr( $value, 13, strlen( $value ) - 13 ) ) );
						}
						if( strstr( $value, '%' ) || strstr( $value, '&' ) ) 
						{
							if( strstr( $value, '%2B' ) )
							{
								$value = explode( '%2B', $value );
								foreach( $value as $k=>$v )
								{
									$value[ $k ] = rawurldecode( $v );
								}
								// %2B also have to be rawurldecoded at the end ...
								$value = rawurldecode( implode( '%2B', $value ) );
							}
							else
							{
								$value = rawurldecode( $value );
							}
						}
						if( $value && ( $value[0] == '{' || $value[0] == '[' ) )
						{
							if( $data = json_decode( $value ) )
							{
								// We got a "post_json" element, which used POST
								if( $key == 'post_json' )
								{
									$key = 'args';
									$data = $data->args;
								}
								$kvdata->$key = $data;
								continue;
							}
							// Try to strip
							else if( $data = json_decode( stripslashes( $value ) ) )
							{
								// We got a "post_json" element, which used POST
								if( $key == 'post_json' )
								{
									$key = 'args';
									$data = $data->args;
								}
								$kvdata->$key = $data;
								continue;
							}
						}
						$kvdata->$key = $value;
					}
				}
			}
		}
	}
	$GLOBALS['args'] = $kvdata;
}

$UserAccount = false;
if( defined( 'FRIEND_USERNAME' ) && defined( 'FRIEND_PASSWORD' ) )
{
	$UserAccount = new stdClass();
	$UserAccount->Username = FRIEND_USERNAME;
	$UserAccount->Password = FRIEND_PASSWORD;
}

// No sessionid!!
if( !$UserAccount && !isset( $groupSession ) && !isset( $GLOBALS[ 'args' ]->sessionid ) && !isset( $GLOBALS[ 'args' ]->authid ) )
{
	if( !isset( $GLOBALS[ 'args' ]->servertoken ) )
	{
		die( '404 NO SESSION 4' );
	}
}
if( !$UserAccount && isset( $GLOBALS[ 'args' ]->sessionid ) && $GLOBALS[ 'args' ]->sessionid == '(null)' )
	die( '404 NO SESSION 2' );

// Setup mysql abstraction
if( file_exists( 'cfg/cfg.ini' ) )
{
	$configfilesettings = parse_ini_file( 'cfg/cfg.ini', true );
	include_once( 'classes/dbio.php' );
	include_once( 'include/i18n.php' );
	// For debugging
	include_once( 'classes/logger.php' );
	
	$logger =& $GLOBALS['Logger'];
	
	// Set config object
	$Config = new stdClass();
	$car = array( 'Hostname', 'Username', 'Password', 'DbName',
	              'FCHost', 'FCPort', 'FCUpload', 'FCPort', 
	              'SSLEnable', 'FCOnLocalhost', 'Domains', 'friendnetwork', 
	              'WorkspaceShortcuts', 'preventWizard', 'ProxyEnable'
	);

    // Get access to the database ----------------------------------------------
    
	// Shortcuts
	$dataUser = $configfilesettings[ 'DatabaseUser' ];
	$dataCore = $configfilesettings[ 'FriendCore' ];
	$datCore2 = $configfilesettings[ 'Core' ]; // TODO: Deprecated?
	if( isset( $configfilesettings[ 'Security' ] ) )
		$security = $configfilesettings[ 'Security' ];
	else $security = [];
	if( isset( $configfilesettings[ 'FriendNetwork' ] ) )
	{
		$frindNet = $configfilesettings[ 'FriendNetwork' ];
	}
	else $frindNet = [];
	
	foreach( array(
		'host', 'login', 'password', 'dbname', 
		'fchost', 'fcport', 'fcupload', 'port', 
		'SSLEnable', 'fconlocalhost', 'domains','friendnetwork',
		'workspaceshortcuts', 'preventwizard', 'ProxyEnable'
	) as $k=>$type )
	{
		$val = '';
		
		switch( strtolower( $type ) )
		{
			case 'workspaceshortcuts':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : [];
				if( is_string( $val ) )
				{
					$val = trim( $val );
					$o = array();
					$val = explode( ',', $val );
					foreach( $val as $v )
						$o[] = trim( $v );
					$val = $o;
					$o = null;
				}
				break;
			case 'host':
			case 'login':
			case 'password':
			case 'dbname':
				$val = isset( $dataUser[ $type ] ) ? $dataUser[ $type ] : '';
				break;	
			case 'fcupload':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				if( substr( $val, 0, 1 ) != '/' )
					$val = getcwd() . '/' . $val;
				break;
			case 'preventwizard':
			case 'port':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'fcport':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'fchost':
			case 'fconlocalhost':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'proxyenable':
			case 'sslenable':	
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				// Check in deprecated location
				if( !$val )
				{
					$val = isset( $datCore2[ $type ] ) ? $datCore2[ $type ] : '';
				}
				break;
			case 'domains':
				$val = isset( $security[ $type ] ) ? $security[ $type ] : '';
				break;	
			case 'friendnetwork':
				$val = isset( $frindNet[ 'enabled' ] ) ? $frindNet[ 'enabled' ] : '0';	
				break;
			default:
				$val = '';
				break;	
		}
		// Make sure the value is valid
		if( isset( $val ) && $val )
		{
			$Config->{$car[$k]} = $val;
		}
	}
	
	// Don't need these now
	$dataUser = null;
	$dataCore = null;
	$security = null;
	$frindNet = null;
	
	// Temporary folder
	$Config->FCTmp    = isset( $ar['fctmp'] ) ? $ar['fctmp'] : '/tmp/';
	if( substr( $Config->FCTmp, -1, 1 ) != '/' )
		$Config->FCTmp .= '/';
		
	$GLOBALS['Config'] =& $Config;
	
	$SqlDatabase = new SqlDatabase();
	
	if( !$SqlDatabase->Open( $Config->Hostname, $Config->Username, $Config->Password ) )
		die( 'fail<!--separate-->Could not connect to database.' );
	
	$SqlDatabase->SelectDatabase( $Config->DbName );
	
	$GLOBALS['SqlDatabase'] =& $SqlDatabase;
	
	// Done with database access -----------------------------------------------
	
	// User application info
	$UserApplication = false;
	
	// Get user information, trying first on FUserSession SessionID ------------
	$User = new dbUser();
	$UserSession = new dbIO( 'FUserSession' );

	// Match sessionid by authid
	if( isset( $args->authid ) && !isset( $args->sessionid ) && !isset( $args->args->sessionid ) )
	{
		$authid = mysqli_real_escape_string( $SqlDatabase->_link, $args->authid );
		$sess = $SqlDatabase->fetchObject( 'SELECT us.SessionID FROM FUserSession us, FAppSession a1 WHERE a1.AuthID=\'' . $authid . '\' AND us.UserID = a1.UserID LIMIT 1' );
		if( $sess )
		{
			$args->sessionid = $sess->SessionID;
		}
	}

	$sudm = false;
	// Use UserAccount object to authenticate directly into the database
	if( $UserAccount )
	{
		if( $mu = $SqlDatabase->fetchObject( $uq = '
			SELECT * FROM FUser u
			WHERE
				u.Name = \'' . $UserAccount->Username . '\' AND
				u.Password = \'' . '{S6}' . hash( 'sha256', 'HASHED' . hash( 'sha256', $UserAccount->Password ) ) . '\'
		' ) )
		{
			$User->setFromObject( $mu );
			if( $mus = $SqlDatabase->fetchObject( '
				SELECT * FROM FUserSession WHERE UserID = \'' . $mu->ID . '\' LIMIT 1
			' ) )
			{
				$UserSession = $mus;
			}	
		}
	}
	// Try with server token
	if( !isset( $UserSession->ID ) && isset( $GLOBALS[ 'args' ]->servertoken ) )
	{
		if( $session = $SqlDatabase->FetchObject( $q = ( '
			SELECT s.* FROM
				FUserSession s, FUser u
			WHERE
				u.ID = s.UserID AND u.ServerToken = "' . $SqlDatabase->_link->real_escape_string( $GLOBALS[ 'args' ]->servertoken ) . '"
			ORDER BY ID DESC
			LIMIT 1
		' ) ) )
		{
			$UserSession = $session;
		}
	}
	// Load by session id
	if( !isset( $UserSession->ID ) && isset( $GLOBALS[ 'args' ]->sessionid ) )
	{
		$User = new dbUser();
	    $UserSession->SessionID = $GLOBALS[ 'args' ]->sessionid;
	    if( $UserSession->Load() )
	    {
	        $User->Load( $UserSession->UserID );
	    }
	}

	// Here we need a union because we are looking for sessionid in both the
	// FUserSession and FUser tables..
	if( isset( $User->ID ) && $User->ID > 0 )
	{
		$GLOBALS[ 'User' ] =& $User;
		$GLOBALS[ 'UserSession' ] =& $UserSession;
	}
	else
	{
		// Ok, did we have auth id?
		if( isset( $GLOBALS['args']->authid ) )
		{
			$asid = mysqli_real_escape_string( $SqlDatabase->_link, $GLOBALS['args']->authid );
			if( $row = $SqlDatabase->FetchObject( $q = '
				SELECT * FROM ( 
					( 
						SELECT u.ID FROM FUser u, FUserApplication a 
						WHERE 
							a.AuthID="' . $asid . '" AND a.UserID = u.ID LIMIT 1 
					) 
					UNION 
					( 
						SELECT u2.ID FROM FUser u2, Filesystem f 
						WHERE 
							f.Config LIKE "%' . $asid . '%" AND u2.ID = f.UserID LIMIT 1 
					) 
				) z LIMIT 1
			' ) )
			{
				$User->Load( $row->ID );

				if( isset( $User->ID ) && $User->ID > 0 )
				{
					$GLOBALS[ 'User' ] =& $User;

					if( $mus = $SqlDatabase->FetchObject( '
						SELECT * FROM FUserSession WHERE UserID = \'' . $User->ID . '\' LIMIT 1
						' ) )
						{
							$UserSession = $mus;
							$GLOBALS['UserSession'] =& $UserSession;
						}
				}
			}
		}
		
		// Failed to authenticate
		if( !isset( $groupSession ) && isset( $User->ID ) && $User->ID <= 0 )
			die( '404' );
	}
	
	register_shutdown_function( function()
	{
		global $SqlDatabase, $friendHeaders;
		$SqlDatabase->close();
		if( count( $friendHeaders ) > 0 )
		{
			// Get current data
			$string = ob_get_contents();
			@ob_clean();
		
			// Write data with headers
			$out = "---http-headers-begin---\n";
			foreach( $friendHeaders as $k=>$v )
				$out .= "$k: $v\n";
			$out .= "---http-headers-end---\n";
			
			die( $out . $string );
		}
	} );
}
// Ouch, no ini file!
else
{
	die( 'Failed to initialize cfg.ini...' );
}

?>
