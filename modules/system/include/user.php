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

require_once( 'php/include/permissions.php' );

$prevlevel = $level;

/*if( $perm = Permissions( 'write', 'application', false, [ 
	'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
	'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
	'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
	'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
] ) )
{
	if( is_object( $perm ) )
	{
		// Permission denied.
		
		if( $perm->response == -1 )
		{
			//
			
			die( 'fail<!--separate-->' . json_encode( $perm ) );
		}
		
		// Permission granted.
		
		if( $perm->response == 1 )
		{*/
			
			$level = 'Admin';
			
		/*}
	}
}*/

die( 'TODO: finish the module code to create / update user ' . print_r( $args,1 ) . ' -- ' );



if( $level == 'Admin' )
{
	
	$data = []; $extr = [];
	
	if( isset( $args->sessionid ) )
	{
		$data['sessionid'] = trim( $args->sessionid );
	}
	if( isset( $args->servertoken ) )
	{
		$data['servertoken'] = trim( $args->servertoken );
	}
	if( isset( $args->args->id ) )
	{
		$data['id'] = trim( $args->args->id );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->fullname ) )
	{
		$data['fullname'] = trim( $args->args->fullname );
	}
	if( isset( $args->args->username ) )
	{
		$data['username'] = trim( $args->args->username );
	}
	if( isset( $args->args->password ) )
	{
		$data['password'] = trim( $args->args->password );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->email ) )
	{
		$data['email'] = trim( $args->args->email );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->mobile ) )
	{
		$extr['mobile'] = trim( $args->args->mobile );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->language ) )
	{
		$extr['language'] = trim( $args->args->language );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->avatar ) )
	{
		$extr['avatar'] = trim( $args->args->avatar );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->workgroups ) )
	{
		$extr['workgroups'] = trim( $args->args->workgroups );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	if( isset( $args->args->setup ) )
	{
		$extr['setup'] = trim( $args->args->setup );
		
		// TODO: Add check if it's correct format if not return back ...
	}
	
	
	
	if( $args->command )
	{
	
		switch( $args->command )
		{
	
			case 'user/create'
				
				// TODO: Add permission check ...
				
				// 0: Create user ... 
				
				if( isset( $data['fullname'] ) && $data['fullname'] && isset( $data['username'] ) && $data['username'] && isset( $data['password'] ) && $data['password'] )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
					
					$data['args'] = json_decode( '{
						"type"    : "write", 
						"context" : "application",  
						"data"    : { 
							"permission" : [ 
								"PERM_USER_CREATE_GLOBAL", 
								"PERM_USER_CREATE_IN_WORKGROUP", 
								"PERM_USER_GLOBAL", 
								"PERM_USER_WORKGROUP" 
							]
						} 
					}' );
					
					$g = new dbIO( 'FUserGroup' );
					$g->Name = 'User';
					$g->Load();
					$g->Save();
					
					if( $g->ID > 0 )
					{
						
						$res = _fcquery( '/system.library/user/create', $data );
					
						die( $res . ' -- ' );
						
						// 1: Add extra field
						
						if( isset( $extr['mobile'] ) && $extr['mobile'] )
						{
							_addExtraFields( $userid, [ 'Mobile' => $extr['mobile'] ] );
						}
						
						// 2: First login
						
						_firstLogin( $userid );
						
						// 3: Save avatar image
						
						if( isset( $extr['avatar'] ) && $extr['avatar'] )
						{
							_saveAvatar( $userid, $extr['avatar'] );
						}
						
						// 4: Apply template
						
						if( isset( $extr['setup'] ) && $extr['setup'] )
						{
							_applySetup( $userid, $extr['setup'] );
						}
						
						// 5: Save language setting
						
						if( isset( $extr['language'] ) && $extr['language'] )
						{
							_updateLanguages( $userid, $extr['language'] );
						}
						
						die( 'ok success' );
						
					}
					
				}
				else
				{
					die( 'fail fullname, username and password is required ...' );
				}
				
				break;
	
			case 'user/update':
				
				// TODO: Add permission check ...
				
				// 0: Update user ... 
				
				if( isset( $data['id'] ) && $data['id'] )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
					
					$data['args'] = json_decode( '{
						"type"    : "write", 
						"context" : "application",  
						"data"    : { 
							"permission" : [ 
								"PERM_USER_UPDATE_GLOBAL", 
								"PERM_USER_UPDATE_IN_WORKGROUP", 
								"PERM_USER_GLOBAL", 
								"PERM_USER_WORKGROUP" 
							]
						}, 
						"object"   : "user", 
						"objectid" : ' . $data['id'] . ' 
					}' );
					
					$res = _fcquery( '/system.library/user/update', $data );
					
					die( $res . ' -- ' );
					
					// 1: Add extra field
					
					if( isset( $extr['mobile'] ) && $extr['mobile'] )
					{
						_addExtraFields( $userid, [ 'Mobile' => $extr['mobile'] ] );
					}
					
					// 2: Save avatar image
					
					if( isset( $extr['mobile'] ) && $extr['avatar'] )
					{
						_saveAvatar( $userid, $extr['avatar'] );
					}
					
					// 3: Apply template
					
					if( isset( $extr['mobile'] ) && $extr['setup'] )
					{
						_applySetup( $userid, $extr['setup'] );
					}
					
					// 4: Save language setting
					
					if( isset( $extr['mobile'] ) && $extr['language'] )
					{
						_updateLanguages( $userid, $extr['language'] );
					}
					
					die( 'ok success' );
					
				}
				else
				{
					die( 'fail id is required ...' );
				}
				
				break;
				
			case 'user/delete':
				
				// TODO: Add permission check ...
				
				// 0: Delete user ...
				
				if( isset( $data['id'] ) && $data['id'] )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
					
					$data['args'] = json_decode( '{
						"type"    : "delete", 
						"context" : "application",  
						"data"    : { 
							"permission" : [ 
								"PERM_USER_DELETE_GLOBAL", 
								"PERM_USER_DELETE_IN_WORKGROUP", 
								"PERM_USER_GLOBAL", 
								"PERM_USER_WORKGROUP" 
							]
						}, 
						"object"   : "user", 
						"objectid" : ' . $data['id'] . ' 
					}' );
					
					$res = _fcquery( '/system.library/user/delete', $data );
					
					// 1: Delete extra fields ...
					
					_deleteExtraFields( $userid );
					
					die( $res . ' -- ' );
					
					die( 'ok success' );
					
				}
				else
				{
					die( 'fail id is required ...' );
				}
				
				break;
				
		}
		
		
		
		
		

		
	}

}

