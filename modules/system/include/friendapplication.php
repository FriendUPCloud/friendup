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

function makeNumericalVersion( $versionString )
{
	$vers = explode( '.', $versionString );
	$out = '';
	foreach( $vers as $ver )
	{
		$out .= str_pad( $ver, 4, '0', STR_PAD_LEFT );
	}
	return intval( 1 . $out, 10 );
}

function storeRecentApps( $name )
{
	global $User, $Logger;
	// Store list in database --------------------------------------------------
	
	$appHistory = new dbIO( 'FSetting' );
	$appHistory->UserID = $User->ID;
	$appHistory->Type = 'system';
	$appHistory->Key = 'recent_apps';
	$appHistory->load();
	
	$list = [];
	if( $appHistory->Data )
	{
		$list = json_decode( $appHistory->Data );
		if( !$list ) $list = [];
	}
	
	//$Logger->log( 'Merging? ' . $appHistory->Key );
	
	$list = array_merge( array( $name ), $list );
	
	// Fix duplicates!
	$cleaned = [];
	for( $a = 0; $a < count( $list ); $a++ )
	{
		$found = false;
		for( $b = 0; $b < count( $cleaned ); $b++ )
		{
			if( $cleaned[ $b ] == $list[ $a ] )
			{
				$found = true;
				break;
			}
		}
		if( !$found )
			$cleaned[] = $list[ $a ];	
	}
	$list = $cleaned; unset( $cleaned );
	
	// Max ten in list
	$out = [];
	for( $a = 0; $a < 10 && $a < count( $list ); $a++ )
	{
		$out[] = $list[ $a ];
	}
	
	$appHistory->Data = json_encode( $out );
	$appHistory->save();
	unset( $list, $a );
	
	// Done storing recent apps ------------------------------------------------
}

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

// Activate whitelist
if( isset( $args->args->application ) && isset( $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ] ) )
{
	$whitelist = $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ];
	$whitelist = explode( ',', $whitelist );
	if( $level != 'Admin' && !in_array( $args->args->application, $whitelist ) )
	{
		die( 'fail' );
	}	
}

// Get the groups for authentication
$r = AuthenticateApplication( $args->args->application, $User->ID );
if( $r && substr( $r, 0, 4 ) == 'fail' )
	die( $r );

list( $retCode, $retData ) = explode( '<!--separate-->', $r );
$retObject = false;
if( $retData )
{
	$retObject = json_decode( $retData );
}

// Some settings
$sets = array( 'language' );
$opts = new stdClass();
foreach( $sets as $set )
{
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = $set;
	$s->UserID = $User->ID;
	if( $s->Load() )
	{
		$json = false;
		if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
		{
			$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
		}
		if( $json && $d = json_decode( $json ) )
		{
			$opts->$set = $d;
		}
		else if( $d = json_decode( $s->Data ) )
		{
			$opts->$set = $d;
		}
		else $opts->$set = $s->Data;
	}
}

// Just a marker to redo the test
friendapplicationstart:

