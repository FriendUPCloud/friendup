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
$byName = [];
foreach( $installed as $inst )
{
	$byName[ $inst->Name ] = $inst;
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
			if( $f->UserGroups )
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
			if( $f->Trusted == 'yes' && $f->MimeTypes )
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