// Helper functions ...
function _fcquery( $command = '', $args = false, $method = 'POST', $headers = false )
{
	global $Config;	
		
	$curl = curl_init();
	
	$server = ( $Config->SSLEnable ? 'https://' : 'http://' ) . $Config->FCHost . ( $Config->FCHost == 'localhost' && $Config->FCPort ? ':' . $Config->FCPort : '' );
	
	$url = ( $server . $command );
	
	if( $url && strstr( $url, '?' ) )
	{
		$thispath = $url;
		$url = explode( '?', $url );
	
		if( isset( $url[1] ) )
		{
			if( strstr( $url[1], '&' ) && strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '&', $url[1] );
			
				foreach( $url[1] as $k=>$p )
				{
					if( strstr( $url[1][$k], '=' ) )
					{
						$url[1][$k] = explode( '=', $url[1][$k] );
					
						if( isset( $url[1][$k][1] ) )
						{
							$url[1][$k][1] = urlencode( $url[1][$k][1] );
						}
					
						$url[1][$k] = implode( '=', $url[1][$k] );
					}
				}
			
				$url[1] = implode( '&', $url[1] );
			}
			else if( strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '=', $url[1] );
			
				if( isset( $url[1][1] ) )
				{
					$url[1][1] = urlencode( $url[1][1] );
				}
			
				$url[1] = implode( '=', $url[1] );
			}
		}
	
		$url = implode( '?', $url );
	}

	curl_setopt( $curl, CURLOPT_URL, $url );
	curl_setopt( $curl, CURLOPT_EXPECT_100_TIMEOUT_MS, false );

	if( $headers )
	{
		curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
	}

	if( $method != 'POST' )
	{
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
	}
	
	// TODO: Turn this off when SSL is working ...
	curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
	curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
	
	if( $args )
	{
		if( is_object( $args ) )
		{
			$args = array(
				'args' => urlencode( json_encode( $args ) )
			);
		}
		else if( is_string( $args ) )
		{
			$args = array(
				'args' => urlencode( $args )
			);
		}
	
		curl_setopt( $curl, CURLOPT_POST, true );
		curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
	}
	
	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

	$output = curl_exec( $curl );

	$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	curl_close( $curl );

	return $output;
}

function _findInSearchPaths( $app )
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

