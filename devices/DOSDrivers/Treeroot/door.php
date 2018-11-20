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

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

if( !class_exists( 'DoorTreeroot' ) )
{
	class DoorTreeroot extends Door
	{
		function onConstruct()
		{
			global $args, $Logger;
			
			if( $this->Server )
			{
				$this->Domain = ( ( substr( $this->Server, -1, 1 ) == '/' ? substr( $this->Server, 0, -1 ) : $this->Server ) . ( $this->Port ? ':' . $this->Port : '' ) . '/' );
			}
			
			//$Logger->log( '[---DEBUGGING---] onConstruct: ' . print_r( $args,1 ) );
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}
		
		// Some private vars ---------------------------------------------------
		
		//private var $sessionid;
		
		
		// Some private methods ------------------------------------------------
		
		// First of all, let's log in!
		private function login()
		{
			global $Logger;
			
			//$Logger->log( '[---DEBUGGING---] Ok, we are trying login: ' );
			
			// TODO: We need to change this function to support crypto from client side.
			
			return '3e701df95d802c3055db48f323a80001';
			
			$ch = curl_init( $this->Server . '/authenticate/' );
			$fields = array(
				'Username' => $this->Username,
				'Password' => $this->Password,
				'Source'   => 'FriendUP'
			);

			curl_setopt( $ch, CURLOPT_POSTFIELDS, $fields );
			curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );

			if( $res = curl_exec( $ch ) )
			{
				curl_close( $ch );
				$xml = new SimpleXMLElement( $res );
				$this->sessionid = $xml->sessionid;
				return $xml->sessionid;
			}
			curl_close( $ch );
			return false;
		}
		
		// Gets a path
		public function getIcons( $path )
		{
			global $Logger;
			
			//$Logger->log( '[---DEBUGGING---] Ok, we are trying getIcons: ' . $path );
			
			if( !$this->login() )
				return 'fail';
				
			$subPath = end( explode( ':', $path ) );
			
			if( trim( $subPath ) )
			{	
				return 'ok<!--separate-->[]';
			}
			else
			{
				$newsFeed = new stdClass();
				$newsFeed->Filename = 'Newsfeed';
				$newsFeed->Type = 'Directory';
				$newsFeed->MetaType = $newsFeed->Type;
				$newsFeed->Filesize = 0;
				$newsFeed->DateModifed = date( 'Y-m-d H:i:s' );
				$newsFeed->DateCreated = '1970-01-01 00:00:00';
				$newsFeed->Path = $path . 'Newsfeed/';
				$newsFeed->Permissions = '';
		
				$messages = new stdClass();
				$messages->Filename = 'Messages';
				$messages->Type = 'Directory';
				$messages->MetaType = $messages->Type;
				$messages->Filesize = 0;
				$messages->DateModifed = date( 'Y-m-d H:i:s' );
				$messages->DateCreated = '1970-01-01 00:00:00';
				$messages->Path = $path . 'Messages/';
				$messages->Permissions = '';
		
				$events = new stdClass();
				$events->Filename = 'Events';
				$events->Type = 'Directory';
				$events->MetaType = $events->Type;
				$events->Filesize = 0;
				$events->DateModifed = date( 'Y-m-d H:i:s' );
				$events->DateCreated = '1970-01-01 00:00:00';
				$events->Path = $path . 'Events/';
				$events->Permissions = '';
	
				$library = new stdClass();
				$library->Filename = 'Library';
				$library->Type = 'Directory';
				$library->MetaType = $library->Type;
				$library->Filesize = 0;
				$library->DateModifed = date( 'Y-m-d H:i:s' );
				$library->DateCreated = '1970-01-01 00:00:00';
				$library->Path = $path . 'Library/';
				$library->Permissions = '';
		
				$groups = new stdClass();
				$groups->Filename = 'Groups';
				$groups->Type = 'Directory';
				$groups->MetaType = $groups->Type;
				$groups->Filesize = 0;
				$groups->DateModifed = date( 'Y-m-d H:i:s' );
				$groups->DateCreated = '1970-01-01 00:00:00';
				$groups->Path = $path . 'Groups/';
				$groups->Permissions = '';
		
				$profile = new stdClass();
				$profile->Filename = 'Profile';
				$profile->Type = 'Directory';
				$profile->MetaType = $profile->Type;
				$profile->Filesize = 0;
				$profile->DateModifed = date( 'Y-m-d H:i:s' );
				$profile->DateCreated = '1970-01-01 00:00:00';
				$profile->Path = $path . 'Profile/';
				$profile->Permissions = '';
		
				$settings = new stdClass();
				$settings->Filename = 'Settings';
				$settings->Type = 'Executable';
				$settings->MetaType = 'File';
				$settings->IconFile = 'gfx/icons/128x128/apps/preferences-desktop-user.png';
				$settings->Filesize = 1024;
				$settings->DateModifed = date( 'Y-m-d H:i:s' );
				$settings->DateCreated = '1970-01-01 00:00:00';
				$settings->Path = $path . 'Settings';
				$settings->Permissions = '';
		
				$chat = new stdClass();
				$chat->Filename = 'Chat';
				$chat->Type = 'Executable';
				$chat->MetaType = 'File';
				$chat->IconFile = 'gfx/icons/128x128/apps/telepathy-kde.png';
				$chat->Filesize = 1024;
				$chat->DateModifed = date( 'Y-m-d H:i:s' );
				$chat->DateCreated = '1970-01-01 00:00:00';
				$chat->Path = $path . 'Chat';
				$chat->Permissions = '';
	
				$array = array(
					$newsFeed,
					$messages,
					$events,
					$library,
					$groups,
					$profile,
					$settings,
					$chat
				);
		
				return 'ok<!--separate-->' . json_encode( $array ); 
			}
		}
		
		
		
		function curl_exec_follow( $cu, &$maxredirect = null )
		{		
			$mr = 5;
			
			if ( ini_get( 'open_basedir' ) == '' && ini_get( 'safe_mode' == 'Off' ) )
			{
				curl_setopt( $cu, CURLOPT_FOLLOWLOCATION, $mr > 0 );
				curl_setopt( $cu, CURLOPT_MAXREDIRS, $mr );
			}
			else
			{
				curl_setopt( $cu, CURLOPT_FOLLOWLOCATION, false );
				
				if ( $mr > 0 )
				{
					$newurl = curl_getinfo( $cu, CURLINFO_EFFECTIVE_URL );
					$rch = curl_copy_handle( $cu );
					
					curl_setopt( $rch, CURLOPT_HEADER, true );
					curl_setopt( $rch, CURLOPT_NOBODY, true );
					curl_setopt( $rch, CURLOPT_FORBID_REUSE, false );
					curl_setopt( $rch, CURLOPT_RETURNTRANSFER, true );
					do
					{
						curl_setopt( $rch, CURLOPT_URL, $newurl );
						
						$header = curl_exec( $rch );
						
						if ( curl_errno( $rch ) ) 
						{
							$code = 0;
						}
						else
						{
							$code = curl_getinfo( $rch, CURLINFO_HTTP_CODE );
							
							if ( $code == 301 || $code == 302 || $code == 303 )
							{
								preg_match( '/Location:(.*?)\n/', $header, $matches );
								
								if ( !$matches )
								{
									preg_match( '/location:(.*?)\n/', $header, $matches );
								}
								
								$oldurl = $newurl;
								$newurl = trim( array_pop( $matches ) );
								
								if ( $newurl && !strstr( $newurl, 'http://' ) && !strstr( $newurl, 'https://' ) )
								{
									if ( strstr( $oldurl, 'https://' ) )
									{
										$parts = explode( '/', str_replace( 'https://', '', $oldurl ) );
										$newurl = ( 'https://' . reset( $parts ) . ( $newurl{0} != '/' ? '/' : '' ) . $newurl );
									}
									if ( strstr( $oldurl, 'http://' ) )
									{
										$parts = explode( '/', str_replace( 'http://', '', $oldurl ) );
										$newurl = ( 'http://' . reset( $parts ) . ( $newurl{0} != '/' ? '/' : '' ) . $newurl );
									}
									
								}
							}
							else
							{
								$code = 0;
							}
						}
					}
					while ( $code && --$mr );
					curl_close( $rch );
					if ( !$mr )
					{
						if ( $maxredirect === null )
						{
							return false;
						}
						else
						{
							$maxredirect = 0;
						}
						
						return false;
					}
					
					curl_setopt( $cu, CURLOPT_URL, $newurl );
				}
			}
			
			$cu = curl_exec( $cu );
			
			if( $cu )
			{
				return $cu;
			}
			
			return false;
		}
		
		
		
		function proxyCheck( $server, $agent = false )
		{
			global $Config;
			
			if( $server && function_exists( 'curl_init' ) )
			{
				$c = curl_init();
				curl_setopt( $c, CURLOPT_URL, $server );
				curl_setopt( $c, CURLOPT_FAILONERROR, true );
				curl_setopt( $c, CURLOPT_NOBODY, true );
				curl_setopt( $c, CURLOPT_RETURNTRANSFER, true );
				
				if( $agent )
				{
					curl_setopt( $c, CURLOPT_USERAGENT, $agent );
				}
				
				if( $Config && $Config->SSLEnable )
				{
					curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
					curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
				}
				
				//if( function_exists( 'curl_exec_follow' ) )
				//{
					$r = $this->curl_exec_follow( $c );
				//}
				//else
				//{
				//	$r = curl_exec( $c );
				//}
				
				$k = curl_getinfo( $c );
				curl_close( $c );
				
				if( $r !== false && $k && ( $k['http_code'] == 200 || $k['http_code'] == 301 || $k['http_code'] == 206 ) )
				{
					return $k['http_code'];
				}
				
				return $k['http_code'];
			}
			else
			{
				return 'fail : function curl_init doesn\'t exist';
			}
			
			return false;
		}
		
		
		
		function proxyGet( $server, $args = false, $agent = false, $rawdata = false )
		{
			global $Config;
			
			if( $server && function_exists( 'curl_init' ) )
			{
				$c = curl_init( $server );
				$fields = [];
				
				if( $args )
				{
					foreach( $args as $k=>$v )
					{
						$fields[$k] = $v;
					}
					
					curl_setopt( $c, CURLOPT_POST, true );
					curl_setopt( $c, CURLOPT_POSTFIELDS, http_build_query( $fields ) );
				}
				
				curl_setopt( $c, CURLOPT_RETURNTRANSFER, true );
				curl_setopt( $c, CURLOPT_HTTPHEADER, array( 'Accept-charset: UTF-8' ) );
				curl_setopt( $c, CURLOPT_ENCODING, 'UTF-8' );
				
				if( $agent )
				{
					curl_setopt( $c, CURLOPT_USERAGENT, $agent );
				}
				
				if( $Config && $Config->SSLEnable )
				{
					curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
					curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
				}
				
				//if( function_exists( 'curl_exec_follow' ) )
				//{
					$r = $this->curl_exec_follow( $c );
				//}
				//else
				//{
				//	$r = curl_exec( $c );
				//}
				
				curl_close( $c );
				
				if( ( isset( $fields['rawdata'] ) && $fields['rawdata'] ) || $rawdata )
				{
					return $r;
				}
			}
			else
			{
				return 'fail : function curl_init doesn\'t exist';
			}
			
			if( !preg_match( '/\<html/i', $r ) )
			{
				// --- Check if result is xml or json -----------------------------
				if( strstr( substr( trim( $r ), 0, 200 ), "<?xml" ) )
				{
					if( function_exists( 'simplexml_load_string' ) )
					{
					//	class simple_xml_extended extends SimpleXMLElement
					//	{
					//		public function Attribute( $name )
					//		{
					//			foreach( $this->Attributes() as $key=>$val )
					//			{
					//				if( $key == $name )
					//				{
					//					return (string)$val;
					//				}
					//			}
					//		}
					//	}
						
						// TODO: Make support for rss with namespacing
						
						//if( $xml = simplexml_load_string( trim( $r ), 'simple_xml_extended' ) )
						if( $xml = simplexml_load_string( trim( $r ) ) )
						{
							return $xml;
						}
						else
						{
							return 'fail : couldn\'t convert string to object with function simplexml_load_string';
						}
					}
					else
					{
						return 'fail : function simplexml_load_string doesn\'t exist';
					}
				}
				else if( json_decode( trim( $r ) ) && json_last_error() === 0 )
				{
					return json_decode( trim( $r ) );
				}
				else
				{
					return $r;
				}
			}
			else
			{
				return $r;
			}
			
			return false;
		}
		
		
		
		// Execute a dos command
		function dosAction( $args )
		{
			global $Logger;
			
			$domain = $this->Domain;
			$token = 'f7ef1f69334267686439fcdcf065496f';
			
			//$Logger->log( '[---DEBUGGING---] Ok, we are trying dosAction: ' . print_r( $args, 1 ) );
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				if( !$token )
				{
					$login = new stdClass();
					$login->Filename = 'Login.jsx';
					$login->Type = 'File';
					$login->MetaType = 'File'; // TODO: Is this really needed??
					$login->Permissions = 'r*e*r*e*';
					$login->DateModified = date('Y-m-d H:i:s');
					$login->DateCreated = $login->DateModified;
					$login->Filesize = 16;
					$login->Path = $login->Filename;
					
					$out[] = $login;
					
					return 'ok<!--separate-->' . json_encode( $out );
				}
				
				
				
				
				
				$obj = new stdClass();
				$obj->SessionID = $token;
				$obj->Encoding = 'json';
				
				$data = false; $subPath = false;
				
				// Can we get sub folder?
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					if( strstr( $subPath, 'Groups/' ) )
					{
						if( strstr( $subPath, '#?' ) )
						{
							$cid = explode( '#?', str_replace( 'Groups/', '', $subPath ) );
							$cid = explode( '/', $cid[1] );
							
							$obj->CategoryID = $cid[0];
							$obj->Folders = '*';
							
							$data = $this->proxyGet( $domain . 'components/library/', $obj );
						}
						else
						{
							$data = $this->proxyGet( $domain . 'components/groups/', $obj );
						}
						
					}
					else if( strstr( $subPath, 'Profile/' ) )
					{
						$obj->Folders = '*';
						
						$data = $this->proxyGet( $domain . 'components/library/', $obj );
					}
					
					// Failed to find a path
					if( !$data ) die( 'fail<!--separate-->Path error.' );
				}
				
				
				
				if( $data && ( is_array( $data ) || is_object( $data ) ) )
				{
					if( $data->response == 'ok' )
					{
						if( isset( $data->items->Groups ) && ( $groups = $data->items->Groups ) )
						{
							// List groups
							foreach( $groups as $row )
							{
								$o = new stdClass();
								$o->Filename = $row->Name;
								$o->Type = 'Directory';
								$o->MetaType = $row->Type; // TODO: Is this really needed??
								$o->ID = $row->ID;
								//$o->Permissions = $row->Permissions;
								//$o->DateModified = $row->DateModified;
								//$o->DateCreated = $row->DateCreated;
								//$o->Filesize = $row->Filesize;
								$o->Path = ( $subPath ? $subPath : '' ) . $o->Filename . '#?' . $o->ID . '/';
								
								$out[] = $o;
							}
							
							return 'ok<!--separate-->' . json_encode( $out );
						}
						else if( isset( $data->items->Folders ) )
						{
							if( $folders = $data->items->Folders )
							{
								$lapath = false; $found = false;
								
								if( $subPath )
								{
									$lapath = $subPath;
									
									if( substr( $lapath, -1, 1 ) == '/' )
									{
										$lapath = substr( $lapath, 0, -1 );
									}
									
									$lapath = explode( '/', $lapath );
									$lapath = end( $lapath );
									$lapath = explode( '#?', $lapath );
								}
								
								if( $lapath && isset( $lapath[1] ) )
								{
									// List images, files and folders
									foreach( $folders as $row )
									{
										if( $row->Name == $lapath[0] && $row->ID == $lapath[1] )
										{
											$found = $row;
										}
										
										if( isset( $row->Folders ) )
										{
											foreach( $row->Folders as $sub )
											{
												if( $sub->Name == $lapath[0] && $sub->ID == $lapath[1] )
												{
													$found = $sub;
												}
											}
										}
									}
									
									if( $found )
									{
										$folders = ( isset( $found->Folders ) ? $found->Folders : false );
									}
								}
								
								
								
								if( $folders )
								{
									foreach( $folders as $row )
									{
										$o = new stdClass();
										$o->Filename = $row->Name;
										$o->Type = 'Directory';
										$o->MetaType = $row->Type; // TODO: Is this really needed??
										$o->ID = $row->ID;
										//$o->Permissions = $row->Permissions;
										//$o->DateModified = $row->DateModified;
										//$o->DateCreated = $row->DateCreated;
										//$o->Filesize = $row->Filesize;
										$o->Path = ( $subPath ? $subPath : '' ) . $o->Filename . '#?' . $o->ID . '/';
										
										$out[] = $o;
									}
								}
								else if( $found && $subPath )
								{
									$data = false;
									
									$obj = new stdClass();
									$obj->SessionID = $token;
									$obj->Encoding = 'json';
									
									if( strstr( $subPath, '#?' ) )
									{
										$cid = explode( '#?', $subPath );
										$cid = explode( '/', $cid[1] );
										
										$obj->CategoryID = $cid[0];
										$obj->Folders = $lapath[1];
										$obj->Images = '*';
										$obj->Files = '*';
									}
									
									$data = $this->proxyGet( $domain . 'components/library/', $obj );
									
									if( $data && ( is_array( $data ) || is_object( $data ) ) )
									{
										if( $data->response == 'ok' )
										{
											if( isset( $data->items->Images ) || isset( $data->items->Files ) )
											{
												if( $images = $data->items->Images )
												{
													// List images, files and folders
													foreach( $images as $row )
													{
														$o = new stdClass();
														$o->Filename = $row->Filename;
														$o->Type = 'File';
														$o->MetaType = $row->Type; // TODO: Is this really needed??
														$o->ID = $row->ID;
														//$o->Permissions = $row->Permissions;
														//$o->DateModified = $row->DateModified;
														//$o->DateCreated = $row->DateCreated;
														$o->Filesize = $row->Filesize;
														$o->Path = ( $subPath ? $subPath : '' ) . '#?' . str_replace( $domain, '', $row->DiskPath );
														//$o->Shared = isset( $entry->Shared ) ? $entry->Shared : '';
														//$o->SharedLink = isset( $entry->SharedLink ) ? $entry->SharedLink : '';
														
														$out[] = $o;
													}
												}
												
												if( $files = $data->items->Files )
												{
													// List images, files and folders
													foreach( $files as $row )
													{
														$o = new stdClass();
														$o->Filename = $row->Filename;
														$o->Type = 'File';
														$o->MetaType = $row->Type; // TODO: Is this really needed??
														$o->ID = $row->ID;
														//$o->Permissions = $row->Permissions;
														//$o->DateModified = $row->DateModified;
														//$o->DateCreated = $row->DateCreated;
														$o->Filesize = $row->Filesize;
														$o->Path = ( $subPath ? $subPath : '' ) . '#?' . str_replace( $domain, '', $row->DiskPath );
														//$o->Shared = isset( $entry->Shared ) ? $entry->Shared : '';
														//$o->SharedLink = isset( $entry->SharedLink ) ? $entry->SharedLink : '';
														
														$out[] = $o;
													}
												}
											}
										}
									}
								}
							}
							
							return 'ok<!--separate-->' . ( $out ? json_encode( $out ) : '[]' );
						}
					}
				}
				else if( !$thePath || ( !strstr( $thePath, 'Groups' ) && !strstr( $thePath, 'Profile' ) ) )
				{
					$o = new stdClass();
					$o->Filename = 'Groups';
					$o->Type = 'Directory';
					$o->MetaType = $row->Type; // TODO: Is this really needed??
					$o->Path = 'Groups/';
					
					$out[] = $o;
					
					$o = new stdClass();
					$o->Filename = 'Profile';
					$o->Type = 'Directory';
					$o->MetaType = $row->Type; // TODO: Is this really needed??
					$o->Path = 'Profile/';
					
					$out[] = $o;
					
					return 'ok<!--separate-->' . ( $out ? json_encode( $out ) : '[]' );
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'read' )
			{
				$subPath = false; $data = '';
				
				
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				
				
				
				if( $thePath == ( $this->Name . ':Login.jsx' ) )
				{
					$jsx = 'devices/DOSDrivers/Treeroot/door.jsx';
					
					if( file_exists( $jsx ) ) 
					{
						$loginapp = file_get_contents( $jsx );		
						
						ob_clean();
						return 'ok<!--separate-->' . $loginapp;
						die();
					}
					else
					{
						return 'fail<!--separate-->Login app not found' . $jsx;
					}
				}
				else if( $thePath == ( $this->Name . ':login.html' ) )
				{
					$tmp = 'devices/DOSDrivers/Treeroot/login.html';
					
					if( file_exists( $tmp ) ) 
					{
						$html = file_get_contents( $tmp );		
						
						ob_clean();
						return 'ok<!--separate-->' . $html;
						die();
					}
					else
					{
						return 'fail<!--separate-->not found' . $tmp;
					}
				}
				else if( $thePath == ( $this->Name . ':login.js' ) )
				{
					$js = 'devices/DOSDrivers/Treeroot/login.js';
					
					if( file_exists( $js ) ) 
					{
						$scr = file_get_contents( $js );		
						
						ob_clean();
						return 'ok<!--separate-->' . $scr;
						die();
					}
					else
					{
						return 'fail<!--separate-->not found' . $js;
					}
				}
				
				
				
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					$lapath = $subPath;
					
					$lapath = explode( '#?', $lapath );
					$lapath = end( $lapath );
					
					if( $lapath && strstr( $lapath, 'secure-files/' ) )
					{
						$data = $this->proxyGet( $query = ( $domain . str_replace( $domain, '', $lapath ) ) );
					}
				}
				
				//die( $data . ' -- ' . $query );
				
				if( $data && ( $args->mode == 'rb' || $args->mode == 'rs' ) )
				{
					friendHeader( 'Content-Type: image/jpeg' );
					die( $data );
				}
				else if( $data )
				{
					// Return ok
					$okRet = 'ok<!--separate-->';
					
					return $okRet . $data;
				}
				return 'fail<!--separate-->Could not read file: ' . '' . '<!--separate-->';
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
				if( !$this->ID )
				{
					if( $d = $SqlDatabase->FetchObject( '
						SELECT * FROM `Filesystem` WHERE `UserID`=\'' . $User->ID . '\' AND LOWER(`Name`)=LOWER("' . reset( explode( ':', $args->path ) ) . '")
					' ) )
					{
						foreach( $d as $k=>$v )
						$this->$k = $v;
					}
				}
				if( $row = $SqlDatabase->FetchObject( '
					SELECT SUM(Filesize) AS FZ FROM FSFile 
					WHERE 
						FilesystemID = \'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\'
				' ) )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = $row->FZ;
					$o->Filesize = SQLDRIVE_FILE_LIMIT;
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}
				die( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					case 'mount':
						//$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						//$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
						// Other combos not supported yet
						return 'fail';
				}
			}
			
			die( 'what command?... ' . print_r( $args,1 ) );
		}
	}
}

// Create a door...
$door = new DoorTreeroot( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
