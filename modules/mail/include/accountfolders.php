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
