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

if( $web = fopen( $args->args->link, 'r' ) )
{
    $out = '';
    while( $line = fread( $web, 2048 ) )
    {
        $out .= $line;
        if( strstr( $line, '<body' ) )
        {
            break;
        }
    }
    fclose( $web );
    die( 'ok<!--separate-->' . $out );
}

die( 'fail<!--separate-->{"response":0,"message":"No graph here."}' );

?>
