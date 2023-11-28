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
		// Common application path:
		$path = '/usr/share/applications';
		
		// Check path and list apps' information
		if( file_exists( $path ) && is_dir( $path ) )
		{
			if( $d = opendir( $path ) )
			{
				$out = [];
				while( $f = readdir( $d ) )
				{
					if( $f[0] == '.' ) continue;
					$try = parse_ini_file( $path . '/' . $f );
					if( $try && $try[ 'Exec' ] && $try[ 'Name' ] )
					{
						$o = new stdClass();
						$o->Exec = $try[ 'Exec' ];
						$o->Name = $try[ 'Name' ];
						$o->Categories = $try[ 'Categories' ];
						$o->Icon = $try[ 'Icon' ];
						$out[] = $o;
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
