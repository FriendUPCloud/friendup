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

if( isset( $args->conf ) )
{
	$conf = $args->conf;
	$confFilename = '';
	
	if( !is_object( $conf ) )
	{
		if( strstr( $conf, ':' ) )
		{
			$confFilename = $conf;
			$conf = new File( $conf );
			if( $conf->Load() )
				$conf = json_decode( $conf->GetContent() );
			else die( 'fail' );
		}
		else if( $conf = file_get_contents( $conf ) )
		{
			if( !( $conf = json_decode( $conf ) ) )
				die( 'fail' );
		}
	}
	
	// Base url of config
	$burl = '';
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
	
	if( file_exists( 'resources/webclient/sandboxed.html' ) )
	{
		$f = file_get_contents( 'resources/webclient/sandboxed.html' );

		$s = '';
		$u = $Config->SSLEnable ? 'https://' : 'http://';
		$u .= $Config->Hostname . ':' . $Config->FCPort;
	
		if( isset( $conf->Libraries ) )
		{
			foreach( $conf->Libraries as $file )
			{
				if( isset( $file->Folder ) && file_exists( 'resources/' . $file->Folder ) && !is_dir( 'resources/' . $file->Folder ) )
				{
					$s .= "\t\t" . '<script src="/' . $file->Folder . $file->Init . '"></script>' . "\n";
				}
			}
		}
		
		// Includes!
		if( isset( $args->url ) )
		{
			if( file_exists( 'resources' . urldecode( $args->url ) ) )
			{
				if( $ud = file_get_contents( 'resources' . urldecode( $args->url ) ) )
				{
					// We have our own
					if( strstr( strtolower( $ud ), '<body' ) )
					{
						$f = preg_replace( '/(\s{0,})\<\/head[^>]*?\>/i', '$1<script src="/webclient/js/apps/api.js"></script>' . "\n" . '$1</head>', $ud );
					}
					else $f = preg_replace( '/\<\/body[^>]*?>/i', $ud . '</body>', $f );
				}
			}
			// Get it!
			else
			{
				$c = curl_init();
				curl_setopt( $c, CURLOPT_URL, $u . urldecode( $args->url ) );
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
						$f = preg_replace( '/(\s{0,})\<\/head[^>]*?\>/i', '$1<script src="/webclient/js/apps/api.js"></script>' . "\n" . '$1</head>', $ud );
					else $f = preg_replace( '/\<\/body[^>]*?>/i', $ud . '</body>', $f );
				}
			}
			
			// Add base href to load resources correctly
			if( !strstr( $args->url, ':' ) )
			{
				$bh = $u . urldecode( $args->url );
				$nt = "\n\t\t";
				$f = preg_replace( '/\<base[^>]*?\>/i', '', $f );
				$f = preg_replace( '/(\<head[^>]*?\>)/i', '$1' . $nt . '<base href="' . $bh . '"/>', $f );
			}
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
		$f = preg_replace( '/progdir\:/i', $brl, $f );
		
		// Fix all remaining links
		preg_match_all( '/src=["\']{0,1}([^"\']+)["\']{0,1}/i', $f, $srs );
		if( count( $srs ) )
		{
			foreach( $srs[1] as $k=>$sz )
			{
				if( strstr( $sz, ':' ) )
				{
					$f = str_replace( $srs[0][$k], 
						'src="/system.library/file/read/?sessionid=' . 
							$args->sessionid . '&path=' . $sz . '&mode=rb"', 
						$f );
				}
			}
		}
		
		friendHeader( 'Content-Type: text/html' );
		
		// Fallback
		die( $f );
	}
	die( '404 - No sandbox found' );
	
}
die( '404 - No conf found' );

?>
