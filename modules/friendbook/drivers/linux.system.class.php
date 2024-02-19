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
	
	public function tasklist( $vars = false, $args = false )
	{
		// Execute the 'ps -lax' command and capture the output
		exec( 'ps -lax', $output, $status );

		// Check if the command was successful
		if( $status === 0 )
		{
			// Skip the first line of output, which contains the headers
			$cnt = count( $output );
			$unique = new stdClass();
			
			// Initialize an array to hold the parsed processes
			$processes = [];

			for( $i = 1; $i < $cnt; $i++ )
			{
				// Split the line into parts
				$parts = preg_split( '/\s+/', $output[ $i ], -1, PREG_SPLIT_NO_EMPTY );

				// Create an associative array for the current process
				// Note: You might need to adjust the indices based on the 'ps' output format
				$process = [
					'F' => $parts[ 0 ],
					'UID' => $parts[ 1 ],
					'PID' => $parts[ 2 ],
					'PPID' => $parts[ 3 ],
					'PRI' => $parts[ 4 ],
					'NI' => $parts[ 5 ],
					'ADDR' => $parts[ 6 ],
					'SZ' => $parts[ 7 ],
					'WCHAN' => $parts[ 8 ],
					'STIME' => $parts[ 9 ],
					'TTY' => $parts[ 10 ],
					'TIME' => $parts[ 11 ],
					'CMD' => implode( ' ', array_slice( $parts, 12 ) ) // Concatenate the remaining parts for the command
				];
				// Skip non-commands
				if( $process[ 'CMD' ][0] != '/' ) continue;
				$un = explode( '/', $process[ 'CMD' ] );
				$un = end( $un );
				$un = explode( ' ', $un );
				$un = reset( $un );
				if( isset( $unique->{$un} ) ) continue;
				$unique->{$un} = true;

				// Add the process to the processes array
				$processes[] = $process;
			}

			// Output the processes array
			die( 'ok<!--separate-->' . json_encode( $processes ) );
		}
		return 'fail';
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
