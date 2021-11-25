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

/*******************************************************************************
* This file generates a html document  that an application can launch into. It *
* has two basic modes. The default mode is to open a file, sandbox.html (found *
* in  the templates/  directory)  which  includes the  api.js  and  supporting *
* javascript  as well as Friend CSS files for  our theme. The other mode is to *
* open  a  different  html  document  with only the api.js  and no  additional *
* stylesheets.  The first mode is native = true. The second is native = false. *
* The native flag is read by api.js from the document.location.href            *
*******************************************************************************/

if( isset( $args->conf ) )
{
	$conf = $args->conf;
	$confFilename = '';
	
	if( !is_object( $conf ) )
	{
		if( strstr( $conf, ':' ) )
		{
			// Is it a disk conf? (conf is a disk volume name)
			$vol = explode( ':', $conf );
			if( $vol && ( !isset( $vol[1] ) || !trim( $vol[1] ) ) )
			{
				if( $f = $SqlDatabase->fetchObject( $q = '
				SELECT f.* FROM Filesystem f
				WHERE
					(
						f.UserID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $User->ID ) . '\' OR
						f.GroupID IN (
							SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
							WHERE
								g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
								ug.UserID = \'' . $User->ID . '\'
						)
					)
					AND f.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $vol[0] ) . '\'
					AND f.Mounted = \'1\'
				ORDER BY
					f.Name ASC' )
				)
				{
					if( isset( $f->Config ) )
					{
						$conf = json_decode( $f->Config );
						
					    // Make sure we have auth id!
					    if( !isset( $f->AuthID ) ) $f->AuthID = '';
						if( !$f->AuthID && isset( $conf->authid ) )
						{
						    $SqlDatabase->query( 'UPDATE Filesystem f SET f.AuthID="' . $conf->authid . '" WHERE f.ID = \'' . $f->ID . '\'' );
						}
					}
				}
				else die( 'fail<!--separate-->{"response":"Could not find file system."}' );
			}
			// No it's actually a path
			else
			{
				$confFilename = $conf;
				$conf = new File( $conf );
				if( $conf->Load() )
					$conf = json_decode( $conf->GetContent() );
				else die( 'fail' );
			}
		}
		// It's a local (server) path
		else if( file_exists( $conf ) && $conf = file_get_contents( $conf ) )
		{
			if( !( $conf = json_decode( $conf ) ) )
				die( 'fail' );
		}
	}
	
	// Base url of config
	$burl = '';
	if( is_string( $args->conf ) )
	{
		if( strstr( $args->conf, '/' ) )
		{
			$burl = explode( '/', $args->conf );
			array_pop( $burl );
			$burl = implode( '/', $burl );
			$burl .= '/';
		}
		else
		{
			list( $burl, ) = explode( ':', $args->conf );
			$burl .= ':';
		}
	}
	

	$s = '';
	$u = $Config->SSLEnable ? 'https://' : 'http://';
	$u .= ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort;
	
	$bu = $Config->SSLEnable ? 'https://' : 'http://';
	$bu .= $Config->FCHost . ':' . $Config->FCPort;

	if( isset( $conf->Libraries ) )
	{
		foreach( $conf->Libraries as $file )
		{
			if( isset( $file->Folder ) && file_exists( 'resources/' . $file->Folder ) && !is_dir( 'resources/' . $file->Folder ) )
			{
				$enc = file_get_contents( 'resources/' . $file->Folder . $file->Init );
				$enc = base64_encode( $enc );
				$s .= "\t\t" . '<script src="data:text/javascript;base64,' . $enc . '"></script>' . "\n";
			}
		}
	}
	
	$apibase = base64_encode( file_get_contents( 'resources/webclient/js/apps/api.js' ) );
	
	// Includes!
	if( isset( $args->url ) )
	{
		
		if( file_exists( $flz = ( 'resources' . urldecode( $args->url ) ) ) )
		{
			if( $ud = file_get_contents( $flz ) )
			{
				// We have our own
				if( strstr( strtolower( $ud ), '<body' ) )
				{
					$f = preg_replace( '/(\s{0,})\<\/head[^>]*?\>/i', '$1<script src="data:text/javascript;base64,' . $apibase . '"></script>' . "\n" . '$1</head>', $ud );
				}
				else if( file_exists( 'resources/webclient/sandboxed.html' ) )
				{
					$f = file_get_contents( 'resources/webclient/sandboxed.html' );
					$f = preg_replace( '/\<\/body[^>]*?>/i', $ud . '</body>', $f );
				}
			}
		}
		else if( file_exists( $flz = ( 'repository/' . $conf->Name . '/' . urldecode( $args->url ) ) ) )
		{
			if( $ud = file_get_contents( $flz ) )
			{
				// We have our own
				if( strstr( strtolower( $ud ), '<body' ) )
				{
					$f = preg_replace( '/(\s{0,})\<\/head[^>]*?\>/i', '$1<script src="data:text/javascript;base64,' . $apibase . '"></script>' . "\n" . '$1</head>', $ud );
				}
				else if( file_exists( 'resources/webclient/sandboxed.html' ) )
				{
					$f = file_get_contents( 'resources/webclient/sandboxed.html' );
					$f = preg_replace( '/\<\/body[^>]*?>/i', $ud . '</body>', $f );
				}
			}
		}
		// Get it!
		else
		{
			$c = curl_init();
			curl_setopt( $c, CURLOPT_URL, $u . urldecode( $args->url ) );
			curl_setopt( $c, CURLOPT_EXPECT_100_TIMEOUT_MS, false );
			curl_setopt( $c, CURLOPT_RETURNTRANSFER, 1 );
			if( $Config->SSLEnable )
			{
				curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
				curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
			}
			$ud = curl_exec( $c );
			if( $ud )
			{
				if( strstr( strtolower( $ud ), '<body' ) )
					$f = preg_replace( '/(\s{0,})\<\/head[^>]*?\>/i', '$1<script src="data:text/javascript;base64,' . $apibase . '"></script>' . "\n" . '$1</head>', $ud );
				else if( file_exists( 'resources/webclient/sandboxed.html' ) )
				{
					$f = file_get_contents( 'resources/webclient/sandboxed.html' );
					$f = preg_replace( '/\<\/body[^>]*?>/i', $ud . '</body>', $f );
				}
			}
			// close up!
			curl_close( $c );
		}
		
		// Add base href to load resources correctly
		$options = new stdClass();
		if( isset( $args->url ) )
		{
		    $url = explode( '?', $args->url );
		    $url = end( $url );
			$url = explode( '&', $url );
			foreach( $url as $u )
			{
				list( $key, $value ) = explode( '=', $u );
				$options->$key = $value;
			}
		}
		
		$f = str_replace( 'src="/webclient/js/apps/api.js"', 'src="data:text/javascript;base64,' . $apibase. '"', $f );
		
		// Virtual base url 
		if( $options->path && $options->sessionid )
		{
			$nt = "\n\t\t";
			$path = $options->path;
			if( strstr( $options->path, '/' ) )
			{
				$path = explode( '/', $path );
				array_pop( $path );
				$path = implode( '/', $path );
				if( substr( $path, -1, 1 ) != '/' ) $path .= '/';
			}
			else $path = reset( explode( ':', $path ) ) . ':';
			
			$f = preg_replace( '/\<base[^>]*?\>/i', '', $f );
			$f = preg_replace( '/(\<head[^>]*?\>)/i', '$1' . $nt . '<base href="' . $bu . '/' . urlencode( $path ) . '/sid' . $options->sessionid . '/"/>', $f );
		}
		// If we don't have base dir yet..
		if( !isset( $options->path ) && !isset( $options->sessionid ) && !strstr( $args->url, ':' ) )
		{
			$bh = $bu . urldecode( $args->url );
			$nt = "\n\t\t";
			$f = preg_replace( '/\<base[^>]*?\>/i', '', $f );
			$f = preg_replace( '/(\<head[^>]*?\>)/i', '$1' . $nt . '<base href="' . $bh . '"/>', $f );
		}
	}
	else
	{
		if( file_exists( 'resources/webclient/sandboxed.html' ) )
		{
			$f = file_get_contents( 'resources/webclient/sandboxed.html' );
			$f = str_replace( '"/webclient/js/apps/api.js"', '"data:text/javascript;base64,' . $apibase. '"', $f );
		}
		else die( '404' );
	}

	// Check if we must add scripts
	if( isset( $args->scripts ) && $scripts = json_decode( $args->scripts ) )
	{
		foreach( $scripts as $script )
		{
			$s .= "\t\t" . '<script src="' . $script . '"></script>' . "\n";
		}
	}
	// Add new data in header
	if( $s ) $f = str_replace( "\t" . '</head>', $s . "\t</head>", $f );

	// Progdirs..
	$brl = $burl;
	if( substr( $brl, 0, 10 ) == 'resources/' )
		$brl = str_replace( 'resources/', '/', $burl );
	else if( substr( $brl, 0, 13 ) == 'apprepository/' )
	{
		$d = substr( $brl, 13, strlen( $brl ) - 11 );
		$auth = isset( $args->args->authid ) ? ( 'authid=' . $args->args->authid ) : (  isset( $args->args->sessionid ) ? ( 'sessionid=' + $args->args->sessionid ) : '' );
		$brl = '/system.library/module/?module=system&' . $auth . '&command=resource&file=' . rawurlencode( $d );
	}
	$f = preg_replace( '/progdir\:/i', $brl, $f );
	
	// Fix all remaining links
	preg_match_all( '/src=["\']{0,1}^http([^"\']+)["\']{0,1}/i', $f, $srs );
	$prt = 'authid=' . ( isset( $args->args->authid ) ? $args->args->authid : '' );
	if( isset( $args->args->sessionid ) ) $prt = 'sessionid=' + $args->args->sessionid;
	if( count( $srs ) )
	{
		foreach( $srs[1] as $k=>$sz )
		{
			if( strstr( $sz, ':' ) )
			{
				$f = str_replace( $srs[0][$k], 
					'src="/system.library/file/read/?' . $prt . '&path=' . $sz . '&mode=rs"', 
					$f );
			}
		}
	}
	
	friendHeader( 'Content-Type: text/html' );
	
	// Fallback
	die( $f );
	
}
die( '404 - No conf found' );

?>
