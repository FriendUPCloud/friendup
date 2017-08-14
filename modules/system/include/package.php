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

/*******************************************************************************
* This command creates a Friend package, ready to be installed in the software * 
* archive of a Friend Core                                                     *
*******************************************************************************/

require_once( 'php/classes/file.php' );

if( isset( $args->args->filename ) )
{
	$path = $args->args->filename;
	if( strstr( $path, '/' ) )
	{
		$path = explode( '/', $path );
		array_pop( $path );
		$path = implode( '/', $path ) . '/';
	}
	else if( strstr( $path, ':' ) )
	{
		$path = reset( explode( ':', $path ) ) . ':';
	}

	$f = new File( $args->args->filename );
	if( $f->Load() )
	{
		if( $obj = json_decode( $f->GetContent() ) )
		{
			$f = 'temp_file_';
			while( file_exists( '/tmp/' . ( $ff = ( $f . str_replace( ' ', '', microtime() ) . rand( 0, 999 ) . '.zip' ) ) ) ){}
			$zip = new ZipArchive;
			$msg = 'Added ';
			$msgi = 0;
			
			if( $zip->open( '/tmp/' . $ff, ZipArchive::CREATE ) === TRUE )
			{
				foreach( $obj->Files as $fl )
				{
					$o = false;
					if( !strstr( $fl->Path, ':' ) )
						$o = new File( $path . $fl->Path );
					else $o = new File( $fl->Path );
					
					// Make sure we add the paths
					if( strstr( $fl->Path, ':' ) )
					{
						$rpath = substr( $fl->Path, strlen( $path ), strlen( $fl->Path ) - strlen( $path ) );
					}
					else $rpath = $fl->Path;
					
					if( $o->Load() )
					{
						$zip->addFromString( $rpath, $o->GetContent() );
						$msgi++;
					}
				}
				
				// Generate config
				$zip->addFromString( 'Config.conf', json_encode( $obj ) );
				
				$zip->close();
				
				$msg .= $msgi . ' files.';
				
				// Save the new file
				$filename = $args->args->filename;
				if( strstr( $filename, '.' ) )
				{
					$filename = explode( '.', $args->args->filename );
					if( count( $filename ) ) array_pop( $filename );
					$filename = implode( '.', $filename );
				}
				
				$z = new File( $filename . '.fpkg' );
				$res = $z->Save( file_get_contents( '/tmp/' . $ff ) );
				unlink( '/tmp/' . $ff );
				die( 'ok<!--separate-->' . $args->args->filename . '.fpkg<!--separate-->' . $res );
			}
		}
	}
}

die( 'fail' );

?>
