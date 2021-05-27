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

global $Database, $User;

$d = new dbIO( 'FContact' );

if( $args->args->ID )
{
	$d->Load( $args->args->ID );
}

foreach( $args->args as $k=>$v )
{
	$d->$k = $v;
}

if( !$d->ID )
{
	$d->DateCreated = date( 'Y-m-d H:i:s' );
	$d->UserID = $User->ID;
}
$d->DateTouched = date( 'Y-m-d H:i:s' );

if( $d->Save() )
{
	die( 'ok<!--separate-->{"message":"Saved contact.","response":"1","id":"' . $d->ID . '"}' );
}

die( 'fail<!--separate-->{"message":"Failed to save contact.","response":"-1"}' );

?>
