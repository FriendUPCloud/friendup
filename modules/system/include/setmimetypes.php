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

$types = explode( ',', $args->args->types );
$result = new stdClass();
$result->saved = 0;

foreach( $types as $type )
{
	$type = trim( $type );

	$o = new dbIO( 'FSetting' );
	$o->UserID = $User->ID;
	$o->Type = 'mimetypes';
	$o->Key = $type;
	$o->Load();
	$o->Data = trim( $args->args->executable );
	$o->Save();
	
	$result->saved++;
}

die( 'ok<!--separate-->' . json_encode( $result ) );

?>
