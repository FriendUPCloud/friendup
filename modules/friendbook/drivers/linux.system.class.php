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

class LinuxSystem
{
	function __construct()
	{
	}
	
	// List native apps on host Linux system in a list
	public function nativeapps( $vars, $args )
	{
		global $Logger;
		
		// Common application path:
		$path = '/usr/share/applications';
		$exist = new stdClass();
		
		// Check path and list apps' information
		if( file_exists( $path ) && is_dir( $path ) )
		{
			if( $d = opendir( $path ) )
			{
				$out = [];
				while( $f = readdir( $d ) )
				{
					if( $f[0] == '.' ) continue;
					$try = @parse_ini_file( $path . '/' . $f );
					if( $try && $try[ 'Exec' ] && $try[ 'Name' ] )
					{
						$o = new stdClass();
						$o->Exec = $try[ 'Exec' ];
						$o->Name = $try[ 'Name' ];
						
						$o->Category = false;
						$categories = explode( ';', $try[ 'Categories' ] );
						$category = false;
						if( count( $categories ) > 0 )
						{	
							foreach( $categories as $c )
							{
								if( !$category || strlen( trim( $c ) ) > 3 )
								{
									$category = trim( $c );
								}
							}
							if( $category )
								$o->Categories = $category;
						}
						if( !$o->Categories )
						{
							$o->Categories = $try[ 'Categories' ];
						}
						if( is_array( $o->Name ) )
						{
							$ex = explode( ' ', $o->Exec );
							$ex = reset( $ex );
							if( strstr( $ex, '/' ) )
							{
								$ex = explode( '/', $ex );
								$ex = end( $ex );
							}
							$o->Name = ucfirst( $ex );
						}
						$o->Icon = $try[ 'Icon' ];
						if( isset( $o->Name ) && !isset( $exist->{$o->Name} ) )
						{
							$exist->{$o->Name} = true;
							$out[] = $o;
						}
					}
				}
				if( count( $out ) )
				{
					return $out;
				}
				closedir( $d );
			}
		}
		return false;
	}
	
	// Execute an application to void
	public function run( $executable = false )
	{
		if( $executable )
		{
			$response = exec( $executable . ' > /dev/null 2>&1 &' );
			return $response ? $response : 'nothing';
		}
		return 'fail';
	}
}

?>
