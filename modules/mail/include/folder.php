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

if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FMail WHERE UserID=\'' . $User->ID . '\' AND `Address`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->account ) . '\'
' ) )
{
	$fld = end( explode( '}', $args->args->folder ) );
	if( $imap = imap_open( '{' . $row->Server . ':' . $row->Port . '/imap/ssl}' . $fld, $row->Username, $row->Password, OP_READONLY ) )
	{
		$result = '';
		if( $headers = imap_search( $imap, 'ALL' ) )
		{
			$final = [];
			if( $deleted = imap_search( $imap, 'DELETED' ) )
			{
				foreach( $headers as $h )
				{
					if( !in_array( $h, $deleted ) )
						$final[] = $h;
				}
			}
			else $final = $headers;
			
			$result = 'ok<!--separate-->' . json_encode( $final );
		}
		imap_close( $imap );
		if( trim( $result ) ) die( $result );
	}
}

die( 'fail' );

?>
