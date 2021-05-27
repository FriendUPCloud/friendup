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

global $User;

include_once( 'php/classes/door.php' );

$obj = new stdClass();
if( $args->args && $args->args->Permissions )
{
    $obj->permissions = $args->args->Permissions;
}
else $obj->permissions = '';

if( $args->args && $args->args->Domains )
{
    $obj->domain = $args->args->Domains;
}
else $obj->domain = '';

// TODO: Perhaps an admin or device owner should be able to set this invisible
$obj->visibility = 'visible'; // Always set as visible

$f = new Door( $args->args->Filename . ':' );

// Visibility setting per user
$s = new dbIO( 'FMetaData' );
$s->Key = 'FilesystemVisibility';
$s->DataID = $f->ID;
$s->DataTable = 'Filesystem';
$s->ValueNumber = $User->ID;
$s->Load();
$s->ValueString = $args->args->visibility;
$s->Save();

$df = new dbIO( 'Filesystem' );
$df->Load( $f->ID );
$df->Config = json_encode( $obj );
$df->Save();

if( $df->ID > 0 ) die( 'ok<!--separate-->' ); //. $df->Config . '<!--separate-->' . $df->ID );

die( 'fail' );

?>
