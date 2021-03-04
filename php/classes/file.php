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


// Uses door to get disk information
require_once( 'door.php' );

class File
{
	var $_content = '';
	var $_filesize = '';
	var $_fileinfo = '';
	// How to authenticate?
	var $_authcontext = null; // authentication key (e.g. sessionid)
	var $_authdata = null; // authentication data (e.g. a sessionid hash)

	function File( $path )
	{
		$this->path = urldecode( $path );
		
		$this->GetAuthContextComponent();
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
	
	// Get the auth mechanism
	function GetAuthContext()
	{
		return $this->_authcontext;
	}
	
	// Set the correct authentication mechanism
	function SetAuthContext( $context, $authdata )
	{
		switch( $context )
		{
			case 'sessionid':
				$this->_authcontext = 'sessionid';
				$this->_authdata = $authdata;
				return true;
			case 'authid':
				$this->_authcontext = 'authid';
				$this->_authdata = $authdata;
				return true;
			case 'servertoken':
				$this->_authcontext = 'servertoken';
				$this->_authdata = $authdata;
				return true;
			case 'user':
				$this->_authcontext = 'user';
				$this->_authdata = $authdata;
				break;
		}
		return false;
	}
	
	// Get the right component to add to the server calls
	// $userInfo is optional, and will pull that user's SessionID
	function GetAuthContextComponent( $userInfo = false )
	{
		switch( $this->_authcontext )
		{
			case 'sessionid':
				return 'sessionid=' . $this->_authdata;
			case 'authid':
				return 'authid=' . $this->_authdata;
			case 'servertoken':
				return 'servertoken=' . $this->_authdata;
			default:
				if( isset( $GLOBALS[ 'args' ]->sessionid ) )
				{
					$this->_authcontext = 'sessionid';
					$this->_authdata = $GLOBALS[ 'args' ]->sessionid;
				}
				else if( isset( $GLOBALS[ 'args' ]->authid ) )
				{
					$this->_authcontext = 'authid';
					$this->_authdata = $GLOBALS[ 'args' ]->authid;
				}
				else if( isset( $GLOBALS[ 'args' ]->servertoken ) )
				{
					$this->_authcontext = 'servertoken';
					$this->_authdata = $GLOBALS[ 'args' ]->servertoken;
				}
				else if( $userInfo && isset( $userInfo->SessionID ) )
				{
					$this->_authcontext = 'sessionid';
					$this->_authdata = $userInfo->SessionID;
				}
				return $this->GetAuthContextComponent();
		}
		return false;
		
	}
	
	function GetAuthContextObject( $userInfo = false )
	{
		if( $str = $this->GetAuthContextComponent( $userInfo ) )
		{
			$data = explode( '=', $str );
			if( isset( $data[1] ) )
			{
				//$data[0] = substr( $data[0], 1, strlen( $data[0] ) - 1 );
				$key = new stdClass();
				$key->Key = $data[0];
				$key->Data = $data[1];
				return $key;
			}
		}
		return false;
	}
	
	function GetUrl( $path = false, $userInfo = false, $isinforequest = false  )
	{
		global $Config, $User, $Logger;
		
		$filepath = '';
		
		if( $path && $isinforequest == false )
			$filepath = $this->path = urldecode( $path );
		else if ( $path )
			$filepath = urldecode( $path );
		else
			$filepath = $this->path;
		
		$ex = '/system.library/file/read/?mode=rb&path=' . jsUrlEncode( $filepath );
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
			( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;
			
		// Get authentication url component (with $userInfo if needed)
		$url .= '&' . $this->GetAuthContextComponent( $userInfo );

		return $url;
	}
	
	function Load( $path = false, $userInfo = false )
	{
		global $Config, $User, $Logger;
		
		$url = $this->GetUrl( $path, $userInfo );

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
	
	function GetFileInfo()
	{
		global $Config, $User, $Logger;
		
		$fd = new Door( reset( explode( ':', $this->path ) ) . ':', $this->_authcontext, $this->_authdata );
		//$Logger->log( '[File.class] ' . $this->_authcontext . ' -> ' . $this->_authdata );
		$d = new dbIO( 'FFileInfo' );
		$d->Path = $this->path;
		$d->FilesystemID = $fd->ID;
		if( $d->Load() )
		{
			$this->_fileinfo = $d->Data;
			return $this->_fileinfo;
		}
		else
			return false;
	}
	
	// Threaded
	function SaveAndUnlink( $filePath )
	{
		global $Config;
		if( $kd = $this->GetAuthContextObject() )
		{
			// TODO: Check this! It may fail if there's no sessionid
			// TODO: authid and servertoken is not understood here...
			$f = popen( 'php php/include/filePut.php ' . 
				jsUrlEncode( $filePath ) . ' ' . 
				jsUrlEncode( $this->path ) . ' ' . 
				jsUrlEncode( $kd->Data ) . ' ' . 
				jsUrlEncode( json_encode( $Config ) ), 'w' 
			);
			return $f;
		}
		return false;
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
			if( $kd = $this->GetAuthContextObject() )
			{
				$curlFile = new CURLFile( '/tmp/' . $ff, 'application/octetstream', $ff );
				$postfields = array(
					$kd->Key => $kd->Data,
					'devname' => $devname,
					'path' => jsUrlEncode( $this->path ),
					'target' => jsUrlEncode( $this->path ),
					'data' => $curlFile
				);
		
				//$Logger->log( '[File::Save] Trying to save content in: ' . $url . ' with path ' . $this->path );
				//$Logger->log( '[File::Save] POSTFIELDS ' . print_r($postfields,1) );

			
				$ch = curl_init();
				curl_setopt( $ch, CURLOPT_URL, $url    );
				curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
				curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Expect:'));
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
		
		
		$url .= '&' . $this->GetAuthContextComponent();

		$Logger->log( 'Sending DELETE ' . $url );

		$c = curl_init();
		
		curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
		curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
		curl_setopt( $c, CURLOPT_URL,            $url                );
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
		curl_setopt( $c, CURLOPT_HTTPHEADER, array('Expect:'));
	
		$r = curl_exec( $c );
		curl_close( $c );
		
		
		//$Logger->log( 'Got a results... ' . $r );
		
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
