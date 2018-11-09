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

global $SqlDatabase;

$app = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application );

if( $row = $SqlDatabase->fetchObject( 'SELECT COUNT(*) AS CNT FROM `ApplicationLike` WHERE `Application`="' . $app . '"' ) )
{
	// Your like
	$you = $SqlDatabase->fetchObject( 
		'SELECT ID FROM `ApplicationLike` WHERE `UserID`=\'' . $User->ID . '\' AND `Application`="' . $app . '"' );
	if( $you )
	{
		$you = true;
	}
	else
	{
		$you = false;
	}
	
	die( 'ok<!--separate-->{"Likes":' . $row->CNT . ',"You":' . ( $you ? '"true"' : '"false"' ) . '}' );
}
die( 'ok<!--separate-->{"Likes":0,"You":false}' );

?>
