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

$hash = isset( $args->args ) && isset( $args->args->hash ) ? $args->args->hash : ( isset( $args->hash ) ? $args->hash : false );
if( !$hash ) die( 'fail<!--separate-->{"response":-1,"message":"Unknown hash parameter."}' );

$hash = mysqli_real_escape_string( $SqlDatabase->_link, $hash );

if( $row = $SqlDatabase->fetchObject( 'SELECT * FROM FFileShared WHERE `Hash`=\'' . $hash . '\'' ) )
{
    // Check device
    $device = new dbIO( 'Filesystem' );
    if( $device->load( $row->FSID ) )
    {
        $access = false;
        if( $device->UserID == $User->ID )
            $access = true;
        else if( $device->GroupID )
        {
            // Check if user is in group
            if( $res = $SqlDatabase->fetchObject( 'SELECT utg.* FROM FUserToGroup utg WHERE UserID=\'' . $User->ID . '\' AND UserGroupID=\'' . $device->GroupID . '\'' ) )
            {
                $access = true;
            }
        }
        if( $access )
        {
            die( 'ok<!--separate-->{"path":"' . $row->Path . '","devname":"' . $row->Devname . '"}' );
        }
    }
}

die( 'fail<!--separate-->{"response":-1,"message":"Unknown device based on shared file."}' );

?>
