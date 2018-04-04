<?php

// 0. Check if mountlist is installed and user have access!
if( !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM FApplication WHERE Name = "Mountlist" AND UserID=\'' . $User->ID . '\'' ) ) )
{
	if( !function_exists( 'findInSearchPaths' ) )
	{
		function findInSearchPaths( $app )
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
			$a->UserID = $User->ID;
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
if( !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\'' ) ) )
{
	// 2. Setup standard dock items
	$dockItems = array(
		array( 'Dock', 'Manage your application laucher' ),
		array( 'FriendShell', 'The Friend command line interface' ),
		array( 'FriendChat', 'A chat and video conferencing application' ),
		array( 'FriendCreate', 'A programmers editor' ),
		array( 'Author', 'A simple word processor' ),
		array( 'Wallpaper', 'Select wallpapers' ),
		array( 'Astray', 'A labyrinth ball game in 3D' ),
		array( 'Calculator', 'Do some math' ),
		array( 'Panzers', 'Multiplayer tanks fun!' ),
		array( 'Welcome', 'Useful Friend information' )
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

// 2. Check if we never logged in before..
if( !( $disk = $SqlDatabase->FetchObject( $q = 'SELECT * FROM Filesystem WHERE UserID=\'' . $User->ID . '\'' ) ) )
{

	$Logger->log( 'Creating home dir' );
	
	// 3. Setup a standard disk
	$o = new dbIO( 'Filesystem' );
	$o->UserID = $User->ID;
	$o->Name = 'Home';
	$o->Load();
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
		if( !$f2->Load() )
		{
			$f2->DateCreated = date( 'Y-m-d H:i:s' );
			$f2->DateModified = $f2->DateCreated;
			$f2->Save();
		}

		// 5. Some example documents
		$f = new dbIO( 'FSFolder' );
		$f->FilesystemID = $o->ID;
		$f->UserID = $User->ID;
		$f->Name = 'Documents';
		if( !$f->Load() )
		{
			$f->DateCreated = date( 'Y-m-d H:i:s' );
			$f->DateModified = $f->DateCreated;
			$f->Save();
		}

		$f1 = new dbIO( 'FSFolder' );
		$f1->FilesystemID = $o->ID;
		$f1->UserID = $User->ID;
		$f1->Name = 'Code examples';
		if( !$f1->Load() )
		{
			$f1->DateCreated = date( 'Y-m-d H:i:s' );
			$f1->DateModified = $f1->DateCreated;
			$f1->Save();
		}

		// 6. Copy some wallpapers
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
			$fl->UserID = $User->ID;
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

		// 7. Copy some other files
		$prefix = "resources/webclient/examples/";
		$files = array(
		"ExampleWindow.jsx", "Template.html"
		);

		foreach( $files as $filen )
		{
			list( $file, $ext ) = explode( '.', $filen );

			$fl = new dbIO( 'FSFile' );
			$fl->Filename = $file . '.' . $ext;
			$fl->FolderID = $f1->ID;
			$fl->FilesystemID = $o->ID;
			$fl->UserID = $User->ID;
			if( !$fl->Load() )
			{
				$newname = $file;
				while( file_exists( 'storage/' . $newname . '.' . $ext ) )
					$newname = $file . rand( 0, 999999 );
				copy( $prefix . $file . '.' . $ext, 'storage/' . $newname . '.' . $ext );

				$fl->DiskFilename = $newname . '.' . $ext;
				$fl->Filesize = filesize( $prefix . $file . '.' . $ext );
				$fl->DateCreated = date( 'Y-m-d H:i:s' );
				$fl->DateModified = $fl->DateCreated;
				$fl->Save();
			}
		}

		// 8. Fill Wallpaper app with settings and set default wallpaper
		$wp = new dbIO( 'FSetting' );
		$wp->UserID = $User->ID;
		$wp->Type = 'system';
		$wp->Key = 'imagesdoors';
		if( !$wp->Load() )
		{
			$wp->Data = '['. $wallpaperstring .']';
			$wp->Save();
		}

		$wp = new dbIO( 'FSetting' );
		$wp->UserID = $User->ID;
		$wp->Type = 'system';
		$wp->Key = 'wallpaperdoors';
		if( !$wp->Load() )
		{
			$wp->Data = '"Home:Wallpaper/Freedom.jpg"';
			$wp->Save();
		}
	}
}

?>
