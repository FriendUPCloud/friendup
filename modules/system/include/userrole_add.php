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

global $SqlDatabase, $Logger, $User;

// Must be admin
if( $level != 'Admin' )
	die( '404' );

if( !isset( $args->args->name ) )
{
	die( 'fail<!--separate-->{"message":"Please specify a name for your role.","response":-1}' );
}
	
$d = new dbIO( 'FUserGroup' );
$d->Type = 'Role';
$d->Name = trim( $args->args->name );
if( $d->Load() )
{
	die( 'fail<!--separate-->{"message":"Role already exists.","response":-1}' );
}
$d->Save();
if( $d->ID > 0 )
{
	die( 'ok<!--separate-->{"message":"Role created.","response":1}' );
}

die( 'fail' );

?>