function _addExtraFields( $userid, $fields )
{
	if( $userid > 0 && $fields )
	{
		
		foreach( $fields as $key => $value )
		{
			
			if( trim( $key ) && $userid > 0 )
			{
				$fm = new dbIO( 'FMetaData' );
				$fm->DataTable = 'FUser';
				$fm->DataID = $userid;
				$fm->Key = trim( $key );
				$fm->Load();
				$fm->ValueString = trim( $value );
				$fm->Save();
			}
			
		}
		
		return true;
	}
	
	return false;
}

function _deleteExtraFields( $userid )
{
	if( $userid > 0 )
	{
		
		if( $fields = $SqlDatabase->FetchObjects( '
			SELECT 
				fm.* 
			FROM 
				FMetaData fm 
			WHERE 
					fm.Key       IN ("' . implode( '","', [ 'Mobile' ] ) . '") 
				AND fm.DataID    = \'' . $userid . '\' 
				AND fm.DataTable = "FUser" 
			ORDER BY 
				fm.ID ASC 
		' ) )
		{
			
			foreach( $fields as $field )
			{
				
				if( $field->ID > 0 )
				{
					$fm = new dbIO( 'FMetaData' );
					if( $fm->Load( $field->ID ) )
					{
						$fm->Delete();
					}
				}
				
			}
			
			return true;
		}
		
	}
	
	return false;
}

function _firstLogin( $userid )
{
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 )
	{
		
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
				
				$f1 = new dbIO( 'FSFolder' );
				$f1->FilesystemID = $o->ID;
				$f1->UserID = $userid;
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
					$fl->UserID = $userid;
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
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'imagesdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '['. $wallpaperstring .']';
					$wp->Save();
				}
				
				$wp = new dbIO( 'FSetting' );
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'wallpaperdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '"Home:Wallpaper/Freedom.jpg"';
					$wp->Save();
				}
				
				return true;
			}
		}
	}
	
	return false;
}

function _saveAvatar( $userid, $base64 )
{
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && trim( $base64 ) )
	{
		if( !base64_encode( base64_decode( $base64, true ) ) === $base64 )
		{
			die( 'fail not base64 string ...' );
		}
		
		$o = new dbIO( 'FSetting' );
		$o->UserID = $uid;
		$o->Type = 'system';
		$o->Key = 'avatar';
		$o->Load();
		$o->Data = trim( $base64 );
		$o->Save();
		
		// Save image blob as filename hash on user
		if( $o->ID > 0 && $o->Data && $o->UserID > 0 )
		{
			$u = new dbIO( 'FUser' );
			$u->ID = $o->UserID;
			if( $u->Load() )
			{
				$u->Image = md5( $o->Data );
				$u->Save();
				
				return true;
			}
		}
	}
	
	return false;
}

