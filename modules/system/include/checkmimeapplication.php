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

global $SqlDatabase, $Config, $User;

// Parse path and find mimetype
$mimetype = $args->args->path;
$mimeFound = false;
$executable = false;
if( strstr( $mimetype, ':' ) )
{
	list( , $mimetype ) = explode( ':', $mimetype );
	if( strstr( $mimetype, '/' ) )
	{
		$mimetype = explode( '/', $mimetype );
		$mimetype = array_pop( $mimetype );
	}
	if( strstr( $mimetype, '.' ) )
	{
		$mimetype = explode( '.', $mimetype );
		$mimetype = array_pop( $mimetype );
		if( $mimetype )
		{
			$mimetype = strtolower( $mimetype );
			$mimeFound = true;
		}
	}
}
if( !$mimeFound )
{
	die( 'fail<!--separate-->{"response":-1,"message":"Could not determine file mimetype."}' );
}

// Fetch installed applications
$installed = $SqlDatabase->fetchObjects( 'SELECT * FROM FApplication WHERE UserID=\'' . $User->ID . '\'' );
if( $installed )
{
    $byName = [];
    foreach( $installed as $inst )
    {
	    $byName[ $inst->Name ] = $inst;
    }
}
unset( $installed );

// Fetch locally available software
$apps = [];
$paths = [ 'resources/webclient/apps/', 'repository/' ];
foreach( $paths as $path )
{
	if( $dir = opendir( $path ) )
	{
		while( $file = readdir( $dir ) )
		{
			if( $file{0} == '.' ) continue;
		
			// For repositories
			if( file_exists( $path . $file . '/Signature.sig' ) )
			{
				if( !( $d = file_get_contents( 'repository/' . $file . '/Signature.sig' ) ) )
					continue;
				if( !( $js = json_decode( $d ) ) )
					continue;
				if( !isset( $js->validated ) )
					continue;
			}

			if( !file_exists( $path . $file . '/Config.conf' ) )
				continue;
			
			
			$f = json_decode( file_get_contents( $path . $file . '/Config.conf' ) );
			if( !$f ) continue;
			if( isset( $f->HideInCatalog ) && $f->HideInCatalog == 'yes' ) continue;
			
			$user = true; $admin = false;
			if( isset( $f->UserGroups ) )
			{
				$user = false;
				foreach( $f->UserGroups as $ug )
				{
					if( $ug == 'Admin' ) 
						$admin = true;
					else if( $ug == 'User' )
						$user = true;
				}
			}
			
			// Need to be admin?
			if( $admin && !$user && $level != 'Admin' )
			{
				continue;
			}
			
			// Check matching mimetypes
			if( isset( $f->Trusted ) && $f->Trusted == 'yes' && isset( $f->MimeTypes ) )
			{
				foreach( $f->MimeTypes as $v )
				{
					if( strtolower( $v ) == $mimetype )
					{
						$executable = $file;
					}
				}
			}
		}
		closedir( $dir );
	}
}

// Return with the correct executable
if( $executable )
{
	$response = new stdClass();
	$response->executable = $executable;
	die( 'ok<!--separate-->' . json_encode( $response ) );
}

die( 'fail<!--separate-->{"response":"-1","message":"Could not determine file mimetype."}' );

?>