// Do we already have an object? An app project!
if( $retObject && isset( $retObject->ProjectName ) )
{
	// Project path
	$ppath = $args->args->application;
	if( strstr( $ppath, '/' ) )
	{
		$ppath = explode( '/', $ppath );
		array_pop( $ppath );
		$ppath = implode( '/', $ppath ) . '/';
	}
	else if( strstr( $ppath, ':' ) )
	{
		$ppath = reset( explode( ':', $ppath ) ) . ':';
	}

	$conf = new stdClass();
	$conf->Name = $retObject->ProjectName;
	$conf->Author = $retObject->Author;
	$conf->Version = $retObject->Version;
	$conf->API = 'v1';
	$conf->Permissions = [];
	if( isset( $retObject->Permissions ) )
	{
		foreach( $retObject->Permissions as $k=>$v )
		{
			$conf->Permissions[] = $v->Permission . ' ' . $v->Name . ( $v->Options ? ( ' ' . $v->Options ) : '' );
		}
	}
	
	$conf->Libraries = $retObject->Libraries;
	$conf->Domain = $retObject->Domain; // Security domain

	$init = '';
	foreach( $retObject->Files as $k=>$v )
	{
		if( strtolower( substr( $v->Filename, -4, 4 ) ) == '.jsx' )
		{
			if( !strstr( $v->Path, ':' ) )
				$v->Path = $ppath . $v->Path;
			$init = $v->Path;
		}
	}
	
	// Store the recent!
	storeRecentApps( $v->Filename );
	
	if( $init )
	{
		$conf->Init = $init;
		die( 'ok<!--separate-->' . json_encode( $conf ) );
	}
	die( 'fail' );
}
// API app goes straight on!
else if( $level == 'API' )
{
	$conf = json_decode( $retData );
	
	// Create fapplication and fuser application if they do not exist..
	$o = new DbIO( 'FApplication' );
	$o->UserID = $User->ID;
	$o->Name = $args->args->application;
	$o->Config = $retData;
	if( !$o->Load() )
	{
		$o->DateInstalled = date( 'Y-m-d H:i:s' );
		$o->DateModified = $o->DateInstalled;
		$o->Save();
	}
	if( !$o->ID ) die( 'fail<!--separate-->No application object!' );
	
	$fa = new DbIO( 'FUserApplication' );
	$fa->UserID = $User->ID;
	$fa->ApplicationID = $o->ID;
	if( !$fa->Load() )
	{
		$fa->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . microtime() );
		$fa->Save();
	}
	// TODO: Update authid sometime for guests..? No?
	$conf->AuthID = $fa->AuthID;
	
	storeRecentApps( $o->Name );
		
	die( 'ok<!--separate-->' . json_encode( $conf ) );
}
// Installed application..
else if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE UserID=\'' . $User->ID . '\' AND `Name` = "' . $args->args->application . '"
' ) )
{
	if( $ur = $SqlDatabase->FetchObject( '
		SELECT * FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'
	' ) )
	{
		$fn = $retObject ? $retObject->ConfFilename : false;
		$conf = json_decode( $row->Config );
		
		if( $path = findInSearchPaths( $args->args->application ) )
			$conf->Path = str_replace( '../resources', '', $path ) . '/';
		else $conf->Path = str_replace( '../resources', '', $conf->Path );
		
		$numVersion = makeNumericalVersion( $conf->Version );
		
		// Find current installed (on disk) version
		if( file_exists( $conf->Path . 'Config.conf' ) )
		{
			$confStr = file_get_contents( $conf->Path . 'Config.conf' );
			$new = json_decode( $confStr );
			
			// We got a new version! Install it immediately
			if( makeNumericalVersion( $new->Version ) > $numVersion )
			{
				$o = new dbIO( 'FApplication' );
				if( $o->Load( $row->ID ) )
				{
					$o->Config = $confStr;
					$o->Save();
					
					// Get the new object
					$conf = $new;
					
					// Assign path again
					if( $path = findInSearchPaths( $args->args->application ) )
						$conf->Path = str_replace( '../resources', '', $path ) . '/';
					else $conf->Path = str_replace( '../resources', '', $conf->Path );
				}
			}
		}
		
		$conf->Permissions = json_decode( $ur->Permissions );
		$conf->AuthID = $ur->AuthID;
		$conf->State = json_decode( $ur->Data );
		$conf->ConfFilename = $fn;
		
		// Set user settings
		foreach( $opts as $ko=>$vo )
		{
			$conf->$ko = $vo;
		}
		
		// Icons, normal app icon, icon for dormant disk, dock icon
		if( file_exists( 'resources/' . $conf->Path . 'icon.svg' ) )
			$conf->Icon = $conf->Path . 'icon.svg';
		else if( file_exists( 'resources/' . $conf->Path . 'icon.png' ) )
			$conf->Icon = $conf->Path . 'icon.png';
		if( file_exists( 'resources/' . $conf->Path . 'icon_door.png' ) )
			$conf->IconDoor = $conf->Path . 'icon_door.png';
		if( file_exists( 'resources/' . $conf->Path . 'icon_dock.png' ) )
			$conf->IconDock = $conf->Path . 'icon_dock.png';
		
		$conf->UserConfig = $ur->Data;
		
		storeRecentApps( $args->args->application );
		
		die( 'ok<!--separate-->' . json_encode( $conf ) );
	}
	
	// Activate whitelist
	if( isset( $configfilesettings[ 'Security' ][ 'UserAppAutoinstall' ] ) )
	{
		$autoinstall = $configfilesettings[ 'Security' ][ 'UserAppAutoinstall' ];
		$autoinstall = explode( ',', $autoinstall );
		// We have allow-list of autoinstall apps
		if( isset( $autoinstall ) )
		{
			// We found the app in autoinstall list
			if( in_array( $args->args->application, $autoinstall ) )
			{
				$inPermissions = json_decode( $row->Permissions );
				$perms = [];
				foreach( $inPermissions as $perm )
				{
					$value = '';
					if( $perm = 'Door Local' ) $value = 'all';
					$perms[] = array( $perm, $value );
				}
			
				// Collect permissions in a string
				$app = new dbIO( 'FUserApplication' );
				$app->ApplicationID = $row->ID;
				$app->UserID = $User->ID;
				$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $row->ID );
				$app->Permissions = json_encode( $perms );
				$app->Data = '{}';
				$app->Save();
				
				// Try again
				goto friendapplicationstart;
			}
		}
	}
	die( 'activate<!--separate-->' . $row->Config );
}
else if ( $path = findInSearchPaths( $args->args->application ) )
{
	$trusted = 'n/a';
	if( file_exists( $path . '/Config.conf') )
	{
		$trusted = 'nope';
		try
		{
			$tmp = json_decode( file_get_contents( $path . '/Config.conf') );
			if( $tmp && isset( $tmp->Trusted ) && strtolower( $tmp->Trusted ) == 'yes' ) $trusted = 'yes';
		}
		catch( Exception $e )
		{
			//dont do anything here....
		}
		if( substr( $path, 0, 11 ) == 'repository/' )
		{
			if( !file_exists( 'repository/' . $args->args->application . '/Signature.sig' ) )
				die( 'fail<!--separate-->{"response":"application not signed"}' );
			$s = file_get_contents( 'repository/' . $args->args->application . '/Signature.sig' );
			$s = json_decode( $s );
			if( $s && ( !$s->validated || $s->validated != $s->signature ) )
			{
				die( 'fail<!--separate-->{"response":"application not validated"}' );
			}
		}
	}
	
	// Activate whitelist
	if( isset( $configfilesettings[ 'Security' ][ 'UserAppAutoinstall' ] ) )
	{
		$autoinstall = $configfilesettings[ 'Security' ][ 'UserAppAutoinstall' ];
		$autoinstall = explode( ',', $autoinstall );
	}
	
	// We have allow-list of autoinstall apps
	if( $trusted != 'yes' && isset( $autoinstall ) )
	{
		// We found the app in autoinstall list
		if( in_array( $args->args->application, $autoinstall ) )
		{
			$trusted = 'yes';
		}
		// User needs to manually install application
		else
		{
			die( 'fail<!--separate-->{"response":"application lacks user installation record"}' );
		}
	}
	
	die( 'notinstalled<!--separate-->{"path":"' . $path . '","trusted":"'. $trusted .'"}' );
}
die( 'fail<!--separate-->{"response": "file does not exist"}' );

?>
