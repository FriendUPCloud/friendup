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
if( $row = $SqlDatabase->fetchObject( '
	SELECT * FROM FCalendar WHERE 
	UserID=\'' . $User->ID . '\' AND 
	`ID` = \'' . intval( $args->args->cid, 10 ) . '\'
' ) )
{	
	$ob = new stdClass();
	$ob->ID = $row->ID;
	$ob->Title = $row->Title;
	$ob->Description = $row->Description;
	$ob->TimeTo = $row->TimeTo;
	$ob->TimeFrom = $row->TimeFrom;
	$ob->Date = $row->Date;
	$ob->Type = $row->Type;
	$ob->MetaData = $row->MetaData;
	die( 'ok<!--separate-->' . json_encode( $ob ) );
}
else
{
	die( 'fail<!--separate-->' );
}

?>
