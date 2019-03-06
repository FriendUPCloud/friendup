<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

class File
{
	var $_content = '';
	var $_filesize = '';

	function File( $path )
	{
		$this->path = urldecode( $path );
	}
	
	function SetContent( $content )
	{
		$this->_content = $content;
		$this->_filesize = strlen( $content );
	}
	
	function GetContent()
	{
		return $this->_content;
	}
	
	function Load( $path = false )
	{
		global $Config, $User, $Logger;
		
		if( $path ) $this->path = urldecode( $path );
		
		$ex = '/system.library/file/read/?mode=rb&path=' . jsUrlEncode( $this->path );
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
			( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;
		if( isset( $GLOBALS[ 'args' ]->sessionid ) )
			$url .= '&sessionid=' . $GLOBALS[ 'args' ]->sessionid;
		else if( isset( $GLOBALS[ 'args' ]->authid ) )
			$url .= '&authid=' . $GLOBALS[ 'args' ]->authid;
		else if( isset( $User->SessionID ) )
			$url .= '&sessionid=' . $User->SessionID;

		$c = curl_init();
		
		curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
		curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
		curl_setopt( $c, CURLOPT_URL,            $url                );
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
		$r = curl_exec( $c );
		curl_close( $c );
		
		if( $r != false )
		{
			$this->_content = $r;
			$this->_filesize = strlen( $r );
			
			$ex = explode( ':', $this->path );
			$ex = end( $ex );
			if( strstr( $ex, '/' ) )
			{
				$ex = explode( '/', $ex );
				$ex = $ex[count($ex)-1];
			}
			$this->Filename = $ex;
			
			return true;
		}
		else
		{
			$this->_content = '';
			$this->_filesize = 0;
		}
		return false;
	}
	
	// Threaded
	function SaveAndUnlink( $filePath )
	{
		global $Config;
		$f = popen( 'php5 php/include/filePut.php ' . 
			jsUrlEncode( $filePath ) . ' ' . 
			jsUrlEncode( $this->path ) . ' ' . 
			jsUrlEncode( $GLOBALS[ 'args' ]->sessionid ) . ' ' . 
			jsUrlEncode( json_encode( $Config ) ), 'w' 
		);
		return $f;
	}
	
	function Save( $content = false )
	{
		global $Config, $Logger;
		
		if( $content ) $this->_content = $content;
		
		$ex = '/system.library/file/upload/';
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
			( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;
		
		$devname = explode( ':', $this->path );
		$devname = $devname[0];
		
		$f = 'temp_file_';
		while( file_exists( '/tmp/' . ( $ff = $f . microtime() ) . rand( 0, 9999 ) ) ){}
		if( $f = fopen( '/tmp/' . $ff, 'w+' ) )
		{
			fwrite( $f, $content );
			fclose( $f );
		}
		
		if( file_exists( '/tmp/' . $ff ) )
		{
			$curlFile = new CURLFile( '/tmp/' . $ff, 'application/octetstream', $ff );
			$postfields = array(
				'sessionid' => $GLOBALS[ 'args' ]->sessionid,
				'devname' => $devname,
				'path' => jsUrlEncode( $this->path ),
				'target' => jsUrlEncode( $this->path ),
				'data' => $curlFile
			);
		
			//$Logger->log( '[File::Save] Trying to save content in: ' . $url . ' with path ' . $this->path );
			
			$ch = curl_init();
			curl_setopt( $ch, CURLOPT_URL, $url    );
			curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
			curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
			if( $Config->SSLEnable == 1 )
			{
				curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
				curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
				//curl_setopt( $ch, CURLOPT_SSL_FALSESTART, true  );
			}
			$result = curl_exec( $ch );
			curl_close( $ch );
		
			unlink( '/tmp/' . $ff );
			
			//$Logger->log( '[File::Save] Result of save: ' );
			//$Logger->log( $result );
			//$Logger->log( "\n" );
	
			return $result;
		}
		return false;
	}

	function Delete()
	{
		global $Config, $User, $Logger;
		
		if( $path ) $this->path = urldecode( $path );
		
		$ex = '/system.library/file/delete/?path=' . jsUrlEncode( $this->path );
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
			( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;
		if( isset( $GLOBALS[ 'args' ]->sessionid ) )
			$url .= '&sessionid=' . $GLOBALS[ 'args' ]->sessionid;
		else if( isset( $GLOBALS[ 'args' ]->authid ) )
			$url .= '&authid=' . $GLOBALS[ 'args' ]->authid;
		else if( isset( $User->SessionID ) )
			$url .= '&sessionid=' . $User->SessionID;

		$Logger->log( 'Sending DELETE ' . $url );

		$c = curl_init();
		
		curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
		curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
		curl_setopt( $c, CURLOPT_URL,            $url                );
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
		$r = curl_exec( $c );
		curl_close( $c );
		
		
		$Logger->log( 'Got a results... ' . $r );
		
		if( $r != false )
		{
			return true;
		}
		else
		{
			$Logger->log( 'File delete failed' . print_r( $r,1 ) );
		}
		return false;
	}
}

if( !function_exists('jsUrlEncode') )
{
	function jsUrlEncode( $in )
	{ 
		$out = '';
		for( $i = 0; $i < strlen( $in ); $i++ )
		{
			$hex = dechex( ord( $in[ $i ] ) );
			if( $hex == '' ) $out = $out . urlencode( $in[ $i ] );
			else $out = $out . '%' . ( ( strlen( $hex ) == 1 ) ? ( '0' . strtoupper( $hex ) ) : ( strtoupper( $hex ) ) );
		}
		return str_replace(
			array( '+', '_', '.', '-' ),
			array( '%20', '%5F', '%2E', '%2D' ),
			$out
		);
	}
}

?>
