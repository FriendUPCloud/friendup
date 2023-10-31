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

// This class manages the Linux WIFI subsystem

class FOSWifi
{
    public function listNetworks()
    {
        $result = shell_exec( 'nmcli -f ssid,bssid,signal,rate,security,in-use -c no -m multiline dev wifi' );
        if( $result )
        {
            $output = [];
            $columns = [
                'SSID', 'BSSID', 'Signal', 'Rate', 'Security', 'InUse'
            ];
            $columnLength = count( $columns );
            $entries = explode( "\n", $result );
            $i = 0;
            for( $a = 0; $a < count( $entries); $a++ )
            {
                if( $i == 0 )
                {
                    $o = new stdClass();
                }
                $cols = explode( ': ', $entries[ $a ] );
                $o->{$columns[$i]} = trim( $cols[ 1 ] );
                $i++;
                if( $i >= $columnLength )
                {
                    $i = 0;
                    $output[] = $o;
                }
            }
            return $output;
        }
        return false;
    }
}

?>
