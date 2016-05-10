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

$type = '';

// Loads a document depending on format
// Setup post query using Curl
$prot = $Config->SSLEnable == 1 ? 'https' : 'http';

$baseUrl = $prot . '://' . $Config->FCHost . '/system.library/';
$readUrl = $baseUrl . 'file/read';
$writeUrl = $baseUrl . 'file/upload';


$path = $args->args->path;
$dev = reset( explode( ':', $path ) );

$f = $SqlDatabase->FetchObject( 'SELECT * FROM Filesystem WHERE UserID=\'' . $User->ID . '\' AND `Name`=\'' . $dev . '\'' );

$postfields = '' .
	'sessionid=' . $args->sessionid .
	'&devname=' . $dev .
	'&path=' . $path .
	'&type=' . $f->Type .
	'&mode=rb'
;

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, $readUrl );
curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
curl_setopt( $ch, CURLOPT_POST, 5 );
curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
if( $Config->SSLEnable == 1 ) curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
if( $Config->SSLEnable == 1 ) curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );

// Execute query
$Logger->log( 'Ok, getting file. ' . $readUrl );

if( $fd = curl_exec( $ch ) )
{
	curl_close( $ch );
	
	// TODO: Atomic file locking!!
	$fna = end( explode( ':', $path ) );
	if( strstr( $fna, '/' ) )
		$fna = end( explode( '/', $fna ) );
						
	$lastExt = end( explode( '.', $fna ) );
	$outFile = substr( $fna, 0, strlen( $fna ) - strlen( $lastExt ) - 1 ) . '.html';
	
	// Write temporary html file
	if( $fl = fopen( '/tmp/' . $outFile, 'w+' ) )
	{
		fwrite( $fl, $fd );
		fclose( $fl );
	}
	else die( 'fail<!--separate-->Error writing temporary file.' );
	
	// Force into old DOC
	$convTo = $lastExt;
	if( $lastExt == 'doc' ) $convTo = 'doc:"MS Word 2007 XML"';
	
	// TODO: Make much better unique filenames
	
	if( $output = exec( $foo = ( 'libreoffice -env:UserInstallation=file:///tmp --headless --convert-to ' . $convTo . ' \'' . 
		'/tmp/' . $outFile . '\' --outdir /tmp/' ) ) )
	{
		$newFile = substr( $outFile, 0, strlen( $outFile ) - strlen( end( explode( '.', $outFile ) ) ) ) . $lastExt;
		
		$Logger->log( $newFile );
		
		if( file_exists( '/tmp/' . $outFile ) )
		{	
			$postfields = array( 
				'sessionid' => $args->sessionid,
				'devname' => $dev,
				'path' => $path,
				'type' => $f->Type,
				'file' => '@/tmp/' . $newFile
			);
			$ch = curl_init();
			curl_setopt( $ch, CURLOPT_URL, $writeUrl    );
			curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
			//curl_setopt( $ch, CURLOPT_POST, 4 );
			curl_setopt( $ch, CURLOPT_SAFE_UPLOAD, false );
			curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
			curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
			if( $Config->SSLEnable == 1 )
			{
				curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
				curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
			}
			$result = curl_exec( $ch );
			curl_close( $ch );
			
			unlink( '/tmp/' . $outFile );
			unlink( '/tmp/' . $newFile );
			
			ob_clean();
			die( 'ok<!--separate-->Written properly (' . $result . ')<!--separate-->' );
		}
		die( 'fail<!--separate-->Could not convert file ' . $outFile );
	}
	die( 'fail<!--separate-->' );
}
die( 'fail<!--separate-->Could not convert ' . $path . '(' . curl_error( $ch ) . ')' );

?>
