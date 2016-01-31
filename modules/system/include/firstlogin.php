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

// 0. Check dock!
if( !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\'' ) ) )
{
	// 2. Setup standard dock items
	$dockItems = array(
		array( 'Dock', 'A simple dock desklet' ),
		array( 'Dingo', 'A command line interface' ),
		array( 'Hello', 'A chat client' ),
		array( 'Artisan', 'A programmers editor' ),
		array( 'Author', 'A word processor' ),
		array( 'Wallpaper', 'Select a wallpaper' ),
		array( 'Freeciv', 'Play a game' ),
		array( 'BurningRubber', 'Burn some rubber' )
	);
	$i = 0;
	foreach( $dockItems as $r )
	{
		$d = new dbIO( 'DockItem' );
		$d->Application = $r[0];
		$d->ShortDescription = $r[1];
		$d->UserID = $User->ID;
		$d->SortOrder = $i++;
		$d->Parent = 0;
		$d->Save();
	}
}

// 1. Check if we never logged in before..
if( !( $disk = $SqlDatabase->FetchObject( 'SELECT * FROM Filesystem WHERE UserID=\'' . $User->ID . '\'' ) ) )
{
	// 3. Setup a standard disk
	$o = new dbIO( 'Filesystem' );
	$o->UserID = $User->ID;
	$o->Name = 'Home';
	$o->Type = 'SQLDrive';
	$o->ShortDescription = 'My data volume';
	$o->Server = 'localhost';
	$o->Mounted = '1';
	
	if( $o->Save() )
	{
		// 4. Wallpaper images directory
		$f2 = new dbIO( 'FSFolder' );
		$f2->FilesystemID = $o->ID;
		$f2->UserID = $User->ID;
		$f2->Name = 'Wallpaper';
		$f2->DateCreated = date( 'Y-m-d H:i:s' );
		$f2->DateModified = $f2->DateCreated;
		$f2->Save();
		
		// 5. Some example documents
		$f = new dbIO( 'FSFolder' );
		$f->FilesystemID = $o->ID;
		$f->UserID = $User->ID;
		$f->Name = 'Documents';
		$f->DateCreated = date( 'Y-m-d H:i:s' );
		$f->DateModified = $f->DateCreated;
		$f->Save();
		
		$f1 = new dbIO( 'FSFolder' );
		$f1->FilesystemID = $o->ID;
		$f1->UserID = $User->ID;
		$f1->Name = 'Code examples';
		$f1->DateCreated = date( 'Y-m-d H:i:s' );
		$f1->DateModified = $f1->DateCreated;
		$f1->Save();

		// 6. Copy some wallpapers
		$prefix = "resources/webclient/theme/";
		$files = array(
			"wp_beach", "wp_microscope",
			"wp_morerocks", "wp_mountains",
			"wp_omnious", "wp_rocks"
		);
		foreach( $files as $file )
		{
			$newname = $file;
			while( file_exists( 'storage/' . $newname . '.jpg' ) )
				$newname = $file . rand( 0, 999999 );
			copy( $prefix . $file . '.jpg', 'storage/' . $newname . '.jpg' );
			$fl = new dbIO( 'FSFile' );
			$fl->DiskFilename = $newname . '.jpg';
			$fl->Filename = $file . '.jpg';
			$fl->FolderID = $f2->ID;
			$fl->FilesystemID = $o->ID;
			$fl->Filesize = filesize( $prefix . $file . '.jpg' );
			$fl->DateCreated = date( 'Y-m-d H:i:s' );
			$fl->DateModified = $fl->DateCreated;
			$fl->UserID = $User->ID;
			$fl->Save();
		}
		
		// 7. Copy some other files
		$prefix = "resources/webclient/examples/";
		$files = array(
			"ExampleWindow.jsx", "Template.html"
		);
		foreach( $files as $filen )
		{
			list( $file, $ext ) = explode( '.', $filen );
			$newname = $file;
			while( file_exists( 'storage/' . $newname . '.' . $ext ) )
				$newname = $file . rand( 0, 999999 );
			copy( $prefix . $file . '.' . $ext, 'storage/' . $newname . '.' . $ext );
			$fl = new dbIO( 'FSFile' );
			$fl->DiskFilename = $newname . '.' . $ext;
			$fl->Filename = $file . '.' . $ext;
			$fl->FolderID = $f1->ID;
			$fl->FilesystemID = $o->ID;
			$fl->Filesize = filesize( $prefix . $file . '.' . $ext );
			$fl->DateCreated = date( 'Y-m-d H:i:s' );
			$fl->DateModified = $fl->DateCreated;
			$fl->UserID = $User->ID;
			$fl->Save();
		}
		
	}
}

?>
