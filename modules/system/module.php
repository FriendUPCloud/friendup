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

// Intermediary module to abstract some system stuff!

include_once( 'php/friend.php' );

// We might come here by mistage (direct calling of file by phpfs)
if( $args->module != 'system' && $args->module != '(null)' )
{
	if( file_exists( $f = ( 'modules/' . $args->module . '/module.php' ) ) )
	{
		include( $f );
	}
	die( 'fail' );
}

if( !isset( $User ) || ( $User && !isset( $User->ID ) ) )
{
	if( isset( $logger ) )
		$logger->log( 'Failed. No user! ' . print_r( $args, 1 ) );
	die( 'fail<!--separate-->User did not authenticate! ' . print_r( $args, 1 ) );
}

// Get user level
if( $level = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE ug.UserID=\'' . $User->ID . '\' AND ug.UserGroupID = g.ID' ) )
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
			$identifier = 'ID=\'' . intval( $args->fileInfo->ID, 10 ) . '\'';
		}
		else
		{
			$identifier = '`Name`=\'' . mysql_real_escape_string( reset( explode( ':', $args->fileInfo->Path ) ) )  . '\'';
		}
	}
	else if( isset( $args->path ) )
	{
		$identifier = '`Name`=\'' . mysql_real_escape_string( reset( explode( ':', $args->path ) ) ) . '\'';
	}
	if( $Filesystem = $SqlDatabase->FetchObject( '
	SELECT * FROM `Filesystem` WHERE UserID=\'' . $User->ID . '\' AND ' . $identifier . '
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

if( isset( $args->command ) )
{
	switch( $args->command )
	{
		// Gives a proxu connection
		case 'proxyget':
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
			$r = curl_exec( $c );
			curl_close( $c );
			if( $xml = simplexml_load_string( $r ) )
			{
				die( 'ok<!--separate-->' . json_encode( $xml ) );
			}
			die( 'fail' );
			break;
			
		case 'userlevel':
			if( $o = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE ug.UserID=\'' . $User->ID . '\' AND ug.UserGroupID = g.ID' ) )
			{
				die( 'ok<!--separate-->' . $o->Name );
			}
			die( 'fail' );
			break;
		// Install / upgrade application from central Friend Store repo
		case 'install':
			include( 'modules/system/include/install.php' );
			break;
		case 'assign':
			$mode = $args->args->mode;
			
			// Remove others
			if( !$mode || strtolower( $mode ) != 'add' )
			{
				$SqlDatabase->query( 'DELETE FROM `Filesystem` f WHERE f.Type = "Assign" AND f.UserID=\'' . $User->ID . '\' AND f.Name = "' . str_replace( ':', '', trim( $assign ) ) . '"' );
			}	
			
			// Add item
			$path = $args->args->path;
			$assign = $args->args->assign;
			$o = new dbIO( 'Filesystem' );
			$o->UserID = $User->ID;
			$o->Name = str_replace( ':', '', trim( $assign ) );
			$o->Type = 'Assign';
			$o->Mounted = '1';
			$o->Path = $path;
			$o->Save();
			if( $o->ID > 0 )
				die( 'ok' );
			die( 'fail' );
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
		case 'types':
			$out = [];
			if( $dir = opendir( 'devices/DOSDrivers' ) )
			{
				while( $f = readdir( $dir ) )
				{
					if( $f{0} == '.' ) continue;
					if( !file_exists( $fn = 'devices/DOSDrivers/' . $f . '/sysinfo.json' ) )
						continue;
					$o = file_get_contents( $fn );
					if( !( $o = json_decode( $o ) ) ) continue;
					$out[] = $o;
				}
				closedir( $dir );
			}
			if( count( $out ) > 0 )
			{
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail' );
			//die( 'ok<!--separate-->[{"type":"treeroot","literal":"Treeroot"},{"type":"local","literal":"Local filesystem"},{"type":"corvo","literal":"MySQL Based Filesystem"},{"type":"website","literal":"Mount websites as doors"}]' );
			break;
		// Get desktop events
		case 'events':
			if( $data = checkDesktopEvents() )
			{
				die( 'ok<!--separate-->' . $data );
			}
			die( 'fail' );
			break;
		// Updates from Friend Software Labs!
		case 'news':
			if( ( $d = file_get_contents( 'resources/updates.html' ) ) )
			{
				die( 'ok<!--separate-->' . $d );
			}
			die( 'fail' );
			break;
		// Get a list of mounted and unmounted devices
		case 'mountlist':
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM Filesystem WHERE UserID=\'' . $User->ID . '\' ORDER BY `Name` ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				die( 'fail<!--separate-->no filesystems available' );
			}
			break;
		case 'deletedoor':
			if( $row = $SqlDatabase->FetchObject( '
				SELECT * FROM Filesystem 
				WHERE 
					UserID=\'' . $User->ID . '\' AND ID=\'' . intval( $args->args->id ) . '\' 
				LIMIT 1
			' ) )
			{
				$SqlDatabase->Query( 'DELETE FROM Filesystem WHERE UserID=\'' . $User->ID . '\' AND ID=\'' . intval( $args->args->id, 10 ) . '\'' );
				die( 'ok<!--separate-->' );
			}
			break;
		// List available systems stored for the current user
		case 'filesystem':
			if( $row = $SqlDatabase->FetchObject( '
				SELECT * FROM Filesystem 
				WHERE 
					UserID=\'' . $User->ID . '\' AND ID=\'' . intval( $args->args->id ) . '\' 
				LIMIT 1
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $row ) );
			}
			break;
		case 'addfilesystem':
			$obj = $args->args;
			if( isset( $obj->Name ) && strlen( $obj->Name ) > 0 )
			{
				$fs = new DbIO( 'Filesystem' );
				$fs->Name = $obj->Name;
				$fs->UserID = $User->ID;
				if( !$fs->Load() )
				{
					$SqlDatabase->query( '
					INSERT INTO Filesystem
					( `Name`, `UserID`, `Server`, `Port`, `Path`, `Type`, `ShortDescription`, `Username`, `Password`, `Mounted` )
					VALUES
					(
						"' . mysql_real_escape_string( $obj->Name ) . '",
						"' . $User->ID . '", 
						"' . mysql_real_escape_string( $obj->Server ) . '",
						"' . intval( $obj->Port, 10 ) . '",
						"' . mysql_real_escape_string( $obj->Path ) . '",
						"' . mysql_real_escape_string( $obj->Type ) . '",
						"' . mysql_real_escape_string( $obj->ShortDescription ) . '",
						"' . mysql_real_escape_string( $obj->Username ) . '",
						"' . mysql_real_escape_string( $obj->Password ) . '",
						"' . mysql_real_escape_string( isset( $obj->Mounted ) ? $obj->Mounted : '' ) . '"
					)
					' );
					die( 'ok' );
				}
				die( 'fail' );
			}
			die( 'fail' );
		case 'editfilesystem':
			$obj = $args->args;
			if( isset( $obj->ID ) && $obj->ID > 0 )
			{
				$SqlDatabase->query( '
				UPDATE Filesystem
					SET `Name` = "' . mysql_real_escape_string( $obj->Name ) . '", 
					`UserID` = "' . $User->ID . '", 
					`Server` = "' . mysql_real_escape_string( $obj->Server ) . '", 
					`Port` = "' . mysql_real_escape_string( $obj->Port ) . '", 
					`Path` = "' . mysql_real_escape_string( $obj->Path ) . '", 
					`Type` = "' . mysql_real_escape_string( $obj->Type ) . '", 
					`ShortDescription` = "' . mysql_real_escape_string( $obj->ShortDescription ) . '", 
					`Username` = "' . mysql_real_escape_string( $obj->Username ) . '", 
					`Password` = "' . mysql_real_escape_string( $obj->Password ) . '", 
					`Mounted` = "0"
				WHERE
					ID = \'' . intval( $obj->ID, 10 ) . '\'
				' );
				die( 'ok' );
			}
			die( 'fail' );
		// Filesystem status
		case 'status':
			if( $args->devname )
			{
				$devname = str_replace( ':', '', $args->devname );
				if( $row = $SqlDatabase->FetchObject( '
					SELECT * FROM Filesystem
					WHERE
						UserID=\'' . $User->ID .'\' AND Name=\'' . $devname . '\'
					LIMIT 1
				' ) )
				{
					die( $row->Mounted ? 'mounted' : 'unmounted' );
				}
				die( 'fail' );
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
					SELECT * FROM Filesystem
					WHERE
						`UserID`=\'' . $User->ID .'\' AND `Name`=\'' . $devname . '\'
					LIMIT 1
				' ) )
				{
					$Logger->log( 'Found fs ' . $row->Name . ':' );
					$SqlDatabase->query( '
					UPDATE `Filesystem`
						SET `Mounted` = "1"
					WHERE
						`ID` = \'' . $row->ID . '\'
					' );
					
					// TODO: Will be deprecated to be here'
					$path = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) && $args->args->path ? $args->args->path : false );
					$test = 'devices/DOSDrivers/' . $row->Type . '/door.php';
					if( file_exists( $test ) )
					{
						$Logger->log( 'Found ' . 'devices/DOSDrivers/' . $row->Type . '/door.php' );
						include( $test );
						$args->command = 'dosaction';
						$args->action = 'mount';
						$Logger->log( 'Why??' );
						if( $result = $door->dosAction( $args ) )
						{
							$Logger->log( 'Result: ' . $result );
							die( $result );
						}
						$Logger->log( 'Included..' );
					}
					die( 'ok<!--separate-->' );
				}
			}
			else
			{
				die( 'fail<!--separate-->What da fuk?: ' . print_r( $args, 1 ) );
			}
			break;
		case 'unmount':
			if( $args->devname )
			{
				$devname = trim( str_replace( ':', '', $args->devname ) );
				if( $row = $SqlDatabase->FetchObject( '
					SELECT * FROM `Filesystem`
					WHERE
						`UserID`=\'' . $User->ID .'\' AND `Name`=\'' . $devname . '\'
					LIMIT 1
				' ) )
				{
					$SqlDatabase->query( '
					UPDATE `Filesystem`
						SET `Mounted` = "0"
					WHERE
						`ID` = \'' . $row->ID . '\'
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
		// Install an application available in the repo (sysadmin only!)
		case 'installapplication':
			require( 'modules/system/include/installapplication.php' );
			break;
		case 'updateappdata':
			require( 'modules/system/include/updateappdata.php' );
			break;
		// Get information about a volume
		case 'volumeinfo':
			require( 'modules/system/include/volumeinfo.php' );
			break;
		// Add a filesystem bookmark
		case 'addbookmark':
			$s = new dbIO( 'FSetting' );
			$s->UserID = $User->ID;
			$s->Type = 'bookmark';
			$s->Key = $args->args->name;
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
			die( 'fail' );
		// Gets a list of available filesystem "drivers"
		case 'listfilesystems':
			
			break;
		case 'getfilesystemgui':
			if( !isset( $args->args->type ) ) die( 'fail' );
			if( file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/door.html' ) ) )
			{
				die( 'ok<!--separate-->' . file_get_contents( $f ) );
			}
			die( 'fail' );
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
		case 'finddocumentation':
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
					if( $inst->Name == $args->args->doc && file_exists( $ppath . $inst->Name ) && file_exists( $ppath . $inst->Name . '/' . $dpath ) && file_exists( $final ) )
					{
						die( 'ok<!--separate-->' . file_get_contents( $final ) );
					}
				}
			}
			die( 'fail<!--separate-->' );
			break;
		// Get a list of users
		// TODO: Permissions!!! Only list out when you have users below your
		//                      level, unless you are Admin
		case 'listusers':
			if( $level != 'Admin' ) die('fail');
			
			if( $users = $SqlDatabase->FetchObjects( '
				SELECT u.*, g.Name AS `Level` FROM 
					`FUser` u, `FUserGroup` g, `FUserToGroup` ug
				WHERE
					    u.ID = ug.UserID
					AND g.ID = ug.UserGroupID
				ORDER BY 
					u.FullName ASC
			' ) )
			{
				$out = [];
				foreach( $users as $u )
				{
					$keys = [ 'ID', 'Name', 'Password', 'FullName', 'Email', 'CreatedTime', 'Level' ];
					$o = new stdClass();
					foreach( $keys as $key )
					{
						$o->$key = $u->$key;
					}
					$out[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail' );
			break;
		
		// Get detailed info about a user
		// TODO: Permissions!!! Only access users if you are admin!
		case 'userinfoget':
			if( isset($args->args->id) )
				$uid = $args->args->id;
			else
				$uid = $User->ID;
			if( $level == 'Admin' || $uid == $User->ID )
			{
				if( $userinfo = $SqlDatabase->FetchObject( '
					SELECT u.*, g.Name AS `Level` FROM 
						`FUser` u, `FUserGroup` g, `FUserToGroup` ug
					WHERE
							u.ID = ug.UserID
						AND g.ID = ug.UserGroupID
						AND u.ID = \'' . $uid . '\'
				' ) )
				{
					die( 'ok<!--separate-->' . json_encode( $userinfo ) );
				}
			}
			die( 'fail' );
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
						$g = new dbIO( 'FUserGroup' );
						$g->Name = $args->args->Level;
						$g->Load();
						if( $g->ID > 0 )
						{
							$SqlDatabase->query( '
								UPDATE FUserToGroup 
									SET UserGroupID = \'' . $g->ID . '\'
								WHERE
									UserID = \'' . $u->ID . '\'
							' );
							die( 'ok' );
						}
					}
					die( 'ok' );
				}
			}
			die( 'fail' );
		// Add a new user
		// TODO: Permissions! ONly admin can do this!
		case 'useradd':
			if( $level == 'Admin' )
			{
				// Make sure we have the "User" type group
				$g = new dbIO( 'FUserGroup' );
				$g->Name = 'User';
				$g->Load();
				$g->Save();
			
				if( $g->ID > 0 )
				{
					// Create the new user
					$u = new dbIO( 'FUser' );
					$u->Password = md5( rand(0,999) + microtime() );
					$u->Name = 'Unnamed user';
					$u->FullName = 'Unnamed user';
					$u->Save();
				
					if( $u->ID > 0 )
					{
						$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $u->ID . '\', \'' . $g->ID . '\' )' );
						die( 'ok<!--separate-->' . $u->ID );
					}
				}
			}
			die( 'fail' );
			
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
			die( 'fail' );
			break;	

		case 'userbetamail':		
		case 'listbetausers':
			require( 'modules/system/include/betaimport.php' );
			break;
			

			
		case 'setsetting':
			require( 'modules/system/include/setsetting.php' );
			break;
		case 'getsetting':
			require( 'modules/system/include/getsetting.php' );
			break;
		case 'listlibraries':
			require( 'modules/system/include/listlibraries.php' );
			break;
		case 'listmodules':
			require( 'modules/system/include/modules.php' );
			break;
		case 'listuserapplications':
			require( 'modules/system/include/listuserapplications.php' );
			break;
		case 'getmimetypes':
			require( 'modules/system/include/getmimetypes.php' );
			break;
		case 'setmimetypes':
			require( 'modules/system/include/setmimetypes.php' );
			break;
		case 'deletemimetypes':
			require( 'modules/system/include/deletemimetypes.php' );
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
			die( 'fail' );
		case 'userdelete':
			$u = new dbIO( 'FUser' );
			if( $u->Load( $args->args->id ) )
			{
				$SqlDatabase->query( 'DELETE FROM `FSetting` WHERE UserID=\'' . $u->ID . '\'' );
				$SqlDatabase->query( 'DELETE FROM `DockItem` WHERE UserID=\'' . $u->ID . '\'' );
				$u->Delete();
				die( 'ok' );
			}
			die( 'fail' );
		case 'usersettings':
			// Settings object
			$s = new stdClass();
			
			// The first login test!
			include( 'modules/system/include/firstlogin.php' );
			
			// Theme information
			$o = new dbIO( 'FSetting' );
			$o->UserID = $User->ID;
			$o->Type = 'system';
			$o->Key = 'theme';
			$o->Load();

			$s->Theme = $o->ID > 0 ? $o->Data : false;
			
			// Get all mimetypes!
			$types = [];
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM FSetting s
				WHERE
					s.UserID = \'' . $User->ID . '\'
					AND
					s.Type = \'mimetypes\'
				ORDER BY s.Data ASC
			' ) )
			{
				foreach( $rows as $row )
				{
					$found = false;
					if( count( $types ) )
					{
						foreach( $types as $type )
						{
							if( $type->executable == $row->Data )
							{
								$type->types[] = $row->Key;
								$found = true;
							}
						}
					}
					if( !$found )
					{
						$o = new stdClass();
						$o->executable = $row->Data;
						$o->types = array( $row->Key );
						$types[] = $o;
					}
				}
			}
			$s->Mimetypes = $types;
			
			die( 'ok<!--separate-->' . json_encode( $s ) );
			
			
		case 'listsystemsettings':
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM FSetting s
				WHERE
					s.UserID = \'-1\'
				ORDER BY s.Key ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				die('ok<!--separate-->nosettingsfound');	
			}
			
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
				$SqlDatabase->query( 'UPDATE `FSetting` SET Data=\''. $args->args->settings .'\' WHERE ID=\'' . $args->args->settingsid . '\'' );
				die('ok<!--separate-->' .$args->args->settingsid );
			}
			break;
			
			
			
		// Launch an app...
		case 'launch':
			require( 'modules/system/include/launch.php' );
			break;
			
			
		// handle FriendUp version
		case 'friendversion':
			require( 'modules/system/include/friendversion.php' );
			break;
	}
}

// End of the line
die( 'fail<!--separate-->end of the line<!--separate-->' . print_r( $args, 1 ) . '<!--separate-->' . ( isset( $User ) ? $User : 'No user object!' ) );


?>
