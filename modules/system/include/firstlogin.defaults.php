<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

$userid = ( isset( $args->args->userid ) ? $args->args->userid : $User->ID );

// 0. Check if mountlist is installed and user have access!
if( ( !isset( $args->args->exclude ) || ( isset( $args->args->exclude ) && !in_array( 'mountlist', $args->args->exclude ) ) ) 
&& !( $row = $SqlDatabase->FetchObject( $q = 'SELECT * FROM FApplication WHERE Name = "Mountlist" AND UserID=\'' . $userid . '\'' ) ) )
{
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

	if( $path = findInSearchPaths( 'Mountlist' ) )
	{
		if( file_exists( $path . '/Config.conf' ) )
		{	
			$f = file_get_contents( $path . '/Config.conf' );
			// Path is dynamic!
			$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );

			// Store application!
			$a = new dbIO( 'FApplication' );
			$a->UserID = $userid;
			$a->Name = 'Mountlist';
			if( !$a->Load() )
			{
				$a->DateInstalled = date( 'Y-m-d H:i:s' );
			}

			$a->Config = $f;
			$a->Permissions = 'UGO';
			$a->DateModified = $a->DateInstalled;
			$a->Save();

			// Application activation
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
						$app->Load();
						$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
						$app->Permissions = json_encode( $perms );
						$app->Data = json_encode( $da );
						$app->Save();
					}
				}
			}
		}
	}
}

// 1. Check dock!
if( ( !isset( $args->args->exclude ) || ( isset( $args->args->exclude ) && !in_array( 'dock', $args->args->exclude ) ) ) 
&& !( $row = $SqlDatabase->FetchObject( $q = 'SELECT * FROM DockItem WHERE UserID=\'' . $userid . '\'' ) ) )
{
	// 2. Setup standard dock items
	$dockItems = array(
		array( 'Convos', 'A chat and video conferencing application', false ),
		array( 'Author', 'A simple word processor', '.memo' ),
		array( 'Software', 'Software catalog', false )
	);
	$i = 0;
	foreach( $dockItems as $r )
	{
		$d = new dbIO( 'DockItem' );
		$d->Application = $r[0];
		$d->ShortDescription = $r[1];
		$d->UserID = $userid;
		$d->SortOrder = $i++;
		$d->Parent = 0;
		$d->Save();
		
		// Mimetype
		if( $r[2] )
		{
			$o = new dbIO( 'FSetting' );
			$o->UserID = $userid;
			$o->Type = 'mimetypes';
			$o->Key = $r[2];
			$o->Load();
			$o->Data = $r[0];
			$o->Save();
		}
	}
}

