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

	/*
		Landing file to enable Google Drive access in Friend. The HTTP path to this file must match the redrect URI for our oAuth cliet ID (https://console.developers.google.com/apis/credentials?project=friend-unifying-platform&authuser=1)
	*/

	if ( !function_exists( 'hex2bin' ) ) {
	    function hex2bin( $str ) {
	        $sbin = "";
	        $len = strlen( $str );
	        for ( $i = 0; $i < $len; $i += 2 ) {
	            $sbin .= pack( "H*", substr( $str, $i, 2 ) );
	        }
	
	        return $sbin;
	    }
	}
	
	if( isset( $_REQUEST['state'] ) && isset( $_REQUEST['code'] ) )
	{
	    $friend_serverurl = false;
	    $decoded = hex2bin( $_REQUEST['state'] );
	    $t2 = explode('::',$decoded);
	    if( is_array( $t2 ) && count($t2) > 2 )
	    {
	            $friend_userid = intval( $t2[0] );
	            $friend_mountname = $t2[1];
	            $friend_sessionid = $t2[2];
	            $friend_serverurl = $t2[3];
	    }
	    if( $friend_serverurl )
	    {
	
	            $remoteurl = $friend_serverurl . '?state=' . urlencode( $_REQUEST['state'] ) . '&code=' . urlencode( $_REQUEST['code'] );
	
	            #die($remoteurl . ' ?URL?');
	
	            $result = file_get_contents( $remoteurl );
	            die('<div>:' . $result . ':</div>'); 
	    }        
	}                
	header('Location: https://friendup.cloud');
	die();
?>

