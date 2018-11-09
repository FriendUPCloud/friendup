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

// Database check
$dbTest = new dbTable( 'ApplicationLike' );
if( !$dbTest->load() )
{
	$SqlDatabase->query( '
		CREATE TABLE `ApplicationLike` ( 
			ID bigint(20) NOT NULL auto_increment,
			UserID bigint(20) NOT NULL,
			`Application` varchar(255) default "",
			`Liked` tinyint(4) NOT NULL default 0,
			PRIMARY KEY(ID)
		);
	' );
}

$l = new dbIO( 'ApplicationLike' );
$l->UserID = $User->ID;
$l->Application = $args->args->application;
$l->Load(); // Try load
$l->Liked = intval( $args->args->like, 10 );
if( $l->Save() )
{
	die( 'ok<!--separate-->{"response":"1","message":"You stored your like"}' );
}
else
{
	die( 'fail<!--separate-->{"response":"0","message":"Failed to store like"}' );
}

?>
