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

if( is_string( $args->args ) )
{
	$args->args = json_decode( stripslashes( $args->args ) );
}

if( $args->args->groupId && $args->args->roomId )
{
	$g = new dbIO( 'FUserGroup' );
	if( $g->Load( intval( $args->args->groupId, 10 ) ) )
	{
		// It belongs to you!
		if( $g->UserID == $User->ID )
		{
			if( !$SqlDatabase->fetchObject( 'SELECT * FROM `FMetaData` WHERE `DataTable` = "FUserGroup" AND `Key` = "presence-roomId" AND `DataID` = \'' . intval( $args->args->groupId, 10 ) . '\' AND `ValueString` = \'' . $args->args->roomId . '\'' ) )
			{
				if( $SqlDatabase->query( 'INSERT INTO FMetaData ( `DataTable`, `Key`, `DataID`, `ValueString` ) VALUES ( "FUserGroup", "presence-roomId", \'' . intval( $args->args->groupId, 10 ) . '\', \'' . $args->args->roomId . '\' )' ) )
				{
					die( 'ok<!--separate-->' );
				}
				die( 'fail<!--separate-->{"response":-1,"message":"Could not save the ting."}' );
			}
			die( 'fail<!--separate-->{"response":-1,"message":"Already registered."}' );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"Group does not belong to you."}' );
	}
	die( 'fail<!--separate-->{"response":-1,"message":"Could not load group."}' );
}
die( 'fail<!--separate-->{"response":-1,"message":"Params missing. Please check your args variable."}' );

?>
