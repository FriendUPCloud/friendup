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

include_once( 'php/classes/door.php' );

$obj = new stdClass();
$obj->permissions = $args->args->Permissions;
$obj->domain = $args->args->Domains;

$f = new Door( $args->args->Filename . ':' );

$df = new dbIO( 'Filesystem' );
$df->Load( $f->ID );
$df->Config = json_encode( $obj );
$df->Save();
if( $df->ID > 0 ) die( 'ok<!--separate-->' ); //. $df->Config . '<!--separate-->' . $df->ID );

die( 'fail' );

?>
