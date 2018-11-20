<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/**
 * @file door.php
 *
 * This file is a cleaned version of the SQLDrive door?php file. We have left some
 * of the code of the original drive in the dosAction function to show the structure
 * of the parameters passed to the function.
 * We also have documented it "doxygen-way" even if Doxygen does not support
 * PHP as of today.
 *
 * @author FL (Francois Lionet)
 * @author HT (Hogne Tildstad)
 */

/**
 * Arguments transmitted to the functions
 */
global $args;

/**
 * Current user
 */
global $User;

/**
 * Current configuration options
 */
global $Config;

/**
 * Includes parent class
 */
include_once( 'php/classes/door.php' );

if( !class_exists( 'HelloDrive' ) )
{
	class HelloDrive extends Door
	{
	    /***
	     * Called upon construction of the class
	     *
	     * This function should perform any initialization tasks necessary
	     * for the DOSDriver to work.
	     * The global $args variable contains the default fileInfo used to communicate
	     * with the system. It should check if the $args variable is not null
	     * (first call of the class) and create an empty object instead.
	     */
 		function onConstruct()
		{
			global $args;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}

        /***
		 * Executes a dos command
		 *
		 * @param $args the list of arguments
		 * 1.$args->path or args->args->path : the path of the command to execute
		 * 2. $args-command the first level command to execute, can be
		 *      'dir',
		 *      'directory',
		 *      'info',
		 *      'write',
		 *      'read',
		 *      'import',
		 *      'volumeInfo',
		 *      'dosaction'
		 * 3. If the command is 'dosaction' then the function should explore the sub-parameter
		 * args->action, which can take the following values :
		 *      'mount',
		 *      'unmount',
		 *      'rename',
		 *      'makedir',
		 *      'delete',
		 *      'copy'
		 * @returns 'ok<!--separate-->' if succeed
		 * @returns 'fail<!--separate-->' if fail
		 */
		function dosAction( $args )
		{
			// Do a directory listing
			if(
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
			    {
			        ... put your code here and return the value in the message
					return 'ok<!--separate-->' . json_encode( $out );
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			// Get information on a folder or on a file
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
			    ... Insert your code here
			    {
                    die( 'ok<!--separate-->' . json_encode( $fldInfo ) );   // Returns the information after separator
				}
				die( 'fail<!--separate-->Could not find file!' );   // Returns error message after the separator
			}
			// Writes to a file
			else if( $args->command == 'write' )
			{
			    ... your code here
			    {
			        // Return several parameters with the <!--separate--> separator
					return 'ok<!--separate-->' . $len . '<!--separate-->' . $f->ID;
				}
				return 'fail<!--separate-->Could not write file: ' . $Config->FCUpload . $fn;
			}
			// Reads a file
			else if( $args->command == 'read' )
			{
			    {
                    return 'fail<!--separate--> . trim( file_get_contents( $fname ) );
				}
				return 'fail<!--separate-->Could not read file: ' . $Config->FCUpload . $fn . '<!--separate-->' . print_r( $f, 1 );
			}
			// Import sent files
			else if( $args->command == 'import' )
			{
			    ... your code here
			    {
					die( 'ok<!--separate-->' . $fcount );
				}
				die( 'fail<!--separare-->Could not open dir.' );
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
			    ... your code here
			    {
					die( 'ok<!--separate-->' );
				}
				die( 'fail<!--separare-->' );
			}
			// Switch to sub-sub commands
			else if( $args->command == 'dosaction' )
			{
			    // The sub command is contained in the $args->action variable
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					case 'mount':
					    // Your code here
					    {
							die( 'ok<!--separate-->' );
						}
						die( 'fail<!--separate-->' );
						break;
					case 'unmount':
					    // Your code here
					    {
							die( 'ok<!--separate-->' );
						}
						die( 'fail<!--separate-->' );
						break;
					case 'rename':
					    // Your code here
					    {
							die( 'ok<!--separate-->Renamed the file.' );
						}
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
                	    // Your code here
                	    {
							return 'ok<!--separate-->' . $f->ID;
						}
						die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
					    // Your code here
					    {
							die( 'ok<!--separate-->' );
						}
						die( 'fail<!--separate-->' );
						break;
					// Move files and folders or a whole volume to another door
					case 'copy':
					    // Your code here
					    {
							die( 'ok<!--separate-->' );
						}
						die( 'fail<!--separate-->' );
						break;
				}
			}
			return 'fail<!--separate-->' . print_r( $args, 1 );
		}

        /***
		 * Gets a file by path
		 *
		 * @param $path the path of the file to find
		 * @returns the fileInfo object is found
		 * @returns false in case of error
		 */
		function getFile( $path )
		{
		}
		
		/***
		 * Opens and returns a file pointer set with options
		 *
		 * @param $path the path of the file to open
		 * @param $mode opening mode
		 * Opening modes are :
		 * r read
		 * w write
		 * w+ ?HT
		 * a read and write ?HT
		 * a+ ?HT
		 * rb read binary
		 *
		 * @returns the file pointer if succeed
		 * @returns false in case of error
		 */
		function openFile( $path, $mode )
		{
		}

		/***
		 * Closes a file
		 *
		 * @param filePointer obtained by openFile
		 * @returns always returns false
		 */
		function closeFile( $filePointer )
		{
		}

		/***
		 * Reads from file pointer x bytes
		 *
		 * @param $fp filePointer returned by openFile
		 * @param $bytes number of bytes to read
		 * @returns the data read
		 * @returns NULL if error
		 */
		function readFile( $fp, $bytes )
		{
		}
	
		/***
		 * Write to pointer, data, x bytes
		 *
		 * @param $fp filePointer returned by openFile
		 * @param $data the data to write
		 * @param $bytes number of bytes to write
		 * @returns number of bytes actually wrote
		 * @returns NULL if error
		 */
		function writeFile( $filePointer, $data, $bytes )
		{
		}
	
		/***
		 * Get the location of a temporary file
		 *
		 * This function should find the name of a temporary file
		 * in a directory by any mean possible, like numbering the file names
		 * so that they do not match.
		 *
		 * @param $path the path where to put the temporary file
		 * @returns the full path to the file
		 * @returns false if error (should not happen)
		 */
		function getTmpFile( $path )
		{
		}
	
		/***
		 * Put a file
		 *
		 * This function should create a file in one go from the data it gets
		 * out of the fileInfo object it is transmited to it in the directory
		 * it is given.
		 *
		 * @param $path the path where to put the file
		 * @param $fileObject the fileInfo object containing info on the file to copy
		 * @returns true if OK or false if error
		 */
		function putFile( $path, $fileObject )
		{
		}
	
		/***
		 * Creates a folder
		 *
		 * This function should create a new folder at the location it is
		 * given.
		 *
		 * @param $folderName the name of the new folder
		 * @param $where directory where to create the new directory
		 * @returns true if OK or false if error
		 */
		function createFolder( $folderName, $where )
		{
		}
	
		/***
		 * Deletes a folder
		 *
		 * This function be recursive to destroy the sub-folders
		 *
		 * @param $path the path to the folder to destroy
		 * @param $recursive true if the function should destroy the subfolders, false if not
		 * @returns always false
		 */
		function deleteFolder( $path, $recursive = true )
		{
		}
	
		/***
		 * Returns a file from its Friend path
		 *
		 * This function can convert the pathname to its internal path names
		 * but must return the correct file pointed to by the system.
		 *
		 * @param path the FriendUP full path
		 * @return the fileinfo structure pointing to the file
		 */ 
		function getFileByPath( $path )
		{
		}
	
		/***
		 * Delete a file
		 *
		 * This function deletes a file, or of the given name is a directory
		 * it will destroy (recursively if chosen) all the sub-directories.
		 *
		 * @param $path this path to the file or directory to delete
		 * @param $recursive in case of folders, makes the routing delete all the sub folders
		 * @return TRUE of everything was OK
		 * @return FALSE in case of error
		 /
		function deleteFile( $path, $recursive = false )
		{
		}
	}
}

/**
 * Create a the new SQL door to interface with the Core...
 */
$door = new DoorSQLDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>

