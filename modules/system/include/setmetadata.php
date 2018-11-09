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

if( $level != 'Admin' ) 
	die( 'fail' );
	
$entry = new dbIO( 'FMetaData' );
$entry->Key = $args->args->key;
if( isset( $args->args->valueString ) )
	$entry->ValueString = $args->args->valueString;
$entry->load();

if( isset( $args->args->valueNumber ) )
{
	$entry->ValueNumber = $args->args->valueNumber;
}
if( isset( $args->args->valueString ) )
{
	$entry->ValueString = $args->args->valueString;
}

$entry->save();

if( $entry->ID > 0 )
{
	die( 'ok<!--separate-->' );
}

die( 'fail' );

?>
