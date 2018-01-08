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

global $SqlDatabase, $Config, $User;

// Fetch installed applications
$installed = $SqlDatabase->fetchObjects( 'SELECT * FROM FApplication WHERE UserID=\'' . $User->ID . '\'' );
$byName = [];
foreach( $installed as $inst )
{
	$byName[ $inst->Name ] = $inst;
}
unset( $installed );

// Fetch locally available software
$apps = [];
$paths = [ 'resources/webclient/apps/', 'repository/' ];
foreach( $paths as $path )
{
	if( $dir = opendir( $path ) )
	{
		while( $file = readdir( $dir ) )
		{
			if( $file{0} == '.' ) continue;
		
			// For repositories
			if( file_exists( $path . $file . '/Signature.sig' ) )
			{
				if( !( $d = file_get_contents( 'repository/' . $file . '/Signature.sig' ) ) )
					continue;
				if( !( $js = json_decode( $d ) ) )
					continue;
				if( !isset( $js->validated ) )
					continue;
			}

			if( !file_exists( $path . $file . '/Config.conf' ) )
				continue;
			
			
			$f = json_decode( file_get_contents( $path . $file . '/Config.conf' ) );
			if( !$f ) continue;
			if( isset( $f->HideInCatalog ) && $f->HideInCatalog == 'yes' ) continue;
			
			$stat = stat( $path . $file . '/Config.conf' );
		
		
			$o = new stdClass();
			$o->Name = $file;
			$o->Preview = file_exists( $path . $file . '/preview.png' ) ? true : false;
			$o->Category = $f->Category;
			$o->Description = isset( $f->Description ) ? $f->Description : '';
			$o->DateModifiedUnix = $stat[9];
			$o->DateModified = date( 'Y-m-d H:i:s', $stat[9] );
		
			if( isset( $byName[ $o->Name ] ) )
			{
				$o->Installed = true;
			}
		
			$apps[] = $o;
		}
		closedir( $dir );
	}
}

die( 'ok<!--separate-->' . json_encode( $apps ) );

?>
