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

if( $rows = $SqlDatabase->FetchObjects( $q = ( '
	SELECT * FROM FMailHeader WHERE
	    UserID=\'' . $User->ID . '\' 
	AND `Address`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->account ) . '\' 
	AND ExternalMessageID IN ( ' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->ids ) . ' )
	AND `Folder` = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->folder ) . '\'
	ORDER BY `Date` DESC
' ) ) )
{
	$response = new stdClass();
	$response->ids = [];
	$response->headers = [];
	foreach( $rows as $row )
	{
		// Add in a standard format
		$ob = new stdClass();
		$ob->subject   = $row->Subject;
		$ob->from      = $row->From;
		$ob->replyto   = $row->ReplyTo;
		$ob->date      = $row->Date;
		$ob->to        = $row->To;
		$ob->messageId = $row->ExternalMessageID;
		$ob->folder    = $row->Folder;
		$ob->account   = $args->args->account;
		
		// Add to response
		$response->ids[] = $row->ExternalMessageID;
		$response->headers[] = json_encode( $ob );
	}
	die( 'ok<!--separate-->' . json_encode( $response ) );
}
die( 'fail<!--separate-->' );

?>
