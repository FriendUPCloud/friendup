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

if( isset( $args->args->files ) )
{
	$top = $SqlDatabase->fetchObject( 'SELECT MAX(ValueNumber) M FROM FMetaData WHERE `Key`="Desktopshortcut"' );
	$top = (int)$top->M;
	
	$files = 0;
	foreach( $args->args->files as $path )
	{
		$d = new dbIO( 'FMetaData' );
		$d->Key = 'Desktopshortcut';
		$d->DataID = $User->ID;
		$d->DataTable = 'FUser';
		$d->ValueString = $path;
		$d->Load();
		$d->ValueNumber = ++$top;
		$d->save();
		if( $d->ID > 0 )
			$files++;
	}
	if( $files > 0 )
	{
		die( 'ok<!--separate-->{"response":1,"message":"Successfully added desktop shortcuts.","affected_files":"' . $files . '"}' );
	}
}

die( 'fail<!--separate-->{"response":0,"message":"Failed to create desktop shortcuts."}' );

?>