function _applySetup( $userid, $id )
{
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && $id > 0 )
	{
		if( $ug = $SqlDatabase->FetchObject( '
			SELECT 
				g.*, s.Data
			FROM 
				`FUserGroup` g, 
				`FSetting` s 
			WHERE 
					g.ID = \'' . $id . '\' 
				AND g.Type = "Setup" 
				AND s.Type = "setup" 
				AND s.Key = "usergroup" 
				AND s.UserID = g.ID 
		' ) )
		{
			
			$users = array( $userid );
			
			$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
			
			// Try to get wallpaper
			$wallpaper = new dbIO( 'FMetaData' );
			$wallpaper->DataID = $ug->ID;
			$wallpaper->DataTable = 'FSetting';
			$wallpaper->Key = 'UserTemplateSetupWallpaper';
			$wallpaperContent = false;
			if( !$wallpaper->Load() )
			{
				$wallpaper = false;
			}
			else
			{
				if( !( $wallpaperContent = file_get_contents( $wallpaper->ValueString ) ) )
				{
					$wallpaper = false;
				}
			}
			
			if( $users )
			{
				foreach( $users as $uid )
				{
					// Make sure the user exists!
					$theUser = new dbIO( 'FUser' );
					$theUser->load( $uid );
					if( !$theUser->ID ) continue;
				
					// Great, we have a user
					if( $ug->Data && $uid )
					{
						// Language ----------------------------------------------------------------------------------------
			
						if( $ug->Data->language )
						{
							// 1. Check and update language!
	
							$lang = new dbIO( 'FSetting' );
							$lang->UserID = $uid;
							$lang->Type = 'system';
							$lang->Key = 'locale';
							$lang->Load();
							$lang->Data = $ug->Data->language;
							$lang->Save();
						}
		
						// Wallpaper -----------------------------------------------
						// TODO: Support other filesystems than SQLDrive! (right now, not possible!)
					
						if( $wallpaper )
						{
							$fnam = $wallpaper->ValueString;
							$fnam = explode( '/', $fnam );
							$fnam = end( $fnam );
							$ext  = explode( '.', $fnam );
							$fnam = $ext[0];
							$ext  = $ext[1];
						
							$f = new dbIO( 'Filesystem' );
							$f->UserID = $uid;
							$f->Name   = 'Home';
							$f->Type   = 'SQLDrive';
							$f->Server = 'localhost';
							if( !$f->Load() )
							{
								$f->ShortDescription = 'My data volume';
								$f->Mounted = '1';
							
								// TODO: Enable this when we have figured out a better way to handle firstlogin.defaults.php if Home: is created it fucks up the first login procedure ...
							
								//$f->Save();
							
								$f->ID = 0;
							}
						
							if( $f->ID > 0 && $fnam && $ext && $theUser->Name )
							{
								// Make sure we have wallpaper folder
								$fl = new dbIO( 'FSFolder' );
								$fl->FilesystemID = $f->ID;
								$fl->UserID = $uid;
								$fl->Name = 'Wallpaper';
								$fl->FolderID = 0;
								if( !$fl->Load() )
								{
									$fl->DateCreated = date( 'Y-m-d H:i:s' );
									$fl->DateModified = $fl->DateCreated;
								
									$fl->Save();
								}
								
								$fi = new dbIO( 'FSFile' );
								$fi->Filename = ( 'default_wallpaper_' . $fl->FilesystemID . '_' . $fl->UserID . '.jpg' );
								$fi->FolderID = $fl->ID;
								$fi->FilesystemID = $f->ID;
								$fi->UserID = $uid;
								if( $fi->Load() && $fi->DiskFilename )
								{
									if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
									{
										unlink( $Config->FCUpload . $fi->DiskFilename );
									}
								}
								
								// Find disk filename
								$uname = str_replace( array( '..', '/', ' ' ), '_', $theUser->Name );
								if( !file_exists( $Config->FCUpload . $uname ) )
								{
									mkdir( $Config->FCUpload . $uname );
								}
							
								while( file_exists( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext ) )
								{
									$fnam = ( $fnam . rand( 0, 999999 ) );
								}
							
								if( $fp = fopen( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext, 'w+' ) )
								{
									fwrite( $fp, $wallpaperContent );
									fclose( $fp );
								
								
								
									$fi->DiskFilename = ( $uname . '/' . $fnam . '.' . $ext );
									$fi->Filesize = filesize( $wallpaper->ValueString );
									$fi->DateCreated = date( 'Y-m-d H:i:s' );
									$fi->DateModified = $fi->DateCreated;
									$fi->Save();
								
								
								
									// Set the wallpaper in config
									$s = new dbIO( 'FSetting' );
									$s->UserID = $uid;
									$s->Type = 'system';
									$s->Key = 'wallpaperdoors';
									$s->Load();
									$s->Data = '"Home:Wallpaper/' . $fi->Filename . '"';
									$s->Save();
								
								
								
									// Fill Wallpaper app with settings and set default wallpaper
									$wp = new dbIO( 'FSetting' );
									$wp->UserID = $uid;
									$wp->Type = 'system';
									$wp->Key = 'imagesdoors';
									if( $wp->Load() && $wp->Data )
									{
										$data = substr( $wp->Data, 1, -1 );
	
										if( $data && !strstr( $data, '"Home:Wallpaper/' . $fi->Filename . '"' ) )
										{
											if( $json = json_decode( $data, true ) )
											{
												$json[] = ( 'Home:Wallpaper/' . $fi->Filename );
			
												if( $data = json_encode( $json ) )
												{
													$wp->Data = stripslashes( '"' . $data . '"' );
													$wp->Save();
												}
											}
										}
									}
								
								}
							
							
							}
						}
					
						// Startup -----------------------------------------------------------------------------------------
		
						if( isset( $ug->Data->startups ) )
						{
							// 2. Check and update startup!
	
							$star = new dbIO( 'FSetting' );
							$star->UserID = $uid;
							$star->Type = 'system';
							$star->Key = 'startupsequence';
							$star->Load();
							$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
							$star->Save();
						}
		
						// Theme -------------------------------------------------------------------------------------------
		
						if( $ug->Data->theme )
						{
							// 3. Check and update theme!
	
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'theme';
							$them->Load();
							$them->Data = $ug->Data->theme;
							$them->Save();
						}
					
						if( $ug->Data->themeconfig && $ug->Data->theme )
						{
							// 3. Check and update look and feel config!
						
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'themedata_' . strtolower( $ug->Data->theme );
							$them->Load();
							$them->Data = json_encode( $ug->Data->themeconfig );
							$them->Save(); 
						}
					
						if( $ug->Data->workspacecount )
						{
							// 3. Check and update look and feel workspace numbers!
						
							$them = new dbIO( 'FSetting' );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'workspacecount';
							$them->Load();
							$them->Data = $ug->Data->workspacecount;
							$them->Save(); 
						}
					
						// Software ----------------------------------------------------------------------------------------
					
						if( !isset( $ug->Data->software ) )
						{
							$ug->Data->software = json_decode( '[["Dock","1"]]' );
						}
					
						if( $ug->Data->software )
						{
							// 4. Check dock!
						
							// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...
	
							if( 1==1 || !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
							{
								$i = 0;
		
								foreach( $ug->Data->software as $r )
								{
									if( $r[0] )
									{
										// 5. Store applications
				
										if( $path = _findInSearchPaths( $r[0] ) )
										{
											if( file_exists( $path . '/Config.conf' ) )
											{
												$f = file_get_contents( $path . '/Config.conf' );
												// Path is dynamic!
												$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
					
												// Store application!
												$a = new dbIO( 'FApplication' );
												$a->UserID = $uid;
												$a->Name = $r[0];
												if( !$a->Load() )
												{
													$a->DateInstalled = date( 'Y-m-d H:i:s' );
													$a->Config = $f;
													$a->Permissions = 'UGO';
													$a->DateModified = $a->DateInstalled;
													$a->Save();
												}
						
												// 6. Setup dock items
						
												if( $r[1] )
												{
													$d = new dbIO( 'DockItem' );
													$d->Application = $r[0];
													$d->UserID = $uid;
													$d->Parent = 0;
													if( !$d->Load() )
													{
														//$d->ShortDescription = $r[1];
														$d->SortOrder = $i++;
														$d->Save();
													}
												}
							
												// 7. Pre-install applications
						
												if( $ug->Data->preinstall != '0' && $a->ID > 0 )
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
															if( !$app->Load() )
															{
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
									}
								}
							}
						}
					}
				
					
				
					if( $uid )
					{
						if( $dels = $SqlDatabase->FetchObjects( $q = '
							SELECT 
								g.* 
							FROM 
								`FUserGroup` g, 
								`FUserToGroup` ug 
							WHERE 
									g.Type = "Setup" 
								AND ug.UserGroupID = g.ID 
								AND ug.UserID = \'' . $uid . '\' 
							ORDER BY 
								g.ID ASC 
						' ) )
						{
		
							foreach( $dels as $del )
							{
								if( $del->ID != $args->args->id )
								{
									$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
								}
							}
						}
		
						if( $SqlDatabase->FetchObject( '
							SELECT 
								ug.* 
							FROM 
								`FUserToGroup` ug 
							WHERE 
									ug.UserGroupID = \'' . $ug->ID . '\' 
								AND ug.UserID = \'' . $uid . '\' 
						' ) )
						{
							$SqlDatabase->query( '
								UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
								WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
							' );
						}
						else
						{						
							$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
						}
					}
				}
			}
		
			return ( $ug->Data ? json_encode( $ug->Data ) : 'false' );
		}
	}
	
	return false;
}

function _updateLanguages( $userid, $lang )
{
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && trim( $lang ) )
	{
		// Find right language for speech
		$langs = [ 'en', 'fr', 'no', 'fi', 'pl' ]; //speechSynthesis.getVoices();
	
		$voice = false;
	
		foreach( $langs as $v )
		{
			if( strtolower( trim( $v ) ) == strtolower( trim( $lang ) ) )
			{
				$voice = '{"spokenLanguage":"' . $lang . '","spokenAlternate":"' . $lang . '"}';
			}
		}
		
		if( !$voice )
		{
			die( 'fail not supported language. ' . json_encode( $langs ) );
		}
		
		$lo = new dbIO( 'FSetting' );
		$lo->UserID = $userid;
		$lo->Type = 'system';
		$lo->Key = 'locale';
		$lo->Load();
		$lo->Data = $lang;
		$lo->Save();
	
		if( $lo->ID > 0 )
		{
			$lo = new dbIO( 'FSetting' );
			$lo->UserID = $userid;
			$lo->Type = 'system';
			$lo->Key = 'language';
			$lo->Load();
			$lo->Data = $voice;
			$lo->Save();
			
			return true;
		}
	}
	
	return false;
}

die( 'fail ...' );

?>
