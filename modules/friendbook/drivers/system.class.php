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
	
	public function nativeapps( $vars, $args )
	{
		$path = '/usr/share/applications';
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
}

?>
