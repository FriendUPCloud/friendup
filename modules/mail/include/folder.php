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
