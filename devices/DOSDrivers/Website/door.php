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

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

class DoorWebsite extends Door
{
	function onConstruct()
	{
		global $args, $Filesystem;
		$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		$this->rootPath = $Filesystem->Server;
	}
	
	// Gets the subfolder by path on this filesystem door
	function getDirectoryListing( $subPath )
	{
		global $args;
		
		// 1. Get Path
		$subPath = end( explode( ':', $args->path ) );
		
		if( trim( $subPath ) )
		{
			if( substr( $subPath, 0, 2 ) == '//' )
				$path = 'http:' . $subPath;
			else 
			{
				$path = $this->rootPath;
				if( substr( $path, -1, 1 ) != '/' )
					$path .= '/';
				$path .= $subPath;
			}
		}
		// Just load the root server
		else
		{
			$path = $this->rootPath;
		}
		
		// 2. Get data
		if( $data = file_get_contents( $path ) )
		{
			// 3. Page to file
			$file = new stdClass();
			$file->Filename = 'index.html';
			$file->Type = 'File';
			$file->MetaType = 'File';
			$file->IconFile = 'gfx/icons/128x128/mimetypes/text-html.png';
			$file->Filesize = strlen( $data );
			$file->DateModifed = date( 'Y-m-d H:i:s' );
			$file->DateCreated = '1970-01-01 00:00:00';
			$file->Path = $args->path . 'index.html';
			$file->Permissions = '';
			$array[] = $file;

			// 4. Convert links to folders
			if( preg_match_all( '/\<a.*?href\=\"([^"]*?)\"[^>]*?\>([^<]*?)\</i', $data, $matches ) )
			{
				//die( print_r( $matches, 1 ) );
				foreach( $matches[2] as $k=>$m )
				{
					if( !trim( $m ) ) continue;
				
					// Only take local links
					if( 
						(
							substr( $matches[1][$k], 0, 5 ) == 'http:' ||
							substr( $matches[1][$k], 0, 6 ) == 'https:' ||
							substr( $matches[1][$k], 0, 7 ) == 'mailto:'
						)
						&&
						substr( $matches[1][$k], 0, strlen( $path ) ) != $path
					)
					{
						continue;
					}
						
					// Don't repeat links
					if( substr( $matches[1][$k], 0, strlen( $path ) ) == $path )
						$dir = substr( $matches[1][$k], strlen( $path ), strlen( $matches[1][$k] ) - strlen( $path ) );
					else $dir = $matches[1][$k];
					if( $dir{0} == '/' ) $dir = substr( $dir, 1, strlen( $dir ) - 1 );
					if( !trim( $dir ) ) continue;
					if( substr( $args->path, -1, 1 ) != '/' )
						$dir = "/$dir";
						
					// 3. Page to file
					$file = new stdClass();
					$file->Filename = $m;
					$file->Type = 'Directory';
					$file->MetaType = 'Directory';
					//$file->IconFile = 'gfx/icons/128x128/mimetypes/text-html.png';
					$file->Filesize = 1024;
					$file->DateModifed = date( 'Y-m-d H:i:s' );
					$file->DateCreated = '1970-01-01 00:00:00';
					$file->Path = $args->path . $dir;
					$file->Permissions = '';
					$array[] = $file;
				}
				return $array;
			}
		}
		return false;
	}
	
	// Execute a dos command
	function dosAction( $args )
	{
		global $Filesystem;
		// Do a directory listing
		// TODO: Make it uniform! Not to methods! use command == dir
		if( 
			( isset( $args->command ) && $args->command == 'directory' ) ||  
			( isset( $args->command ) && $args->command == 'dosaction' && $args->args->action == 'dir' )
		)
		{
			// Can we get sub folder?
			$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
			if( isset( $thePath ) && ( $thePath == ( $Filesystem->Name . ':' ) || $subPath = trim( end( explode( ':', $thePath ) ) ) ) )
			{
				if( $list = $this->getDirectoryListing( $thePath == $Filesystem->Server ? $Filesystem->Server : $subPath ) )
				{
					return json_encode( $list );
				}
				// Failed to find a path
			}
		}
		return false;
	}
}


// Create a door...
$door = new DoorWebsite( $path );

?>
