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


class Nexus
{
	function __construct()
	{
	}
	
    // Check the host for information
    public function checkhost( $vars, $args )
    {
        
    }
    
    public function nativeapps( $vars, $args )
    {
    	require_once( 'modules/friendbook/drivers/system.class.php' );
    	
    	$s = new LinuxSystem();
    	if( $response = $s->nativeapps( $vars, $args ) )
    	{
    		return 'ok<!--separate-->' . json_encode( $response );
    	}
    	else
    	{
    		return 'fail<!--separate-->{"response":"-1","message":"Failed to list native apps."}';
    	}
    }
    
    public function run( $vars, $args )
    {
    	global $Logger;
    	
    	require_once( 'modules/friendbook/drivers/linux.system.class.php' );
    	
    	$s = new LinuxSystem();
    	if( isset( $args->executable ) && ( $response = $s->run( $args->executable ) ) )
    	{
    		$Logger->log( 'Running now: ' . $args->executable );
    		return 'ok<!--separate-->' . json_encode( $response );
    	}
    	else
    	{
    		$Logger->log( 'Failed to run: ' . $args->executable . ' (' . $response . ')' );
    		return 'fail<!--separate-->{"response":"-1","message":"Failed to execute app.","vars":"' . $vars . '"}';
    	}
    }
    
    // Get a list of all WIFI networks available
    public function listwifi( $vars, $args )
    {
        require_once( 'modules/friendbook/drivers/wifi.class.php' );
        
        $w = new FOSWifi();
        if( $response = $w->listNetworks() )
        {
            return 'ok<!--separate-->' . json_encode( $response );
        }
        else
        {
            return 'fail<!--separate-->{"response":"-1","message":"Failed to list wifi networks."}';
        }
    }
}

?>
