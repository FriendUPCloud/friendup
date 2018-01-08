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

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT ua.ID, ua.ApplicationID, n.Name, ua.Permissions, ua.Data FROM FUserApplication ua, FApplication n
	WHERE
		n.ID = ua.ApplicationID AND ua.UserID=\'' . $User->ID . '\'
	ORDER BY n.Name ASC
' ) )
{
	$basepaths = array(
		'resources/webclient/apps/',
		'repository/'
	);
	foreach( $rows as $k=>$v )
	{
		// Include image preview
		$fnd = false;
		foreach( $basepaths as $path )
		{
			// For repositories
			if( $path == 'repository/' )
			{
				if( file_exists( $path . $file . '/Signature.sig' ) )
				{
					if( !( $d = file_get_contents( 'repository/' . $file . '/Signature.sig' ) ) )
						continue;
					if( !( $js = json_decode( $d ) ) )
						continue;
					if( !isset( $js->validated ) )
						continue;
				}
			}
			if( file_exists( $path . '/' . $v->Name . '/preview.png' ) )
			{
				$fnd = $path . '/' . $v->Name . '/preview.png';
				break;
			}
		}
		if( $fnd )
		{
			$rows[ $k ]->Preview = true;
		}
	}
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail' );


?>
