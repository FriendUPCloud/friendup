<?php

/*©lpgl*************************************************************************
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

/** @file
 *
 *  Google Drive FileSystem...
 *
 *  Uses oAuth interface and stores users data in DB after he authorized us to read his files. works a lot like the GoogleDrive Drive.
 *
 *  @author Thomas Wollburg <tw@friendup.cloud>
 *  @date first pushed on 24/04/2017
 */
global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );
require_once( 'devices/DOSDrivers/GoogleDrive/Google/vendor/autoload.php' );


if( !class_exists( 'GoogleDrive' ) )
{
	class GoogleDrive extends Door
	{
		
		private $state;
		private $accountinfo;
		private $dbx; //GoogleDrive Client App
		
		const LOGINAPP = 'devices/DOSDrivers/GoogleDrive/GoogleAuthoriseApp.jsx';
		const UNAUTHORIZED = 'unauthorized';
					
		function onConstruct()
		{
			global $args, $Logger, $User;
	
			$this->parseSysInfo();
			
			if( !is_array(  $this->sysinfo ) || !isset( $this->sysinfo['key'] ) || !isset( $this->sysinfo['client_secret'] ) ) { $Logger->log('Unable to load sysinfo'); die('fail'); }	
			
			if( $this->Config == '' )
			{
				$this->state = self::UNAUTHORIZED;
			}
			else
			{
				//check config contains what we need...
				$confjson = json_decode($this->Config,1);
				if( !( json_last_error() == JSON_ERROR_NONE && isset( $confjson['access'] ) && isset( $confjson['access']['access_token'] ) ) ) $this->state = self::UNAUTHORIZED;
			}
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}
		
		//small helper to get config from safe place..
		function parseSysinfo()
		{

			$cfg = file_exists('cfg/cfg.ini') ? parse_ini_file('cfg/cfg.ini',true) : [];
			
			if( is_array($cfg) && isset( $cfg['GoogleDriveAPI'] ) )
			{
				$this->sysinfo = $cfg['GoogleDriveAPI'];
			}
			else
			{
				$this->sysinfo = [];
			}
		}


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
						die('ok<!--separate-->' . json_encode( $this->loginFile( $this->Name . ':' ) ) );
					}
					else if( $this->connectClient() )
					{
						$fo = $this->listFolderContents( '/'); 
					}
					else
					{
						die('could not connect client');	
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
						die('fail<!--separate-->GoogleDrive connect failed');
					}
				}
				return 'ok<!--separate-->' . json_encode( $fo );
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 
			else if( $args->command == 'write' )
			{
				if( $this->state != self::UNAUTHORIZED && isset( $args->tmpfile ) && $this->connectClient()) 
				{
					$googlepath = end( explode(':', $args->path) );
					if( substr($googlepath,-1) == '/' ) $googlepath = rtrim($googlepath,'/');
	
					$filesize = filesize( $args->tmpfile  );

					$tmp = explode('/', $googlepath);
					$filename = array_pop($tmp);
					$parentpath = implode('/',$tmp);    

					if( !$filesize ) return 'fail<!--separate-->no data to transfer';
					
					$parents = false;
					if( $parentpath != '' )
					{
					    $gdir = $this->getGoogleFileObject( $parentpath );
					    $parents = [ $gdir->getId() ];
					}
					else
					{
					    $parents = [ 'root' ];
					}			
					if( !$parents ) return 'fail<!--separate-->could not determine target directory';


					$fileId = false;
					// check if file exists... update if it does
                	$results = $this->getSingleFolderContents( $parents[0], "mimeType != 'application/vnd.google-apps.folder'" );
					foreach ($results->getFiles() as $gfile)
					{
						if( $gfile->getName() == $filename )
						{
							$fileId = $gfile->getId();
						}
					}					
					
					$drivefiles = new Google_Service_Drive( $this->gdx );
					
					/*
						files under 1MB are send in one chunk... bigger files are split up.
					*/
					if( $filesize < 1024*1024 )
					{
						$file = new Google_Service_Drive_DriveFile();
						$file->setName( $filename );
						$file->setParents( $parents );
						if( $fileId )
						{
							$file = new Google_Service_Drive_DriveFile();
							$result = $drivefiles->files->update($fileId, $file, array(
							  'data' => file_get_contents( $args->tmpfile ),
							  'mimeType' => 'application/octet-stream',
							  'uploadType' => 'multipart'
							));							
						}
						else
						{
							$result = $drivefiles->files->create($file, array(
							  'data' => file_get_contents( $args->tmpfile ),
							  'mimeType' => 'application/octet-stream',
							  'uploadType' => 'multipart'
							));							
						}

						return 'ok<!--separate-->' . $filesize;
					}
					else
					{
						$file = new Google_Service_Drive_DriveFile();
						$file->setName( $filename )	;
						$file->setParents( $parents );
						$chunkSize = 512 * 1024;
						
						// Call the API with the media upload, defer so it doesn't immediately return.
						$this->gdx->setDefer(true);
						
						if( $fileId )
						{
							$file->setId( $fileId );
							$request = $drivefiles->files->update($fileId,new Google_Service_Drive_DriveFile());						
						}
						else
						{
							$request = $drivefiles->files->create($file);	
						}
						
						
						// Create a media file upload to represent our upload process.
						$media = new Google_Http_MediaFileUpload(
						  $this->gdx,
						  $request,
						  'text/plain',
						  null,
						  true,
						  $chunkSize
						);
						$media->setFileSize( $filesize );
						
						// Upload the various chunks. $status will be false until the process is
						// complete.
						$status = false;
						$handle = fopen( $args->tmpfile , 'rb');
						while (!$status && !feof($handle)) {
						  $chunk = fread($handle, $chunkSize);
						  $status = $media->nextChunk($chunk);
						 }
						
						// The final value of $status will be the data from the API for the object
						// that has been uploaded.
						$result = false;
						if($status != false) {
						  $result = $status;
						}
						
						return 'ok<!--separate-->' . $filesize ;
					}
				}
				else
				{
					$Logger->log('Unauthorized writ attempt');
					return( 'fail<!--separate-->Not authorized to write to GoogleDrive.' );
				}
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 			
			else if( $args->command == 'call' )
			{
				if( $this->connectClient() && $args->args->query == 'execute' )
				{
					//we want to open a doc for editing here
					return $this->getFile( $args->path, true );
				}
				return 'fail<!--separate-->unauthorized or unknown call not allowed';
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 			
			else if( $args->command == 'read' )
			{

				if($this->state == self::UNAUTHORIZED)
				{
					// return login Dialogue
					if( strtolower( $args->path ) == strtolower( $this->Name .':Login.jsx' ) )
					{
						$rs = $SqlDatabase->FetchObject('SELECT fs.Data FROM FSetting fs WHERE fs.UserID=\'-1\' AND fs.Type = \'system\' AND fs.Key=\'googledrive\'');
						if( $rs ) $dconf=json_decode($rs->Data,1);
						
						if( $rs && json_last_error() == JSON_ERROR_NONE && $dconf['interfaceurl'] )
						{

						
							// we want to use token... but as we do not have SSL yet we need to work with the code
							// our state info must contain user id and our mountname so that we can update the database...
							// we will also tell our google answer which server to redirect the google request to.
							$statevar = $User->ID . '::' . $this->Name . '::' . $args->sessionid . '::' . $dconf['interfaceurl'];
							
							$client = new Google_Client();
							$client->setApplicationName($this->sysinfo['project_id']);
							$client->setClientId($this->sysinfo['client_id']);
							$client->setClientSecret($this->sysinfo['client_secret']);	
							$client->setDeveloperKey($this->sysinfo['key']);
							$client->setIncludeGrantedScopes(true);
							$client->addScope(Google_Service_Drive::DRIVE);
							$client->setState( rawurlencode( bin2hex( $statevar ) ) );
							$client->setAccessType('offline');
							$client->setRedirectUri($this->sysinfo['redirect_uri']);

							/*
								Google will even create a nice complete target url for us with all parameters included....
								
								The response from the server should trigger a directory refresh...
							*/
							$targetURL = $client->createAuthUrl();
							
							if( file_exists(self::LOGINAPP) ) 
							{
								$loginapp = file_get_contents(self::LOGINAPP);		
								$loginapp = str_replace('{googleurl}', $targetURL,$loginapp);
								$loginapp = str_replace('{authid}', $args->sessionid,$loginapp);
								$loginapp = str_replace('{googleinterface}', $this->sysinfo['redirect_uri'],$loginapp);
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
						else
						{
							$Logger->log('System configration incomplete. Please defined system/googledrive key with interfaceurl as setting in data.');
							return 'fail<!--separate-->Sysconfig incomplete';
						}
						

					}
				}
				else if( strtolower( $args->path ) == strtolower( $this->Name .':index.jsx' ) )
				{
					$jsxpath = 'devices/DOSDrivers/GoogleDrive/index.jsx';
					if( file_exists( $jsxpath ) )
					{
						ob_clean();
						return 'ok<!--separate-->' . file_get_contents($jsxpath);
						die();						
					}
					return 'fail';
						
				}
				else if( $this->connectClient() )
				{
					//we want a file stream here
					return $this->getFile( $args->path );
				}
				
				
				return( 'fail<!--separate-->Could not connect to Google Drive for file read ::' . $this->state );
				die();
				
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
					$o->Used = 0;
					$o->Filesize = 0;
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
						return $this->connectToGoogleDrive();
						break;
					case 'unmount':
						return 'ok';
						break;
						
					case 'rename':
						if( !isset( $args->path ) || !isset( $args->newname ) ) return('fail<!--separate-->Cannot rename without proper arguments');
						if( $this->connectClient() )
						{

							$googlepath = end( explode( ':', $args->path ) );
                            if( substr($googlepath,-1) == '/' ) $googlepath = rtrim($googlepath,'/');
							
							$tmp = explode('/', $googlepath);
							$oldname = array_pop($tmp);

							$gfile = $this->getGoogleFileObject( $googlepath );
							if( !$gfile ) return 'fail';
							
							$tmpfile = new Google_Service_Drive_DriveFile();
							$tmpfile->setName( $args->newname );
							$drivefiles = new Google_Service_Drive( $this->gdx );
							$drivefiles->files->update( $gfile->getID(),$tmpfile );							
							
							return 'ok<!--separate-->File moved.';
							
						}
						else
						{
							return 'fail<!--separate-->Could not connect to Google Drive';
						}
						
						break;
					case 'makedir':
						if(isset( $args->path ) && $this->connectClient())
                        {
                            $google_directory_metatype = 'application/vnd.google-apps.folder';
                            
                            $googlepath = end( explode(':', $args->path ) );
                            if( substr($googlepath,-1) == '/' ) $googlepath = rtrim($googlepath,'/');

                            
							$tmp = explode('/', $googlepath);
							$foldername = array_pop($tmp);
							$parentpath = implode('/',$tmp);                  
                            
                            $gdir = false;
                            if( $parentpath != '' )
                            {
	                            $gdir = $this->getGoogleFileObject( $parentpath );
	                            $parents = [ $gdir->getId() ];
                            }
                            else
                            {
	                            $parents = [ 'root' ];
                            }
                            
                            if( $parents )
                            {
	                        	
	                        	//dont create if we have it already...
	                        	$results = $this->getSingleFolderContents( $parents[0], "mimeType = 'application/vnd.google-apps.folder'" );
								foreach ($results->getFiles() as $gfile)
								{
									if( $gfile->getName() == $foldername )
									{
										return 'ok';
									}
								}
	                        
		                        $tmpdir = new Google_Service_Drive_DriveFile();
	                            $tmpdir->setName( $foldername );
	                            $tmpdir->setMimeType( $google_directory_metatype );
	                            $tmpdir->setParents( $parents );
	                            
	                            $drivefiles = new Google_Service_Drive( $this->gdx );
								$drivefiles->files->create( $tmpdir );
				
								return 'ok';
	                            
                            }
                            return 'fail';
                        }

                        return 'fail<!--separate-->Could not create folder at GoogleDrive target';
						break;
					case 'delete':
						$googlepath = end( explode(':', $args->path ) );


						if( strlen( $googlepath ) && $this->connectClient() )
						{
							$gfile = $this->getGoogleFileObject( $googlepath );
							if( $gfile && $gfile->getID() )
							{
								$tmpfile = new Google_Service_Drive_DriveFile();
								$tmpfile->setTrashed( true );
								$drivefiles = new Google_Service_Drive( $this->gdx );
								$drivefiles->files->update( $gfile->getID(),$tmpfile );
								return 'ok';
							}
						}
					
						return 'fail<!--separate-->Delete in google failed';
						break;
						
					case 'copy':
						return 'fail<!--separate-->Copy not implemented yet.';
						break;
				}
			} 
			return 'fail<!--separate-->' . print_r( $args, 1 );
			
		} // end of dosAction



		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function listFolderContents( $subPath )
		{
			global $Logger, $args;

			if( substr( $subPath, -1 ) == '/' ) $subPath = rtrim($subPath, '/');
			
			//we need our mountname to prefix it to pathes from google			
			$mountname = reset( explode( ':', $args->path ? $args->path : $args->args->path) );

			$results = false;
			$parentID = 'root';
			if( $subPath != '' )
			{
				//we need to work our way downwards
				$tmp = explode('/',$subPath);
				for( $i = 0; $i < count( $tmp ); $i++ )
				{
					$lastParentID = $parentID;
					$rs = $this->getSingleFolderContents( $parentID, "name='" . $tmp[$i] . "'" );
					foreach ($rs->getFiles() as $gfile)
					{
						if( $gfile->getName() == $tmp[$i] )
						{
							if( $i+1 < count($tmp) )
							{
								$parentID = $gfile->getId();
								
							}
							else
							{
								//finally get our listing....
								$results = $this->getSingleFolderContents( $gfile->getId() );
							}
						}
					}
					if( $results== false && $lastParentID == $parentID ) die('fail');					
				}
			}
			else
			{
				$results = $this->getSingleFolderContents($parentID);
			}
	
			//organize our return values; we might want to add some kind of sorting here in the future
			if( $results )
			{
				$ret = [];
				foreach ($results->getFiles() as $gfile)
				{
					$dm = new DateTime( $gfile->getModifiedTime() );
					$dc = new DateTime( $gfile->getCreatedTime() );
				
					$o = new stdClass();
					$o->Type = $gfile->getMimeType() == 'application/vnd.google-apps.folder' ? 'Directory' : 'File';
					$o->Filename = $gfile->getName() . ( $o->Type == 'Directory' ? '' : $gfile->getFileExtension() );
					$o->MetaType = ( strpos($gfile->getMimeType(),'google') == false && $o->Type != 'Directory' ? $o->Type : 'DiskHandled'); //
					$o->Permissions = ''; //TODO: is this correct
					$o->DateModified = $dm->format( 'Y-m-d H:i:s' );
					$o->DateCreated = $dc->format( 'Y-m-d H:i:s' );

					switch( $gfile->getMimeType() )
					{
						case 'application/vnd.google-apps.document':
							$o->IconClass = 'TypeGoogleDocs';
							$o->Command = $gfile->getMimeType();
							break;
						case 'application/vnd.google-apps.spreadsheet':
							$o->IconClass = 'TypeGoogleDocs';
							$o->Command = $gfile->getMimeType();
							break;
						default:
							break;
					}

					$o->Filesize = ( $gfile->getSize() != null ? $gfile->getSize() : '16' );
					$o->ID = $gfile->getId();
					$cleanpath = ($subPath != '' ? $subPath . '/' : '' ) . $o->Filename; 
					$cleanpath .= ( $o->Type == 'Directory' && substr( $cleanpath , -1) != '/' ? '/' : '' ) ;
					$o->Path = $cleanpath;
					$ret[] = $o;
				}
				//$Logger->log('LKisting files' . print_r( $ret,1 ));
				return $ret;
			}
			else
			{
				return false;
			}
		} // end of listFolderContents

		/*
			get contents of gDrive Folder
			
			as google uses IDs all over the place and has no inbuilt structure for getting contents by path we have to execute a couple of requests here to get the actual file content
			
			@param $gDriveParentId id of the parent folder (which is 'root' for the top level)
			@param $filterstring an additional filter string to limit the results we get back; usually name = "[DIRECTORY_NA:E_WE_ARE_AFTER]" will be passed
			
			@return Google Drive FileList object

		*/
		function getSingleFolderContents( $gDriveParentId, $filterstring=false )
		{
			global $Logger;
			$drivefiles = new Google_Service_Drive( $this->gdx );
	
			// use the api...
			// https://developers.google.com/resources/api-libraries/documentation/drive/v3/php/latest/class-Google_Service_Drive.html
		
			$filterstring = ( $filterstring ? ' AND trashed = false AND ' . $filterstring : ' AND trashed = false' );
			$requestParameters = [];
			$requestParameters['q'] = "'{$gDriveParentId}' in parents" . ( $filterstring );
			$requestParameters['fields'] = 'files(id, name,mimeType,size,version,spaces,parents,modifiedTime,createdTime,webViewLink)'; //,owners,permissions			
			
			//$Logger->log('Gettting content...' . print_r( $requestParameters,1 ));
			
			return $drivefiles->files->listFiles($requestParameters);
		}
		
		
		/**
			get a file from google drive based on its path
			
			as google uses IDs all over the place and has no inbuilt structure for getting contents by path we have to execute a couple of requests here to get the actual file content
			
			@param $path the path to the file
		*/
		function getFile( $path, $returnGDocURL=false )
		{
			global $User, $args, $Logger;
		
			
			$googlepath = end( explode(':', $path) );
			
			$parentID = 'root';
			$filepointer= false;
			$drivefiles = new Google_Service_Drive( $this->gdx );
			
			$gfile = $this->getGoogleFileObject( $path );
			
			/*
				special handler for google file types...
			*/
			if( strpos($gfile->getMimeType(),'google') > 0 && $returnGDocURL )
			{
				$dataset = (object)['url'=>$gfile->getWebViewLink(),'title'=>$gfile->getName()];
				return 'ok###' . json_encode($dataset);
			}
			else if( strpos($gfile->getMimeType(),'google') > 0 )
			{
				$filepointer = $drivefiles->files->export($gfile->getId(), 'application/pdf', array('alt' => 'media' ));
			}
			else
			{
				//do the actual data transfer....
				$filepointer = $drivefiles->files->get($gfile->getId(), array( 'alt' => 'media' ));			
			}


			$fp = tmpfile();
			fwrite( $fp, $filepointer->getBody()->getContents() );
			fseek($fp, 0);
			
			if( $args->mode == 'rb' )
			{
				return stream_get_contents( $fp );
			}
			else if( $args->mode == 'rs' )
			{
				while( $data = fread( $fp, 4096 ) )
					print( $data );
				
				die();
			}
			else
			{
				return('ok<!--separate-->' . stream_get_contents($fp) );
			}
		
			return false;
		}
		
		/*
			resolve a Friend Path to a google file ID
		*/
		function getGoogleFileObject( $friendpath )
		{
			global $Logger;
			
			$googlepath = end( explode(':', $friendpath) );
			if( substr($googlepath,-1) == '/' ) $googlepath = rtrim($googlepath,'/');
						
			$parentID = 'root';
			$filepointer= false;
			$drivefiles = new Google_Service_Drive( $this->gdx );
			
			if( strpos($googlepath,'/') )
			{
				//we need to work our way downwards
				$tmp = explode('/',$googlepath);
				for( $i = 0; $i < count( $tmp ); $i++ )
				{
					$lastParentID = $parentID;
					$rs = $this->getSingleFolderContents( $parentID, "name='" . $tmp[$i] . "'" );
					foreach ($rs->getFiles() as $gfile)
					{
						if( $gfile->getName() == $tmp[$i] )
						{
							if( $i+1 < count($tmp) )
							{
								$parentID = $gfile->getId();
							}
							else
							{
								//we got our file, return its ID
								return $gfile;
							}
						}
					}
				}				
			}
			else
			{
				$rs = $this->getSingleFolderContents( $parentID, "name = '{$googlepath}'");
				foreach ($rs->getFiles() as $gfile)
				{
					if( $gfile->getName() == $googlepath )
					{
						return $gfile;
					}
				}
			}
			return false;
		}
		
		
		/*
			Will open and return a file pointer set with options
			TODO: implement this?
		*/
		function openFile( $path, $mode )
		{
			global $Config, $User;
			return false;
		}
		
		/*
			Close file pointer!	
			TODO: implement this?
		*/
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
	
			return false;
		}
	
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;

		
			return false;
		}
	
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;
			return false;
		}
	
		
	
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true )
		{
			global $Config, $User, $Logger;
			return true;
		}
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;
			return false;
		}
	
		// Delete a file
		function deleteFile( $path, $recursive = false )
		{
			global $Config, $User, $Logger;
			return false;
		}
		
		/* connect to google */
		function connectToGoogleDrive()
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
				$account = $this->gdx->getCurrentAccount();
				$this->accountinfo = $account->getData();
				$this->accountinfo['storageStatus'] = $this->gdx->getSpaceUsage();
			}
		}
		
		function connectClient()
		{
			global $User, $SqlDatabase, $Config, $Logger, $args;

			if( $this->state == self::UNAUTHORIZED ) die('fail<!--separate-->Cannot connect unauthorized.');
			if( isset( $this->gdx ) ) return true;
			
			$confjson = json_decode($this->Config,1);
			
			$could_not_update_token = false;
			
			if( json_last_error() == JSON_ERROR_NONE && isset( $confjson['access'] ) && isset( $confjson['access']['access_token'] ) )
			{
				$client = new Google_Client();
				$client->setApplicationName($this->sysinfo['project_id']);
				$client->setClientId($this->sysinfo['client_id']);
				$client->setClientSecret($this->sysinfo['client_secret']);	
				$client->setDeveloperKey($this->sysinfo['key']);
				$client->setIncludeGrantedScopes(true);
				$client->addScope(Google_Service_Drive::DRIVE_METADATA);
				$client->addScope(Google_Service_Drive::DRIVE);
				$client->setAccessType('offline');
				
				
				
				try
				{
					$client->setAccessToken($confjson['access']);				
				}
				catch (Exception $e)
				{

					$Logger->log('something went bust'. $e->getMessage() . print_r( $e,1 ) . print_r( $client,1 ));
					return 'fail<!--separate-->could not authenticate';
				}
				
				
				/*
					if access token is expired... create new one. as we have asked for offline access we can do that ithout the user needing to approve us once more :)
				*/
				if ( $client->isAccessTokenExpired() )
				{
				    
					$refreshToken = $client->getRefreshToken();
					
					if( $refreshToken  )
					{
					    $client->fetchAccessTokenWithRefreshToken( $refreshToken );
					    $accessToken = $client->getAccessToken();
	
						$confjson['access'] = $accessToken;						
					}
					else
					{
						unset( $confjson['access'] );
						$could_not_update_token = true;
					}

					$mountname = reset( explode( ':', $args->path ? $args->path : $args->args->path) );
					$SqlDatabase->Query('UPDATE Filesystem SET Config=\''. mysqli_real_escape_string( $SqlDatabase->_link, json_encode($confjson) ) .'\' WHERE Name="'. mysqli_real_escape_string( $SqlDatabase->_link, $mountname ) .'" AND UserID = ' . intval( $User->ID ) );
				}

				try
				{
					$client->setAccessToken($confjson['access']);				
				}
				catch (Exception $e)
				{

					$Logger->log('something went bust'. $e->getMessage() . print_r( $e,1 ) . print_r( $client,1 ));
					return 'fail<!--separate-->could not authenticate';
				}
				
				if ( !$client->isAccessTokenExpired() )
				{
					$this->gdx = $client;
					return true;					
				}
			}
			return false;
			
		} // end of connectClient
		
		/**
			function that return login JSX handler
			
			Needed as we cannot login without user interaction at GoogleDrivees side right now.
			
		*/
		function loginFile( $thePath )
		{
			//$oReadme = new stdClass();
			$oLogin = new stdClass();
			$oLogin->Filename = 'Login.jsx';
			$oLogin->Type = 'File';
			$oLogin->MetaType = 'File'; // TODO: Is this really needed??
			$oLogin->Permissions = '';
			$oLogin->DateModified = date('Y-m-d H:i:s');
			$oLogin->DateCreated = $oLogin->DateModified;
			$oLogin->Filesize = 16;
			$oLogin->Path = end( explode( ':', $thePath . $oLogin->Filename ) );
			return [ $oLogin ];
		}
	}
}

$door = new GoogleDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
