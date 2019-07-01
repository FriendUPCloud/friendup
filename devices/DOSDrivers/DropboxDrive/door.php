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
/** @file
 *
 *  Dropbox FileSystem...
 *
 *  We need an app which an be seen via https://www.dropbox.com/developers/apps
 *  This app has key and secret which we need to do certain things..
 *  Each app has a PREDEFINED set of redirect URLs. All no localhost ones require SSL....
 *  We use a new set of PHP classes for API v2 - https://github.com/kunalvarma05/dropbox-php-sdk - 
 *
 *  @author Thomas Wollburg <tw@friendup.cloud>
 *  @date first pushed on 10/02/2015
 *  @date 2017-04-22 started conversion to API v2 using new PHP classes for dropbox connection.
 *  @todo FL>TW this code is not finished. The thread handling function does nothing.
 */
global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

//load required files
require_once( 'devices/DOSDrivers/DropboxDrive/dropbox-sdk-php/Dropbox_APIv2/vendor/autoload.php' );

include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );

use Kunnu\Dropbox\Dropbox;
use Kunnu\Dropbox\DropboxApp;
use Kunnu\Dropbox\Http\Clients\DropboxHttpClientFactory;

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
			
			// TODO: Get login data / token from door connected to fkeys encrypted with the servers privatekey perhaps ... since we don't have any client when we use the door system with webdav ...
			
			// TODO: Get client id and so on from server settings not from config ...
			
			$this->parseSysInfo();
			
			if( !is_array(  $this->sysinfo ) || !$this->sysinfo['key'] || !$this->sysinfo['secret'] ) { $Logger->log('Unable to load sysinfo'); die('fail<!--separate-->system information incomplete'); }	
			
			if( $this->Config == '' )
			{
				$this->state = self::UNAUTHORIZED;
			}
			else
			{
				//check config contains what we need...
				$confjson = json_decode($this->Config,1);
				if( !( json_last_error() == JSON_ERROR_NONE && isset( $confjson['access_token'] ) && isset( $confjson['uid'] ) ) ) $this->state = self::UNAUTHORIZED;
			}
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}
		
		function GetByCurl( $url, $args = false, $method = 'POST', $headers = false )
		{
			if( !$url ) return;
			
			$agent = ( isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0' );
			
			if( function_exists( 'curl_init' ) )
			{
				// Get data
				$ch = curl_init();
				curl_setopt( $ch, CURLOPT_URL, $url );
				//curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 1 );
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
				curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Accept-charset: UTF-8' ) );
				curl_setopt( $ch, CURLOPT_ENCODING, 'UTF-8' );
				//curl_setopt( $ch, CURLOPT_ENCODING, 1 );
				curl_setopt( $ch, CURLOPT_USERAGENT, $agent );
				
				if( $headers )
				{
					curl_setopt( $ch, CURLOPT_HTTPHEADER, $headers );
				}
		
				if( $method != 'POST' )
				{
					curl_setopt( $ch, CURLOPT_CUSTOMREQUEST, $method );
				}
		
				if( $args )
				{
					curl_setopt( $ch, CURLOPT_POST, true );
					curl_setopt( $ch, CURLOPT_POSTFIELDS, $args );
				}
		
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
				
				return ( curl_exec( $ch ) );
				
			}
			
			return 'fail<!separate-->curl unavailable';
		}
		
		
		//small helper to get config from safe place..
		function parseSysinfo()
		{
			global $SqlDatabase, $User, $Logger;
			
			$cfg = file_exists('cfg/cfg.ini') ? parse_ini_file('cfg/cfg.ini',true) : [];
			
			if( is_array($cfg) && isset( $cfg['DropboxAPI'] ) )
			{
				$this->sysinfo = $cfg['DropboxAPI'];
			}
			else
			{
				$this->sysinfo = [];
			}
			
			
			
			if( $fs = $SqlDatabase->FetchObject( '
				SELECT 
					f.ID, f.KeysID 
				FROM 
					`Filesystem` f 
				WHERE 
						f.ID = \'' . $this->ID . '\' 
					AND f.UserID = \'' . $User->ID . '\' 
				ORDER BY 
					f.ID ASC 
				LIMIT 1
			' ) )
			{
				if( $fs->KeysID && ( $dbs = $SqlDatabase->FetchObjects( $q = '
					SELECT 
						k.* 
					FROM 
						`FKeys` k 
					WHERE 
							k.UserID = \'' . $User->ID . '\' 
						AND k.ID IN ( ' . $fs->KeysID . ' ) 
						AND k.IsDeleted = "0" 
						AND k.ApplicationID = "-1" 
					ORDER BY 
						k.ID DESC 
				' ) ) )
				{
					$data = ''; $publickey = '';
					
					foreach( $dbs as $db )
					{
						$data = $db->Data;
						$publickey = $db->PublicKey;
					}
					
					// If publickey is set and it's the servers publickey decrypt it with the servers privatekey
					
					if( $publickey && $data )
					{
						if( file_exists( 'cfg/crt/server_encryption_key.pem' ) )
						{
							$privatekey = '';
						
							$fcrypt = new fcrypto();
						
							if( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) )
							{
								if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
								{
									if( isset( $keys[0] ) )
									{
										$privatekey = ( $keys[0] . '-----' );
									}
								}
							}
							
							if( $privatekey && ( $decrypted = $fcrypt->decryptString( $data, $privatekey ) ) )
							{
								if( $plaintext = $decrypted->plaintext )
								{
									$data = $decrypted->plaintext;
								}
							}
						}
					}
					
					//$Logger->log( ' $keys ' . print_r( $keys,1 ) . ' [] $privatekey ' . $privatekey . ' [] $data ' . $data . ' [] $decrypted ' . print_r( $decrypted, 1 ) );
					
					$this->Config = $data;
					
					if( strstr( $this->Config, '#' ) && strstr( $this->Config, '&' ) && strstr( $this->Config, '=' ) )
					{
						if( $this->Config = explode( '#', $this->Config ) )
						{
							if( $this->Config = explode( '&', $this->Config[1] ) )
							{
								$json = new stdClass();
								
								foreach( $this->Config as $v )
								{
									if( $v = explode( '=', $v ) )
									{
										$json->{$v[0]} = $v[1];
									}
								}
					
								if( $json )
								{
									$this->Config = json_encode( $json );
								}
							}
						}
					}
				}
			}
				
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

			$rs = $this->dbx->listFolder( $subPath )->getData();	
			
			//$Logger->log( $subPath . ' [] ' . print_r( $rs,1 ) . ' [] ' . print_r( $this->dbx->listFolder( $subPath ),1 ) );
			
			//die( print_r( $rs,1 ) );  
			
			//organize our return values; we might want to add some kind of sorting here in the future
			if( is_array($rs) && is_array($rs['entries']) )
			{
				$ret = [];
				$dc = $rs['entries'];
				for($i = 0; $i < count($dc); $i++)
				{
					$o = new stdClass();
					$o->Filename = basename( $dc[$i]['name'] );
					$o->Type = $dc[$i]['.tag'] == 'folder' ? 'Directory' : 'File';
					$o->MetaType = $dc[$i]['.tag'] == 'folder' ? 'Directory' : 'File'; //we actually have a mime type from dropbox we could use... $dc[$i]['mime_type'] // TODO: Is this really needed??
					$o->Permissions = ''; //TODO: is this correct
					$o->DateModified = $dc[$i]['server_modified'];
					$o->DateCreated = $dc[$i]['server_modified'];
					$o->Filesize = $dc[$i]['size'];
					
					$path = ( $subPath && $subPath != '/' ? $subPath . '/' : '' ) . end( explode( '/', $dc[$i]['path_display'] ) );
					
					$cleanpath = ( substr( $path,0,1 ) == '/' ? substr( $path,1 ) : $path ); 
					$cleanpath .= ( $dc[$i]['.tag'] == 'folder' && substr( $cleanpath , -1) != '/' ? '/' : '' ) ;
					
					//$cleanpath = ( substr( $dc[$i]['path_display'],0,1 ) == '/' ? substr( $dc[$i]['path_display'],1 ) : $dc[$i]['path_display'] ); 
					//$cleanpath .= ( $dc[$i]['.tag'] == 'folder' && substr( $cleanpath , -1) != '/' ? '/' : '' ) ;
					
					$o->Path = $cleanpath; // . ( $dc[$i]['is_dir'] ? '/' : '' )
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
			
			
			
			// TODO: This is a workaround, please fix in Friend Core!
			//       Too much code for getting a real working path..
			if( isset( $args->path ) )
			{
				$path = $args->path;
			}
			else if( isset( $args->args ) )
			{
				if( isset( $args->args->path ) )
				{
					$path = $args->args->path;
				}
			}
			
			if( isset( $path ) )
			{
				$path = str_replace( '::', ':', $path );
				$path = str_replace( ':/', ':', $path );
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$path = $path[1] . ':' . $path[2];
				}
				else
				{
					// FIX WEBDAV problems
					if( count( $path ) > 1 )
					{
						if( $path[1] != '' && $path[1]{0} == '/' )
							$path[1] = substr( $path[1], 1, strlen( $path[1] ) );
					}
					$path = implode( ':', $path );
				}
				
				$path = $args->path;
			}
			
			
			
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
					else
					{
						die('ok<!--separate-->' . json_encode( $this->loginFile( $this->Name . ':/' ) ) );
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
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
				// TODO: Make this simpler, and also finish it, only fake 0 data atm ...
				
				// Is it a folder?
				if( substr( $path, -1, 1 ) == '/' )
				{
					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = 'Directory';
					$fldInfo->Path = $path;
					$fldInfo->Filesize = 0;
					$fldInfo->Filename = end( explode( '/', substr( end( explode( ':', $path ) ), 0, -1 ) ) );
					$fldInfo->DateCreated = '';
					$fldInfo->DateModified = '';
					die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
				}
				else if( substr( $path, -1, 1 ) == ':' )
				{
					// its our mount itself
					
					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = 'Directory';
					$fldInfo->Path = $path;
					$fldInfo->Filesize = 0;
					$fldInfo->Filename = $path;
					$fldInfo->DateCreated = '';
					$fldInfo->DateModified = '';
					die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
				}
				// Ok, it's a file
				else
				{
					if( strstr( $path, '.' ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'File';
						$fldInfo->MetaType = 'File';
						$fldInfo->Path = $path;
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = end( explode( '/', end( explode( ':', $path ) ) ) );
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					else
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = 'Directory';
						$fldInfo->Path = $path . '/';
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = end( explode( '/', end( explode( ':', $path ) ) ) );
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
				}
				die( 'fail<!--separate-->Could not find file!' );
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 
			else if( $args->command == 'write' )
			{
				
				if( $this->state != self::UNAUTHORIZED && isset( $args->tmpfile ) && $this->connectClient()) 
				{
					$dropboxpath = end( explode(':', $args->path) );
					if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level
					
					//$Logger->log( '$args->command == \'write\' ' . print_r( $args,1 ) . ' [] ' . $dropboxpath );

					//create db file isntance
					$dbf = new Kunnu\Dropbox\DropboxFile( $args->tmpfile );
					
					
					// TODO: Add chuncked support for files over 8mb ...
					
					$filesize = filesize( $args->tmpfile );
					
					// 524288 bytes = 0,5mb
					
					$chunkSize = ( $filesize < 524288 ? $filesize : 524288 );
					
					//$Logger->log( '$this->dbx->uploadChunked( ' . ( $dbf ? 'true' : 'false' ) . ', ' . $dropboxpath . ', ' . $filesize . ', ' . $chunkSize . ', [\'autorename\' => true] );' );
					
					$file = $this->dbx->uploadChunked($dbf, $dropboxpath, $filesize, $chunkSize, ['autorename' => true]);
					
					$newmeta = $file->getData();
					
					if( is_array($newmeta) && isset( $newmeta['size'] ) )
					{
						$this->updateAccountInfo();
						$Logger->log( 'ok<!--separate-->' . $newmeta['size'] . '<!--separate-->' . $newmeta['path_display'] );
						return 'ok<!--separate-->' . $newmeta['size'] . '<!--separate-->' . $newmeta['path_display'];
					}
					else
					{
						$Logger->log( 'fail<!--separate-->Write to dropbobx failed' );
						return 'fail<!--separate-->Write to dropbobx failed';
					}
				}
				else
				{
					$Logger->log( 'fail<!--separate-->Not authorized to write to Dropbox.' );
					return( 'fail<!--separate-->Not authorized to write to Dropbox.' );
				}
			}
			// ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### ##### 			
			else if( $args->command == 'read' )
			{
				if( $this->connectClient() )
				{
					//we want a file stream here
					return $this->getFile( $args->path );
				}				
				else/* if($this->state == self::UNAUTHORIZED)*/
				{
					// return login Dialogue
					
					if( $args->path == $this->Name .':/Login.jsx' )
					{
						//
						$Logger->log( 'What can we send to dropbox... args ... ' . print_r( $args,1 ) . ' User ######## ' . print_r( $User,1 ));
						
						$rs = $SqlDatabase->FetchObject('SELECT fs.Data FROM FSetting fs WHERE fs.UserID=\'-1\' AND fs.Type = \'system\' AND fs.Key=\'dropbox\'');
						if( $rs ) $dconf=json_decode($rs->Data,1);
						
						if( 1==1/*$rs && json_last_error() == JSON_ERROR_NONE && $dconf['interfaceurl']*/ )
						{
							// we want to use token... but as we do not have SSL yet we need to work with the code
							// our state info must contain user id and our mountname so that we can update the database...
							// we will also tell our dropbox answer which server to redirect the dropbox request to.
							//$statevar = $User->ID . '::' . $this->Name . '::' . $args->sessionid . '::' . $dconf['interfaceurl'];
							$targetURL = 'https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=' . $this->sysinfo['key']/* . '&state=' . rawurlencode( bin2hex( $statevar ) )*/;
							
							if( file_exists(self::LOGINAPP) ) 
							{
								$loginapp = file_get_contents(self::LOGINAPP);		
								
								$loginapp = str_replace('{dropboxurl}', $targetURL,$loginapp);
								$loginapp = str_replace('{path}', $this->Name .':',$loginapp);
								
								$loginapp = str_replace('{redirect_uri}', ( isset( $dconf['redirect_uri'] ) ? $dconf['redirect_uri'] : '' ),$loginapp);
								
								//$loginapp = str_replace('{authid}', $args->sessionid,$loginapp);
								//$loginapp = str_replace('{dropboxinterface}', urlencode( $this->sysinfo['dropboxhandler'] ),$loginapp);
								//$loginapp = str_replace('{path}', $this->Name .':Authorized.html',$loginapp);
								
								ob_clean();
								return 'ok<!--separate-->' . $loginapp;
								die();
							}
							else
							{
								$errapp = '';
								$errapp.= '';
								$errapp.= 'Application.run = function( msg, interface )';
								$errapp.= '{';
								$errapp.= 'Notify({"title":"Dropbox system error","text":"Login app not found!"}); Application.quit();';
								$errapp.= '}';							
								
								return 'ok<!--separate-->' . $errapp;
								
							}
						}
						else
						{
							//$Logger->log('System configration incomplete. Please defined system/dropbox key with interfaceurl as setting in data.');
							
							$errapp = '';
							$errapp.= '';
							$errapp.= 'Application.run = function( msg, interface )';
							$errapp.= '{';
							$errapp.= 'Notify({"title":"Dropbox system error","text":"Incomplete system configuration. Please notify your Administrator!"}); Application.quit();';
							$errapp.= '}';							
							
							return 'ok<!--separate-->' . $errapp;
						}
						

					}
				}
				
				die( 'fail<!--separate-->Could not connect to Dropbox for file read ::' . $this->state );
				
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				/* TODO: implement import; postponed as Hogne said this is not needed */
				die('fail<!--separate-->import not implemented');
			}
			else if( $args->command == 'loaddocumentformat' )
			{
				/* TODO: check if we can just reuse the existing code from mysql drive here... */
				die('fail<!--separate-->loaddocumentformat not implemented');
			}
			else if( $args->command == 'gendocumentpdf' )
			{
				/* TODO: Postponed as Hogne said not needed now */
				die('fail<!--separate-->gendocumentpdf not implemented');
			}
			else if( $args->command == 'writedocumentformat' )
			{
				/* TODO: Postponed as Hogne said not needed now */
				die('fail<!--separate-->writedocumentformat not implemented');
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
					$o->Used = $this->accountinfo['storageStatus']['used'];
					$o->Filesize = $this->accountinfo['storageStatus']['allocation']['allocated'];
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}
	
				die( 'fail<!--separate-->volumeinfo failed' );
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
                            $foldermeta = $this->dbx->createFolder( $dropboxpath );
                            $result = $foldermeta->getData();
                            if( is_array($result) && isset($result['path_display']) ) return 'ok<!--separate-->Folder created';
                        }

                        return 'fail<!--separate-->Could not create folder at Dropbox target';
						break;
					case 'delete':
					
						$dropboxpath = end( explode(':', $args->path ) );
						if( substr($dropboxpath,0,1) != '/' ) $dropboxpath = '/' . $dropboxpath; //sometimes the leading trail is missing; like in sometimes when a folder is created at root level
						if( substr($dropboxpath,-1) == '/' ) $dropboxpath = rtrim($dropboxpath,'/');


						if( strlen( $dropboxpath ) && $this->connectClient() )
						{
							$foldermeta = $this->dbx->delete( $dropboxpath );
							$result = $foldermeta->getData();
							$this->updateAccountInfo();
							
							if( is_array($result) && $result['id'] == 1 ) return 'ok';
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

			$file_to_get = $this->dbx->download( $dropboxpath );
			
			fwrite( $fp, $file_to_get->getContents() );
			fseek( $fp, 0 );
			
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
			
			$Logger->log( 'return false;' );
			
			return false;
		}
		
		// Will open and return a file pointer set with options
		function openFile( $path, $mode )
		{
			global $Config, $User;
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
				$account = $this->dbx->getCurrentAccount();
				$this->accountinfo = $account->getData();
				$this->accountinfo['storageStatus'] = $this->dbx->getSpaceUsage();
			}
		}
		
		function connectClient()
		{
			global $User, $SqlDatabase, $Config, $Logger;
			
			if( $this->state == self::UNAUTHORIZED ) return false;/*die('fail<!--separate-->Cannot connect unauthorized.');*/
			if( $this->dbx ) return true;
			
			$confjson = json_decode($this->Config,1);
			if( json_last_error() == JSON_ERROR_NONE && isset( $confjson['access_token'] ) && isset( $confjson['uid'] )  )
			{

				//die( print_r( $confjson,2 ) );
				
				try
				{
					$app = new Kunnu\Dropbox\DropboxApp($confjson['uid'], $this->sysinfo['secret'], $confjson['access_token']);
					$this->dbx = new Kunnu\Dropbox\Dropbox($app);
				
					$this->accountinfo = $this->dbx->getCurrentAccount()->getData();
					$this->accountinfo['storageStatus'] = $this->dbx->getSpaceUsage();
				
				}
				catch ( Exception $e ) 
				{
					return false; 
				}
				
				if( isset( $this->accountinfo['account_id']) ) return true;
			}
			
			$Logger->log( 'Dropbox config is not valid ' );
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
			$oLogin->Permissions = '';
			$oLogin->ID = '0001';
			$oLogin->DateModified = date('Y-m-d H:i:s');
			$oLogin->DateCreated = $oLogin->DateModified;
			$oLogin->Filesize = "" . strlen( file_get_contents(self::LOGINAPP) );
			$oLogin->Path = end( explode( ':', $thePath . $oLogin->Filename ) );
			
			return array( $oLogin );
		}
	}
}

$door = new DoorDropboxDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