// 2. Check if we never logged in before..
if( !( $disk = $SqlDatabase->FetchObject( $q = 'SELECT * FROM Filesystem WHERE UserID=\'' . $userid . '\'' ) ) )
{
	// 3. Setup a standard disk
	$o = new dbIO( 'Filesystem' );
	$o->UserID = $userid;
	$o->Name = 'Home';
	$o->Load();
	$o->Type = 'SQLDrive';
	$o->ShortDescription = 'My data volume';
	$o->Server = 'localhost';
	$o->Mounted = '1';
	
	if( $o->Save() )
	{
		if( !isset( $args->args->exclude ) || isset( $args->args->exclude ) && !in_array( 'mount', $args->args->exclude ) )
		{
			// 3b. Mount the thing
			$u = $Config->SSLEnable ? 'https://' : 'http://';
			$u .= ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort;
			$c = curl_init();
			curl_setopt( $c, CURLOPT_URL, $u . '/system.library/device/mount/?devname=Home&sessionid=' . $User->SessionID );
			curl_setopt( $c, CURLOPT_EXPECT_100_TIMEOUT_MS, false );
			curl_setopt( $c, CURLOPT_RETURNTRANSFER, 1 );
			if( $Config->SSLEnable )
			{
				curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
				curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
			}
			$ud = curl_exec( $c );
			curl_close( $c );
		}

		// 4. Wallpaper images directory
		$f2 = new dbIO( 'FSFolder' );
		$f2->FilesystemID = $o->ID;
		$f2->UserID = $userid;
		$f2->Name = 'Wallpaper';
		if( !$f2->Load() )
		{
			$f2->DateCreated = date( 'Y-m-d H:i:s' );
			$f2->DateModified = $f2->DateCreated;
			$f2->Save();
		}
		
		// 5. Some example documents
		$f = new dbIO( 'FSFolder' );
		$f->FilesystemID = $o->ID;
		$f->UserID = $userid;
		$f->Name = 'Documents';
		if( !$f->Load() )
		{
			$f->DateCreated = date( 'Y-m-d H:i:s' );
			$f->DateModified = $f->DateCreated;
			$f->Save();
		}
		
		$fdownloadfolder = new dbIO( 'FSFolder' );
		$fdownloadfolder->FilesystemID = $o->ID;
		$fdownloadfolder->UserID = $userid;
		$fdownloadfolder->Name = 'Downloads';
		if( !$fdownloadfolder->Load() )
		{
			$fdownloadfolder->DateCreated = date( 'Y-m-d H:i:s' );
			$fdownloadfolder->DateModified = $f->DateCreated;
			$fdownloadfolder->Save();
		}
		
		// 6. Copy some wallpapers
		// TODO: Implement support for "copydefaultwallpapers"
		// This was disabled to conserve space when many user accounts are created
		if( isset( $Config ) && isset( $Config->copydefaultwallpapers ) )
		{
			$prefix = "resources/webclient/theme/wallpaper/";
			$files = array(
				"Autumn",
				"CalmSea",
				"Domestic",
				"Field",
				"Fire",
				"Freedom",
				"NightClouds",
				"RedLeaf",
				"TechRoad",
				"TreeBranch",
				"Bug",
				"CityLights",
				"EveningCalm",
				"FireCones",
				"FjordCoast",
				"GroundedLeaves",
				"Omen",
				"SummerLeaf",
				"TrailBlazing",
				"WindyOcean"
			);

			$wallpaperstring = '';
			$wallpaperseperator = '';
			foreach( $files as $file )
			{
				$fl = new dbIO( 'FSFile' );
				$fl->Filename = $file . '.jpg';
				$fl->FolderID = $f2->ID;
				$fl->FilesystemID = $o->ID;
				$fl->UserID = $userid;
				if( !$fl->Load() )
				{
					$newname = $file;
					while( file_exists( 'storage/' . $newname . '.jpg' ) )
						$newname = $file . rand( 0, 999999 );
					copy( $prefix . $file . '.jpg', 'storage/' . $newname . '.jpg' );

					$fl->DiskFilename = $newname . '.jpg';
					$fl->Filesize = filesize( $prefix . $file . '.jpg' );
					$fl->DateCreated = date( 'Y-m-d H:i:s' );
					$fl->DateModified = $fl->DateCreated;
					$fl->Save();

					$wallpaperstring .= $wallpaperseperator . '"Home:Wallpaper/' . $file . '.jpg"';
					$wallpaperseperator = ',';
				}
			}
		}

		// 8. Fill Wallpaper app with settings and set default wallpaper
		$wp = new dbIO( 'FSetting' );
		$wp->UserID = $userid;
		$wp->Type = 'system';
		$wp->Key = 'imagesdoors';
		if( !$wp->Load() )
		{
			$wp->Data = '';
			$wp->Save();
		}
		
		$wp = new dbIO( 'FSetting' );
		$wp->UserID = $userid;
		$wp->Type = 'system';
		$wp->Key = 'wallpaperdoors';
		if( !$wp->Load() )
		{
			$wp->Data = '';
			$wp->Save();
		}
	}
}

?>
