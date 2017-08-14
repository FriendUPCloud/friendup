<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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
