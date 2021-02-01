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

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/friend.php' );
include_once( 'php/classes/door.php' );
include_once( 'php/classes/logger.php' );

require_once( 'include/nexus.php' );

$nexus = new Nexus();

if( method_exists( $nexus, $args->command ) )
{
    die( $nexus->{$args->command}( $args, $args->args ) );
}
die( 'fail<!--separate-->{"message":"Unknown command."}' );

?>
