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

class Door extends dbIO
{
	// Construct a Door object
	function Door( $path = false )
	{
		global $SqlDatabase;
		
		$this->dbTable ( 'Filesystem' );
		
		if( $q = $this->getQuery( $path ) )
		{
			if( $d = $SqlDatabase->FetchObject( $q ) )
			{
				foreach( $d as $k=>$v )
					$this->$k = $v;
			}
		}
		if( method_exists( $this, 'onConstruct' ) )
		{
			$this->onConstruct();
		}
	}
	
	// Gets the correct identifier to extract a filesystem
	function getQuery( $path = false )
	{
		global $args, $User;
		
		$identifier = false;
		
		// We've probably got a request object
		if( is_object( $path ) )
		{
			$args = $path;
			
			// TODO: MAP AND KILL THIS SHIT! WE NEED ONLY ONE WAY!
			// Try by fileInfo path
			if( isset( $args->fileInfo->Path ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->fileInfo->Path ) ) ) . '\')';
			}
			// Try by volume name
			else if( isset( $args->args->volume ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->args->volume ) ) ) . '\')';
			}
			else if( isset( $args->args->from ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->args->from ) ) ) . '\')';
			}
			else if( isset( $args->path ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->path ) ) ) . '\')';
			}
			else if( isset( $args->args->path ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->args->path ) ) ) . '\')';
			}
			// This one should not be required!
			else if( isset( $args->args->directory ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->args->directory ) ) ) . '\')';
			}
			// This one should not be required!
			else if( isset( $args->args->args->path ) )
			{
				$identifier = 'LOWER(`Name`)=LOWER(\'' . mysql_real_escape_string( reset( explode( ':', $args->args->args->path ) ) ) . '\')';
			}
			// Try by filesystem database id (LAST RESORT!)
			else if( isset( $args->fileInfo->ID ) )
			{
				$identifier = 'ID=\'' . intval( $args->fileInfo->ID, 10 ) . '\'';
			}
			if( $identifier )
			{
				return 'SELECT * FROM `Filesystem` WHERE UserID=\'' . $User->ID . '\' AND ' . $identifier;
			}
		}
		// Get by path (string)
		else
		{
			$name = mysql_real_escape_string( reset( explode( ':', $path ) ) );
			return 'SELECT * FROM `Filesystem` WHERE UserID=\'' . $User->ID . '\' AND `Name`=\'' . $name . '\'';
		}
		
		// Failed!
		return false;
	}
	
	// Will open and return a file pointer set with options
	function openFile( $path, $mode )
	{
		return false;
	}
	
	// Close file pointer!
	function closeFile( $filePointer )
	{
		return false;
	}
	
	// Will read from file pointer x bytes
	function readFile( $filePointer, $bytes )
	{
		return NULL;
	}

	// Will write to pointer, data, x bytes
	function writeFile( $filePointer, $data, $bytes )
	{
		return 0;
	}

	function copyFile( $pathFrom, $pathTo )
	{
		global $User, $Logger;
		
		// 1. Get the filesystem objects
		$from = reset( explode( ':', $pathFrom ) );
		$to   = reset( explode( ':', $pathTo   ) );
		
		$fsFrom = new dbIO( 'Filesystem' );
		$fsFrom->UserID = $User->ID;
		$fsFrom->Name   = $from;
		$fsFrom->Load();
		
		$fsTo = new dbIO( 'Filesystem' ); 
		$fsTo->UserID = $User->ID;
		$fsTo->Name   = $to;
		$fsTo->Load();
		
		// We got two filesystems, good!
		if( $fsTo->ID > 0 && $fsFrom->ID > 0 )
		{
			// Make sure we support both filesystems
			// TODO: Deprecate old version
			$testFrom = 'modules/files/include/door_' . $fsFrom->Type . '.php';
			$testTo   = 'modules/files/include/door_' . $fsTo->Type . '.php';
			// New version:
			if( !file_exists( $testFrom ) )
				$testFrom = 'devices/DOSDrivers/' . $fsFrom->Type . '/door.php';
			if( !file_exists( $testTo ) )
				$testTo = 'devices/DOSDrivers/' . $fsTo->Type . '/door.php';
				
			// Final test
			if( !file_exists( $testFrom ) ) die( 'error' );
			if( !file_exists( $testTo   ) ) die( 'error' );
			
			// Get a filesystem object for the two file systems
			$path = $pathFrom;
			include( $testFrom );
			$doorFrom = $door;
			
			$path = $pathTo;
			include( $testTo );
			$doorTo = $door;
			
			unset( $door, $path );
			
			// Do a file move!
			// It's a folder!
			if( substr( $pathFrom, -1, 1 ) == '/' )
			{
				$fpath = substr( $pathFrom, 0, strlen( $pathFrom ) - 1 );
				if( strstr( $fpath, '/' ) )
					$folderName = end( explode( '/', $fpath ) );
				else $folderName = end( explode( ':', $fpath ) );

				if( trim( $folderName ) )
				{
					$tpath = $pathTo;
					if( substr( $tpath, -1, 1 ) != ':' && substr( $tpath, -1, 1 ) != '/' )
						$tpath .= '/';
					
					// Create the path
					$doorTo->createFolder( $folderName, $tpath );
					return true;
				}
			}
			// It's a file
			else
			{
				if( $file = $doorFrom->getFile( $pathFrom ) )
				{
					if( $doorTo->putFile( $pathTo, $file ) )
					{
						return true;
					}
				}
			}
			return false;
		}
	}
}

?>
