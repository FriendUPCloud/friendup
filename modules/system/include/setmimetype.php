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

$o = new dbIO( 'FSetting' );
$o->UserID = $User->ID;
$o->Type = 'mimetypes';
$o->Key = $args->args->type;
$o->Load();
$o->Data = trim( $args->args->executable );
$o->Save();

$result = new stdClass();

$result->result = $o->ID > 0 ? '1' : '0';
$result->message = $o->ID > 0 ? 'Saved successfully.' : 'Failed.';

die( 'ok<!--separate-->' . json_encode( $result ) );

?>
