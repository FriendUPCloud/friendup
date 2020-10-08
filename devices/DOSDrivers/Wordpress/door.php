<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

if( !defined( 'DOOR_SLASH_REPLACEMENT' ) )
{
	// To fix names
	//define( 'DOOR_SLASH_REPLACEMENT', '&#47;' );
	define( 'DOOR_SLASH_REPLACEMENT', '&#124;' );
}

// Make it a little bit aggressive!
ini_set( 'max_execution_time', 300 ); // 5min 

if( !defined( 'WORDPRESS_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'WORDPRESS_FILE_LIMIT', 524288000 );
}

if( !class_exists( 'DoorWordpress' ) )
{
	class DoorWordpress extends Door
	{
		
		// OBS! Specially made for the Woocommerce plugin for Wordpress, doesn't work with the rest of Wordpress unless the code is changed
		
		var $api_path    = 'wp-json';
		var $api_type    = 'wc';
		var $api_version = 'v1';
		
		// Some private functions ----------------------------------------------
		private function fixPathName( $string )
		{
			$str = html_entity_decode( $string );
			$str = str_replace( '/', DOOR_SLASH_REPLACEMENT, $str );
			return $str;
		}
		
		
		// Some public functions
		function onConstruct()
		{
			global $args, $Logger;
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			
			//$Logger->log( $this->Password . ' --' . "\r\n" );
			
			if( !$this->ID || !$this->Server || !$this->Username || !$this->Password )
			{
				return false;
			}
			
			$this->Server = str_replace( array( '/index.php', 'index.php' ), '', trim( $this->Server ) ) . '/index.php';
		}
		
		/* --- Helper functions -------------------------------------------------------------------------------------------------------------------- */
		
		function CurlUrlExists ( $url, $param = false, $limit = false )
		{
			$agent = ( isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0' );
			//$agent = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
		
			// Only need the first 10 bytes
			//$headers = array( 'Range: bytes=0-10' );
			// Only need the first 6kb
			$headers = array( 'Range: bytes=0-60000' );
		
			$ok = false;
		
			if( !$url ) return false;
		
			$c = curl_init();
		
			curl_setopt( $c, CURLOPT_URL, $url );
			curl_setopt( $c, CURLOPT_FAILONERROR, 1 );
		
			if( $param )
			{
				curl_setopt( $c, CURLOPT_HTTPHEADER, $headers );
			}
			else
			{
				curl_setopt( $c, CURLOPT_NOBODY, 1 );
			}
		
			curl_setopt( $c, CURLOPT_RETURNTRANSFER, 1 );
			curl_setopt( $c, CURLOPT_USERAGENT, $agent );
		
			if( method_exists( $this, 'curl_exec_follow' ) )
			{
				$r = $this->curl_exec_follow( $c );
			}
			else
			{
				$r = curl_exec( $c );
			}
		
			$ok = curl_getinfo( $c );
		
			//die( $r . ' -- ' . $url . ' -- ' . print_r( $ok,1 ) );
		
			if( $r !== false && $ok && ( $ok['http_code'] == 200 || $ok['http_code'] == 301 || $ok['http_code'] == 206 ) )
			{
				// Check if parameters match
				if( $param && strstr( $param, '=>' ) )
				{
					$param = explode( '=>', trim( $param ) );
					if( !strstr( $ok[ trim( $param[0] ) ], trim( $param[1] ) ) )
					{
						$ok = false;
					}
					else if( $ok['content_type'] && strstr( $ok['content_type'], 'image' ) )
					{
						if( $im = @imagecreatefromstring( $r ) )
						{
							$ok['image_width'] = imagesx( $im );
							$ok['image_height'] = imagesy( $im );
							$ok['image_type'] = ''; /* (channels) */
							$ok['image_bits'] = ''; /* (bits) */
							$ok['image_mime'] = $ok['content_type'];
						
							if( $limit && strstr( $limit, 'x' ) )
							{
								$limit = explode( 'x', trim( $limit ) );
							
								if( $limit && ( $limit[0] > $ok['image_width'] || $limit[1] > $ok['image_height'] ) )
								{
									$ok = false;
								}
							}
						}
						else
						{
							$ok = false;
						}
					}
					/*if( $ok )
					{
						die( print_r( $ok,1 ) . ' -- ' );
					}*/
				}
			}
			else
			{
				$ok = false;
			}
			curl_close( $c );
			return $ok;
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
		
		// Send an arena server query
		private function query( $command, $args = false, $method = 'POST', $headers = false )
		{
			global $User, $SqlDatabase, $Logger;
			
			//
			
			if( substr( $command, 0, 4 ) == 'http' )
			{
				$url = $command;
			}
			else
			{
				$url = trim( $this->Server ) . '/' . $this->api_path . '/' . $this->api_type . '/' . $this->api_version . $command;
			}
			
			$base64 = base64_encode( trim( $this->Username ) . ':' . trim( $this->Password ) );
			
			$headers = ( $headers ? $headers : array( 'Content-Type: application/json' ) );
			
			$headers[] = ( 'Authorization: Basic ' . $base64 );
			
			
			$curl = curl_init();
			
			curl_setopt( $curl, CURLOPT_URL, $url );
			
			curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
			
			if( $method != 'POST' )
			{
				curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
			}
			
			if( $args )
			{
				curl_setopt( $curl, CURLOPT_POST, true );
				curl_setopt( $curl, CURLOPT_POSTFIELDS, ( is_object( $args ) || is_array( $args ) ? json_encode( $args ) : $args ) );
			}
			
			curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
			
			$output = curl_exec( $curl );
			
			$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
			
			curl_close( $curl );
			
			if( $output )
			{
				return $output;
			}
			
			return '';
		}
		
		// Get the actual data by path - depth = 2 to skip WooCommerce -> Products
		function getPathData( $path, $parent = 0, $log = false, $depth = 2 )
		{
			global $Logger;
			
			if( $path )
			{
				if( !is_array( $path ) && strstr( $path, ':' ) )
				{
					$parts = explode( ':', $path );
					
					if( isset( $parts[1] ) )
					{
						$path = $parts[1];
					}
				}
				
				// We got a path!
				if( $path )
				{
					// Make sure we have an array
					$parts = ( !is_array( $path ) && strstr( $path, '/' ) ? explode( '/', $path ) : $path );
					
					// Yes it is an array
					if( $parts && is_array( $parts ) )
					{
						$out = []; $test = []; $subs = [];
						
						// TODO: Find a way to search more pages if there is more, a 100 pages as max is a major limitation if there is folders with more then folders
						
						//$Logger->log( '!!! Depth is: ' . $depth . ' and part start = ' . $parts[ $depth ] );
						
						//$Logger->log( '[Wordpress: getPathData] Fetching path data for ' . $parent );
						//$Logger->log( '/products/categories?per_page=100&parent=' . $parent );
						
						$catjson = $this->query( '/products/categories?per_page=100&parent=' . $parent );
						
						if( $catobj = json_decode( $catjson ) )
						{
							foreach( $catobj as $obj )
							{	
								$test[] = '['.$obj->id.']'.$obj->slug.'|'.$obj->parent.'|'.$obj->name;
								
								$subs[] = $obj->name;
								
								$v = $parts[ $depth ];
							
								// Finding matching object
								if( trim( $v ) )
								{
									//$Logger->log( 'Matching ' .  str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', strtolower( html_entity_decode( urldecode( trim( $v ) ) ) ) ) . ' == ' . str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', strtolower( html_entity_decode( urldecode( trim( $obj->name ) ) ) ) ) );
									
									// TODO: Add support for the DOOR_SLASH_REPLACEMENT thing ...
									
									$matchParts = str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', strtolower( html_entity_decode( urldecode( trim( $v ) ) ) ) );
									$matchObject = str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', strtolower( html_entity_decode( urldecode( trim( $obj->name ) ) ) ) );
									if( $matchParts == $matchObject )
									{
										$o = new stdClass();
										$o->id = $obj->id;
										$o->name = $obj->name;
										$o->slug = $obj->slug;
										$o->parent = $obj->parent;
										$o->description = $obj->description;
										$o->display = $obj->display;
										$o->image = $obj->image;
										$o->menu_order = $obj->menu_order;
										$o->count = $obj->count;
									
										if( $obj->id > 0 && ( $sub = $this->getPathData( $parts, $obj->id, $log, $depth + 1 ) ) )
										{
											//$Logger->log( '[Wordpress: getPathData] Found ' . $parts[ $depth + 1 ] );
											if( $sub['subs'] )
											{
												$o->subs = json_encode( $sub['subs'] );
											}
										
											$out[] = $o;
										
											if( $sub['out'] )
											{
												$out = array_merge( $out, $sub['out'] );
											}
										}
										else
										{
											$out[] = $o;
										}
									}
								}
							}
						}
						
						if( !$parent )
						{
							if( $out )
							{
								return $out;
							}
						}
						else if( $subs || $out )
						{
							return array( 'subs' => $subs, 'out' => $out );
						}
					}
				}
			}
			
			return false;
		}
		
		/*
			Find a subpath by path string
			$path = path to product
			$log = enable logging
			$onlyfound = only look at this path
			$depth = too many recursions prevention
		*/
		function getSubPath( $path, $log = false, $onlyfound = false, $depth = 2 )
		{
			global $Logger;
			
			// TODO: See if this can be simplified
			
			//if( $log ) $Logger->log( "\r\n" . '------------------ [[[[[[[[[[ getSubPath: Start ]]]]]]]]]] ------------------' . "\r\n" );
			
			$isfile = false; $name = ''; $infoname = false;
			
			// Find unique id
			$sku = false;
			if( preg_match( '/\(\-([^-]*?)\-\)/i', $path, $matches ) )
			{
				$sku = $matches[1];
			}
			
			$parent = new stdClass();
			$parent->id = 0;
			
			if( $path )
			{
				if( $this->pathIsFile( $path ) )
				{
					$isfile = true;
				}
				
				if( substr( $path, -8, 8 ) == '.dirinfo' )
				{
					//$Logger->log( '[Wordpress: getSubPath] Found .dirinfo in ' . $path );
					$ipath = $path;
					
					if( $ipath = explode( '/', $ipath ) )
					{
						$infoname = end( $ipath );
					}
					
					$path = str_replace( '.dirinfo', '/', $path );
				}
				else if( substr( $path, -5, 5 ) == '.info' )
				{
					//$Logger->log( '[Wordpress: getSubPath] Found .info in ' . $path );
					$ipath = $path;
					
					if( $ipath = explode( '/', $ipath ) )
					{
						$infoname = end( $ipath );
					}
					
					$path = str_replace( '.info', '', $path );
				}
				
				$subpath = []; $subs = [];
				
				if( strstr( $path, ':' ) )
				{
					$parts = explode( ':', $path );
					
					if( isset( $parts[1] ) )
					{
						$path = $parts[1];
					}
				}
				
				//$Logger->log( '[Wordpress: getSubPath] Path now is: ' . $path );
				
				// If it is a subpath
				if( strstr( $path, '/' ) )
				{
					$parts = explode( '/', $path );
					
					if( $parts )
					{
						foreach( $parts as $v )
						{
							if( trim( $v ) )
							{
								$name = trim( $v );
								$subs[] = trim( $v );
							}
						}
						
						$cats = []; $test = []; $found = false;
						
						// Get the category objects
						
						//$slot = $Logger->addSlot( 'Getting category objects ' . $path );
						
						if( $catobj = $this->getPathData( $path, 0, $log ) )
						{
							//$slot->resolve( true, 'Got path data.' ); //, print_r( $catobj, 1 ) );
							//$Logger->log( 'CatOBJ: ' . json_encode( $catobj ) );
							
							foreach( $catobj as $obj )
							{
								$fixedObjName = strtolower( html_entity_decode( urldecode( $obj->name ) ) );
								$fixedName = strtolower( html_entity_decode( urldecode( $name ) ) );
								
								$test[] = '['.$obj->id.']'.$obj->slug.'|'.$obj->parent.'|'.$obj->name;
								$cats[$obj->id] = str_replace( ' ', '-', $fixedObjName );
								
								foreach( $parts as $k=>$v )
								{
									if( $v && is_string( $v ) )
									{
										$vname = strtolower( html_entity_decode( urldecode( trim( $v ) ) ) );
									}
									
									if( 
										$v && is_string( $v ) && 
										trim( $v ) && str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', $vname ) == str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', $fixedObjName ) 
									)
									{
										$obj->pathname = ( $infoname ? $infoname : $name );
										$obj->path = $path;
										
										if( str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', $fixedName ) == str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', $fixedObjName ) )
										{
											$obj->found = true;
											$found = true;
										}
										else
										{
											$obj->found = false;
										}
										
										$parts[$k] = $obj;
									}
								}
							}
						}
						
						if( !$onlyfound || $found )
						{
							foreach( $parts as $k=>$v )
							{
								if( is_object( $v ) )
								{
									if( $v->name )
									{
										$v->name = $this->fixPathName( $v->name );
									}
									$parent->name = $v->name;
									$parent->id = $v->id;
									$parent->image = $v->image;
									$subpath[] = $v;
								}
								else if( !is_object( $v ) && trim( $v ) )
								{
									$cat = new stdClass();
									$cat->name = str_replace( '.info', '', trim( $v ) );
									$cat->pathname = ( $infoname ? $infoname : $name );
									$cat->path = $path;
									
									$cat->parentname = ( isset( $parent->name ) ? $parent->name : '' );
									
									if( !isset( $subs[($k-1)] ) || !isset( $parent->name ) || str_replace( '.info', '', trim( $subs[($k-1)] ) ) == $parent->name )
									{
										$cat->parent = $parent->id;
										$cat->parentimage = $parent->image;
									}
									
									$subpath[] = $cat;
								}
							}
							
							
							if( $isfile )
							{
								// Return file with file info even if not found for creating new
								
								$file = new stdClass();
								$file->name = str_replace( '.info', '', $name );
								$file->pathname = $name;
								$file->path = $path;
								$file->parentname = ( isset( $parent->name ) ? $parent->name : '' );
								$file->parent = $parent->id;
								$file->parentimage = $parent->image;
								
								// TODO: Remove this or rewrite search doesn't work that well with the WP Api
								
								// Pure text search (no signs please! no html encode)
								if( $sku )
								{
									$surl = '/products?sku=' . $sku . '&category=' . $parent->id;
									//$Logger->log( 'Doing a sku search ' . $sku );
								}
								else
								{
									$test3 = explode( ' (-', $name );
									
									$surl = '/products?search=' . 
										urlencode( str_replace( '.info', '', str_replace( DOOR_SLASH_REPLACEMENT, '/', $test3[0] ) ) ) . 
										'&category=' . $parent->id;
								}
								
								//$Logger->log( '(Wordpress) Getting path: ' . $surl );
								$catjson = $this->query( $surl );
								
								// If it has a fucked up filename hard to find because wordpress messup how it's listed out do a last try matching in php ...
								
								if( !json_decode( $catjson ) && ( strstr( $name, '-' ) || strstr( $name, '/' ) || strstr( $name, DOOR_SLASH_REPLACEMENT ) ) )
								{
									$catjson = $this->query( '/products?per_page=100&category=' . $parent->id );
									
									//$Logger->log( 'Doing a /products?per_page=100&category=' . $parent->id );
								}
								
								//$Logger->log( '[[[[[[[[[[ catjson: ]]]]]]]]]] Url: ' . $surl . ' [] ' . json_encode( $catjson ) . "\r\n" );
								
								$matches = [];
								
								if( $catobj = json_decode( $catjson ) )
								{
									// Find with the correct name
									$foundcatobj = false;
									$test2 = str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', $name );
									foreach( $catobj as $c )
									{
										if( $sku )
										{
											//$Logger->log( 'Matching on sku: ' . $sku . ' == ' . $c->sku );
											
											$matches[] = ( $sku . ' == ' . $c->sku );
											
											if( $c->sku == $sku )
											{
												$foundcatobj = $c;
												break;
											}
										}
										else
										{
											$test = str_replace( array( DOOR_SLASH_REPLACEMENT, '/', ' ' ), '-', html_entity_decode( $c->name ) );
											
											//$Logger->log( substr( $test2, 0, strlen( $test ) ) . ' == ' . $test );
											
											$matches[] = ( substr( $test2, 0, strlen( $test ) ) . ' == ' . $test );
											
											if( $test && $test2 && substr( $test2, 0, strlen( $test ) ) == $test )
											{
												$foundcatobj = $c;
												break;
											}
										}
									}
									if( $foundcatobj )
									{
										$foundcatobj->pathname = $name;
										$foundcatobj->path = $path;
										$foundcatobj->parent = $parent->id;
										$foundcatobj->parentimage = $parent->image;
										
										//if( $log ) $Logger->log( '[[[[[[[[[[ File[1]: ]]]]]]]]]] Subpath' . ' (' . count($subpath) . '): ' . print_r( $subpath,1 ) . ' [] IsFile: ' . $isfile . ' [] File: ' . json_encode( $catobj[0] ) . ' [] Path: ' . $path . "\r\n" );
										
										
										//$Logger->log( '[Wordpress getSubPath: End with catobj ' . $foundcatobj->id );
										
										return $foundcatobj;
									}
									else
									{
										//$Logger->log( 'Didn\'t find any match for [' . $test2 . '] ' . json_encode( $matches )/* . json_encode( $catobj )*/ );
									}
								}
								
								//if( $log ) $Logger->log( '[[[[[[[[[[ File[2]: ]]]]]]]]]] Subpath' . ' (' . count($subpath) . '): ' . print_r( $subpath,1 ) . ' [] IsFile: ' . $isfile . ' [] File: ' . json_encode( $catobj[0] ) . ' [] Path: ' . $path . "\r\n" );
								
								//if( $log ) $Logger->log( "\r\n" . '------------------ [[[[[[[[[[ getSubPath: Slutt ]]]]]]]]]] ------------------' . "\r\n" );
								
								//$Logger->log( '[Wordpress getSubPath: End with ' . print_r( $file, 1 ) );
								
								return $file;
							}
						}
						
						//if( $log ) $Logger->log( '[[[[[[[[[[ Cats: ]]]]]]]]]] Subpath' . ' (' . count($subpath) . '): ' . print_r( $subpath,1 ) . ' [] IsFile: ' . $isfile . ' [] Path: ' . $path . "\r\n" );
					}
				}
				
				// We found a subpath - return it
				if( $subpath && isset( $subpath[count($subpath)-1] ) )
				{
					//if( $log ) $Logger->log( "\r\n" . '------------------ [[[[[[[[[[ getSubPath: Slutt ]]]]]]]]]] ------------------' . "\r\n" );
					
					//$Logger->log( '[Wordpress getSubPath: End with subpath ' . print_r( $subpath[count($subpath)-1], 1 ) );
					
					return $subpath[count($subpath)-1];
				}
			}
			
			//if( $log ) $Logger->log( "\r\n" . '------------------ [[[[[[[[[[ getSubPath: Slutt ]]]]]]]]]] ------------------' . "\r\n" );
			
			return '';
		}
		
		function pathIsDir( $path )
		{
			if( substr( $path, -8, 8 ) == '.dirinfo' )
			{
				$path = str_replace( '.dirinfo', '/', $path );
			}
			
			if( $path && substr( $path, -1, 1 ) == '/' )
			{
				return true;
			}
			
			return false;
		}
		
		function pathIsFile( $path )
		{
			if( substr( $path, -8, 8 ) == '.dirinfo' )
			{
				$path = str_replace( '.dirinfo', '/', $path );
			}
			
			if( $path && substr( $path, -1, 1 ) != '/' )
			{
				return true;
			}
			
			return false;
		}
		
		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger, $Filesystem;
			
			// TODO: put this into a function to fix path and command from args
			
			// Some standard check's
			$command = false;
			
			if( $args->command == 'dosaction' && isset( $args->args ) )
			{
				$command = $args->args->action;
			}
			else if( $args->command == 'dosaction' && isset( $args->action ) )
			{
				$command = $args->action;
			}
			else
			{
				$command = $args->command;
			}
			
			// TODO: This is a workaround, please fix in Friend Core!
			//       Too much code for getting a real working path..
			if( isset( $args->path ) )
			{
				$path = urldecode( $args->path );
			}
			else if( isset( $args->args ) )
			{
				if( isset( $args->args->path ) )
					$path = urldecode( $args->args->path );
			}
			if( isset( $path ) )
			{
				$path = str_replace( '::', ':', $path );
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$args->path = $path[1] . ':' . $path[2];
				}
				else
				{
					$args->path = implode( ':', $path );
				}
				
				$path = urldecode( $args->path );
				
				if( isset( $args->args ) && isset( $args->args->path ) )
				{
					unset( $args->args->path );
				}
			}
			
			//$Logger->log( '[[[[[[ WORDPRESS ARGS: ]]]]]] ' . print_r( $args,1 ) . ' [] path: ' . $path . "\r\n" );
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args ) && $args->args->action == 'dir' )
			)
			{
				//
				
				$out = [];
				
				if( strstr( $path, ':WooCommerce/' ) )
				{
					if( strstr( $path, '/Products/' ) )
					{
						$subpath = explode( '/Products/', $path );
						
						if( isset( $subpath[1] ) && trim( $subpath[1] ) )
						{
							// --- Level 3 ++: ------------------------------------------------------ //
							
							if( $this->pathIsDir( $path ) )
							{
								if( $cat = $this->getSubPath( $path, false, true ) )
								{
									if( is_object( $cat ) )
									{
										// TODO: Put this into a function
										
										// --- Folders ------------------------------------------ //
										
										$json = $this->query( '/products/categories?per_page=100&parent=' . $cat->id );
										
										if( $obj = json_decode( $json ) )
										{
											foreach( $obj as $o )
											{
												if( $o->name )
												{
													$tp = new stdClass();
													$tp->Filename = $this->fixPathName( $o->name );
													$tp->Type = 'Directory';
													$tp->MetaType = 'Directory'; // TODO: Is this really needed??
													$tp->ID = $o->id;
													$tp->DirectoryID = $o->parent;
													$tp->Permissions = '';
													$tp->DateModified = 0;
													$tp->DateCreated = 0;
													$tp->Filesize = 0;
													$tp->Path = ( $path . $tp->Filename . '/' );
													$tp->UniqueID = $o->slug;
													$tp->Shared = '';
													$tp->SharedLink = '';
													
													$out[] = $tp;
													
													$tp = new stdClass();
													$tp->Filename = $this->fixPathName( $o->name ) . '.dirinfo';
													$tp->Filesize = 16;
													$tp->Type = 'File';
													$tp->MetaType = 'DirectoryInformation';
													$tp->DateCreated = 0;
													$tp->DateModified = 0;
													$tp->ID = $o->id;
													$tp->Path = ( $path . $tp->Filename );
													$tp->UniqueID = $o->slug . '.dirinfo';
													$tp->Shared = '';
													$tp->SharedLink = '';
													
													$out[] = $tp;
												}
											}
										}
										
										// TODO: Put this into a function
										
										// --- Files -------------------------------------------- //
										
										// TODO: Fix this shit it doesn't give you more then 100 products per page .....
										
										$obj = [];
										
										foreach( array( 1,2,3,4,5 ) as $p )
										{
											$json = $this->query( '/products?per_page=100&page=' . $p . '&category=' . $cat->id );
											
											if( $dat = json_decode( $json ) )
											{
												$obj = array_merge( $obj, $dat );
											}
											else break;
										}
										
										if( $obj )
										{
											foreach( $obj as $o )
											{
												if( $o->name )
												{
													//if( strstr( $o->name, 'Neotec' ) ) 
													//{
													//	$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ /products?per_page=100&category=' . $cat->id . ' [JSON]: ' . print_r( $o,1 ) . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
													//}
													
													// If parent id doesn't match the categoryid skip it
													if( $o->categories && is_array( $o->categories ) )
													{
														$found = false;
														
														foreach( $o->categories as $cts )
														{
															if( isset( $cts->id ) && $cts->id == $cat->id )
															{
																$found = true;
															}
														}
														
														if( !$found )
														{
															continue;
														}
													}
													
													// Original state of the file
													$tp = new stdClass();
													$tp->Title = $this->fixPathName( $o->name ) . ' (-' . $o->sku . '-)';
													$tp->Filename = $tp->Title/* . '.jpg'*/;
													$tp->Filesize = '16';
													$tp->Type = 'File';
													$tp->MetaType = 'MetaFile';
													//$tp->MetaType = 'File';
													$tp->DateCreated = date( 'Y-m-d H:i:s', strtotime( $o->date_created ) );
													$tp->DateModified = date( 'Y-m-d H:i:s', strtotime( $o->date_modified ) );
													$tp->ID = $o->id;
													$tp->UniqueID = $o->sku;
													$tp->Path = ( $path . $tp->Filename );
													$tp->Shared = '';
													$tp->SharedLink = '';
													
													$out[] = $tp;
													
													$tp = new stdClass();
													$tp->Title = $this->fixPathName( $o->name ) . ' (-' . $o->sku . '-)' . '.info';
													$tp->Filename = $tp->Title;
													$tp->Filesize = '16';
													$tp->Type = 'File';
													$tp->MetaType = 'Information';
													$tp->DateCreated = date( 'Y-m-d H:i:s', strtotime( $o->date_created ) );
													$tp->DateModified = date( 'Y-m-d H:i:s', strtotime( $o->date_modified ) );
													$tp->ID = $o->id;
													$tp->UniqueID = $o->sku . '.info';
													$tp->Path = ( $path . $tp->Filename );
													$tp->Shared = '';
													$tp->SharedLink = '';
													
													$out[] = $tp;
												}
											}
										}
									}
								}
							}
						}
						else
						{
							// --- Level 2: ------------------------------------------------------ //
							
							// TODO: Put this into a function
							
							$json = $this->query( '/products/categories?parent=0&per_page=100' );
							
							if( $obj = json_decode( $json ) )
							{
								foreach( $obj as $o )
								{
									if( $o->name )
									{
										$tp = new stdClass();
										$tp->Filename = $this->fixPathName( $o->name );
										$tp->Type = 'Directory';
										$tp->MetaType = 'Directory'; // TODO: Is this really needed??
										$tp->ID = $o->id;
										$tp->DirectoryID = $o->parent;
										$tp->Permissions = '';
										$tp->DateModified = 0;
										$tp->DateCreated = 0;
										$tp->Filesize = 0;
										$tp->UniqueID = $o->slug;
										$tp->Path = ( $path . $tp->Filename . '/' );
										$tp->Shared = '';
										$tp->SharedLink = '';
										
										$out[] = $tp;
										
										$tp = new stdClass();
										$tp->Filename = $this->fixPathName( $o->name ) . '.dirinfo';
										$tp->Filesize = 16;
										$tp->Type = 'File';
										$tp->MetaType = 'DirectoryInformation';
										$tp->DateCreated = date( 'Y-m-d H:i:s' );
										$tp->DateModified = $tp->DateCreated;
										$tp->ID = $o->id;
										$tp->UniqueID = $o->slug . '.dirinfo';
										$tp->Path = ( $path . $tp->Filename );
										$tp->Shared = '';
										$tp->SharedLink = '';
										
										$out[] = $tp;
									}
								}
							}
						}
					}
					else
					{
						// --- Level 1: ------------------------------------------------------ //
						
						$tp = new stdClass();
						$tp->Filename = 'Products';
						$tp->Type = 'Directory';
						$tp->MetaType = 'Directory'; // TODO: Is this really needed??
						$tp->ID = 0;
						$tp->DirectoryID = 0;
						$tp->Permissions = '';
						$tp->DateModified = 0;
						$tp->DateCreated = 0;
						$tp->Filesize = 0;
						$tp->Path = $path . $tp->Filename . '/';
						$tp->Shared = '';
						$tp->SharedLink = '';
						
						$out[] = $tp;
					}
					
				}
				else if( strstr( $path, ':Pages/' ) )
				{
					//die( 'alibaba ....' );
					$json = $this->query( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/pages?per_page=100', false, 'GET' );
					//die( $json . ' [GET] ' . trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/pages?per_page=100' );
					if( $json && ( $obj = json_decode( trim( $json ) ) ) )
					{	
						foreach( $obj as $o )
						{
							if( $o->title && isset( $o->title->rendered ) )
							{
								// Original state of the file
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->title->rendered );
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'MetaFile';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
								
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->title->rendered ) . '.info';
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'Information';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
							}
						}
					}
					
				}
				else if( strstr( $path, ':Media/' ) )
				{
					
					$json = $this->query( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/media?per_page=100', false, 'GET' );
					
					//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ Media: ' . $json . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
					
					if( $json && ( $obj = json_decode( trim( $json ) ) ) )
					{
						$files = []; $paths = [];
						//die( $json );
						foreach( $obj as $o )
						{
							if( $o->media_details && isset( $o->media_details->file ) )
							{
								// Original state of the file
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->media_details->file );
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'MetaFile';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$paths[]        = $tp->Path;
								$files[$tp->ID] = $tp->ID;
								
								$out[] = $tp;
								
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->media_details->file ) . '.info';
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'Information';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
							}
						}
						
						// Get shared files
						
						if( $out && $paths )
						{
							if( $shared = $SqlDatabase->FetchObjects( $q = '
								SELECT Path, UserID, ID, `Name`, `Hash` FROM FFileShared s
								WHERE
									s.DstUserSID = "Public" AND s.Path IN ( "' . implode( '", "', $paths ) . '" ) AND
									s.UserID IN ( ' . $User->ID . ' )
							' ) )
							{
								foreach( $out as $k=>$entry )
								{
									foreach( $shared as $sh )
									{
										if( isset( $entry->Path ) && isset( $sh->Path ) && $entry->Path == $sh->Path )
										{
											$out[$k]->Shared = 'Public';
											
											$link  = ( $Config->SSLEnable == 1 ? 'https' : 'http' ) . '://';
											$link .= $Config->FCHost . ':' . $Config->FCPort . '/sharedfile/' . $sh->Hash . '/' . $sh->Name;
											$out[$k]->SharedLink = $link;
										}
									}
								}
							}
							
							//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ Media: ' . $q . ' [] ' . print_r( $shared,1 ) . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
						}
					}
					
				}
				else if( strstr( $path, ':Posts/' ) )
				{
					$subcat = false;
					
					$subpath = explode( ':Posts/', $path );
					
					$json = $this->query( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/categories?per_page=100', false, 'GET' );
					
					//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ Posts: ' . $json . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
					
					if( $json && ( $obj = json_decode( trim( $json ) ) ) )
					{
						foreach( $obj as $o )
						{
							if( $o->name )
							{
								$tp = new stdClass();
								$tp->Filename = $this->fixPathName( $o->name );
								$tp->Type = 'Directory';
								$tp->MetaType = 'Directory'; // TODO: Is this really needed??
								$tp->ID = $o->id;
								$tp->DirectoryID = $o->parent;
								$tp->Permissions = '';
								$tp->DateModified = 0;
								$tp->DateCreated = 0;
								$tp->Filesize = 0;
								$tp->Path = ( $path . $tp->Filename . '/' );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
								
								if( isset( $subpath[1] ) && trim( $subpath[1] ) && strstr( strtolower( $tp->Filename . '/' ), strtolower( trim( $subpath[1] ) ) ) )
								{
									$subcat = $tp;
								}
								
								$tp = new stdClass();
								$tp->Filename = $this->fixPathName( $o->name ) . '.dirinfo';
								$tp->Filesize = 16;
								$tp->Type = 'File';
								$tp->MetaType = 'DirectoryInformation';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
							}
							
							/*if( $o->title && isset( $o->title->rendered ) )
							{
								// Original state of the file
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->title->rendered );
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'MetaFile';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
								
								$tp = new stdClass();
								$tp->Title = $this->fixPathName( $o->title->rendered ) . '.info';
								$tp->Filename = $tp->Title;
								$tp->Filesize = '16';
								$tp->Type = 'File';
								$tp->MetaType = 'Information';
								$tp->DateCreated = date( 'Y-m-d H:i:s' );
								$tp->DateModified = $tp->DateCreated;
								$tp->ID = $o->id;
								$tp->Path = ( $path . $tp->Filename );
								$tp->Shared = '';
								$tp->SharedLink = '';
								
								$out[] = $tp;
							}*/
						}
					}
					
					if( isset( $subpath[1] ) && trim( $subpath[1] ) )
					{
						$out = [];
						
						// Posts listed here based on parent
						
						if( $subcat && isset( $subcat->ID ) )
						{
							$json = $this->query( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/posts?per_page=100&categories=' . $subcat->ID, false, 'GET' );
							
							if( $json && ( $obj = json_decode( trim( $json ) ) ) )
							{	
								foreach( $obj as $o )
								{
									if( $o->title && isset( $o->title->rendered ) )
									{
										// Original state of the file
										$tp = new stdClass();
										$tp->Title = $this->fixPathName( $o->title->rendered );
										$tp->Filename = $tp->Title;
										$tp->Filesize = '16';
										$tp->Type = 'File';
										$tp->MetaType = 'MetaFile';
										$tp->DateCreated = date( 'Y-m-d H:i:s' );
										$tp->DateModified = $tp->DateCreated;
										$tp->ID = $o->id;
										$tp->Path = ( $path . $tp->Filename );
										$tp->Shared = '';
										$tp->SharedLink = '';
										
										$out[] = $tp;
										
										$tp = new stdClass();
										$tp->Title = $this->fixPathName( $o->title->rendered ) . '.info';
										$tp->Filename = $tp->Title;
										$tp->Filesize = '16';
										$tp->Type = 'File';
										$tp->MetaType = 'Information';
										$tp->DateCreated = date( 'Y-m-d H:i:s' );
										$tp->DateModified = $tp->DateCreated;
										$tp->ID = $o->id;
										$tp->Path = ( $path . $tp->Filename );
										$tp->Shared = '';
										$tp->SharedLink = '';
										
										$out[] = $tp;
									}
								}
							}
						}
					}
					
				}
				else if( $path && substr( $path, -1, 1 ) == ':' )
				{
					// --- Level 0: ------------------------------------------------------ //
					
					// TODO: Put this into the Plugin folder, there needs to be a strategy for how to handle all wordpress matters for this disk not just the woocommerce plugin
					
					$tp = new stdClass();
					$tp->Filename = 'WooCommerce';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Posts';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Media';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Pages';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					/*$tp = new stdClass();
					$tp->Filename = 'Languages';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Plugins';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Themes';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;
					
					$tp = new stdClass();
					$tp->Filename = 'Uploads';
					$tp->Type = 'Directory';
					$tp->MetaType = 'Directory'; // TODO: Is this really needed??
					$tp->ID = 0;
					$tp->DirectoryID = 0;
					$tp->Permissions = '';
					$tp->DateModified = 0;
					$tp->DateCreated = 0;
					$tp->Filesize = 0;
					$tp->Path = $tp->Filename . '/';
					$tp->Shared = '';
					$tp->SharedLink = '';
					
					$out[] = $tp;*/
				}
				
				return 'ok<!--separate-->' . json_encode( $out );
			}
			else if( $args->command == 'volumeinfo' )
			{
				//
				
				// TODO: Show real data ...
				
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
				$o = new stdClass();
				$o->Volume = $this->Name . ':';
				$o->Used = 0;
				$o->Filesize = 0;
				die( 'ok<!--separate-->' . json_encode( $o ) );
				
			}
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
					return 'ok<!--separate-->' . json_encode( $fldInfo );
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
					return 'ok<!--separate-->' . json_encode( $fldInfo );
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
						return 'ok<!--separate-->' . json_encode( $fldInfo );
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
						return 'ok<!--separate-->' . json_encode( $fldInfo );
					}
				}
				return 'fail<!--separate-->Could not find file!';
			}
			// Write a file
			else if( $args->command == 'write' )
			{	
				//
				
				if( isset( $path ) )
				{
					$log = true;
					
					//$Logger->log( 'Wordpress write: Evaluate path: ' . $path );
					
					// Get file object
					if( $file = $this->getSubPath( $path, $log ) )
					{
						//$Logger->log( 'We got a file objecT: ' . print_r( $file, 1 ) );
						
						$prodid = 0; $len = 0; $data = false;
						
						$data = $this->GetTmpFileData( $args );
						
						// TODO: Create file or folder? Putfile for storing file
						
						//$Logger->log( 'Wordpress write: Trying to write to: ' . print_r( $file, 1 ) );
						
						if( $dta = $this->HandleInfoFile( $path, $data ) )
						{
							// Special opcode - waiting for next file in pair
							if( $dta == -2 )
							{
								//$Logger->log( 'Waiting for next file in pair.' );
								return 'ok<!--separate-->{"message":"Waiting for next file in pair."}';
							}
							
							if( $dta->type == 'Directory' && $dta->info && $dta->data )
							{
								//$Logger->log( '[Wordpress Write] About to create a category!' );
								if( $data = $this->CreateCategoryWP( $file, $dta ) )
								{
									//$Logger->log( '[Wordpress Write] OK! We wrote ' . $file->pathname . ' ------------' );
									return 'ok';
								}
								else
								{
									//$Logger->log( '!! [Wordpress Write] Failed to write ' . $file->pathname );
								}
							}
							else if( $dta->info && $dta->data )
							{
								// If it's an .info file remove the .info
								$file->pathname = str_replace( '.info', '', $file->pathname );
								
								// Temporary static mapping
								
								/*$mapping = array(
									'ID' => 'sku',
									'Title' => 'name',
									'Description' => 'description',
									'Price' => 'regular_price',
									'Distributor' => false,
									'Url' => 'external_url',
									'Display' => 'status', 
									'Stock' => 'stock_quantity', 
									'Image' => 'images' 
								);*/
								
								$mapping = array(
									'ID'           => 'sku',
									'Title'        => 'name',
									'Type'         => 'type',
									'Price'        => 'regular_price',
									'Stock'        => 'stock_quantity',
									'Description'  => 'description',
									'Url'          => 'external_url',
									'Attributes'   => 'attributes', 
									'Data'         => 'variations',
									'DateModified' => 'datemodified',
									'DateCreated'  => 'datecreated',
									'Image'        => 'images' 
								);		
								
								$obj = new stdClass();
								
								//$obj->type = 'variable';
								
								$obj->tax_status = 'shipping';
								
								$pos = 0; $data = ''; $stock = 0;
								
								// Do the mapping
								foreach( $dta->info as $k=>$v )
								{
									if( isset( $mapping[$k] ) )
									{
										$data = substr( $dta->data, $pos, $v->Length );
										
										if( $k == 'Stock' && $data != '' )
										{
											$stock = $data;
											
											$obj->{'manage_stock'} = true;
											
											if( !$stock )
											{
												$obj->{'backorders'} = 'notify';
											}
											else
											{
												$obj->{'backorders'} = 'yes';
											}
											
											$obj->{$mapping[$k]} = $data;
										}
										/*else if( $k == 'Display' )
										{
											$obj->{$mapping[$k]} = ( $data ? 'publish' : 'draft' );
										}*/
										else if( $v->Encoding == 'base64' && $v->Name && $v->Type )
										{
											$name = explode( '.', $v->Name );
											
											$o = new stdClass();
											$o->Encoding = $v->Encoding;
											$o->Title = $name[0];
											$o->Name = $v->Name;
											$o->Type = $v->Type;
											$o->Data = $data;
											
											$obj->{$mapping[$k]} = $o;
										}
										else if( $k == 'Image' && $data != '' && ( strstr( $data, 'http' ) || strstr( substr( trim( $data ), 0, 2 ), '\\' ) ) )
										{
											if( $this->CurlUrlExists( trim( $data ), 'content_type=>image' ) )
											{
												$obj->{$mapping[$k]} = $data;
											}
										}
										else if( $v->Encoding == 'json' )
										{
											// TODO: Handle deeper array and objects here ...
											
											$data = json_decode( $data );
											
											$obj->{$mapping[$k]} = $data;
										}
										else if( $v->Encoding != 'UTF-8' )
										{
											$data = utf8_encode( $data );
											
											$obj->{$mapping[$k]} = $data;
										}
										else if( trim( $data ) )
										{
											$obj->{$mapping[$k]} = $data;
										}
									}
									
									$pos += $v->Length;
								}
								
								//if( isset( $obj->{'status'} ) )
								//{
								//	$obj->{'status'} = ( $obj->{'status'}/* && $stock > 0*/ ? 'publish' : 'draft' );
								//}
								
								// Fetch the existing object in WordPress
								//$Logger->log( 'Object to be written: ' . print_r( $obj, 1 ) );
								
								
								if( isset( $obj->sku ) && $obj->sku )
								{
									$catjson = $this->query( '/products?sku=' . urlencode( $obj->sku )/* . '&category=' . $file->parent*/ );
								}
								else
								{
									$catjson = $this->query( '/products?search=' . $file->pathname . '&category=' . $file->parent );
								}
								
								$catobj = json_decode( $catjson );
								
								//$Logger->log( 'File object: ' . print_r( $obj, 1 ) );
								//$Logger->log( 'Writing..' );
								
								$finalObject = $catobj[0];
								foreach( $catobj as $v )
								{
									if( $obj->sku && $v->sku == $obj->sku )
									{
										//$Logger->log( '> Wordpress object: ' . $v->name . ' ' . $v->sku );
										$finalObject = $v;
										break;
									}
								}
								
								if( $catobj && isset( $finalObject->id ) )
								{
									$prodid = $finalObject->id;
									
									// Ugly workaround method to update relative product variations because of limitation when updating, since it wouldn't use sku number to update ...
									
									if( isset( $finalObject->variations ) && is_array( $finalObject->variations ) && isset( $obj->variations ) && is_array( $obj->variations ) )
									{
										foreach( $finalObject->variations as $svar )
										{
											if( isset( $svar->id ) && $svar->id && $svar->sku )
											{
												foreach( $obj->variations as $nvar )
												{
													if( $svar->sku == $nvar->sku && !isset( $nvar->id ) )
													{
														$nvar->id = $svar->id;
													}
												}
											}
										}
									}
								}
								
								$obj->categories = json_decode( '[{"id": "'.$file->parent.'"}]' );
								
								// If image missing set parent image if defined ...

                                if( !$obj->images && $file->parentimage )
                                {
		                            if( isset( $file->parentimage->src ) )
		                            {
		                            	$obj->images = $file->parentimage->src;
		                            }
		                            else
		                            {
		                            	$obj->images = $file->parentimage;
		                            }
                                }
								
								//$Logger->log( '[[[[[[[[[[ Uploading ]]]]]]]]]] ' . print_r( $dta,1 ) . ' [] ' . print_r( $obj,1 ) );
								
								// TODO: temporary that it deletes and creates new images every prod update, perhaps work with ID here also instead of filename
								
								// Check if file is modified --->
								
								// Wordpress
								$WPDateModified = strtotime( $finalObject->date_modified );
								$WPDateCreated  = strtotime( $finalObject->date_created );
								
								$WPFilename = ( isset( $finalObject->images[0]->name ) ? $finalObject->images[0]->name : '' );
								
								// Object
								$QIDateModified = strtotime( $obj->datemodified );
								$QIDataCreated  = strtotime( $obj->datecreated );
								
								$QIFilename = ( isset( $obj->images->Title ) ? $obj->images->Title : '' );
								
								// Check if we have changed
								$changed = $QIDateCreated > $WPDateCreated || $QIFilename != substr( $WPFilename, 0, strlen( $QIFilename ) ) || 
								(
									$QIDateModified > $WPDateCreated || $QIDateModified > $WPDateModified
								);
								
								
								// Check if parent has changed or is missing ...
								if( isset( $file->parent ) && ( !isset( $finalObject->categories[0]->id ) || $finalObject->categories[0]->id != $file->parent ) )
								{
									$changed = true;
								}
								
								// Not changed
								if( !$changed )
								{
									$Logger->log( 'This product has not changed. ['.$path.'] '/* . json_encode( $finalObject ) . ' [] ' . json_encode( $obj )*/ );
									return 'ok<!--separate-->' . $len . '<!--separate-->';
								}
								
								// Wordpress do not want these
								unset( $obj->datemodified, $obj->datecreated );
								
								//$Logger->log( '[Wordpress Write] >> Product changed.' );
								
								// Delete old files
								if( isset( $finalObject->images[0]->id ) )
								{
									$this->DeleteWPFiles( $finalObject->images[0]->id );
								}
								
								// Upload new files
								if( $files = $this->UploadWPFiles( $obj->images ) )
								{
									$img = new stdClass();
									$img->id = $files->id;
									$img->position = 0;
									
									$obj->images = array( $img );
								}
								else if( isset( $obj->images ) && !isset( $obj->images->Data ) )
								{
									$img = new stdClass();
									$img->src = $obj->images;
									$img->position = 0;
									
									$obj->images = array( $img );
								}
								else if( isset( $obj->images ) )
								{
									unset( $obj->images );
								}
								
								
								//$slot = $Logger->addSlot( 'Writing object to Wordpress database. (' . $prodid . ')' );
								
								//$Logger->log( '[Wordpress write] Starting to create product for ' . $prodid );
								$json = $this->query( '/products' . ( $prodid ? ( '/' . $prodid ) : '' ), $obj );
								//$Logger->log( '[Wordpress write] Product for ' . $prodid . ' created. OK!' );
								
								//$Logger->log( '[[[[[[[[[[ Uploaded: ' . $json . ' [] Images: ' . ( isset( $files ) ? json_encode( $files ) : '' ) . ' [] ProductID: ' . $prodid . ' (' . $file->pathname . ') [] ParentID: ' . $file->pathname . ' Obj: ' . print_r( $obj,1 ) . ' [] Variations: ' . json_encode( $catobj[0]->variations ) . ' ]]]]]]]]]]' );
								
								if( $json )
								{
									$msg = json_decode( $json );
									
									if( isset( $msg->code ) && $msg->code )
									{
										//$slot->resolve( false, 'Failed: ' . json_encode( $msg ) );
										//$Logger->log( 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}' );
										return 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}';
									}
									else
									{
										//$slot->resolve( true, ( $json ? 'true' : 'false' ) . ' ' . $len );
										return 'ok<!--separate-->' . $len . '<!--separate-->'/* . print_r( json_decode( $json ), 1 )*/;
									}
								}
								else
								{
									//$slot->resolve( false, 'Did not get json back.' );
								}
								
								//$Logger->Log( 'Response: ' . $json );
								
							}
						}
					}
					else
					{
						//$Logger->Log( 'No file object for us..' );
					}
				}
				
				return'fail<!--separate-->'/* . print_r( $args,1 ) . ' -- ' . $path . ' -- ' . $json*/;
				
			}
			else if( $args->command == 'read' )
			{
				//
				
				if( isset( $path ) )
				{
					if( $this->pathIsDir( $path ) )
					{
						$infoMode = false;
						
						if( substr( $path, -8, 8 ) == '.dirinfo' )
						{
							$infoMode = true;
						}
						
						if( $cat = $this->getSubPath( $path ) )
						{
							$cid = ( strstr( $cat->slug, 'product_cat-' ) ? str_replace( 'product_cat-', '', $cat->slug ) : $cat->id );
							
							$imgdata = ''; $imgname = ''; $imgmime = '';
								
							// Add a meta information file
							
							if( isset( $cat->image->src ) )
							{
								if( strstr( $cat->image->src, '.' ) )
								{
									$imgname = end( explode( '/', $cat->image->src ) );
									$imgmime = ( 'image/' . end( explode( '.', $cat->image->src ) ) );
									$imgdata = file_get_contents( $cat->image->src );
									$imgdata = base64_encode( $imgdata );
								}
							}
							
							// TODO: Find support for created and modified dates on categories ??? FFS Wordpress / Woocommerce ...
							
							if( $infoMode )
							{
								// Add a meta information file
								$meta = array(
									'ID'    => array( 
										'Type'     => 'string', 
										'Length'   => strlen( utf8_encode( $cid ) ), 
										'Encoding' => 'UTF-8', 
										'Value'    => utf8_encode( $cid ) 
									),
									'Title' => array( 
										'Type'     => 'string', 
										'Length'   => strlen( utf8_encode( $cat->name ) ), 
										'Encoding' => 'UTF-8' 
									),
									'Image' => array( 
										'Type'     => $imgmime, 
										'Length'   => strlen( $imgdata ), 
										'Encoding' => 'base64', 
										'Name'     => $imgname 
									)
								);
								
								return json_encode( $meta );
							}
							
							if( $args->mode == 'rs' )
							{
								die( $imgdata ? base64_decode( $imgdata ) : '' );
							}
							else if( $args->mode == 'r' )
								print( 'ok<!--separate-->' );
							die(
								utf8_encode( $cid ) . 
								utf8_encode( $cat->name ) . 
								$imgdata
							);
						}
					}
					else if( $this->pathIsFile( $path ) )
					{
						$infoMode = false;
						
						if( $file = $this->getSubPath( $path, true ) )
						{
							if( substr( $path, -5, 5 ) == '.info' )
						{
							$infoMode = true;
						}
							
							if( $file->id )
							{
								$imgdata = ''; $imgname = ''; $imgmime = '';
								
								// Add a meta information file
								
								if( isset( $file->images[0]->src ) )
								{
									if( strstr( $file->images[0]->src, '.' ) )
									{
										$imgname = end( explode( '/', $file->images[0]->src ) );
										$imgmime = ( 'image/' . end( explode( '.', $file->images[0]->src ) ) );
										$imgdata = file_get_contents( $file->images[0]->src );
										$imgdata = base64_encode( $imgdata );
									}
								}
								
								if( $infoMode )
								{
									// Add a meta information file
									$meta = array(
										'ID'           => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->sku ) ), 
											'Encoding' => 'UTF-8', 
											'Value'    => utf8_encode( $file->sku ) 
										),
										'Title'        => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->name ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Type'         => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->type ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Price'        => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->regular_price ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Stock'        => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->stock_quantity ? (string)$file->stock_quantity : '0' ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Description'  => array( 
											'Type'     => 'text',   
											'Length'   => strlen( utf8_encode( $file->description ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Url'          => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->external_url ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Attributes'   => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->attributes ? json_encode( $file->attributes ) : '' ) ), 
											'Encoding' => 'json' 
										),
										'Data'         => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->variations ? json_encode( $file->variations ) : '' ) ), 
											'Encoding' => 'json' 
										),
										'DateModified' => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->date_modified ) ), 
											'Encoding' => 'UTF-8' 
										),
										'DateCreated'  => array( 
											'Type'     => 'string', 
											'Length'   => strlen( utf8_encode( $file->date_created ) ), 
											'Encoding' => 'UTF-8' 
										),
										'Image'        => array( 
											'Type'     => $imgmime, 
											'Length'   => strlen( $imgdata ), 
											'Encoding' => 'base64', 
											'Name'     => $imgname 
										)
									);
									
									return json_encode( $meta );
								}
								
								
								if( $args->mode == 'rs' )
								{
									die( $imgdata ? base64_decode( $imgdata ) : '' );
								}
								else if( $args->mode == 'r' )
									print( 'ok<!--separate-->' );
								die(
									utf8_encode( $file->sku ) . 
									utf8_encode( $file->name ) . 
									utf8_encode( $file->type ) . 
									utf8_encode( $file->regular_price ) . 
									utf8_encode( $file->stock_quantity ? (string)$file->stock_quantity : '0' ) . 
									utf8_encode( $file->description ) . 
									utf8_encode( $file->external_url ) . 
									utf8_encode( $file->attributes ? json_encode( $file->attributes ) : '' ) . 
									utf8_encode( $file->variations ? json_encode( $file->variations ) : '' ) . 
									utf8_encode( $file->date_modified ) . 
									utf8_encode( $file->date_created ) . 
									$imgdata 
								);
							}
						}
					}
				}
				
				return 'fail<!--separate-->Could not read file: ' . $path . '<!--separate-->'/* . print_r( $args, 1 )*/;
			}
			else if( $args->command == 'infoget' )
			{
				$d = new Door();
				// TODO: Make sure to stream through the file!
				// TODO: Make sure it works on .dirinfo as well
				if( $data = $d->getFile( $args->path . '.info' ) )
				{
					if( $json = json_decode( $data->_content ) )
					{
						if( $raw = $d->getFile( $args->path ) )
						{
							$pos = 0;
							foreach( $json as $k=>$v )
							{
								if( $k == $args->key )
								{
									$data = substr( $raw->_content, $pos, $v->Length );
									if( $v->Encoding != 'UTF-8' )
									{
										$data = utf8_encode( $data );
									}
									return 'ok<!--separate-->' . $data;
								}
								$pos += $v->Length;
							}
							return 'fail<!--separate-->{"response":"Failed to find key in file.","file":"' . $args->path . '","key":"' . $args->key . '"}';
						}
						else
						{
							return 'fail<!--separate-->{"response":"Failed to find file.", "file":"' . $args->path . '"}';
						}
					}
					else
					{
						return 'fail<!--separate-->{"response":"Could not read JSON data.", "file":"' . $args->path . '"}';
					}
				}
				else
				{
					return 'fail<!--separate-->{"response":"Failed to find file.", "file":"' . $args->path . '.info' . '"}';
				}
			}
			// These are highlevel commands! That's why they are called
			// dos actions!
			// TODO: Clean up variable maymen! args->args MUST GO
			else
			{
				//
				
				switch( $command )
				{
					case 'mount':
						//$Logger->log( 'Mounting not needed here.. Always succeed.' );
						
						// TODO: Find out why I only need this database query for mounting??? And not for any other doscommand ...
						
						if( $q = $this->getQuery( $args ) )
						{
							if( $d = $SqlDatabase->FetchObject( $q ) )
							{
								foreach( $d as $k=>$v )
								{
									$this->$k = $v;
								}
							}
						}
						
						$this->Server = str_replace( array( '/index.php', 'index.php' ), '', trim( $this->Server ) ) . '/index.php';
						
						if( $json = $this->query( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2/pages' ) )
						{
							return 'ok';
						}
						
						return 'fail';
					case 'unmount':
						//$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						return 'ok';
					case 'rename':
						
						//
						
						if( isset( $path ) && $args->newname )
						{
							if( $this->pathIsDir( $path ) )
							{
								if( $cat = $this->getSubPath( $path ) )
								{
									if( $cat->id )
									{
										$obj = new stdClass();
										
										$obj->name = $args->newname;
										
										$json = $this->query( '/products/categories/' . $cat->id, $obj, 'PUT' );
										
										if( $json )
										{
											return 'ok<!--separate-->'/* . print_r( json_decode( $json ), 1 )*/;
										}
									}
								}
							}
							else if( $this->pathIsFile( $path ) )
							{
								if( $file = $this->getSubPath( $path ) )
								{
									if( $file->id )
									{
										$obj = new stdClass();
										
										$obj->name = $args->newname;
										
										$json = $this->query( '/products/' . $file->id, $obj, 'PUT' );
										
										if( $json )
										{
											return 'ok<!--separate-->'/* . print_r( json_decode( $json ), 1 )*/;
										}
									}
								}
							}
						}
						
						return 'fail<!--separate-->Could not find file!';
						
					case 'makedir':
						
						//$Logger->log( 'Trying path: ' . $path );
						
						if( isset( $path ) )
						{
							if( !$this->pathIsDir( $path ) )
							{
								$path = ( $path . '/' );
							}
							
							//$Logger->log( 'We got the correct path: ' . $path );
							
							if( $cat = $this->getSubPath( $path ) )
							{
								//$data = $this->GetTmpFileData( $args );
								$compatiblePName = $cat->pathname . ( substr( $cat->path, -1, 1 ) == '/' ? '/' : '' );
								$dta = $this->HandleInfoFile( $compatiblePName, '-----Directory-----'/* . $data*/ );
								
								if( $dta == -2 )
								{
									//$Logger->log( '!! - [Wordpress Makedir] Waiting for full info.' );
									return 'ok<!--separate-->{"message":"Waiting for complete .info"}';
								}
								
								//$Logger->log( 'HandleInfoFile: ' . print_r( $dta, 1 ) );
								
								// INFO: Currently because of having to deal 
								// with an .info file system to create either
								// a file or a folder we have to atm reject
								// creation without the .info file until a
								// better solution is made possible.
								
								//$Logger->log( 'makedir: data: ' . json_encode( $cat ) . ' [] ' . json_encode( $dta ) );
								
								if( $dta && ( $data = $this->CreateCategoryWP( $cat, $dta ) ) )
								{
									//$Logger->log( '[Wordpress Makedir] Creating dir with ' . $cat->path . ' -------------' ); //. print_r( $dta, 1 ) );
									return 'ok<!--separate-->'/* . print_r( json_decode( $data ), 1 )*/;
								}
								else if( isset( $cat->id ) && $cat->id > 0 )
								{
									//$Logger->log( '@@ [Wordpress Makedir] makedir directory already exists ' . $cat->path . '.' );
									return 'ok<!--separate-->{"message":"Directory already exists."}';
								}
								else
								{
									//$Logger->log( '!! [Wordpress Makedir] Makedir ' . $cat->path . ' no id.' ); //. print_r( $cat, 1 ) );
								}
								
								// Temporary because of the .info regime so we don't get the failed notification
							}
							else
							{
								//$Logger->log( 'Wordpress MAKEDIR: Could not find directory ' . $path );
							}
						}
						else
						{
							//$Logger->log( 'Wordpress MAKEDIR: Could not find path' );
						}
						
						return 'fail<!--separate-->'/* . print_r( $args,1 ) . ' -- ' . $path*/;
						
					case 'delete':
						
						//$slot = $Logger->addSlot( '(Wordpress) We are asked to delete: ' . $path );
						
						if( isset( $path ) )
						{
							if( $this->pathIsDir( $path ) )
							{
								if( $this->_deleteFolder( $path ) )
								{
									//$slot->resolve( true, 'Deleted folder successfully' );
									return 'ok';
								}
								else
								{
									//$slot->resolve( false, 'Could not delete folder' );
									return 'fail';
								}
							}
							else if( $this->pathIsFile( $path ) )
							{
								if( $this->_deleteFile( $path ) )
								{
									//$slot->resolve( true, 'Deleted file successfully' );
									return 'ok';
								}
								else
								{
									//$slot->resolve( false, '_deleteFile didn\'t return true' );
									return 'fail';
								}
							}
						}
						
						//$slot->resolve( false, 'Could not delete file.' );
						
						// Other combos not supported yet
						return 'fail';
				}
			}
			return 'fail';
		}
		
		
		
		// TODO: Look through the functions and remove the ones not used
		
		private function UploadWPFiles( $files = false )
		{
			global $Logger;
			
			$server = ( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2' );
			
			if( $files && is_object( $files ) && isset( $files->Data ) )
			{
				
				$headers = array(
					'Content-Type: ' . $files->Type,
					'Content-Disposition: attachment; filename=' . $files->Name
				);
				
				$json = $this->query( $server . '/media', base64_decode( $files->Data ), 'POST', $headers );
				
				//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ UploadFiles: ' . $json . ' [] Data: ' . ( $files->Data ? 'True' : 'False' ) . ' [] Headers: ' . json_encode( $headers ) . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
				
				if( $json && ( $filobj = json_decode( trim( $json ) ) ) )
				{
					return $filobj;
				}
			}
			
			return false;
		}
		
		private function GetWPFiles( $ids = false )
		{
			global $Logger;
			
			$server = ( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2' );
			
			$json = $this->query( $server . '/media' . ( $ids ? ( '/' . $ids ) : '' ), false, 'GET' );
			
			//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ ListFiles: ' . $json . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
			
			if( $json && $filobj = json_decode( trim( $json ) ) )
			{
				return $filobj;
			}
			
			return false;
		}
		
		private function UpdateWPFiles( $ids, $data )
		{
			global $Logger;
			
			$server = ( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2' );
			
			if( $ids && $data )
			{
				$json = $this->query( $server . '/media/' . $ids, $data, 'POST' );
				
				//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ UpdatedFiles: ' . $json . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
				
				if( $json && $filobj = json_decode( trim( $json ) ) )
				{
					return $filobj;
				}
			}
			
			return false;
		}
		
		private function DeleteWPFiles( $ids )
		{
			global $Logger;
			
			$server = ( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2' );
			
			if( $ids )
			{
				$json = $this->query( $server . '/media/' . $ids . '?force=true', false, 'DELETE' );
				
				//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ DeletedFiles: ' . $json . ' [] ' . $server . '/media/' . $ids . '?force=true ]]]]]]]]]]]]]]]]]]]]]]]' );
				
				if( $json && $filobj = json_decode( trim( $json ) ) )
				{
					return $filobj;
				}
			}
			
			return false;
		}
		
		
		
		private function GetTmpFileData( $args )
		{
			global $Logger;
			
			if( $args )
			{
				$data = false;
				
				if( isset( $args->tmpfile ) )
				{
					if( file_exists( $args->tmpfile ) )
					{
						$len = filesize( $args->tmpfile );
						
						// TODO: UGLY WORKAROUND, FIX IT!
						//       We need to support base64 streams
						if( $fr = fopen( $args->tmpfile, 'r' ) )
						{									
							$string = fread( $fr, 32 );
							fclose( $fr );
							if( substr( urldecode( $string ), 0, strlen( '<!--BASE64-->' ) ) == '<!--BASE64-->' )
							{
								$fr = file_get_contents( $args->tmpfile );
								$fr = base64_decode( end( explode( '<!--BASE64-->', urldecode( $fr ) ) ) );
								$data = $fr;
							}
							else
							{
								$fr = file_get_contents( $args->tmpfile );
								$data = $fr;
							}
						}
						
					}
					else
					{
						//$Logger->log( 'Write: Tempfile does not exist.' );
						return 'fail<!--separate-->Tempfile does not exist!';
					}
				}
				else
				{
					if( $total + strlen( $args->data ) < WORDPRESS_FILE_LIMIT )
					{
						$data = $args->data;
					}
					else
					{
						//$Logger->log( 'Write: Limit broken' );
						return 'fail<!--separate-->Limit broken';
					}
				}
				
				if( $data )
				{
					return $data;
				}
			}
			
			return false;
		}
		
		// Handle .info and .dirinfo files for meta information
		private function HandleInfoFile( $name, $data = '', $log = false )
		{
			global $User, $Logger;
			
			if( strstr( $name, ':' ) )
			{
				$name = explode( ':', $name );
				$name = $name[1];
			}
			if( substr( $name, -1, 1 ) != '/' )
			{
				$name = explode( '/', $name );
				$name = $name[ count( $name ) - 1 ];
			}
			else
			{
				$name = explode( '/', $name );
				$name = $name[ count( $name ) - 2 ] . '/';
			}
			
			//$Logger->log( 'Handling filename: ' . $name );
			
			if( $name && $User->ID > 0 )
			{
				// Check if tmpid folder exist if not create it
				
				// Check if it's a directory
				$extension = '';
				if( substr( $name, strlen( $name ) - 8, 8 ) == '.dirinfo' )
				{
					//$Logger->log( 'We got a .dirinfo file ' . $name );
					$extension = '.dirinfo';
				}
				else if( substr( $name, strlen( $name ) - 5, 5 ) == '.info' )
				{
					//$Logger->log( 'We got a .info file ' . $name );
					$extension = '.info';
				}
				$directoryMode = false;
				if( substr( $name, -1, 1 ) == '/' )
				{
					$directoryMode = true;
					//$Logger->log( 'Operating in dirinfo mode ' . $name );
				}
				
				//$Logger->log( 'HandleInfoFile: Here we go: ' . $extension . ' ' . $name );
				
				if( !file_exists( '/tmp/friend_wpdd/' . $User->ID ) )
				{
					@mkdir( '/tmp/friend_wpdd/' . $User->ID, 0777, true );
					@chmod( '/tmp/friend_wpdd/' . $User->ID, 0777 );
				}
				
				// Prepare name without trailing slash and .info and .dirinfo - then add proper extension if any
				$urlf = urlencode( str_replace( array( $extension, '/' ), array( '', '' ), $name ) ) . $extension;
				
				// TODO: Create a difference between files and folders ...
				
				$theFilename = '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf;
				
				//$Logger->log( 'Wordpress: Trying to write temp file: ' . $theFilename );
				
				// Write new file
				$fp = @fopen( $theFilename, 'wb' );
				if( $fp )
				{
					$written = fwrite( $fp, $data );
					fclose( $fp );
					//$Logger->log( 'Wordpress: Temp file written bytes: ' . $written );
				}
				
				// If both exists continue
				// Add extension anew if we're not in .info mode here
				if( $directoryMode )
				{
					$extension = '.dirinfo';
				}
				// Already a .info file - strip it from urlf
				else if( $extension == '.info' )
				{
					$urlf = substr( $urlf, 0, strlen( $urlf ) - 5 );
				}
				else
				{
					$extension = '.info';
				}
				
				//$Logger->log( 'Checking for both files:' );
				//$Logger->log( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf );
				//$Logger->log( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf . $extension );
				
				if( 
					file_exists( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf ) && 
					file_exists( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf . $extension ) 
				)
				{
					$inf = file_get_contents( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf . $extension );
					$dta = file_get_contents( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf );
					
					@unlink( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf . $extension );
					@unlink( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf );
					
					//$Logger->log( 'Wordpress: Cleaning up.' );
					
					$ind = explode( '<!--separate-->', $inf );
					
					$info = json_decode( trim( $ind[0] ) );
					
					if( isset( $ind[1] ) )
					{
						$dat = $ind[1];
					}
					
					// Have no metadata? Return false
					if( !$info )
					{
						//$Logger->log( 'Write: [1] not supported json format [] info: ' . $inf . ' [] data: ' . $dta . ' [] name: ' . $name . "\r\n" );
						
						return false;
					}
					
					// Return an object with the data and metadata
					$obj = new stdClass();
					$obj->type = ( $dta && strstr( $dta, '-----Directory-----' ) ? 'Directory' : 'File' );
					$obj->info = $info;
					$obj->data = ( isset( $dat ) ? $dat : $dta );
					
					//$Logger->log( $name . ' - We are using this info content: ' . $inf );
					
					//$Logger->log( 'Create: File or Folder? ' . json_encode( $obj,1 )  . "\r\n" );
					
					return $obj;
				}
				else
				{
					// One exists, waiting for the next file in pair
					if( 
						file_exists( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf ) ||
						file_exists( '/tmp/friend_wpdd/' . $User->ID . '/' . $urlf . $extension ) 
					)
					{
						return -2;
					}
					//if( $log ) $Logger->log( 'Write: couldn\'t find files: ' . ( '/tmp/friend_wpdd/' . $User->ID . '/' . urlencode( str_replace( array( '/.info', '.info', '/' ), array( '', '', '' ), $name ) ) ) . ' || ' . ( '/tmp/friend_wpdd/' . $User->ID . '/' . urlencode( str_replace( array( '/.info', '.info', '/' ), array( '', '', '' ), $name ) ) . '.info' ) . ' [] name: ' . $name . "\r\n" );
				}
			}
			
			return false;
		}
		
		// Attempt to create a WordPress category
		
		private function CreateCategoryWP( $cat, $dta = false, $log = false )
		{
			global $Logger;
			
			$log = true;
			
			if( $cat && is_object( $cat ) && $cat->pathname && isset( $cat->parent ) )
			{
				$cat->pathname = str_replace( array( '.dirinfo' ), array( '' ), $cat->pathname );
				
				//$Logger->log( 'Here we attempt on path: ' . $cat->pathname );
				
				if( $dta && isset( $dta->info ) && isset( $dta->info->ID ) && isset( $dta->info->ID->Value ) )
				{
					if( !isset( $cat->id ) )
					{
						$catjson = $this->query( '/products/categories?slug=product_cat-' . $dta->info->ID->Value );
						
						//$Logger->log( 'Result from slug: ' . $catjson );
						
						if( $catobj = json_decode( trim( $catjson ) ) )
						{
							$catobj = ( is_array( $catobj ) && isset( $catobj[0]->id ) ? $catobj[0] : $catobj );
							
							$cat->id = $catobj->id;
							
							if( !isset( $cat->image->id ) && isset( $catobj->image->id ) )
							{
								$cat->image = new stdClass();
								$cat->image->id = $catobj->image->id;
							}
						}
						
						//$Logger->log( 'Wordpress: Result from create category wp.' ); //: ' . $catjson );
					}
					
					// Temporary static mapping
								
					$mapping = array(
						'ID' => 'slug',
						'Title' => 'name',
						'Display' => 'display',
						'Image' => 'image'
					);
					
					$obj = new stdClass();
					
					$pos = 0; $data = '';
					
					foreach( $dta->info as $k=>$v )
					{
						if( isset( $mapping[$k] ) )
						{
							$data = substr( $dta->data, $pos, $v->Length );
							
							if( $k == 'Display' )
							{
								$obj->{$mapping[$k]} = ( $data ? 'subcategories' : 'subcategories' );
							}
							else if( $v->Encoding == 'base64' && $v->Name && $v->Type )
							{
								$name = explode( '.', $v->Name );
								
								$o = new stdClass();
								$o->Encoding = $v->Encoding;
								$o->Title = $name[0];
								$o->Name = $v->Name;
								$o->Type = $v->Type;
								$o->Data = $data;
								
								$obj->{$mapping[$k]} = $o;
							}
							else if( $k == 'Image' && $data != '' && ( strstr( $data, 'http' ) || strstr( substr( trim( $data ), 0, 2 ), '\\' ) ) )
							{
								if( $this->CurlUrlExists( trim( $data ), 'content_type=>image' ) )
								{
									$obj->{$mapping[$k]} = $data;
								}
							}
							else if( $v->Encoding != 'UTF-8' )
							{
								$data = utf8_encode( $data );
								
								$obj->{$mapping[$k]} = $data;
							}
							else if( trim( $data ) )
							{
								$obj->{$mapping[$k]} = $data;
							}
						}
						
						$pos += $v->Length;
					}
					
					
					$obj->name = $cat->pathname;
					$obj->parent = $cat->parent;
					
					//$Logger->log( 'SETTING ID: ' . $dta->info->ID->Value . ' on parent ' . $cat->parent . ' ' . print_r( $cat, 1 ) );
					
					$obj->slug = 'product_cat-' . $dta->info->ID->Value;
					
					if( $log ) 
					{
						/*$Logger->log( '[[[[[[ CreateCategoryWP ]]]]]]: [] obj: ' . 
							json_encode( $cat ) . ' [] data: ' . ( $dta ? json_encode( $dta ) : '' ) . "\r\n" 
						);*/
					}
					
					// If image missing set parent image if defined ...
					
                    if( !$obj->image && $cat->parentimage )
                    {
                        if( isset( $cat->parentimage->src ) )
                        {
                            $obj->image = $cat->parentimage->src;
                        }
                        else
                        {
                            $obj->image = $cat->parentimage;
                        }
                    }
					
					if( isset( $obj->image ) )
					{
						// TODO: temporary that it deletes and creates new 
						// images every prod update, perhaps work with ID here 
						// also instead of filename
						
						if( isset( $cat->image->id ) && $obj->image )
						{
							$this->DeleteWPFiles( $cat->image->id );
						}
						
						if( $files = $this->UploadWPFiles( $obj->image, $obj ) )
						{
							$img = new stdClass();
							$img->id = $files->id;
							
							$obj->image = $img;
						}
						else if( isset( $obj->image ) && !isset( $obj->image->Data ) )
						{
							if( isset( $cat->image->id ) )
							{
								$this->DeleteWPFiles( $cat->image->id );
							}
							
							$img = new stdClass();
							$img->src = $obj->image;
							
							$obj->image = $img;
						}
						else if( isset( $obj->image ) )
						{
							unset( $obj->image );
						}
					}
					
					$json = $this->query( '/products/categories' . ( isset( $cat->id ) && $cat->id ? '/' . $cat->id : '' ), $obj );
					
					//$Logger->log( 'Result from create cat from slug: ' . $json . ' Cat id: ' . $cat->id );
					
					/*if( $json )
					{
						return trim( $json );
					}*/
					
					if( $json )
					{
						$msg = json_decode( $json );
						
						if( isset( $msg->code ) && $msg->code )
						{
							$Logger->log( 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}' );
							
							return 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}';
						}
						else
						{
							return trim( $json );
						}
					}
				}
				else
				{
					
					$obj = new stdClass();
					
					$obj->name = $cat->pathname;
					$obj->parent = $cat->parent;
					
					$json = $this->query( '/products/categories' . ( isset( $cat->id ) && $cat->id ? '/' . $cat->id : '' ), $obj );
					
					
					//$Logger->log( 'FREE Result from slug: ' . $json );
					
					//$Logger->log( '[[[[[[ CreateCategoryWP [NEW:2] ]]]]]]: [] query: ' . '/products/categories' . ( isset( $cat->id ) && $cat->id ? '/' . $cat->id : '' ) . ' [] obj: ' . json_encode( $obj ) . ' [] return: ' . $json . ' [] Obj: ' . print_r( $obj,1 ) . "\r\n" );
					
					
					/*if( $json )
					{
						return trim( $json );
					}*/
					
					if( $json )
					{
						$msg = json_decode( $json );
						
						if( isset( $msg->code ) && $msg->code )
						{
							$Logger->log( 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}' );
							
							return 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}';
						}
						else
						{
							return trim( $json );
						}
					}
				}
			}
			
			//if( $log ) $Logger->log( '[[[[[[ CreateCategoryWP ]]]]]]: Failed to create: ' . json_encode( $cat ) . ( $dta ? ' [] Data: ' . json_encode( $dta ) : '' ) . "\r\n" );
			
			return false;
		}
		
		private function DeleteCategoriesWP( $data )
		{
			global $Logger;
			
			//$Logger->log( '[DeleteCategoriesWP] Start. Checking data.' ); //. print_r( $data, 1 ) );
			
			if( $data && is_object( $data ) && $data->id )
			{
				// --- Fetch all content ----------------------------------- //
				
				//$Logger->log( '[DeleteCategoriesWP] We will now fetch all categories and products.' );
				
				// Fetch all products
				$currentPage = 0;
				$products = [];
				$continue = true;
				while( $continue )
				{
					if( $currentPage == 10 )
					{
						return 'fail<!--separate-->{"message":"Too many categories!","response":"-1"}';
					}
					
					$continue = true;
					$json = $this->query( '/products?page=' . $currentPage . '&per_page=100&category=' . $data->id );
					
					if( $obj = json_decode( trim( $json ) ) )
					{
						$products[] = $obj;
						
						//$Logger->log( '[DeleteCategoriesWP] Found ' . count( $obj ) . ' products.' );
					}
					else
					{
						$continue = false;
					}
					
					//$Logger->log( '[DeleteCategoriesWP] Fetched page ' . $currentPage . ' of products.' );
					
					$currentPage++;
				}
				
				// Fetch all categories
				$currentPage = 0;
				$categories = [];
				$continue = true;
				while( $continue )
				{
					if( $currentPage == 10 )
					{
						return 'fail<!--separate-->{"message":"Too many products!","response":"-2"}';
					}
					
					$json = $this->query( '/products/categories?page=' . $currentPage . '&per_page=100&parent=' . $data->id );
				
					if( $obj = json_decode( trim( $json ) ) )
					{
						$categories[] = $obj;
						
						//$Logger->log( '[DeleteCategoriesWP] Found ' . count( $obj ) . ' categories.' );
					}
					else
					{
						$continue = false;
					}
					
					//$Logger->log( '[DeleteCategoriesWP] Fetched page ' . $currentPage . ' of categories.' );
					
					$currentPage++;
					
				}
				
				// Delete products
				if( count( $products ) > 0 )
				{
					foreach( $products as $obj )
					{
						//$Logger->log( '[DeleteCategoriesWP] Products here: ' . print_r( $obj, 1 ) );
						
						foreach( $obj as $file )
						{
							// If parent id doesn't match the categoryid skip it
							if( $file->categories && is_array( $file->categories ) )
							{
								$found = false;
							
								foreach( $file->categories as $cts )
								{
									if( isset( $cts->id ) && $cts->id == $data->id )
									{
										$found = true;
									}
								}
							
								if( !$found )
								{
									continue;
								}
							}
						
							if( $file->id > 0 )
							{
								//$Logger->log( '[DeleteCategoriesWP] Starting deletion of product ' . $file->name );
								$this->DeleteProductWP( $file );
								//$Logger->log( '[DeleteCategoriesWP] Product ' . $file->name . ' deleted.' );
							}
						}
					}
				}
				
				// Delete categories
				if( count( $categories ) > 0 )
				{
					foreach( $categories as $obj )
					{
						//$Logger->log( '[DeleteCategoriesWP] Categories here: ' . print_r( $obj, 1 ) );
						foreach( $obj as $cat )
						{
							if( $cat->id > 0 )
							{
								$this->DeleteCategoriesWP( $cat );
								//$Logger->log( '[DeleteCategoriesWP] Category ' . $cat->name . ' deleted.' );
							}
						}
					}
				}
				
				// TODO: Make sure there is no files or subfolders before deleting this folder
				
				// --- Folder ----------------------------------------------- //
				
				$json = $this->query( '/products/categories/' . $data->id . '?force=true', false, 'DELETE' );
				
				//$Logger->log( '[DeleteCategoriesWP] Final deletion, category ' . $data->id . ' deleted.' );
				
				if( isset( $data->image->id ) )
				{
					$this->DeleteWPFiles( $data->image->id );
				}
				
				if( $json && json_decode( trim( $json ) ) )
				{
					return 'ok';
				}
			}
			
			return false;
		}
		
		private function DeleteProductWP( $data )
		{
			global $Logger;
			
			//$Logger->log( 'DeleteProductWP: Preparing to delete.' );
			
			if( $data && is_object( $data ) && $data->id )
			{
				$json = $this->query( '/products/' . $data->id . '?force=true', false, 'DELETE' );
				
				//$Logger->log( 'DeleteProductWP: Here is the JSON data: ' . $json . "\nDONE with DeleteProductWP.\n" );
				
				if( $json && json_decode( trim( $json ) ) )
				{
					if( isset( $data->images[0]->id ) )
					{
						$this->DeleteWPFiles( $data->images[0]->id );
					}
					
					return 'ok';
				}
			}
			
			return false;
		}
		
		
		
		
		
		
		function WPListPages()
		{
			global $Logger;
			
			$server = ( trim( $this->Server ) . '/' . $this->api_path . '/wp/v2' );
			
			$json = $this->query( $server . '/pages'/* . ( $ids ? ( '/' . $ids ) : '' )*/, false, 'GET' );
			
			//$Logger->log( '[[[[[[[[[[[[[[[[[[[[[[[ ListFiles: ' . $json . ' ]]]]]]]]]]]]]]]]]]]]]]]' );
			
			if( $json && $obj = json_decode( $json ) )
			{
				return $obj;
			}
			
			return false;
		}
		
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User, $Logger;
			
			$o = new stdClass();
			$o->command = 'write';
			$o->path = $path;
			$o->data = isset( $fileObject->_content ) ? $fileObject->_content : $fileObject;
			return $this->dosAction( $o );
			
			// TODO: Remove Obsolete code!
			
			// Look at doscommand write
			
			if( isset( $path ) )
			{
				$log = false;

				
				// TODO: Fix this into a function so we don't have to write the same code two times, look at write doscommand
				
				if( $file = $this->getSubPath( $path, $log ) )
				{
					$prodid = 0; $len = 0; $data = false;
					
					$data = $fileObject;
					
					// TODO: Create file or folder? Putfile for storing file
					
					if( $dta = $this->HandleInfoFile( $file->pathname, $data ) )
					{
						// Waiting
						if( $dta == -2 )
						{
							return true;
						}
						
						if( $dta->type == 'Directory' && $dta->info && $dta->data )
						{
							if( $data = $this->CreateCategoryWP( $file, $dta ) )
							{
								//$Logger->log( '[Wordpress Makedir] Creating dir with ' . $file->pathname . ' -------------' ); //. print_
								return true;
							}
						}
						else if( $dta->info && $dta->data )
						{
							// If it's an .info file remove the .info
							$file->pathname = str_replace( '.info', '', $file->pathname );
							
							// Temporary static mapping
							
							$mapping = array(
								'ID'          => 'sku',
								'Title'       => 'name',
								'Type'        => 'type',
								'Price'       => 'regular_price',
								'Stock'       => 'stock_quantity',
								'Description' => 'description',
								'Url'         => 'external_url',
								'Attributes'  => 'attributes', 
								'Data'        => 'variations',
								'Image'       => 'images' 
							);
							
							
							
							$obj = new stdClass();
							
							//$obj->type = 'variable';
							
							$obj->tax_status = 'shipping';
							
							$pos = 0; $data = ''; $stock = 0;
							
							foreach( $dta->info as $k=>$v )
							{
								if( isset( $mapping[$k] ) )
								{
									$data = substr( $dta->data, $pos, $v->Length );
									
									if( $k == 'Stock' )
									{
									
										$obj->{'manage_stock'} = true;
										$obj->{$mapping[$k]} = $data;
										
										$stock = $data;
									}
									else if( $v->Encoding == 'base64' && $v->Name && $v->Type )
									{
										$name = explode( '.', $v->Name );
										
										$o = new stdClass();
										$o->Encoding = $v->Encoding;
										$o->Title = $name[0];
										$o->Name = $v->Name;
										$o->Type = $v->Type;
										$o->Data = $data;
										
										$obj->{$mapping[$k]} = $o;
									}
									else if( $k == 'Image' && $data != '' && ( strstr( $data, 'http' ) || strstr( substr( trim( $data ), 0, 2 ), '\\' ) ) )
									{
										if( $this->CurlUrlExists( trim( $data ), 'content_type=>image' ) )
										{
											$obj->{$mapping[$k]} = $data;
										}
									}
									else if( $v->Encoding == 'json' )
									{
										// TODO: Handle deeper array and objects here ...
										
										$data = json_decode( $data );
										
										$obj->{$mapping[$k]} = $data;
									}
									else if( $v->Encoding != 'UTF-8' )
									{
										$data = utf8_encode( $data );
										
										$obj->{$mapping[$k]} = $data;
									}
									else if( trim( $data ) )
									{
										$obj->{$mapping[$k]} = $data;
									}
								}
								
								$pos += $v->Length;
							}
							
							
							if( isset( $obj->sku ) && $obj->sku )
							{
								$catjson = $this->query( '/products?sku=' . urlencode( $obj->sku ) );
							}
							else
							{
								$catjson = $this->query( '/products?search=' . $file->pathname . '&category=' . $file->parent );
							}
							
							$catobj = json_decode( $catjson );
							
							if( $catobj && isset( $catobj[0]->id ) )
							{
								$prodid = $catobj[0]->id;
								
								// Ugly workaround method to update relative product variations because of limitation when updating, since it wouldn't use sku number to update ...
								
								if( isset( $catobj[0]->variations ) && is_array( $catobj[0]->variations ) && isset( $obj->variations ) && is_array( $obj->variations ) )
								{
									foreach( $catobj[0]->variations as $svar )
									{
										if( isset( $svar->id ) && $svar->id && $svar->sku )
										{
											foreach( $obj->variations as $nvar )
											{
												if( $svar->sku == $nvar->sku && !isset( $nvar->id ) )
												{
													$nvar->id = $svar->id;
												}
											}
										}
									}
								}
								
							}
							
							$obj->categories = json_decode( '[{"id": "'.$file->parent.'"}]' );
							
							// If image missing set parent image if defined ...

                            if( !$obj->images && $file->parentimage )
                            {
	                            if( isset( $file->parentimage->src ) )
	                            {
	                            	$obj->images = $file->parentimage->src;
	                            }
	                            else
	                            {
	                            	$obj->images = $file->parentimage;
	                            }
                            }
							
							// TODO: temporary that it deletes and creates new images every prod update, perhaps work with ID here also instead of filename
								
							if( isset( $catobj[0]->images[0]->id ) )
							{
								$this->DeleteWPFiles( $catobj[0]->images[0]->id );
							}
							
							if( $files = $this->UploadWPFiles( $obj->images ) )
							{
								$img = new stdClass();
								$img->id = $files->id;
								$img->position = 0;
								
								$obj->images = array( $img );
							}
							else if( isset( $obj->images ) && !isset( $obj->images->Data ) )
							{
								$img = new stdClass();
								$img->src = $obj->images;
								$img->position = 0;
								
								$obj->images = array( $img );
							}
							else if( isset( $obj->images ) )
							{
								unset( $obj->images );
							}
							
							
							
							
							
							$json = $this->query( '/products' . ( $prodid ? ( '/' . $prodid ) : '' ), $obj );
							
							//$Logger->log( '[[[[[[[[[[ Uploaded: ' . $json . ' [] Images: ' . ( isset( $files ) ? json_encode( $files ) : '' ) . ' [] ProductID: ' . $prodid . ' (' . $file->pathname . ') [] ParentID: ' . $file->pathname . ' Obj: ' . print_r( $obj,1 ) . ' [] Variations: ' . json_encode( $catobj[0]->variations ) . ' ]]]]]]]]]]' );
							
							/*if( $json )
							{
								return true;
							}*/
							
							if( $json )
							{
								$msg = json_decode( $json );
								
								if( isset( $msg->code ) && $msg->code )
								{
									$Logger->log( 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}' );
									
									return 'fail<!--separate-->{"response":{"code":' . $msg->code . ',"message":' . $msg->message . '}}';
								}
								else
								{
									return true;
								}
							}
							
							return false;
						}
						
						/*else if( $dta->info && $dta->data )
						{
							// If it's an .info file remove the .info
							$file->pathname = str_replace( '.info', '', $file->pathname );
							
							// Temporary static mapping
							
							$mapping = array(
								'ID' => 'sku',
								'Title' => 'name',
								'Description' => 'description',
								'Price' => 'regular_price',
								'Distributor' => false,
								'Url' => 'external_url',
								'Display' => 'status', 
								'Stock' => 'stock_quantity', 
								'Image' => 'images' 
							);
							
							
							$obj = new stdClass();
							
							$pos = 0; $data = ''; $stock = 0;
							
							foreach( $dta->info as $k=>$v )
							{
								if( isset( $mapping[$k] ) )
								{
									$data = substr( $dta->data, $pos, $v->Length );
									
									if( $k == 'Stock' )
									{
										$obj->{'manage_stock'} = true;
										$obj->{$mapping[$k]} = $data;
										
										$stock = $data;
										
										//$Logger->log( '[[[[[[[[[[ Mapping ]]]]]]]]]] ' . $path . ' [ ' . $pos . ' - ' . print_r( $v,1 ) . ' ] [] Obj: ' . print_r( $obj,1 ) . ' [] Stock: ' . $stock . ' [] DATA: ' . $dta->data );
									}
									else if( $k == 'Display' )
									{
										$obj->{$mapping[$k]} = ( $data ? 'publish' : 'draft' );
									}
									else if( $v->Encoding == 'base64' && $v->Name && $v->Type )
									{
										$name = explode( '.', $v->Name );
										
										$o = new stdClass();
										$o->Encoding = $v->Encoding;
										$o->Title = $name[0];
										$o->Name = $v->Name;
										$o->Type = $v->Type;
										$o->Data = $data;
										
										$obj->{$mapping[$k]} = $o;
									}
									else if( $v->Encoding != 'UTF-8' )
									{
										$data = utf8_encode( $data );
										
										$obj->{$mapping[$k]} = $data;
									}
									else if( trim( $data ) )
									{
										$obj->{$mapping[$k]} = $data;
									}
								}
								
								$pos += $v->Length;
							}
							
							if( isset( $obj->{'status'} ) )
							{
								$obj->{'status'} = ( $obj->{'status'} && $stock > 0 ? 'publish' : 'draft' );
							}
							
							if( isset( $obj->sku ) && $obj->sku )
							{
								$catjson = $this->query( '/products?sku=' . urlencode( $obj->sku ) );
							}
							else
							{
								$catjson = $this->query( '/products?search=' . $file->pathname . '&category=' . $file->parent );
							}
							
							$catobj = json_decode( $catjson );
							
							if( $catobj && isset( $catobj[0]->id ) )
							{
								$prodid = $catobj[0]->id;
							}
							
							$obj->categories = json_decode( '[{"id": "'.$file->parent.'"}]' );
							
							//$Logger->log( '[[[[[[[[[[ Uploading ]]]]]]]]]] ' . print_r( $dta,1 ) . ' [] ' . print_r( $obj,1 ) );
							
							if( $files = $this->UploadWPFiles( $obj->images ) )
							{
								// TODO: temporary that it deletes and creates new images every prod update, perhaps work with ID here also instead of filename
								
								if( isset( $catobj[0]->images[0]->id ) )
								{
									$this->DeleteWPFiles( $catobj[0]->images[0]->id );
								}
								
								$img = new stdClass();
								$img->id = $files->id;
								$img->position = 0;
								
								$obj->images = array( $img );
							}
							else if( isset( $obj->images ) && !isset( $obj->images->Data ) )
							{
								if( isset( $catobj[0]->images[0]->id ) )
								{
									$this->DeleteWPFiles( $catobj[0]->images[0]->id );
								}
								
								$img = new stdClass();
								$img->src = $obj->images;
								$img->position = 0;
								
								$obj->images = array( $img );
							}
							else if( isset( $obj->images ) )
							{
								unset( $obj->images );
							}
							
							
							
							
							
							$json = $this->query( '/products' . ( $prodid ? ( '/' . $prodid ) : '' ), $obj );
							
							$Logger->log( '[[[[[[[[[[ Uploading ]]]]]]]]]] ' . $path . ' [] Obj: ' . print_r( $obj,1 ) . ' [] ' . $json );
							
							if( $json )
							{
								return true;
							}
							
							return false;
						}*/
					}
					
					// TODO: Fix this .info thing that returns fail when storing .info file ... return true
					
					return true;
				}
				
				return false;
			}
			
			return false;
		}
		
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;
			
			// Look at doscommand makedir
			$o = new stdClass();
			$o->command = 'makedir';
			$o->path = $where;
			return $this->dosAction( $o );
			
			// TODO: Delete obsolete code
			
			$path = $where;
			
			if( isset( $path ) )
			{
				if( !$this->pathIsDir( $path ) )
				{
					$path = ( $path.'/' );
				}
				
				if( $cat = $this->getSubPath( $path ) )
				{
					$dta = $this->HandleInfoFile( $cat->pathname, '-----Directory-----' );
					
					if( $dta == -2 )
						return true;
					
					// INFO: Currently because of having to deal with an .info file system to create either a file or a folder we have to atm reject creation without the .info file until a better solution is made possible.
					
					if( $dta && ( $data = $this->CreateCategoryWP( $cat, $dta ) ) )
					{
						//$Logger->log( '[Wordpress Makedir] Creating dir with ' . $cat->path . ' ------------- AY!' ); 
						return true;
					}
					
					// Temporary because of the .info regime so we don't get the failed notification
					
					return true;
				}
			}
			
			return false;
		}
		
		function _deleteFolder( $path )
		{
			if( $this->pathIsDir( $path ) )
			{
				if( $cat = $this->getSubPath( $path, true ) )
				{
					if( $cat->id )
					{
						if( $this->DeleteCategoriesWP( $cat ) )
						{
							return true;
						}
					}
				}
			}
			
			return false;
		}
		
		function _deleteFile( $path )
		{
			global $Logger;
			
			if( $this->pathIsFile( $path ) )
			{
				if( $file = $this->getSubPath( $path ) )
				{
					//$slot = $Logger->addSlot( '(Wordpress) Carrying out delete: ' . $file->name );
					
					if( $file->id )
					{
						if( $this->DeleteProductWP( $file ) )
						{
							//$slot->resolve( true, 'Yes, path is file.' );
							return true;
						}
						else
						{
							//$slot->resolve( false, 'We couldn\'t delete WP product. ' . print_r( $file, 1 ) );
							return false;
						}
					}
					else
					{
						//$slot->resolve( false, 'We have no file id: ' . print_r( $file, 1 ) );
						return false;
					}
				}
				
				//$slot->resolve( false, 'Could not delete file.' );
			}
			
			return false;
		}
		
	}
}

// Create a door...
$door = new DoorWordpress( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
