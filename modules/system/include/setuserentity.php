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

$o = new dbIO( 'FUserGroup' );
$o->UserID = $User->ID;
$o->Type = 'entity';
$o->Load();
$o->Name = $User->FullName . ' Entity';
$o->Description = $args->type;
$o->Save();
if( $o->ID > 0 )
{
	die( 'ok<!--separate-->{"response":1,"message":"Success"}' );
}
die( 'fail<!--separate-->{"response":-1,"message":"Failed"}' );

?>
