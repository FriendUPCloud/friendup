<?php

/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*
	Dropbox FileSystem...
	
	
	We need an app which an be seen via https://www.dropbox.com/developers/apps
	
	This app has key and secret which we need to do certain things..
	
	Each app has a PREDEFINED set of redirect URLs. All no localhost ones require SSL....
	
*/

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );
require_once( 'devices/DOSDrivers/DropboxDrive/dropbox-sdk-php/Dropbox/autoload.php' );

/* do we need this???
if( !defined( 'DROPBOX_DRIVE_FILE_LIMIT' ) )
{
	// 100 megabytes
	define( 'DROPBOX_DRIVE_FILE_LIMIT', 104857600 );
}*/


if( !class_exists( 'DoorDropboxDrive' ) )
{
	class DoorDropboxDrive extends Door
	{
		
		private $state;
		private $accountinfo;
		private $dbx; //Dropbox Client App
		
		const LOGINAPP = 'devices/DOSDrivers/DropboxDrive/DropboxAuthoriseApp.jsx';
		const UNAUTHORIZED = 'unauthorized';
					
		function onConstruct()
		{
			global $args, $Logger, $User;
			
			if( !$this->ID )
			{
				$d = new dbIO( 'Filesystem' );
				$d->UserID = $User->ID;
				$d->Name = reset( explode( ':', $args->path ? $args->path : $args->args->path) );
				if( $d->Load() )
				{
					foreach( $d as $k=>$v )
						$this->$k = $v;
				}
			}

			$this->sysinfo = json_decode( file_get_contents( 'devices/DOSDrivers/DropboxDrive/sysinfo.json' ) , true);
			if( !is_array(  $this->sysinfo ) || !$this->sysinfo['api-key']['key'] || !$this->sysinfo['api-key']['secret'] ) { $Logger->log('Unable to load sysinfo'); die('fail'); }	
			
			if( $this->Config == '' )
			{
				$this->state = self::UNAUTHORIZED;
			}
			else
			{
				//nothing to do here....		
			}
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}

		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function listFolderContents( $subPath )
		{
			
			global $Logger, $args;

			if( substr( $subPath, -1 ) == '/' ) $subPath = substr($subPath, 0, strlen($subPath)-1);
			
			//we need our mountname to prefix it to pathes from dropbox			
			$mountname = reset( explode( ':', $args->path ? $args->path : $args->args->path) );

			//use the api...
			if( substr($subPath,0,1) != '/' ) $subPath = '/' . $subPath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level

			$rs = $this->dbx->getMetadataWithChildren( $subPath );	
			
			//organize our return values; we might want to add some kind of sorting here in the future
			if( is_array($rs) && is_array($rs['contents']) )
			{
				$ret = [];
				$dc = $rs['contents'];
				for($i = 0; $i < count($dc); $i++)
				{
					$o = new stdClass();
					$o->Filename = basename( $dc[$i]['path'] );
					$o->Type = $dc[$i]['is_dir'] ? 'Directory' : 'File';
					$o->MetaType = $dc[$i]['is_dir'] ? 'Directory' : 'File'; //we actually have a mime type from dropbox we could use... $dc[$i]['mime_type'] // TODO: Is this really needed??
					$o->ID = $dc[$i]['rev'];
					$o->Permissions = ''; //TODO: is this correct
					$o->DateModified = $dc[$i]['modified'];
					$o->DateCreated = $dc[$i]['modified'];
					$o->Filesize = $dc[$i]['bytes'];
					
					
					$cleanpath = ( substr( $dc[$i]['path'],0,1 ) == '/' ? substr( $dc[$i]['path'],1 ) : $dc[$i]['path'] ); 
					$cleanpath .= ( $dc[$i]['is_dir'] && substr( $cleanpath , -1) != '/' ? '/' : '' ) ;
					
					$o->Path = $mountname . ':' . $cleanpath; // . ( $dc[$i]['is_dir'] ? '/' : '' )
					$ret[] = $o;
				}
				return $ret;
			}
			else
			{
				return false;
			}
		} // end of listFolderContents

		// Execute a dos command
		function dosAction( $args )
		{
			global $User, $SqlDatabase, $Config, $Logger;
		
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				$fo = false;
						
				// Can we get sub folder?
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				$subPath = false;
				
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					// Failed to find a path
					if( !$subPath ) die( 'fail<!--separate-->Path error.' );
				}
	
				$out = [];
				
				if( substr( $thePath, -1, 1 ) == ':' )
				{
					if( $this->state == self::UNAUTHORIZED )
					{
						die('ok<!--separate-->' . json_encode( $this->loginFile( $this->Name . ':/' ) ) );
					}
					else if( $this->connectClient() )
					{
						$fo = $this->listFolderContents( '/'); 
					}
				}
				else
				{
					if( $this->connectClient() )
					{
						$fo = $this->listFolderContents( $subPath );
					}
					else
					{
						die('fail<!--separate-->Dropbox connect failed');
					}
				}
				return 'ok<!--separate-->' . json_encode( $fo );
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 
			else if( $args->command == 'write' )
			{
				
				
				$Logger->log('Write to dropbox '  . print_r( $args,1 ));
				
				if( $this->state != self::UNAUTHORIZED && isset( $args->tmpfile ) && $this->connectClient()) 
				{
					$dropboxpath = end( explode(':', $args->path) );
					if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level
					$fm = $this->dbx->getMetadata( $dropboxpath );
					
					//check if this file exists; does not work like this and seems not really necessary... we just update exsting ones as Dropbox keeps revisions :)
					//$md = $this->dbx->getMetaData( '/' . $dropboxpath );
					$fp = fopen( $args->tmpfile, 'rb' );
					
					if( is_array($fm) && $fm['revision'] )
					{
						$newmeta = $this->dbx->uploadFile( $dropboxpath, Dropbox\WriteMode::update( $fm['revision'] ), $fp );
					}
					else
					{
						$newmeta = $this->dbx->uploadFile( $dropboxpath, Dropbox\WriteMode::add(), $fp );	
					}
					fclose($fp);  					
					
					if( is_array($newmeta) && isset( $newmeta['bytes'] ) )
					{
						$this->updateAccountInfo();
						return 'ok<!--separate-->' . $newmeta['bytes'] . '<!--separate-->' . $newmeta['path'];
					}
					else
					{
						$Logger->log('Write to dropboxdrive ' . $this->Name . ' failed ' . $newmeta );
						return 'fail<!--separate-->Write to dropbobx failed';
					}
				}
				else
				{
					return( 'fail<!--separate-->Not authorized to write to Dropbox.' );
				}
				
				
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 			
			else if( $args->command == 'read' )
			{

				if($this->state == self::UNAUTHORIZED)
				{
					// return login Dialogue
					if( $args->path == $this->Name .':/Login.jsx' )
					{
						//
						//$Logger->log( 'What can we send to dropbox... args ... ' . print_r( $args,1 ) . ' User ######## ' . print_r( $User,1 ));
						
						// we want to use token... but as we do not have SSL yet we need to work with the code
						// our state info must contain user id and our mountname so that we can update the database...
						$statevar = $User->ID . '::' . $this->Name . '::' . $args->sessionid;
						$targetURL = 'https://www.dropbox.com/1/oauth2/authorize' . '?response_type=token&client_id=' . $this->sysinfo['api-key']['key'] . '&state=' . rawurlencode( bin2hex( $statevar ) );
						
						
						if( file_exists(self::LOGINAPP) ) 
						{
							$loginapp = file_get_contents(self::LOGINAPP);		
							$loginapp = str_replace('{dropboxurl}', $targetURL,$loginapp);
							$loginapp = str_replace('{authid}', $args->sessionid,$loginapp);
							$loginapp = str_replace('{path}', $this->Name .':Authorized.html',$loginapp);
							
							ob_clean();
							return 'ok<!--separate-->' . $loginapp;
							die();
						}
						else
						{
							 return 'fail<!--separate-->Login app not found' . self::LOGINAPP;
							
						}
					}
				}
				else if( $this->connectClient() )
				{
					//we want a file stream here
					return $this->getFile( $args->path );
				}
				
				
				die( 'fail<!--separate-->Could not connect to Dropbox for file read ::' . $this->state );
				
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				/* TODO: implement import; postponed as Hogne said this is not needed */
				die('fail');
			}
			else if( $args->command == 'loaddocumentformat' )
			{
				/* TODO: check if we can just reuse the existing code from mysql drive here... */
				die('fail');
			}
			else if( $args->command == 'gendocumentpdf' )
			{
				/* TODO: Postponed as Hogne said not needed now */
				die('fail');
			}
			else if( $args->command == 'writedocumentformat' )
			{
				/* TODO: Postponed as Hogne said not needed now */
				die('fail');
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
				if( $this->state == self::UNAUTHORIZED )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = 0;
					$o->Filesize = 0;
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}		
				else if ($this->connectClient() )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = $this->accountinfo['quota_info']['normal'];
					$o->Filesize = $this->accountinfo['quota_info']['quota'];
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}
	
				die( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : false );
				switch( $action )
				{
					case 'mount':
						return $this->connectToDropbox();
						break;
					case 'unmount':
						return 'ok';
						break;
						
					case 'rename':
						if( !isset( $args->path ) || !isset( $args->newname ) ) return('fail<!--separate-->Cannot rename without proper arguments');
						if( $this->connectClient() )
						{
							$oldpath = end( explode( ':', $args->path ) );
							$tmp = explode('/', $oldpath);
							array_pop($tmp);
							$newpath =  implode('/',$tmp) . '/'. $args->newname;
							
							
							if( substr($oldpath,0,1) != '/' ) $oldpath = '/' . $oldpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level
							$result = $this->dbx->move( $oldpath, $newpath );
							
							//$Logger->log( 'API move result is \n\n' . print_r( $result, 1 ) );
							return 'ok<!--separate-->File moved.';
							
						}
						else
						{
							return 'fail<!--separate-->Could not connect to Dropbox';
						}
						
						break;
					case 'makedir':
						if(isset( $args->path ) && $this->connectClient())
                        {
                            $dropboxpath = end( explode(':', $args->path ) );
                            if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level
                            $result = $this->dbx->createFolder( $dropboxpath );
                            if( is_array($result) && isset($result['path']) && isset($result['is_dir']) && $result['is_dir'] == 1) return 'ok<!--separate-->Folder created';
                        }

                        return 'fail<!--separate-->Could not create folder at Dropbox target';
						break;
					case 'delete':
					
						//$Logger->log('Delete from dropbox \n\n' . print_r( $args, 1 ));
						$dropboxpath = end( explode(':', $args->path ) );
						if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level

						if( strlen( $dropboxpath ) && $this->connectClient() )
						{
							$result = $this->dbx->delete( $dropboxpath );
							
							//$Logger->log( 'Result of delete operation on '. $dropboxpath .' was this: \n\n' . print_r($result,1) );
							
							$this->updateAccountInfo();
							
							if( is_array($result) && $result['is_deleted'] == 1 ) return 'ok';
						}
					
						return 'fail<!--separate-->Delete in dropbox failed';
						break;
						
					case 'copy':
						return 'fail<!--separate-->Copy not implemented yet.';
						break;
				}
			} 
			return 'fail<!--separate-->' . print_r( $args, 1 );
			
		} // end of dosAction
		
		// Gets a file by path!
		function getFile( $path )
		{
			global $User, $args, $Logger;
		
			$fp = tmpfile();
			
			
			$dropboxpath = end( explode(':', $path) );
			if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level

			$this->dbx->getFile( $dropboxpath, $fp );
			
			fseek($fp,0);
			
			if( $args->mode == 'rb' )
			{
				return( stream_get_contents($fp) );
			}
			else
			{
				return('ok<!--separate-->' . stream_get_contents($fp) );
			}
		
		
			return false;
		}
		
		// Will open and return a file pointer set with options
		function openFile( $path, $mode )
		{
			global $Config, $User;
			
			/*
				
			TODO: implement openFile
				
			// Set basics on file pointer object
			$o = new stdClass();
			$o->offset = 0;
			switch( strtolower( trim( $mode ) ) )
			{
				case 'w':
				case 'r':
				case 'w+':
				case 'a':
				case 'a+':
				case 'rb':
					$o->mode = strtolower( trim( $mode ) );
					break;
				default:
					return false;
			}
			
			// Let's check if the file exists ....
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
		
			// Get filename and folder
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			// Check if it exists
			$tmpPath = false;
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$otmpPath = $Config->FCUpload . $fi->DiskFilename;
				}
			}
			
			// Is everything good?
			if( isset( $o->mode ) && isset( $tmpPath ) )
			{
				$o->tmpPath = $tmpPath;
				return $o;
			} */
			return false;
		}
		
		// Close file pointer!
		function closeFile( $filePointer )
		{
			$filePointer->offset = 0;
			$filePointer->tmpPath = NULL;
			$filePointer->mode = NULL;
			return false;
		}
		
		// Will read from file pointer x bytes
		function readFile( $fp, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
				return NULL;
			
			if( $file = fopen( $fp->tmpPath, $fp->mode ) )
			{
				fseek( $file, $this->offset );
				if( $data = fgets( $file, $bytes ) )
				{
					$this->offset += $bytes;
					fclose( $file );
					return $data;
				}
				fclose( $file );
			}
			return NULL;
		}
	
		// Will write to pointer, data, x bytes
		function writeFile( $filePointer, $data, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
				return NULL;
			
			if( $file = fopen( $fp->tmpPath, $fp->mode ) )
			{
				fseek( $file, $this->offset );
				$int = 0;
				if( $int = fwrite( $file, $data, $bytes ) )
				{
					$this->offset += $bytes;
					fclose( $data );
					return $int;
				}
				fclose( $file );
			}
			return 0;
		}
	
		// Get the location of a tmp file
		function getTmpFile( $path )
		{
			global $Config, $User;
		
			/*
		
			TODO: implement getTmpFile
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
		
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$ext = end( explode( '.', $fi->DiskFilename ) );
					$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
					$filename = $fname . '.' . $ext;		
					while( file_exists( $Config->FCTmp . $filename ) )
						$filename = $fname . rand(0,999) . '.' . $ext;
					// Make tmp file
					copy( $Config->FCUpload . $fi->DiskFilename, $Config->FCTmp . $filename );
					return $Config->FCTmp . $filename;
				}
			}
			
			*/
			return false;
		}
	
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;
		
			/*
		
			TODO: implement this.
		
			if( $tmp = $fileObject->Door->getTmpFile( $fileObject->Path ) )
			{
				// Remove file from path
				$subPath = explode( '/', end( explode( ':', $path ) ) );
				array_pop( $subPath );
				$subPath = implode( '/', $subPath ) . '/';
		
				$fo = $this->getSubFolder( $subPath );
		
				$fi = new dbIO( 'FSFile' );
				$fi->UserID = $User->ID;
				$fi->FilesystemID = $this->ID;
				$fi->FolderID = $fo ? $fo->ID : '0';
				$fi->Filename = $fileObject->Filename;
		
				// Unique filename
				$ext = end( explode( '.', $fi->Filename ) );
				$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
				$filename = $fname . '.' . $ext;		
				while( file_exists( $Config->FCUpload . $filename ) )
					$filename = $fname . rand(0,999) . '.' . $ext;
				$fi->DiskFilename = $filename;
			
				// Do the copy
				copy( $tmp, $Config->FCUpload . $fi->DiskFilename );
			
				// Remove tmp file
				unlink( $tmp );
			
				$fi->Permissions = $fileObject->Permissions;
				$fi->Filesize = filesize( $Config->FCUpload . $fi->DiskFilename );
			
				$fi->Save();
			
				return true;
			}
		
			*/
		
			return false;
		}
	
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;

			/*

			TODO: implement this

			// New folder		
			$nfo = new DbIO( 'FSFolder' );
			$nfo->UserID = $User->ID;
			$nfo->FilesystemID = $this->ID;
		
			// Remove file from path
			$subFolder = $where;
			if( strstr( $subFolder, ':' ) )
				$subFolder = end( explode( ':', $subFolder ) );
			if( substr( $subFolder, -1, 1 ) == '/' )
				$subFolder = substr( $subFolder, 0, strlen( $subFolder ) - 1 );
			if( strstr( $subFolder, '/' ) )
			{
				$subFolder = explode( '/', $subFolder );
				array_pop( $subFolder );
				$subFolder = implode( '/', $subFolder ) . '/';
			}
		
			if( $fo = $this->getSubFolder( $subFolder ) )
			{
				$nfo->FolderID = $fo->ID;
			}
			else
			{
			}
		
			// Get the correct name
			$nfo->Name = $folderName;
		
			// Save
			$nfo->Save();
		
			// Check save result
			if( $nfo->ID > 0 )
				return true;
				
				*/
			return false;
		}
	
		
	
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			/*
		
			TODO: implement this
		
			// Also delete all sub folders!
			if( $recursive )
			{
				$fop = new dbIO( 'FSFolder' );
				$fop->UserID = $User->ID;
				$fop->FilesystemID = $this->ID;
				$fop->FolderID = $fo->ID;
				if( $fop = $fop->find() )
				{
					foreach( $fop as $fopp )
					{
						$this->_deleteFolder( $fopp, $recursive );
					}
				}
			}
			
			// Also delete all files!
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo->ID;
			if( $files = $fi->find() )
			{
				foreach( $files as $file )
				{
					if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
					{
						unlink( $Config->FCUpload . $file->DiskFilename );
					}
					$file->Delete();
				}
			}
		
			$fo->delete();
			
			
			*/
			return true;
		}
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;
		
		
		
			/*
			
			TODO: implement this
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				return $this->_deleteFolder( $fo, $recursive );
			}
			*/
			return false;
		}
	
		// Delete a file
		function deleteFile( $path, $recursive = false )
		{
			global $Config, $User, $Logger;
		
		
			/*
				
			TODO: implement this
				
			// If it's a folder
			if( substr( $path, -1, 1 ) == '/' )
				return $this->deleteFolder( $path, $recursive );
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			$fo = $this->getSubFolder( $subPath );
		
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					unlink( $Config->FCUpload . $fi->DiskFilename );
					$fi->Delete();
					return true;
				}
				else 
				{
					$fi->Delete();
				}
			}
			
			*/
			return false;
		}
		
		/* connect to dropbox */
		function connectToDropbox()
		{
			
			global $args, $Logger, $User;

			//nothing to do if we have never been there and need oauth approval from user			
			if( $this->state == self::UNAUTHORIZED ) return 'ok';
			
			if( $this->connectClient() ) return 'ok';
			return( 'fail<!--separate-->Could not connect client' );
			
			
		}
		
		function updateAccountInfo()
		{
			global $Logger;
			if( $this->state != self::UNAUTHORIZED && $this->connectClient() )
			{
				$this->accountinfo = $this->dbx->getAccountInfo();
				$Logger->log( 'Our Dropbox accountinfo ' . print_r( $this->accountinfo, 1 ) );
			}
		}
		
		function connectClient()
		{
			global $User, $SqlDatabase, $Config, $Logger;

			if( $this->state == self::UNAUTHORIZED ) die('fail<!--separate-->Cannot connect unauthorized.');
			if( $this->dbx ) return true;
			
			$confjson = json_decode($this->Config,1);
			if( json_last_error() == JSON_ERROR_NONE && isset( $confjson['access_token'] ) && isset( $confjson[ 'db_uid' ] )  )
			{

				$this->dbx = new Dropbox\Client( $confjson['access_token'], $confjson['db_uid']);
				$this->accountinfo = $this->dbx->getAccountInfo();
				
				//$Logger->log( 'Our account info is ' . print_r( $this->accountinfo, 1 )  );
				
				if( isset( $this->accountinfo['uid']) ) return true;
			}
			
			$Logger->log( 'Dropbox config is not valid' );
			return false;
			
		} // end of connectClient
		
		/**
			function that return login JSX handler
			
			Needed as we cannot login without user interaction at Dropboxes side right now.
			
		*/
		function loginFile( $thePath )
		{
			//$oReadme = new stdClass();
			$oLogin = new stdClass();
			$oLogin->Filename = 'Login.jsx';
			$oLogin->Type = 'File';
			$oLogin->MetaType = 'File'; // TODO: Is this really needed??
			$oLogin->Permissions = 'r*e*r*e*';
			$oLogin->DateModified = date('Y-m-d H:i:s');
			$oLogin->DateCreated = $oLogin->DateModified;
			$oLogin->Filesize = 16;
			$oLogin->Path = $thePath . $oLogin->Filename;
			return [ $oLogin ];
		}
	}
}

if(!isset($path)) $path = '';
// Create a door...
$door = new DoorDropboxDrive( $path );

?>
