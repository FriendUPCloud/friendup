<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
		global $Config, $Logger;
		
		if( $path ) $this->path = urldecode( $path );
		
		$ex = '/system.library/file/read/?mode=rb&path=' . jsUrlEncode( $this->path );
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
			( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;
		if( isset( $GLOBALS[ 'args' ]->sessionid ) )
			$url .= '&sessionid=' . $GLOBALS[ 'args' ]->sessionid;
		else if( isset( $GLOBALS[ 'args' ]->authid ) )
			$url .= '&authid=' . $GLOBALS[ 'args' ]->authid;


		//$Logger->log( '[File::Load] Url to load: ' . $url );

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
			
			$ex = end( explode( ':', $this->path ) );
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
			$postfields = array(
				'sessionid' => $GLOBALS[ 'args' ]->sessionid,
				'devname' => $devname,
				'path' => jsUrlEncode( $this->path ),
				'target' => jsUrlEncode( $this->path ),
				'data' => '@/tmp/' . $ff
			);
		
			//$Logger->log( '[File::Save] Trying to save content in: ' . $url . ' with path ' . $this->path );
			
			$ch = curl_init();
			curl_setopt( $ch, CURLOPT_URL, $url    );
			curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
			curl_setopt( $ch, CURLOPT_SAFE_UPLOAD, false );
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
}

?>
