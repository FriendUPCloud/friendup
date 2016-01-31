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

global $User, $SqlDatabase;

// 1. Check if we're looking for software.......................................
$len = strlen('System:Software/');
$subpath = $subpathJoin = false;
if( substr( $args->args->path, 0, $len ) == 'System:Software/' )
{
	$subpath = substr( $args->args->path, $len, strlen( $args->args->path ) - $len );
	if( substr( $subpath, -1, 1 ) == '/' )
		$subpath = substr( $subpath, 0, strlen( $subpath ) - 1 );
	$subpath = explode( '/', $subpath );
	$subpathJoin = implode( '/', $subpath );
	// Ok, go fetch!

	// We need subpath here.. for now..
	if( !$subpath ) die( 'fail' );

	// Now try!
	$groups = $SqlDatabase->FetchObjects( 'SELECT ug.Name FROM FUserGroup ug, FUserToGroup utg WHERE utg.UserID=\'' . $User->ID . '\' AND utg.UserGroupID = ug.ID' );
	if( !$groups ) die( 'fail<!--separate-->User with no group can not use apps.' );
	$searchGroups = array(); foreach( $groups as $g ) $searchGroups[] = $g->Name;
	
	if( $dir = opendir( 'resources/webclient/apps' ) )
	{
		$out = [];
		$cats = [];
		$apps = [];
	
		while( $file = readdir( $dir ) )
		{
			if( $file{0} == '.' ) continue;
			if( !file_exists( $fz = 'resources/webclient/apps/' . $file . '/Config.conf' ) )
				continue;
			if( $f = file_get_contents( $fz ) )
			{
				if( $fj = json_decode( $f ) )
				{
					$joi = $fj->Category;
					if( substr( $joi, -1, 1 ) == '/' )
						$joi = substr( $joi, 0, strlen( $joi ) - 1 );
					// Is it subpath?
					if( substr( $joi, 0, strlen( $subpathJoin ) ) == $subpathJoin && strlen( $joi ) > strlen( $subpathJoin ) )
					{
						if( !in_array( $fj->Category, $cats ) )
						{
							$cats[] = $fj->Category;
						}
					}
					// Else, we got it!
					else if( $joi == $subpathJoin )
					{
						$fo = new stdClass();
						$fo->Filename = $file;
						$fo->Cat = $fj->Category;
						$apps[] = $fo;
					}
				}
			}
		}
		closedir( $dir );
	
		if( count( $cats ) )
		{
			foreach( $cats as $cat )
			{
				$cate = explode( '/', $cat );
				foreach( $cate as $k=>$v )
					$cate[$k] = ucfirst( $v );
				
				$o = new stdClass();
				$o->Filename = $cate[count($cate)-1];
				$o->Type = 'Directory';
				$o->MetaType = 'Directory';
				$o->IconFile = 'gfx/icons/128x128/places/folder-brown.png';
				$o->Path = 'System:Software/' . implode( '/', $cate ) . '/';
				$o->Permissions = '';
				$o->DateModified = date( 'Y-m-d H:i:s' );
				$o->DateCreated = '1970-01-01 00:00:00';
				$out[] = $o;
			}
		}
		if( count( $apps ) )
		{
			foreach( $apps as $app )
			{
				// Only allowed apps
				$r = AuthenticateApplication( $app->Filename, $User->ID, $searchGroups );
				if( $r && substr( $r, 0, 4 ) == 'fail' ) continue;
				
				$o = new stdClass();
				$o->Filename = $app->Filename;
				$o->Type = 'Executable';
				$o->MetaType = 'File';
				if( file_exists( 'resources/webclient/apps/' . $app->Filename . '/icon.png' ) )
				{
					$o->IconFile = '/webclient/apps/' . $app->Filename . '/icon.png';
				}
				$o->Path = 'System:Software/' . $app->Cat . '/';
				$o->Permissions = '';
				$o->DateModified = date( 'Y-m-d H:i:s' );
				$o->DateCreated = '1970-01-01 00:00:00';
				$out[] = $o;
			}
		}
		if( count( $out ) > 0 )
			die( 'ok<!--separate-->' . json_encode( $out ) );
	}
}
// DOS Drivers
else if( strtolower( trim( $args->args->path ) ) == 'system:devices/dosdrivers/' )
{
	if( $dr = opendir( 'devices/DOSDrivers' ) )
	{
		$out = [];
		while( $f = readdir( $dr ) )
		{
			if( $f{0} == '.' ) continue;
			$o = new stdClass();
			$o->Filename = $f;
			$o->Type = 'File';
			$o->MetaType = 'File';
			$o->IconFile = 'gfx/icons/128x128/mimetypes/application-vnd.oasis.opendocument.database.png';
			$o->Path = 'System:Devices/DOSDrivers/';
			$o->Permissions = '';
			$o->DateModified = date( 'Y-m-d H:i:s' );
			$o->DateCreated = '1970-01-01 00:00:00';
			$out[] = $o;
		}
		closedir( $dr );
		
		if( count( $out ) )
		{
			die( 'ok<!--separate-->' . json_encode( $out ) );
		}
		die( 'fail' );
		
	}
}
// Unimplemented
else if( strtolower( trim( $args->args->path ) ) == 'system:devices/printers/' )
{
	die( 'fail<!--separate-->' );
}

die( 'fail<!--separate-->' );


?>
