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

if( $row = $SqlDatabase->FetchObject( "
	SELECT * FROM FSetting s 
	WHERE
		s.UserID = '-1' AND s.Type = 'system' AND s.Key = 'locales'
	" ) )
{
	die( 'ok<!--separate-->' . $row->Data );
}
else
{
	$defaultdbsettings = '{"shortNames":["en","no","fr"]}';
	$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'system\',\'locales\',\''. $defaultdbsettings .'\');');
	
	// Manual recursion!
	if( $row = $SqlDatabase->FetchObject( "
	SELECT * FROM FSetting s 
	WHERE
		s.UserID = '-1' AND s.Type = 'system' AND s.Key = 'locales'
	" ) )
	{
		die( 'ok<!--separate-->' . $row->Data );
	}
	die('fail<!--separate-->Language locale entries could not be found. Please contact your administrator.');
}

?>
