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

// Intermediary module to abstract some system stuff!

include_once( 'php/friend.php' );
include_once( 'php/classes/file.php' );

if( !isset( $User ) || ( $User && ( !isset( $User->ID ) || !$User->ID ) ) || !is_object( $User ) )
{
	die( 'fail<!--separate-->{"response":"user did not authenticate. system module. Argv[1]: ' . $argv[1] . '"}' );
}

// We might come here by mistage (direct calling of file by phpfs)
if( isset( $args->module ) && $args->module != 'system' && $args->module != '(null)' )
{
	if( file_exists( $f = ( 'modules/' . $args->module . '/module.php' ) ) )
	{
		include( $f );
	}
	die( 'fail<!--separate-->' . $args->module );
}

// Get user level
if( $level = $SqlDatabase->FetchObject( '
	SELECT g.Name FROM FUserGroup g, FUserToGroup ug
	WHERE
		g.Type = \'Level\' AND
		ug.UserID=\'' . $User->ID . '\' AND
		ug.UserGroupID = g.ID
' ) )
{
	$level = $level->Name;
}
else $level = false;

function GetFilesystemByArgs( $args )
{
	global $SqlDatabase, $User;
	$identifier = false;

	if( isset( $args->fileInfo ) )
	{
		if( isset( $args->fileInfo->ID ) )
		{
			$identifier = 'f.ID=\'' . intval( $args->fileInfo->ID, 10 ) . '\'';
		}
		else
		{
			$identifier = 'f.Name=\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->fileInfo->Path ) ) )  . '\'';
		}
	}
	else if( isset( $args->path ) )
	{
		$identifier = 'f.Name=\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->path ) ) ) . '\'';
	}
	if( $Filesystem = $SqlDatabase->FetchObject( '
	SELECT * FROM `Filesystem` f
	WHERE
		(
			f.GroupID IN (
						SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
						WHERE
							g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
							ug.UserID = \'' . $User->ID . '\'
					)
			OR
			f.UserID=\'' . $User->ID . '\'
		)
		AND ' . $identifier . '
	' ) )
	{
		return $Filesystem;
	}
	return $identifier;
}

// Check for desktop events now
function checkDesktopEvents()
{
	// Returnvar
	$returnvar = [];

	// Check if we have files to import
	$files = [];
	if( file_exists( 'import' ) && $f = opendir( 'import' ) )
	{
		while( $file = readdir( $f ) )
		{
			if( $file{0} == '.' ) continue;
			$files[] = $file;
		}
		closedir( $f );
	}
	if( count( $files ) > 0 )
	{
		$returnvar['Import'] = $files;
	}
	// Count
	$c = 0;
	foreach( $returnvar as $k=>$v )
		$c++;
	if( $c > 0 )
		return json_encode( $returnvar );
	return false;
}



function curl_exec_follow( $cu, &$maxredirect = null )
{
	$mr = 5;

	if ( ini_get( 'open_basedir' ) == '' && ini_get( 'safe_mode' == 'Off' ) )
	{
		curl_setopt( $cu, CURLOPT_FOLLOWLOCATION, $mr > 0 );
		curl_setopt( $cu, CURLOPT_MAXREDIRS, $mr );
	}
	else
	{
		curl_setopt( $cu, CURLOPT_FOLLOWLOCATION, false );

		if ( $mr > 0 )
		{
			$newurl = curl_getinfo( $cu, CURLINFO_EFFECTIVE_URL );
			$rch = curl_copy_handle( $cu );

			curl_setopt( $rch, CURLOPT_HEADER, true );
			curl_setopt( $rch, CURLOPT_NOBODY, true );
			curl_setopt( $rch, CURLOPT_FORBID_REUSE, false );
			curl_setopt( $rch, CURLOPT_RETURNTRANSFER, true );
			do
			{
				curl_setopt( $rch, CURLOPT_URL, $newurl );

				$header = curl_exec( $rch );

				if ( curl_errno( $rch ) )
				{
					$code = 0;
				}
				else
				{
					$code = curl_getinfo( $rch, CURLINFO_HTTP_CODE );

					if ( $code == 301 || $code == 302 || $code == 303 )
					{
						preg_match( '/Location:(.*?)\n/', $header, $matches );

						if ( !$matches )
						{
							preg_match( '/location:(.*?)\n/', $header, $matches );
						}

						$oldurl = $newurl;
						$newurl = trim( array_pop( $matches ) );

						if ( $newurl && !strstr( $newurl, 'http://' ) && !strstr( $newurl, 'https://' ) )
						{
							if ( strstr( $oldurl, 'https://' ) )
							{
								$parts = explode( '/', str_replace( 'https://', '', $oldurl ) );
								$newurl = ( 'https://' . reset( $parts ) . ( $newurl{0} != '/' ? '/' : '' ) . $newurl );
							}
							if ( strstr( $oldurl, 'http://' ) )
							{
								$parts = explode( '/', str_replace( 'http://', '', $oldurl ) );
								$newurl = ( 'http://' . reset( $parts ) . ( $newurl{0} != '/' ? '/' : '' ) . $newurl );
							}

						}
					}
					else
					{
						$code = 0;
					}
				}
			}
			while ( $code && --$mr );
			curl_close( $rch );
			if ( !$mr )
			{
				if ( $maxredirect === null )
				{
					return false;
				}
				else
				{
					$maxredirect = 0;
				}

				return false;
			}

			curl_setopt( $cu, CURLOPT_URL, $newurl );
		}
	}

	$cu = curl_exec( $cu );

	if( $cu )
	{
		return $cu;
	}

	return false;
}

if( isset( $args->command ) )
{
	switch( $args->command )
	{
		/*case 'copytest':
			include_once( 'php/classes/door.php' );
			$d = new Door( 'Home:' );
			$t = new Door( 'Documents:' );
			if( $f = $d->getFile( 'Home:FriendWorkspace.odt' ) )
			{
				$t->putFile( 'Documents:Telenor/FriendWorkspace.odt', $f );
				die( 'ok<!--separate-->' );
			}
			die( 'fail<!--separate-->{"response":"failed"}'  );
			break;*/
		case 'help':
			$commands = array(
				'ping', 'theme', 'systempath', 'software', 'save_external_file', 'proxycheck', 'proxyget',
				'usersessionrenew', 'usersessions', 'userlevel', 'convertfile',
				'userlevel', 'convertfile', 'install', 'assign', 'doorsupport', 'setup',
				'languages', 'types', 'keys', 'events', 'news', 'setdiskcover', 'getdiskcover', 'calendarmodules',
				'mountlist', 'mountlist_list', 'deletedoor', 'fileinfo',
				'addfilesystem', 'editfilesystem', 'status', 'makedir', 'mount',
				'unmount', 'friendapplication', 'activateapplication', 'updateapppermissions', 'getapppermissions',
				'installapplication',  'uninstallapplication', 'package',  'updateappdata',
				'setfilepublic', 'setfileprivate', 'zip', 'unzip', 'volumeinfo',
				'securitydomains', 'systemmail', 'removebookmark', 'addbookmark',
				'getbookmarks', 'listapplicationdocs', 'finddocumentation', 'userinfoget',
				'userinfoset',  'useradd', 'checkuserbyname', 'userbetamail', 'listbetausers', 'listconnectedusers',
				'usersetup', 'usersetupadd', 'usersetupapply', 'usersetupsave', 'usersetupdelete',
				'usersetupget', 'userwallpaperset', 'workgroups', 'workgroupadd', 'workgroupupdate', 'workgroupdelete',
				'workgroupget', 'setsetting', 'getsetting', 'getavatar', 'listlibraries', 'listmodules',
				'listuserapplications', 'getmimetypes',  'setmimetype', 'setmimetypes', 'deletemimetypes',
				'deletecalendarevent', 'getcalendarevents', 'addcalendarevent',
				'listappcategories', 'systempath', 'listthemes', 'settheme', /* DEPRECATED - look for comment below 'userdelete',*/'userunblock',
				'usersettings', 'listsystemsettings', 'savestate', 'getsystemsetting',
				'saveserversetting', 'deleteserversetting', 'launch', 'friendversion', 'getserverkey', 
				'userroleget', 'checkpermission', 'userroleadd', 'userroleupdate', 'userroledelete',
				'getsystempermissions', 'permissions'
			);
			sort( $commands );
			die( 'ok<!--separate-->{"Commands": ' . json_encode( $commands ) . '}' );
			break;
		case 'tinyurl':
			if( isset( $User ) )
				require( 'modules/system/include/tinyurl.php' );
			break;
		case 'ping':
			if( isset( $User ) && isset( $User->ID ) )
			{
				$User->Loggedtime = mktime();
				$User->Save();
				die( 'ok' );
			}
			die( 'fail<!--separate-->{"response":"ping failed"}'  );
			break;
		// Create a thumbnail of any kind of file
		case 'thumbnail':
			require( 'modules/system/include/thumbnail.php' );
			break;
		// Delete a thumbnail
		case 'thumbnaildelete':
			$Logger->log( 'Thumbnaildelete..' );
			require( 'modules/system/include/thumbnaildelete.php' );
			break;
		// Get the app image from repository
		case 'repoappimage':
			require( 'modules/system/include/repoappimage.php' );
			break;
		case 'getsecuritysettings':
			if( isset( $configfilesettings[ 'Security' ] ) )
			{
				$r = new stdClass();
				if( isset( $configfilesettings[ 'Security' ][ 'subdomainsroot' ] ) )
					$r->subdomainsroot = $configfilesettings[ 'Security' ][ 'subdomainsroot' ];
				if( isset( $configfilesettings[ 'Security' ][ 'subdomainsnumber' ] ) )
					$r->subdomainsnumber = $configfilesettings[ 'Security' ][ 'subdomainsnumber' ];
				die( 'ok<!--separate-->' . json_encode( $r ) );
			}
			die( 'fail<!--separate-->{"responseCode":"-1","response":"no security settings available"}' );
			break;
		case 'systempath':
			require( 'modules/system/include/systempath.php' );
			break;
		case 'setmetadata':
			require( 'modules/system/include/setmetadata.php' );
			break;
		case 'getmetadata':
			require( 'modules/system/include/getmetadata.php' );
			break;
		// Get server logs
		case 'getlogs':
			require( 'modules/system/include/getlogs.php' );
			break;
		case 'resetguisettings':
			require( 'modules/system/include/resetguisettings.php' );
			break;
		case 'software':
			require( 'modules/system/include/software.php' );
			break;
		// Upgrade Friend!
		case 'upgradesettings':
			require( 'modules/system/include/upgradesettings.php' );
			break;
		// Check a proxy connection
		case 'proxycheck':
			if( function_exists( 'curl_init' ) )
			{
				$c = curl_init();
				curl_setopt( $c, CURLOPT_URL, $args->args->url );
				curl_setopt( $c, CURLOPT_FAILONERROR, true );
				curl_setopt( $c, CURLOPT_NOBODY, true );
				curl_setopt( $c, CURLOPT_RETURNTRANSFER, true );
				if( $args->args->useragent )
				{
					curl_setopt( $c, CURLOPT_USERAGENT, $args->args->useragent );
				}
				if( $Config->SSLEnable )
				{
					curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
					curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
				}

				if( function_exists( 'curl_exec_follow' ) )
				{
					$r = curl_exec_follow( $c );
				}
				else
				{
					$r = curl_exec( $c );
				}

				$k = curl_getinfo( $c );
				curl_close( $c );

				if( $r !== false && $k && ( $k['http_code'] == 200 || $k['http_code'] == 301 || $k['http_code'] == 206 ) )
				{
					die( 'ok<!--separate-->' . $k['http_code'] . '<!--separate-->' . print_r( $k,1 ) );
				}
				die( 'fail<!--separate-->' . ( $k ? ( $k['http_code'] . '<!--separate-->' . print_r( $k,1 ) ) : $r ) );
			}
			else
			{
				die( 'fail<!--separate-->function curl_init doesn\'t exist' );
			}
			die( 'totalfail<!--separate-->' . $r . '<!--separate-->' . $args->args->url );
			break;
		// Gives a proxy connection
		case 'checkfriendnetwork':
			die( 'ok<!--separate-->' . ( isset( $Config->friendnetwork ) ? $Config->friendnetwork  : '0' ) );
			break;
		
		case 'save_external_file':
		case 'proxyget':
			if( function_exists( 'curl_init' ) )
			{
				// Make sure we're getting an url!
				if( $args->args->url )
				{
					$str5 = substr( $args->args->url, 0, 5 );
					$str6 = substr( $args->args->url, 0, 6 );
					if( $str5 != 'http:' && $str6 != 'https:' )
					{
						die( 'fail<!--separate-->{"Response":"No valid url supplied!"}' );
					}
				}
				$c = curl_init( $args->args->url );
				$fields = [];
				foreach( $args->args as $k=>$v )
				{
					if( $k == 'url' ) continue;
					$fields[$k] = $v;
				}
				curl_setopt( $c, CURLOPT_POST, true );
				curl_setopt( $c, CURLOPT_POSTFIELDS, http_build_query( $fields ) );
				curl_setopt( $c, CURLOPT_RETURNTRANSFER, true );
				curl_setopt( $c, CURLOPT_HTTPHEADER, array( 'Accept-charset: UTF-8' ) );
				curl_setopt( $c, CURLOPT_ENCODING, 'UTF-8' );
				if( $args->args->useragent )
				{
					curl_setopt( $c, CURLOPT_USERAGENT, $args->args->useragent );
				}
				if( $Config->SSLEnable )
				{
					curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
					curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
				}
				
				$info = curl_getinfo( $c );
				
				if( function_exists( 'curl_exec_follow' ) )
				{
					$r = curl_exec_follow( $c );
				}
				else
				{
					$r = curl_exec( $c );
				}

				curl_close( $c );
				
				
				
				if( isset( $args->args->diskpath ) )
				{
					if( strlen( $r ) && $args->args->diskpath )
					{
						$f = new File( $args->args->diskpath );
						if( $f->save( $r ) )
						{
							//$Logger->log( 'Saved to ' . $args->args->diskpath );
							die( 'ok<!--separate-->{"result":"1","message":"Saved","path":"' . $args->args->diskpath . '"}' );
						}
					}
					$Logger->log( 'Could not save to ' . $args->args->diskpath );
					die( 'fail<!--separate-->{"result":"0","message":"Failed to save file"}' );
				}
				
				
				
				if( isset( $fields['rawdata'] ) && $fields['rawdata'] )
				{
					die( 'ok<!--separate-->' . $r );
				}
			}
			else
			{
				die( 'fail<!--separate-->function curl_init doesn\'t exist' );
			}
			if( !preg_match( '/\<html/i', $r ) )
			{
				// --- Check if result is xml or json -----------------------------
				if( strstr( substr( trim( $r ), 0, 200 ), "<?xml" ) )
				{
					if( function_exists( 'simplexml_load_string' ) )
					{
						class simple_xml_extended extends SimpleXMLElement
						{
							public function Attribute( $name )
							{
								foreach( $this->Attributes() as $key=>$val )
								{
									if( $key == $name )
									{
										return (string)$val;
									}
								}
							}
						}

						// TODO: Make support for rss with namespacing

						if( $xml = simplexml_load_string( trim( $r ), 'simple_xml_extended' ) )
						{
							die( 'ok<!--separate-->' . json_encode( $xml ) );
						}
						else
						{
							die( 'fail<!--separate-->couldn\'t convert string to object with function simplexml_load_string' );
						}
					}
					else
					{
						die( 'fail<!--separate-->function simplexml_load_string doesn\'t exist' );
					}
				}
				else if( json_decode( trim( $r ) ) && json_last_error() === 0 )
				{
					die( 'ok<!--separate-->' . $r );
				}
			}
			else
			{
				die( 'ok<!--separate-->' . $r );
			}
			die( 'totalfail<!--separate-->' . $r . '<!--separate-->' . $args->args->url );
			break;

		case 'getconfiginijson':
			require( 'modules/system/include/getconfiginijson.php' );
			break;
			
		case 'getsystempermissions':
			require( 'modules/system/include/getsystempermissions.php' );
			break;

		// Save f.eg from photopea
		case 'savefile':
			require( 'modules/system/include/savefile.php' );
			break;

		// Likes
		case 'like':
			require( 'modules/system/include/like.php' );
			break;
		case 'getlikes':
			require( 'modules/system/include/getlikes.php' );
			break;

		case 'removefromstartupsequence':
			require( 'modules/system/include/removefromstartupsequence.php' );
			break;

		case 'createdesktopshortcuts':
			require( 'modules/system/include/createdesktopshortcuts.php' );
			break;
		case 'removedesktopshortcut':
			require( 'modules/system/include/removedesktopshortcut.php' );
			break;
		
		case 'workspaceshortcuts':
			require( 'modules/system/include/workspaceshortcuts.php' );
			break;
		// Forcefully renew a session for a user
		case 'usersessionrenew':
			require( 'modules/system/include/usersessionrenew.php' );
			break;
		// Get a list of all active user sessions
		case 'usersessions':
			require( 'modules/system/include/usersessions.php' );
			break;
		case 'userlevel':
			if( $o = $SqlDatabase->FetchObject( '
				SELECT g.Name FROM FUserGroup g, FUserToGroup ug
				WHERE
					ug.UserID=\'' . $User->ID . '\' AND ug.UserGroupID = g.ID
					AND g.Type = \'Level\'
			' ) )
			{
				die( 'ok<!--separate-->' . $o->Name );
			}
			die( 'fail<!--separate-->{"response":"user level failed"}'  );
			break;
		case 'convertfile':
			require( 'modules/system/include/convertfile.php' );
			break;
		// Install / upgrade application from central Friend Store repo
		case 'install':
			require( 'modules/system/include/install.php' );
			break;
		case 'assign':
			$mode = $args->args->mode;
			if( !isset( $args->args->assign ) )
			{
				if( $devices = $SqlDatabase->fetchObjects( '
					SELECT f.Name, f.Mounted FROM
						Filesystem f
					WHERE
						f.Type="Assign" AND f.UserID=\'' . $User->ID . '\'
					ORDER BY f.Name ASC
				' ) )
				{
					die( 'ok<!--separate-->' . json_encode( $devices ) );
				}
				die( 'fail<!--separate-->{"response":"assign failed"}'  );
			}
			$assign = $args->args->assign;
			$path = $args->args->path;


			// Remove others
			if( $mode ) $mode = strtolower( $mode );
			if( !$mode || ( $mode && $mode != 'add' ) )
			{
				$SqlDatabase->query( 'DELETE FROM `Filesystem` WHERE `Type` = "Assign" AND `UserID`=\'' . $User->ID . '\' AND `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, str_replace( ':', '', trim( $assign ) ) ) . '"' );
			}

			// Just remove the assign
			if( $mode == 'remove' && !$path )
			{
				die( 'ok<!--separate-->{"response": "Filesystem was properly removed."}' );
			}

			// Add item
			$o = new dbIO( 'Filesystem' );
			$o->UserID = $User->ID;
			$o->Name = str_replace( ':', '', trim( $assign ) );
			$o->Type = 'Assign';
			$o->Load(); // Try to load..
			$o->Mounted = '0';
			$o->Config = '{"Invisible":"Yes"}';

			if( $mode == 'add' )
			{
				$o->Path = $o->Path ? ( ( $o->Path . ';' ) . $path ) : $path;

				// Process paths
				$all = explode( ';', $o->Path );

				// No duplicates
				$final = [];
				foreach( $all as $p )
				{
					$found = false;
					if( count( $final ) )
					{
						foreach( $final as $f )
						{
							if( $p == $f )
							{
								$found = true;
								break;
							}
						}
					}
					if( !$found ) $final[] = $p;
				}
				$o->Path = implode( ';', $final );
			}
			else if( $mode == 'remove' )
			{
				// Process paths
				$all = explode( ';', $o->Path );

				// Just remove one specified by $path
				$final = $o->Path;
				if( $mode == 'remove' )
				{
					$newAll = [];
					foreach( $all as $a )
					{
						if( $a != $path )
							$newAll[] = $a;
					}
					$final = $newAll;
				}
				$o->Path = implode( ';', $final );
			}
			else
			{
				$o->Path = $path;
			}
			$o->Save();
			if( $o->ID > 0 )
				die( 'ok' );
			die( 'fail<!--separate-->{"response":"assign failed"}'  );
			break;
		case 'doorsupport':
			if( $dir = opendir( 'devices/DOSDrivers' ) )
			{
				$str = '';
				while( $f = readdir( $dir ) )
				{
					if( $f{0} == '.' ) continue;
					if( file_exists( $g = 'devices/DOSDrivers/' . $f . '/door.js' ) )
						$str .= file_get_contents( $g ) . "\n";
				}
				closedir( $dir );
				if( strlen( $str ) )
					die( $str );
			}
			die( '' );
			break;
		// Just run some checks
		case 'setup':
			//include( 'modules/system/include/dbchecker.php' );
			die( 'ok' );
			break;
		case 'languages':
			include( 'modules/system/include/languages.php' );
			break;
		case 'getdosdrivericon':
			$f = isset( $args->dosdriver ) ? $args->dosdriver : die( '404' );
			if( strstr( $f, '..' ) ) die( '404' );
			if( file_exists( $fn = ( 'devices/DOSDrivers/' . $f . '/sysinfo.json' ) ) )
			{
				if( $o = json_decode( file_get_contents( $fn ) ) )
				{
					if( $o->group == 'Admin' && $level != 'Admin' ) die( '404' );
					if( !$o->icon ) die( '404' );

					if( file_exists( 'devices/DOSDrivers/' . $f . '/' . $o->icon ) )
					{
						FriendHeader( 'Content-Type: image/png' );
						die( file_get_contents( 'devices/DOSDrivers/' . $f . '/' . $o->icon ) );
					}
				}
			}
			die( '404' );
			break;
		case 'types':
			include( 'modules/system/include/types.php' );
			break;
		case 'keys':
			$out = [];
			
			if( isset( $args->args->appPath ) )
			{
				$fname = explode( ':', $args->args->appPath );
				
				$args->args->appPath = $fname[0];
				
				if( $fsys = $SqlDatabase->FetchObject( '
					SELECT f.* 
					FROM `Filesystem` f 
					WHERE f.UserID = \'' . $User->ID . '\' AND f.Name = \'' . $args->args->appPath . '\' 
					ORDER BY f.ID ASC 
				' ) )
				{
					$args->args->id = $fsys->KeysID;
				}
			}
			
			if( $User->ID > 0 && ( $keys = $SqlDatabase->FetchObjects( $q = '
				SELECT k.*, a.Name AS Application, u.AuthID AS ApplicationAuthID 
				FROM 
					`FKeys` k 
						LEFT JOIN `FApplication` a ON 
						( 
							a.ID = k.ApplicationID 
						) 
						LEFT JOIN `FUserApplication` u ON 
						( 
								u.ApplicationID = k.ApplicationID 
							AND u.UserID = \'' . $User->ID . '\' 
						)
				WHERE 
						k.UserID = \'' . $User->ID . '\' 
					AND k.IsDeleted = "0" 
					' . ( isset( $args->args->id ) ? 'AND k.ID IN ( ' . $args->args->id . ' ) ' : '' ) . '
					' . ( isset( $args->args->authId ) && !isset( $args->args->appPath ) ? ( $args->args->authId == "0" ? 'AND ( k.ApplicationID = "0" OR k.ApplicationID = "-1" ) ' : 'AND u.AuthID = \'' . $args->args->authId . '\' ' ) : '' ) . '
				ORDER 
					BY k.ID ASC 
			' ) ) )
			{
				foreach( $keys as $key )
				{
					$out[] = $key;
				}
			}
			if( isset( $args->args->id ) && $args->args->id && isset( $out[0] ) )
			{
				die( 'ok<!--separate-->' . json_encode( $out[0] ) );
			}
			else if( count( $out ) > 0 )
			{
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail<!--separate-->{"response":"keys failed"} ' . $q );
			//die( 'ok<!--separate-->[{"type":"treeroot","literal":"Treeroot"},{"type":"local","literal":"Local filesystem"},{"type":"corvo","literal":"MySQL Based Filesystem"},{"type":"website","literal":"Mount websites as doors"}]' );
			break;
		// Get desktop events
		case 'events':
			if( $data = checkDesktopEvents() )
			{
				die( 'ok<!--separate-->' . $data );
			}
			die( 'fail<!--separate-->{"response":"events failed"}' );
			break;
		// Updates from Friend Software Labs!
		case 'news':
			if( ( $d = file_get_contents( 'resources/updates.html' ) ) )
			{
				die( 'ok<!--separate-->' . $d );
			}
			die( 'fail<!--separate-->{"response":"news failed"}'  );
			break;
		case 'setdiskcover':
			require( 'modules/system/include/setdiskcover.php' );
			break;
		case 'getdiskcover':
			require( 'modules/system/include/getdiskcover.php' );
			break;
		// Get info about user's calendar sharing 
		case 'calendarshareinfo':
			require( 'modules/system/include/calendarshareinfo.php' );
			break;
		// Share user's calendar with user or workgroup ... 
		case 'calendarshare':
			require( 'modules/system/include/calendarshare.php' );
			break;
		// Unshare user's calendar with user or workgroup ... 
		case 'calendarunshare':
			require( 'modules/system/include/calendarunshare.php' );
			break;
		// Available calendar modules
		case 'calendarmodules':
			$modules = [];
			if( $dir = opendir( 'modules' ) )
			{
				while( $file = readdir( $dir ) )
				{
					if( $file{0} == '.' ) continue;
					if( !is_dir( 'modules/' . $file ) ) continue;
					if( file_exists( 'modules/' . $file . '/calendarmodule.php' ) )
					{
						$o = new stdClass();
						$o->module = $file;
						$o->moduleName = ucfirst( $file );
						$modules[] = $o;
					}
				}
				closedir( $dir );
			}
			if( count( $modules ) )
			{
				die( 'ok<!--separate-->' . json_encode( $modules ) );
			}
			die( 'fail<!--separate-->' );
			break;
		// Get a list of mounted and unmounted devices
		case 'mountlist':
			require( 'modules/system/include/mountlist.php' );
			break;

		case 'mountlist_list':
			if( $level != 'Admin' ) die('fail<!--separate-->{"response":"mountlist_list failed"}' );

			if( !isset( $args->args->userids ) ) die('fail<!--seperate-->no userids given');
			$sql = '';
			if( isset($args->args->path) )
			{
				$type = ( isset( $args->args->type ) ? ' AND f.Type=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->type ) .'\'' : '' );
				$sql = '
					SELECT f.* FROM Filesystem f
					WHERE
						f.UserID IN (' . implode(',', $args->args->userids ) . ') ' . $type . ' AND f.Path LIKE \'%'. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path ) .'%\'
					ORDER BY
						f.Name ASC
				';
			}

			if( $sql == '' ) die('fail<!--seperate-->no filter given');

			//$Logger->log( 'mounstlist list ' . $sql );

			if( $rows = $SqlDatabase->FetchObjects( $sql ) )
			{
				// Let's censor some data..
				foreach( $rows as $k=>$v )
				{
					$rows[$k]->Username = '';
					$rows[$k]->Password = '';
				}
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else if( mysqli_error() )
			{
				die( 'fail<!--separate-->server is defect. check database<!--separate-->' . mysqli_error() );
			}
			else
			{
				die('ok<!--separate-->[]');
			}

			break;

		case 'deletedoor':
			require( 'modules/system/include/deletedoor.php' );
			break;
		case 'fileinfo':
			require( 'modules/system/include/fileinfo.php' );
			break;
		// List available systems stored for the current user
		case 'filesystem':
			require( 'modules/system/include/filesystem.php' );
			break;
		case 'addfilesystem':
			require( 'modules/system/include/addfilesystem.php' );			
			die( 'fail<!--separate-->{"response":"add file system failed"}'  );
		// Disable a file system (don't really delete..)
		case 'deletefilesystem':
			require( 'modules/system/include/deletefilesystem.php' );
			break;
		// Update a file system
		case 'editfilesystem':
			require( 'modules/system/include/editfilesystem.php' );
			break;

		// Filesystem status
		case 'status':
			if( $args->devname )
			{
				$devname = str_replace( ':', '', $args->devname );
				if( $row = $SqlDatabase->FetchObject( '
					SELECT * FROM Filesystem f
					WHERE
						(
							f.UserID=\'' . $User->ID . '\' OR
							f.GroupID IN (
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
								WHERE
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
									ug.UserID = \'' . $User->ID . '\'
							)
						)
						AND f.Name=\'' . $devname . '\'
					LIMIT 1
				' ) )
				{
					die( $row->Mounted ? 'mounted' : 'unmounted' );
				}
				die( 'fail<!--separate-->{"response":"status failed"}'  );
			}
			break;
		case 'makedir':
			// Redirect it to the files module
			$args->command = 'dosaction';
			if( !isset( $args->args ) ) $args->args = new stdClass();
			$args->args->action = 'makedir';
			$args->args->path = $_REQUEST['path'];
			include( 'modules/files/module.php' );
			break;
		case 'mount':
			if( $args->devname )
			{
				$devname = trim( str_replace( ':', '', $args->devname ) );
				if( $row = $SqlDatabase->FetchObject( '
					SELECT * FROM Filesystem f
					WHERE
						f.Name=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $devname ) . '\' AND
						(
							f.UserID=\'' . intval( $User->ID ) .'\' OR
							f.GroupID IN (
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
								WHERE
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
									ug.UserID = \'' . intval( $User->ID ) . '\'
							)
						)
					LIMIT 1
				' ) )
				{
					//$Logger->log( 'Found fs ' . $row->Name . ':' );

					// TODO: Will be deprecated to be here'
					$path = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) && $args->args->path ? $args->args->path : false );
					$test = 'devices/DOSDrivers/' . $row->Type . '/door.php';
					if( file_exists( $test ) )
					{
						$args->command = 'dosaction';
						$args->action = 'mount';

						include_once( $test );

						$Logger->log('file was included');

						foreach( $row as $k=>$v )
							$door->$k = $v;



						if( $result = $door->dosAction( $args ) )
						{
							die( $result );
						}
					}
					else
					{
						$Logger->log('No door.php found for ' . $row->Name . ' at ' . $test);
					}
					die( 'ok<!--separate-->' );
				}
			}
			//$Logger->log( 'Failed..' );
			die( 'fail<!--separate-->{"response":"could not mount drive"}' );
			break;
		case 'unmount':
			if( $args->devname )
			{
				$devname = trim( str_replace( ':', '', $args->devname ) );
				if( $row = $SqlDatabase->FetchObject( '
					SELECT * FROM `Filesystem`
					WHERE
						(
							f.UserID=\'' . intval( $User->ID ) . '\' OR
							f.GroupID IN (
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
								WHERE
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
									ug.UserID = \'' . intval( $User->ID ) . '\'
							)
						)
						AND Name=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->devname ) . '\'
					LIMIT 1
				' ) )
				{
					// Only user can unmount
					$SqlDatabase->query( '
					UPDATE `Filesystem`
						SET `Mounted` = "0"
					WHERE
						`ID` = \'' . $row->ID . '\' AND UserID=\'' . $User->ID . '\'
					' );


					// TODO: Will be deprecated to be here'
					$Logger->log( 'Trying to use dosdriver to unmount drive ' . $devname . '..' );
					$test = 'devices/DOSDrivers/' . $row->Type . '/door.php';
					if( file_exists( $test ) )
					{
						include( $test );
						$args->command = 'dosaction';
						$args->action = 'unmount';
						if( $result = $door->dosAction( $args ) )
							die( $result );
					}

					die( 'ok<!--separate-->' );
				}
			}
			break;
		// Populate a sandbox
		case 'sandbox':
			require( 'modules/system/include/sandbox.php' );
			break;
		// Try to lauch friend application
		case 'friendapplication':
			require( 'modules/system/include/friendapplication.php' );
			break;
		// Activate an application for the user
		case 'activateapplication':
			require( 'modules/system/include/activateapplication.php' );
			break;
		case 'updateapppermissions':
			require( 'modules/system/include/updateapppermissions.php' );
			break;
		case 'getapppermissions':
			require( 'modules/system/include/getapppermissions.php' );
			break;
		// Get a repository resource
		case 'resource':
			require( 'modules/system/include/resource.php' );
			break;
		// Install a friend package!
		case 'installpackage':
			require( 'modules/system/include/installpackage.php' );
			break;
		// Install an application available in the repo (sysadmin only!)
		case 'installapplication':
			require( 'modules/system/include/installapplication.php' );
			break;
		// Install an application available in the repo (sysadmin only!)
		case 'uninstallapplication':
			require( 'modules/system/include/uninstallapplication.php' );
			break;
		case 'package':
			require( 'modules/system/include/package.php' );
			break;
		case 'updateappdata':
			require( 'modules/system/include/updateappdata.php' );
			break;
		case 'setfilepublic':
			require( 'modules/system/include/setfilepublic.php' );
			break;
		case 'setfileprivate':
			require( 'modules/system/include/setfileprivate.php' );
			break;
		case 'zip':
			require( 'modules/system/include/zip.php' );
			break;
		case 'unzip':
			require( 'modules/system/include/unzip.php' );
			break;
		// Get information about a volume
		case 'volumeinfo':
			require( 'modules/system/include/volumeinfo.php' );
			break;
		// Remove a bookmark
		case 'securitydomains':
			require( 'modules/system/include/securitydomains.php' );
			break;
		case 'systemmail':
			require( 'modules/system/include/systemmail.php' );
			break;
			
		// Set/get the system global settings
		case 'setserverglobals':
			require( 'modules/system/include/setserverglobals.php' );
			break;
		
		case 'getserverglobals':
			require( 'modules/system/include/getserverglobals.php' );
			break;
			
		// Remove a bookmark
		case 'removebookmark':
			$s = new dbIO( 'FSetting' );
			$s->UserID = $User->ID;
			$s->Type = 'bookmark';
			$s->Key = $args->args->name;
			$s->Load(); // Try to load it
			if( isset( $s->ID ) && $s->ID > 0 )
			{
				$s->Delete();
				die( 'ok' );
			}
			die( 'fail<!--separate-->' ); //. $s->_lastQuery );
			break;
		// Add a filesystem bookmark
		case 'addbookmark':
			$s = new dbIO( 'FSetting' );
			$s->UserID = $User->ID;
			$s->Type = 'bookmark';
			$s->Key = $args->args->path;
			$s->Load(); // Try to load it
			$s->Data = json_encode( $args->args );
			$s->Save(); // Save!
			if( isset( $s->ID ) && $s->ID > 0 )
			{
				die( 'ok' );
			}
			die( 'fail<!--separate-->' . $s->_lastQuery );
		// Get all bookmarks
		case 'getbookmarks':
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM `FSetting` WHERE
				`UserID`=\'' . $User->ID . '\' AND
				`Type`=\'bookmark\'
				ORDER BY `Key` ASC
			' ) )
			{
				$result = array();
				foreach( $rows as $row )
				{
					$data = json_decode( $row->Data );
					$o = new stdClass();
					$o->name = $data->name;
					$o->path = $data->path;
					$result[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $result ) );
			}
			die( 'fail<!--separate-->{"response":"getbookmarks failed"}'  );
		case 'getlocale':
			require( 'modules/system/include/getlocale.php' );
			break;
		// Gets a list of available filesystem "drivers"
		case 'listfilesystems':

			break;
		// Get the whole or components of the dos driver gui
		case 'dosdrivergui':
			require( 'modules/system/include/dosdrivergui.php' );
			break;
		case 'evaluatepackage':
			require( 'modules/system/include/evaluatepackage.php' );
			break;
		case 'repositorysoftware':
			require( 'modules/system/include/repositorysoftware.php' );
			break;
		case 'listapplicationdocs':
			if( $installed = $SqlDatabase->FetchObjects( '
				SELECT a.* FROM FApplication a, FUserApplication ua
				WHERE
					a.ID = ua.ApplicationID
				AND
					ua.UserID = \'' . $User->ID . '\'
				ORDER BY a.Name DESC
			' ) )
			{
				$out = [];
				foreach( $installed as $inst )
				{
					$ppath = 'resources/webclient/apps/';
					$dpath = 'Documentation/';
					$docnm = 'index.html';
					$final = $ppath . $inst->Name . '/' . $dpath . $docnm;
					if( file_exists( $ppath . $inst->Name ) && file_exists( $ppath . $inst->Name . '/' . $dpath ) && file_exists( $final ) )
					{
						$o = new stdClass();
						$o->Path = 'System:Documentation/Applications/' . $inst->Name;
						$o->Title = $inst->Name;
						$o->Filename = $inst->Name;
						$o->Type = 'DormantFunction';
						$o->Filesize = 16;
						$o->Module = 'Files';
						$o->Command = 'dormant';
						$o->Position = 'left';
						$o->IconFile = 'gfx/icons/128x128/mimetypes/text-enriched.png';
						$out[] = $o;
					}
				}
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail<!--separate-->' );
			break;
		case 'applicationdetails':
			require( 'modules/system/include/applicationdetails.php' );
			break;
		case 'finddocumentation':
			if( isset( $args->args->path ) && substr( strtolower( $args->args->path ), 0, 7 ) == 'system:' )
			{
				$p = strtolower( preg_replace( '/[^a-z]+/i', '_', end( explode( ':', $args->args->path ) ) ) ) . '.html';
				if( file_exists( 'resources/repository/onlinedocs/' . $p ) )
				{
					die( 'ok<!--separate-->' . file_get_contents( 'resources/repository/onlinedocs/' . $p ) );
				}
				die( 'fail<!--separate-->{"response":"find docs failed"}'  );
			}
			else if( $installed = $SqlDatabase->FetchObjects( '
				SELECT a.* FROM FApplication a, FUserApplication ua
				WHERE
					a.ID = ua.ApplicationID
				AND
					ua.UserID = \'' . $User->ID . '\'
				ORDER BY a.Name DESC
			' ) )
			{
				$out = [];
				foreach( $installed as $inst )
				{
					$ppath = 'resources/webclient/apps/';
					$dpath = 'Documentation/';
					$docnm = 'index.html';
					$final = $ppath . $inst->Name . '/' . $dpath . $docnm;
					if( $inst->Name == $args->args->doc && file_exists( $ppath . $inst->Name ) && file_exists( $ppath . $inst->Name . '/' . $dpath ) && file_exists( $final ) )
					{
						die( 'ok<!--separate-->' . file_get_contents( $final ) );
					}
				}
			}
			die( 'fail<!--separate-->' );
			break;
			
		// Get a list of users
		case 'listusers':
			require( 'modules/system/include/listusers.php' );
			break;

		// List users connected to you through workgroups
		case 'listconnectedusers':
			require( 'modules/system/include/listconnectedusers.php' );
			break;

		// store new public key
		case 'setuserpublickey':
			require( 'modules/system/include/setuserpublickey.php' );
			break;

		// Get detailed info about a user
		// TODO: Permissions!!! Only access users if you are admin!
		case 'userinfoget':
			require( 'modules/system/include/userinfoget.php' );
			break;
		case 'userkeysupdate':
			if( $User->ID )
			{
				$fsysid = false; $found = false;
				
				if( isset( $args->args->appPath ) )
				{
					$fname = explode( ':', $args->args->appPath );
					
					$args->args->appPath = $fname[0];
				}
				
				$key = new dbIO( 'FKeys' );
				$key->IsDeleted = '0';
				$key->UserID = $User->ID;
				if( isset( $args->args->id ) && $args->args->id )
				{
					if( !$key->Load( $args->args->id ) )
					{
						die( 'fail<!--separate-->{"response":"no user key found"}' );
					}
					
					$found = true;
				}
				else if( isset( $args->args->authId ) && $args->args->authId )
				{
					if( $fup = $SqlDatabase->FetchObject( '
						SELECT 
							a.ID 
						FROM 
							`FUserApplication` u, 
							`FApplication` a 
						WHERE 
								u.UserID = \'' . $User->ID . '\' 
							AND u.AuthID = \'' . $args->args->authId . '\' 
							AND a.ID = u.ApplicationID 
						ORDER BY 
							a.ID ASC 
						LIMIT 1 
					' ) )
					{
						$key->ApplicationID = $fup->ID;
						
						if( !$key->Load() )
						{
							$key->UniqueID = hash( 'sha256', ( time().rand(0,999).rand(0,999).rand(0,999) ) );
							$key->DateCreated = date( 'Y-m-d H:i:s' );
						}
						
						$found = true;
					}
					else
					{
						die( 'fail<!--separate-->{"response":"no application key found"}' );
					}					
				}
				else if( isset( $args->args->appPath ) && $args->args->appPath )
				{
					if( $fs = $SqlDatabase->FetchObject( '
						SELECT 
							f.ID, f.KeysID 
						FROM 
							`Filesystem` f 
						WHERE 
								f.UserID = \'' . $User->ID . '\' 
							AND f.Name = \'' . $args->args->appPath . '\' 
						ORDER BY 
							f.ID ASC 
						LIMIT 1
					' ) )
					{
						$deviceid = $fs->ID;
						
						$args->args->app = '-1';
						
						if( $fs->KeysID && ( $fsys = $SqlDatabase->FetchObjects( $q = '
							SELECT 
								k.ID 
							FROM 
								`FKeys` k 
							WHERE 
									k.UserID = \'' . $User->ID . '\' 
								AND k.ID IN ( ' . $fs->KeysID . ' ) 
								AND k.IsDeleted = "0" 
								AND k.ApplicationID = "-1" 
							ORDER BY 
								k.ID DESC 
						' ) ) )
						{
							foreach( $fsys as $fsy )
							{
								$key->ID = $fsy->ID;
							}
						}
						
						//die( print_r( $fsys,1 ) . ' [] ' . $q );
						
						if( !$key->ID || !$key->Load() )
						{
							$fsysid = $deviceid;
							
							//$key->RowType = 'Filesystem';
							//$key->RowID = intval( $fsy->ID, 10 );
							
							$key->UniqueID = hash( 'sha256', ( time().rand(0,999).rand(0,999).rand(0,999) ) );
							$key->DateCreated = date( 'Y-m-d H:i:s' );
						}
						
						$found = true;
					}
					else
					{
						die( 'fail<!--separate-->{"response":"no filesystem key found"}' );
					}					
				}
				/*else
				{
					$key->UniqueID = hash( 'sha256', ( time().rand(0,999).rand(0,999).rand(0,999) ) );
					$key->DateCreated = date( 'Y-m-d H:i:s' );
				}*/
				$key->ApplicationID = ( isset( $args->args->app ) ? $args->args->app : $key->ApplicationID );
				$key->Name          = ( $args->args->name ? $args->args->name : $key->Type );
				$key->Type          = ( $args->args->type ? $args->args->type : $key->Type );
				
				if( !$found )
				{
					$key->Load();
					$key->UniqueID = hash( 'sha256', ( time().rand(0,999).rand(0,999).rand(0,999) ) );
					$key->DateCreated = date( 'Y-m-d H:i:s' );
				}
				
				$key->Data          = ( $args->args->key ? $args->args->key : $key->Data );
				$key->Signature     = ( $args->args->signature ? $args->args->signature : $key->Signature );
				$key->PublicKey     = $args->args->publickey;
				$key->DateModified  = date( 'Y-m-d H:i:s' );
				$key->Save();
				
				if( $fsysid && $key->ID > 0 )
				{
					$sys = new dbIO( 'Filesystem' );
					$sys->ID = $fsysid;
					$sys->UserID = $User->ID;
					if( $sys->Load() )
					{
						$sys->KeysID = ( !strstr( ','.$sys->KeysID.',', ','.$key->ID.',' ) ? ( $sys->KeysID ? $sys->KeysID.',' : '' ) . $key->ID : $sys->KeysID );
						$sys->Save();
					}
				}
				
				die( 'ok<!--separate-->' . $key->ID );
			}
			die( 'fail<!--separate-->{"response":"user keys update failed"}'  );
			break;
		case 'userkeysdelete':
			if( $User->ID > 0 && $args->args->id )
			{
				$key = new dbIO( 'FKeys' );
				$key->UserID = $User->ID;
				if( $key->Load( $args->args->id ) )
				{
					$key->IsDeleted = 1;
					$key->Save();

					die( 'ok' );
				}
			}
			die( 'fail<!--separate-->{"response":"user keys delete failed"}'  );
			break;
		// Set info on a user
		// TODO: Update with correct encryption algo
		case 'userinfoset':
			if( $level == 'Admin' || $args->args->id == $User->ID )
			{
				$u = new dbIO( 'FUser' );
				if( $u->Load( $args->args->id ) )
				{
					$u->FullName = $args->args->FullName;
					$u->Name     = $args->args->Name;
					$u->Email    = $args->args->Email;
					if( isset( $args->args->Password ) && $args->args->Password != '********' )
						$u->Password = $args->args->Password;
					$u->Save();
					if( isset( $args->args->Level ) )
					{
						// Check if the user group exists
						$g = false;
						if( !$g = $SqlDatabase->FetchObject( '
							SELECT * FROM `FUserGroup` g
							WHERE
								g.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Level ) . '\''
						) )
						{
							$g = new dbIO( 'FUserGroup' );
							$g->Name = $args->args->Level;
							$g->Type = 'Level';
							$g->Load();
							$g->Save();
						}
						// If we have a group
						if( isset( $g->ID ) && $g->ID > 0 )
						{
							if( $ugs = $SqlDatabase->FetchObjects( '
								SELECT
									g.*
								FROM
									`FUserGroup` g,
									`FUserToGroup` ug,
								WHERE
										g.Type = "Level"
									AND ug.UserGroupID = g.ID
									AND ug.UserID = \'' . $u->ID . '\'
							' ) )
							{
								foreach( $ugs as $ug )
								{
									$SqlDatabase->query( '
										UPDATE FUserToGroup
											SET UserGroupID = \'' . $g->ID . '\'
										WHERE
												UserGroupID = \'' . $ug->ID . '\'
											AND UserID = \'' . $u->ID . '\'
									' );
								}
							}
							else
							{
								$ug = new dbIO( 'FUserToGroup' );
								$ug->UserGroupID = $g->ID;
								$ug->UserID = $u->ID;
								$ug->Load();
								$ug->Save();
							}

							die( 'ok' );
						}
					}
					die( 'ok' );
				}
			}
			die( 'fail<!--separate-->{"response":"user info set failed"}'  );
		// Add a new user
		// TODO: Permissions! ONly admin can do this!
		case 'useradd':
			require( 'modules/system/include/useradd.php' );
			break;
		//
		case 'checkuserbyname':
			if( $level == 'Admin' || $args->args->id == $User->ID )
			{
				if( $userinfo = $SqlDatabase->FetchObject( '
					SELECT `ID` FROM `FUser` WHERE Name = \'' . $args->args->username . '\'
				' ) )
				{
					die( 'ok<!--separate-->userexists' );
				}
				else
				{
					die( 'ok<!--separate-->userdoesnotexist' );
				}
			}
			die( 'fail<!--separate-->{"response":"checkuserbyname failed"}'  );
			break;
		/* Roles */
		case 'userroleadd':
			require( 'modules/system/include/userrole_add.php' );
			break;
		case 'userroledelete':
			require( 'modules/system/include/userrole_delete.php' );
			break;
		case 'userroleupdate':
			require( 'modules/system/include/userrole_update.php' );
			break;
		case 'userroleget':
			require( 'modules/system/include/userrole_get.php' );
			break;
		case 'checkpermission':
			require( 'modules/system/include/checkpermission.php' );
			break;
		/* End roles */
		case 'userbetamail':
		case 'listbetausers':
			require( 'modules/system/include/betaimport.php' );
			break;
		// List setup
		case 'usersetup':
			require( 'modules/system/include/usersetup.php' );
			break;
		// Add setup
		case 'usersetupadd':
			require( 'modules/system/include/usersetupadd.php' );
			break;
		// Apply setup
		case 'usersetupapply':
			if( $level == 'Admin' && ( $args->args->userid > 0 || $args->args->members > 0 ) )
			{
				require( 'modules/system/include/usersetupapply.php' );
			}
			die( 'fail<!--separate-->{"response":"unauthorized access to usersetupapply"}' );
			break;
		// Save setup
		case 'usersetupsave':
			require( 'modules/system/include/usersetupsave.php' );
			break;
		// Delete setup
		case 'usersetupdelete':
			require( 'modules/system/include/usersetupdelete.php' );
			break;
		case 'usersetupwallpaperdelete':
			require( 'modules/system/include/usersetupwallpaperdelete.php' );
			break;
		case 'usersetupwallpaperexists':
			require( 'modules/system/include/usersetupwallpaperexists.php' );
			break;
		case 'usersetupwallpaperget':
			require( 'modules/system/include/usersetupwallpaperget.php' );
			break;
		case 'usersetupwallpaperset':
			require( 'modules/system/include/usersetupwallpaperset.php' );
			break;
		// Get setup
		case 'usersetupget':
			require( 'modules/system/include/usersetupget.php' );
			break;
		// Wallpaper
		case 'userwallpaperset':
			require( 'modules/system/include/userwallpaperset.php' );
			break;
		// List workgroups
		case 'workgroups':
			require( 'modules/system/include/workgroups.php' );
			break;
		// Add a workgroup
		case 'workgroupadd':
			require( 'modules/system/include/workgroupadd.php' );
			break;
		// Update a workgroup
		case 'workgroupupdate':
			require( 'modules/system/include/workgroupupdate.php' );
			break;
		// Delete a workgroup
		case 'workgroupdelete':
			require( 'modules/system/include/workgroupdelete.php' );
			break;
		// Get a workgroup
		case 'workgroupget':
			require( 'modules/system/include/workgroupget.php' );
			break;

		case 'setsetting':
			require( 'modules/system/include/setsetting.php' );
			break;
		case 'getsetting':
			require( 'modules/system/include/getsetting.php' );
			break;
		case 'getavatar':
			require( 'modules/system/include/getavatar.php' );
			break;
		case 'listlibraries':
			require( 'modules/system/include/listlibraries.php' );
			break;
		case 'listmodules':
			require( 'modules/system/include/modules.php' );
			break;
		case 'removeapplicationsettings':
			require( 'modules/system/include/removeapplicationsettings.php' );
			break;
		case 'listuserapplications':
			require( 'modules/system/include/listuserapplications.php' );
			break;
		case 'getapplicationpreview':
			require( 'modules/system/include/getapplicationpreview.php' );
			break;
		case 'getmimetypes':
			require( 'modules/system/include/getmimetypes.php' );
			break;
		case 'setmimetype':
			require( 'modules/system/include/setmimetype.php' );
			break;
		case 'setmimetypes':
			require( 'modules/system/include/setmimetypes.php' );
			break;
		case 'checkuserpermission':
			require( 'modules/system/include/checkuserpermission.php' );
			break;
		case 'checkapppermission':
			require( 'modules/system/include/checkapppermission.php' );
			break;
		case 'checkmimeapplication':
			require( 'modules/system/include/checkmimeapplication.php' );
			break;
		case 'deletemimetypes':
			require( 'modules/system/include/deletemimetypes.php' );
			break;
		case 'deletecalendarevent':
			require( 'modules/system/include/deletecalendarevent.php' );
			break;
		case 'getcalendarevents':
			require( 'modules/system/include/getcalendarevents.php' );
			break;
		case 'getcalendarevent':
			require( 'modules/system/include/getcalendarevent.php' );
			break;
		case 'savecalendarevent':
			require( 'modules/system/include/savecalendarevent.php' );
			break;
		case 'addcalendarevent':
			require( 'modules/system/include/addcalendarevent.php' );
			break;
		// List the categories of apps!
		case 'listappcategories':
			require( 'modules/system/include/appcategories.php' );
			break;
		// Handle system paths
		case 'systempath':
			require( 'modules/system/include/systempath.php' );
			break;
		// Get a list of available themes
		case 'listthemes':
			require( 'modules/system/include/themes.php' );
			break;
		case 'theme':
			require( 'modules/system/include/theme.php' );
			break;
		case 'themesettings':
			require( 'modules/system/include/themesettings.php' );
			break;
		case 'settheme':
			$o = new dbIO( 'FSetting' );
			$o->UserID = $User->ID;
			$o->Type = 'system';
			$o->Key = 'theme';
			$o->Load();
			$o->Data = $args->args->theme;
			$o->Save();
			if( $o->ID > 0 )
				die( 'ok' );
			die( 'fail<!--separate-->{"response":"set theme failed"}'  );

		case 'userunblock':
			if( $level != 'Admin' ) die('fail<!--separate-->{"response":"userunblock failed"}' );
			$u = new dbIO( 'FUser' );
			if( $u->Load( $args->args->id ) )
			{
				$unblockquery = 'INSERT INTO FUserLogin (`UserID`,`Login`,`Information`,`LoginTime`) VALUES ('. $u->ID .',\''. $u->Name .'\',\'Admin unblock\',\''. time() .'\')';
				$SqlDatabase->query( $unblockquery );
				die( 'ok' );
			}
			die( 'fail<!--separate-->{"response":"userunblock failed"}'  );
		case 'usersettings':
			require( 'modules/system/include/usersettings.php' );
			break;

		case 'listsystemsettings':
			if( $level != 'Admin' ) die('fail<!--separate-->{"response":"unauthorized access to system settings"}' );
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM FSetting s
				WHERE
					s.UserID = \'-1\'
				ORDER BY s.Type ASC, s.Key ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				die('ok<!--separate-->nosettingsfound');
			}

			break;

		// Save the application state
		case 'savestate':
			require( 'modules/system/include/savestate.php' );
			break;

		case 'getsystemsetting':
			if( $args->args->type && $args->args->key && $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM FSetting s
				WHERE
					s.UserID = \'-1\'
				AND s.Type = \''. $args->args->type .'\'
				AND s.Key = \''. $args->args->key .'\'
				ORDER BY s.Key ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				die('ok<!--separate-->settingnotfouns');
			}
			break;

		case 'saveserversetting':
			if( $level == 'Admin' && $args->args->settingsid && $args->args->settings )
			{
				$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->settings ) .'\' WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->settingsid ) . '\'' );
				die('ok<!--separate-->' .$args->args->settingsid );
			}
			else if( $level == 'Admin' && $args->args->key && $args->args->type )
			{
				$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. mysqli_real_escape_string( $SqlDatabase->_link, $args->args->settings ) .'\' WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->settingsid ) . '\'' );
				$o = new dbIO( 'FSetting' );
				$o->UserID = '-1';
				$o->Type = $args->args->type;
				$o->Key = $args->args->key;
				$o->Save();
				if( $o->ID > 0 )
				{
					die('ok<!--separate-->' . $o->ID );
				}
			}
			else
			{
				die('fail<!--separate-->You are ' . $level );
			}
			die( 'fail<!--separate-->{"response":"saveserversettings failed"}'  );

		case 'deleteserversetting':
			if( $level == 'Admin' && $args->args->sid )
			{
				$SqlDatabase->query( 'DELETE FROM `FSetting` WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->sid ) . '\'' );
				die('ok<!--separate-->' .$args->args->settingsid );
			}
			break;

		// Launch an app...
		case 'launch':
			require( 'modules/system/include/launch.php' );
			break;

		// Account maintenance
		case 'updatefriendaccount':
			require( 'modules/system/include/updatefriendaccount.php' );
			break;


		// Handle FriendUP version
		case 'friendversion':
			require( 'modules/system/include/friendversion.php' );
			break;
		
		// List server services
		case 'getservices':
			if( $level == 'Admin' )
			{
				require( 'modules/system/include/getservices.php' );
			}
			die( 'fail<!--separate-->{"response":"unauthorized access to getservices"}' );
			break;
		
		// get server publickey, create keypairs if not found
		case 'getserverkey':
			
			include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
			
			$publickey = '';
			
			// TODO: Have a look at why there is a slight difference between a standard 2048 bit RSA key and the key generated here (probably pkcs#7) ...
			
			if( file_exists( 'cfg/crt/server_encryption_key.pem' ) )
			{
				if( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) )
				{
					if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
					{
						if( isset( $keys[1] ) )
						{
							$publickey = ( '-----' . $keys[1] );
						}
					}
				}
			}
			else 
			{
				$fcrypt = new fcrypto( 2048 );
				
				if( $keys = $fcrypt->generateKeys(  ) )
				{
					$pem = ( $keys['privatekey'] . "\r\n" . $keys['publickey'] );
					
					if( !file_exists( 'cfg/crt' ) )
					{
						@mkdir( 'cfg/crt', 0755, true );
					}
					
					if( $pem && ( $fp = @fopen( 'cfg/crt/server_encryption_key.pem', 'w+' ) ) )
					{
						fwrite ( $fp, $pem );
						fclose ( $fp );
						
						$publickey = $keys['publickey'];
					}
				}
			}
			
			if( $publickey )
			{
				die( 'ok<!--separate-->' . $publickey );
			}
			
			die( 'fail<!--separate-->{"response":"getserverkey fatal error"}' );
			
			break;
		
		// System permissions handling go here
		case 'permissions':
			require( 'modules/system/permissions/index.php' );
			break;
		
		case 'sleepabit':
			/* just sleep a bit and return given sleeptime + random stuff to the client */
			/* used for FriendCore debug work only...  */
			$sleeptime = intval( ( isset( $args->args->sleeptime) ? $args->args->sleeptime : 0 ) );
			if( $sleeptime < 1 ) $sleeptime = 1;
			
			$randomstring = str_shuffle( 'thisisjustsomedebugoutputcontainingthesleeptimeof' . $sleeptime .'seconds' );
			
			$Logger->log( 'Sleeping a bit here ' . $sleeptime . ' :: ' . $randomstring);
			
			sleep( $sleeptime );
			
			die( 'ok<!--separate-->{"slept_for": "'. $sleeptime .'" seconds", "randomstuff":"'.$randomstring.'" }' );
			break;
		
		// Init firstlogin for a new user via this module call 
		case 'firstlogin':
			
			if( isset( $args->args->userid ) && $args->args->userid )
			{
				$debug = [];
				
				$userid = ( isset( $args->args->userid ) ? $args->args->userid : $User->ID );
				
				require( 'modules/system/include/firstlogin.php' );
				
				die( 'ok<!--separate-->' . $userid . '<!--separate-->' . json_encode( $debug ) );
			}
			
			break;
		
		// NATIVE version commands ---------------------------------------------

		// These functions are insecure. Commented out, we do not need them
		// Get all windows managed by friend core
		/*case 'list_windows':
			require( 'modules/system/include/znative_list_windows.php' );
			break;
		// Resize a window mbfc
		case 'window_resize':
			require( 'modules/system/include/znative_window_resize.php' );
			break;
		// Minimize a window mbfc
		case 'window_minimize':
			require( 'modules/system/include/znative_window_minimize.php' );
			break;
		// Maximize a window mbfc
		case 'window_maximize':
			require( 'modules/system/include/znative_window_maximize.php' );
			break;
		// Maximize a window mbfc
		case 'window_restore':
			require( 'modules/system/include/znative_window_restore.php' );
			break;
		// List apps running mbfc
		case 'list_apps':
			require( 'modules/system/include/znative_list_apps.php' );
			break;
		// Kill an app mbfc
		case 'kill_app':
			require( 'modules/system/include/znative_kill_app.php' );
			break;
		case 'launch_app':
			require( 'modules/system/include/znative_launch_app.php' );
			break;*/
	}
}

// End of the line
die( 'fail<!--separate-->{"response":"uncaught command exception"}' ); //end of the line<!--separate-->' . print_r( $args, 1 ) . '<!--separate-->' . ( isset( $User ) ? $User : 'No user object!' ) );


?>
