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
	SELECT * FROM FMail WHERE UserID=\'' . $User->ID . '\' AND `Address`=\'' . $args->args->account . '\'
' ) )
{
	$r = [];
	if( $imap = imap_open( '{' . $row->Server . ':' . $row->Port . '/imap/ssl}', $row->Username, $row->Password ) )
	{
		if( is_array( ( $list = imap_listmailbox( $imap, '{' . $row->Server . '}', '*' ) ) ) )
		{
			for( $c = 0; $c < 2; $c++ )
			{
				foreach( $list as $val )
				{
					$o = new stdClass();
					$showName = $val;
					if( preg_match( '/.*?\}.*?\./i', $showName ) && $c == 1 )
					{
						$showName = preg_replace( '/.*?\}.*?\.(.*)/i', '$1', imap_utf7_decode( $showName ) );
						$o->Name = imap_utf7_decode( $val );
						$o->DisplayName = $showName;
						$r[] = $o;
					}
					else if( !preg_match( '/.*?\}.*?\./i', $showName ) && $c == 0 )
					{
						$showName = preg_replace( '/.*?\}(.*)/i', '$1', imap_utf7_decode( $showName ) );
						$o->Name = imap_utf7_decode( $val );
						$o->DisplayName = $showName;
						$r[] = $o;
					}
				}
			}
		}
		imap_close( $imap );
	}
		
	if( count( $r ) > 0 )
	{
		die( 'ok<!--separate-->' . json_encode( $r ) );
	}
}

die( 'fail' );

?>
