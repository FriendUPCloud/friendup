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

global $SqlDatabase, $User;

if( isset( $args->args->userid ) && !isset( $args->userid ) )
{
	$args->userid = $args->args->userid;
}

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->userid ) ? $args->userid : $User->ID );
}
else
{
	
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->userid ) ? $User->ID : 0 );
	
	// Only check permissions if userid is defined ...
	if( isset( $args->userid ) )
	{
		if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ], 'user', ( isset( $args->userid ) ? $args->userid : $User->ID ) ) )
		{
			if( is_object( $perm ) )
			{
				// Permission denied.
		
				if( $perm->response == -1 )
				{
					//
					
					die( 'fail<!--separate-->'.json_encode($perm) );
				}
				
				// Permission granted. GLOBAL or WORKGROUP specific ...
				
				if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->userid ) )
				{
			
					// If user has GLOBAL or WORKGROUP access to this user
			
					if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->userid.',' ) )
					{
						$userid = intval( $args->userid );
					}
				
				}
		
			}
		}
	}
}

// Get varargs
$file = false;

if( isset( $args->args->path ) )
{
	$file = $args->args->path;
}

if( !$file || !$userid ) die( '404' );

// TODO: Create code to copy file from Admin's Home: folder to the user's folder and set the users wallpaper if the admin has access ...

$d = new File( $file );
if( $d->Load() )
{
	
	// Make sure the user exists!
	$theUser = new dbIO( 'FUser' );
	$theUser->load( $userid );
	if( !$theUser->ID ) die( 'failure ...' );
	
	// 1. Check if the user has a Home drive and has logged in ...
	$o = new dbIO( 'Filesystem' );
	$o->UserID = $userid;
	$o->Name = 'Home';
	if( !$o->Load() )
	{
		die( 'fail<!--separate-->{"message":"User haven\'t logged in yet, Home drive is missing...","response":-1}' );
	}
	
	// 2. Check if the user has Wallpaper folder if not create it ...
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
	
	// 3. Check if file exists if not create it ...
	$fl = new dbIO( 'FSFile' );
	$fl->Filename = ( 'default_wallpaper_' . $f2->FilesystemID . '_' . $f2->UserID . '.jpg' );
	$fl->FolderID = $f2->ID;
	$fl->FilesystemID = $o->ID;
	$fl->UserID = $userid;
	if( $fl->Load() && $fl->DiskFilename )
	{
		if( file_exists( $Config->FCUpload . $fl->DiskFilename ) )
		{
			unlink( $Config->FCUpload . $fl->DiskFilename );
		}
	}
	
	$ext     = explode( '.', $d->Filename );
	$newname = ( $ext[0] ? $ext[0] : false );
	$ext     = ( $ext[1] ? $ext[1] : false );
	
	if( !$newname || !$ext || !$theUser->Name )
	{
		die( 'fail<!--separate-->{"message":"Missing correct filename example.jpg or path ...","response":-1}' );
	}
	
	// Find disk filename
	$uname = str_replace( array( '..', '/', ' ' ), '_', $theUser->Name );
	if( !file_exists( $Config->FCUpload . $uname ) )
	{
		mkdir( $Config->FCUpload . $uname );
	}
	
	while( file_exists( $Config->FCUpload . $uname . '/' . $newname . '.' . $ext ) )
	{
		$newname = ( $newname . rand( 0, 999999 ) );
	}
	
	if( $f = fopen( $Config->FCUpload . $uname . '/' . $newname . '.' . $ext, 'w+' ) )
	{
		fwrite( $f, $d->GetContent() );
		fclose( $f );
	}
	
	$fl->DiskFilename = ( $uname . '/' . $newname . '.' . $ext );
	$fl->Filesize = $d->_filesize;
	$fl->DateCreated = date( 'Y-m-d H:i:s' );
	$fl->DateModified = $fl->DateCreated;
	
	if( !file_exists( $Config->FCUpload . $fl->DiskFilename ) )
	{
		die( 'fail<!--separate-->{"message":"Failed to save file ...","response":-1}' );
	}
	
	$fl->Save();

	
	// 5. Fill Wallpaper app with settings and set default wallpaper
	$wp = new dbIO( 'FSetting' );
	$wp->UserID = $userid;
	$wp->Type = 'system';
	$wp->Key = 'imagesdoors';
	if( $wp->Load() && $wp->Data )
	{
		$data = substr( $wp->Data, 1, -1 );
		
		if( $data && !strstr( $data, '"Home:' . $f2->Name . '/' . $fl->Filename . '"' ) )
		{	
			if( $json = json_decode( $data, true ) )
			{
				$json[] = ( 'Home:' . $f2->Name . '/' . $fl->Filename );
				
				if( $data = json_encode( $json ) )
				{
					$wp->Data = stripslashes( '"' . $data . '"' );
					$wp->Save();
				}
			}
		}
	}
	
	// 6. Update settings to replace wallpaper for the user ...
	$wp = new dbIO( 'FSetting' );
	$wp->UserID = $userid;
	$wp->Type = 'system';
	$wp->Key = 'wallpaperdoors';
	$wp->Load();
	$wp->Data = ( '"Home:' . $f2->Name . '/' . $fl->Filename . '"' );
	$wp->Save();
	
	if( $wp->ID > 0 )
	{
		die( 'ok<!--separate-->{"message":"Saved users wallpaper.","response":1}' );
	}
	
}

die( 'fail<!--separate-->{"message":"Failed to update the users wallpaper.","response":-1}' );


?>
