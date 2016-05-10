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

class File
{
	var $_content = '';
	var $_filesize = '';

	function File( $path )
	{
		$this->path = $path;
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
		global $Config;
		
		if( $path ) $this->path = $path;
		
		$ex = '/system.library/file/read/?mode=rb&path=' . $this->path;
		$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) . 
			$Config->FCHost . ':' . $Config->FCPort . $ex;
		if( isset( $GLOBALS[ 'args' ]->sessionid ) )
			$url .= '&sessionid=' . $GLOBALS[ 'args' ]->sessionid;
		else if( isset( $GLOBALS[ 'args' ]->authid ) )
			$url .= '&authid=' . $GLOBALS[ 'args' ]->authid;

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
			return true;
		}
		else
		{
			$this->_content = '';
			$this->_filesize = 0;
		}
		return false;
	}
	
	// TODO: Implement this
	function Save( $content = false )
	{
		if( $content ) $this->_content = $content;
		
		
	}
}

?>
