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

global $Config;

if( !isset( $Config->Domains ) )
{
	die( 'fail' );
}

$domains = explode( ',', $Config->Domains );
$object = new stdClass();
$object->domains = $domains;

if( count( $domains ) )
{
	die( 'ok<!--separate-->' . json_encode( $object ) );
}

die( 'fail' );

?>
