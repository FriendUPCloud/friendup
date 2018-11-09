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

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT ID, `Name`, `UserID` FROM FUserGroup WHERE `Type`=\'Setup\'
	ORDER BY `Name` ASC
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'ok<!--separate-->[]' );

?>
