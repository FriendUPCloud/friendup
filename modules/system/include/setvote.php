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

if( $votes = $SqlDatabase->fetchObject( '
	SELECT * FROM FSetting WHERE `Type`="vote" AND `Key`="' . $SqlDatabase->_link->real_escape_string( $args->args->key ) . '" AND UserID=\'' . $User->ID . '\'
' ) )
{
	die( 'fail<!--separate-->{"message":"Vote already cast.","response":"-1"}' );
}

$o = new dbIO( 'FSetting' );
$o->Type = 'vote';
$o->UserID = $User->ID;
$o->Key = $args->args->key;
$o->Data = $args->args->data;
$o->Save();

if( $o->ID )
{
	die( 'ok<!--separate-->' . json_encode( $votesOut ) );
}

die( 'fail<!--separate-->{"message":"Could not set vote.","response":"-1"}' );

?>
