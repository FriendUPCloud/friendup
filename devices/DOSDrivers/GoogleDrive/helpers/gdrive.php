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

