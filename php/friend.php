<?php
/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/******************************************************************************\
*                                                                              *
* FriendUP PHP API v1.0                                                        *
* (c) 2015, Friend Software Labs AS                                            *
* mail: info@friendup.no                                                       *
*                                                                              *
\******************************************************************************/

ob_start();

// Output headers in a readable format
$friendHeaders = [];
function friendHeader( $header )
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

// Authenticate applications on users
function AuthenticateApplication( $appName, $UserID, $searchGroups = false )
{
	global $SqlDatabase;
	
	if( !$searchGroups )
	{
		$groups = $SqlDatabase->FetchObjects( 'SELECT ug.Name FROM FUserGroup ug, FUserToGroup utg WHERE utg.UserID=\'' . $UserID . '\' AND utg.UserGroupID = ug.ID' );
		if( !$groups ) return 'fail<!--separate-->User with no group can not use apps.';
		$searchGroups = array(); foreach( $groups as $g ) $searchGroups[] = $g->Name;
	}
	
	// Do we have a project?
	if( strtolower( substr( $appName, -4, 4 ) ) == '.apf' )
	{
		include_once( 'php/classes/file.php' );
		$f = new File( $appName );
		$f->Load();
		$content = $f->GetContent();
		return 'ok<!--separate-->' . $content;
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

// Find apps and search path..
function FindAppInSearchPaths( $app )
{
	$ar = array(
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
	if( $args = explode( "&", $argv[1] ) )
	{
		$kvdata = new stdClass();
		foreach ( $args as $arg )
		{
			if( trim( $arg ) )
			{
				list( $key, $value ) = explode( "=", $arg );
				if( isset( $key ) && isset( $value ) )
				{
					$kvdata->$key = urldecode( $value );
					if( $data = json_decode( $kvdata->$key ) )
						$kvdata->$key = $data;
				}
			}
		}
	}
	$GLOBALS['args'] = $kvdata;
}

// No sessionid!!
if( !isset( $GLOBALS[ 'args' ]->sessionid ) && !isset( $GLOBALS[ 'args' ]->authid ) )
{
	die( '404' );
}

// Setup mysql abstraction
if( file_exists( 'cfg/cfg.ini' ) )
{
	$ar = parse_ini_file( 'cfg/cfg.ini' );
	require_once( 'classes/dbio.php' );
	require_once( 'include/i18n.php' );
	// For debugging
	require_once( 'classes/logger.php' );
	$logger =& $GLOBALS['Logger'];
	
	// Set config object
	$Config = new Object();
	$car = array( 'Hostname', 'Username', 'Password', 'DbName', 
	              'FCHost', 'FCPort', 'FCUpload', 'SSLEnable' );
	foreach( array(
		'host', 'login', 'password', 'dbname', 'fchost', 'fcport', 'fcupload',
		'SSLEnable'
	) as $k=>$type )
	{
		if( isset( $ar[$type] ) )
			$Config->{$car[$k]} = $ar[$type];
	}
	
	// Temporary folder
	$Config->FCTmp    = isset( $ar['fctmp'] ) ? $ar['fctmp'] : '/tmp/';
	if( substr( $Config->FCTmp, -1, 1 ) != '/' )
		$Config->FCTmp .= '/';
		
	$GLOBALS['Config'] =& $Config;
	
	$SqlDatabase = new SqlDatabase();
	$SqlDatabase->Open( $ar['host'], $ar['login'], $ar['password'] );
	$SqlDatabase->SelectDatabase( $ar['dbname'] );
	$GLOBALS['SqlDatabase'] =& $SqlDatabase;
	
	// User application info
	$UserApplication = false;
	
	// Get user information
	$User = new dbIO( 'FUser' );
	
	if( isset( $GLOBALS['args']->sessionid ) )
	{
		$User->SessionID = $GLOBALS['args']->sessionid;
		$User = $User->FindSingle();
		//$logger->log( 'User logged in with sessionid:' . ( $User ? ( $User->ID . ' ' . print_r( $args, 1 ) ) : ( 'No user id!' . print_r( $args, 1 ) ) ) );
	}
	if( isset( $User->SessionID ) && trim( $User->SessionID ) && $User->Load() )
	{
		//$logger->log( 'fop' );
		$GLOBALS['User'] =& $User;
	}
	else
	{
		//$logger->log( 'lop' );
		
		// Ok, did we have auth id?
		if( isset( $GLOBALS['args']->authid ) )
		{
			$UserApplication = new dbIO( 'FUserApplication' );
			$UserApplication->AuthID = $GLOBALS['args']->authid;
			$UserApplication->Load();
			if( $UserApplication->ID > 0 ) 
			{
				$User->Load( $UserApplication->UserID );
				if( $User->ID > 0 )
					$GLOBALS['User'] =& $User;
			}
		}
		
		//$logger->log( 'ok: ' . ( isset( $User ) ? ' has user' : ' no user' ) );
		
		// Failed to authenticate
		if( isset( $User->ID ) && $User->ID <= 0 )
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
			ob_clean();
		
			// Write data with headers
			$out = "---http-headers-begin---\n";
			foreach( $friendHeaders as $k=>$v )
				$out .= "$k: $v\n";
			$out .= "---http-headers-end---\n";
			
			/*$f = fopen( '/tmp/test.jpg', 'w+' );
			fwrite( $f, $out . $string );
			fclose( $f );*/
			
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
