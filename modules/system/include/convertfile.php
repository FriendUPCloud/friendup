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

global $Config;

$type = '';

// Loads a document depending on format
// Setup post query using Curl
$prot = $Config->SSLEnable == 1 ? 'https' : 'http';

$baseUrl = $prot . '://' . ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . '/system.library/';
$readUrl = $baseUrl . 'file/read';
$writeUrl = $baseUrl . 'file/upload';


$path = $args->args->path;
$dev = mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $path ) ) );
$destination = $path;

$f = $SqlDatabase->FetchObject( 'SELECT * FROM Filesystem WHERE UserID=\'' . $User->ID . '\' AND `Name`=\'' . $dev . '\'' );

// We get data
if( isset( $args->args->data ) )
{
	$process = true;
}
// We read data
else
{
	$postfields = '' .
		'sessionid=' . $args->sessionid .
		'&devname=' . $dev .
		'&path=' . $path .
		'&type=' . $f->Type .
		'&mode=rs'
	;
	$ch = curl_init();
	curl_setopt( $ch, CURLOPT_URL, $readUrl );
	curl_setopt( $ch, CURLOPT_EXPECT_100_TIMEOUT_MS, false );
	curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
	curl_setopt( $ch, CURLOPT_POST, 5 );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
	if( $Config->SSLEnable == 1 ) curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
	if( $Config->SSLEnable == 1 ) curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
	$process = curl_exec( $ch );
	curl_close( $ch );
}

// Execute query
/*$Logger->log( 'Ok, getting file. ' . $readUrl );
$Logger->log( 'Post fields: ' . print_r( $postfields, 1 ) );
$Logger->log( "\n" );*/

if( $process )
{
	// We have data
	if( $args->args->data )
	{
		$dataFormat = 'html';
		if( $args->args->dataFormat ) $dataFormat = $args->args->dataFormat;
		$nf = 'mytemp_';
		$wanted = '';
		do
		{
			$rand = rand( 0, 999 ) . rand( 0, 999 ) . rand( 0, 999 );
			$wanted = $nf . $rand . '.'. $dataFormat;
		}
		while( file_exists( '/tmp/' . $wanted ) );
		
		$f = fopen( '/tmp/' . $wanted, 'w+' );
		fwrite( $f, $args->args->data );
		fclose( $f );
		$fna = $wanted;
		$lastExt = '.' . $dataFormat;
		$outFile = $wanted;
		
		$Logger->log( 'We wrote ' . '/tmp/' . $wanted . ' to disk.' );
	}
	// We read data
	else
	{
		// TODO: Atomic file locking!!
		$fna = end( explode( ':', $path ) );
		if( strstr( $fna, '/' ) )
			$fna = end( explode( '/', $fna ) );
						
		$lastExt = end( explode( '.', $fna ) );
		$outFile = $fna;
		
		// Write temporary out file
		if( $fl = fopen( '/tmp/' . $outFile, 'w+' ) )
		{
			fwrite( $fl, $process );
			fclose( $fl );
		}
		else die( 'fail<!--separate-->Error writing temporary file.<!--separate-->' . $outFile . '<!--separate-->' . $path );
		
		//$Logger->log( 'We wrote from retrieved file (' . $path . ') /tmp/' . $outFile . ' with filesize: ' . filesize( $outFile ) );
		//$Logger->log( 'The process answered: ' . $process );
	}
	
	// Force into format?
	$convTo = $lastExt;
	$toFormat = $convTo;
	
	// Make sure we don't promise more than we can keep
	$supported = array( 'odt', 'doc', 'rtf', 'docx', 'html', 'pdf' );
	if( !in_array( strtolower( $convTo ), $supported ) )
		die( 'fail<!--separate-->{"response":"format not supported."}' );
	
	
	if( isset( $args->args->format ) )
	{
		$convTo = $args->args->format;
		$destination = explode( '.', $destination );
		array_pop( $destination );
		$destination = implode( '.', $destination ) . '.' . $convTo;
		$toFormat = $convTo;
	}
	if( $convTo == 'doc' )
	{
		$convTo = 'doc:"MS Word 2007 XML"';
	}
	
	// TODO: Make much better unique filenames
	if( $output = exec( $foo = ( 'libreoffice -env:UserInstallation=file:///tmp --headless --convert-to ' . $convTo . ' \'' . 
		'/tmp/' . $outFile . '\' --outdir /tmp/' ) ) )
	{
		$newFile = substr( $outFile, 0, strlen( $outFile ) - strlen( end( explode( '.', $outFile ) ) ) ) . $toFormat;
		
		$Logger->log( 'We used libreoffice to convert file:' );
		$Logger->log( "\t$foo" );
		$Logger->log( 'New file: ' . $newFile );
		
		if( file_exists( '/tmp/' . $outFile ) && file_exists( '/tmp/' . $newFile ) )
		{	
			if( !$args->args->returnData )
			{
				$curlFile = new CURLFile( '/tmp/' . $newFile, 'application/octetstream', $newFile );
				$postfields = array( 
					'sessionid' => $args->sessionid,
					'devname' => $dev,
					'path' => $destination,
					'type' => $f->Type,
					'file' => $curlFile
				);
				$ch = curl_init();
				curl_setopt( $ch, CURLOPT_URL, $writeUrl );
				curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
				curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
				if( $Config->SSLEnable == 1 )
				{
					curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
					curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
				}
			
				$result = curl_exec( $ch );
			
				curl_close( $ch );
				
				$Logger->log( 'Removing temporary files.' );
				unlink( '/tmp/' . $outFile );
				unlink( '/tmp/' . $newFile );
				
				$Logger->log( 'Saving to: ' . $destination );
			}
			// Return the converted file
			else
			{
				ob_clean();
				$data = file_get_contents( '/tmp/' . $newFile );
				
				$Logger->log( 'Removing temporary files.' );
				unlink( '/tmp/' . $outFile );
				unlink( '/tmp/' . $newFile );
				die( 'ok<!--separate-->' . $data );
			}			
			
			ob_clean();
			die( 'ok<!--separate-->' . $destination );
		}
		die( 'fail<!--separate-->Could not convert file ' . $outFile );
	}
	die( 'fail<!--separate-->' . $foo );
}
die( 'fail<!--separate-->Could not convert ' . $path . '(' . curl_error( $ch ) . ')' );

?>
