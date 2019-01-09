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

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 1);

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );
include_once( 'php/include/i18n.php' );

// Dependency required ... php7.0-sybase package
// ++ some PDO stuff is needed ..., ask Thomas ...

if( !defined( 'QUICK_SLASH_REPLACEMENT' ) )
{
	// To fix names
	//define( 'QUICK_SLASH_REPLACEMENT', '&#47;' );
	define( 'QUICK_SLASH_REPLACEMENT', '&#124;' );
}

// Make it a little bit aggressive!
ini_set( 'sybct.login_timeout integer', 30 );
ini_set( 'sybase.max_links', -1 );
ini_set( 'sybct.deadlock_retry_count', 4 );

ini_set( 'max_execution_time', 300 ); // 5min 

i18nAddPath( 'devices/DOSDrivers/QuickNG/Locale/' );

if( !defined( 'QuickNG_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'QuickNG_FILE_LIMIT', 524288000 );
}

if( !class_exists( 'DoorQuickNG' ) )
{	
	class DoorQuickNG extends Door
	{	
		var $db;
		
		function onConstruct()
		{
			$this->authenticate();
		}
		
		private function authenticate( $retries = 4 )
		{
			global $args, $Logger;
			
			if( $GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ] )
			{
				$this->db = $GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ];
				//$Logger->log( 'Already authenticated. Using old database link.' );
				return true;
			}
			
			
			//$Logger->log( 'QuickNG: Trying to authenticate (' . $retries . ' retries left.)' );
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();	
			
			//$Logger->log( print_r( $this, 1 ) );
			if( $this->Server && $this->Username && $this->Password )
			{
				//$Logger->log( 'Login object: ' . print_r( $this, 1 ) );
				$this->Config = json_decode( $this->Config ); // Decode the config too!
				//$Logger->log( 'Logging in on ' . $this->Server . ' with username and password ' . $this->Username . '/' . $this->Password . ' on db ' . $this->Config->Database );
				
				try
				{
					//$Logger->log( 'Trying to connect to server.' );
					//if( $this->db = sybase_connect( $this->Server . ':' . $this->Port, $this->Username, $this->Password, 'ISO-8859-1' ) )
					if( $this->db = new PDO( 'dblib:host=' . $this->Server . ':' . $this->Port . ';dbName=' . $this->Config->Database, $this->Username, $this->Password ) )
					{
						//$Logger->log( 'Seems we didn\'t get an error.' );
						//$this->expunge( 'Seems we didn\'t get an error.' . ( $this->Server . ':' . $this->Port . ' ' . $this->Username . ' ' . $this->Password ) . ' [] ' . $this->db );
						$GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ] = $this->db;
						return true;
					}
					else
					{
						$Logger->log( 'Error connecting!!' . $this->db );
						//$this->expunge( 'Error connecting!! ' . ( $this->Server . ':' . $this->Port . ' ' . $this->Username . ' ' . $this->Password ) );
						// Try retries
						if( $retries > 0 )
							return $this->authenticate( $retries - 1 );
						return false;
					}
				}
				catch( Exception $e )
				{
					$Logger->log( 'QuickNG: We got a login error: ', $e );
				}
				//$Logger->log( 'We logged in!' );
			}
			else
			{
				//$Logger->log( 'We got no server information.' );
			}
			return false;
		}
		
		function __destruct()
		{
			global $Logger;
			if( $this->db )
			{
				$this->db = null;
				//sybase_close( $this->db );
				$GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ] = null;
			}
			//$Logger->log( 'Good bye!' );
		}

		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function getSubFolder( $subPath )
		{
			global $Logger, $SqlDatabase;
			
			//$inputPath = $subPath;
			
			if( $subPath == '/' ) return false;
			
			
			//$Logger->log('We return the folder ID ' . $fo->ID . ' for the original input ' . $inputPath );
			return false;
		}

		/**
		 * @brief Execute a dos command
		 * 
		 * Executes a dormant command on this Door object which is passed on to
		 * Friend Core. The function is very low level in that it takes a url
		 * encoded string of vars.
		 * The function does not return any data, but exits with its result
		 * in the format of returncode<!--separate-->{jsondata...}
		 *
		 * @param $args arguments for dos action
		 * @return none
		 */
		public function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
			
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
			
			//$Logger->log( '[[[[[[ QUICK ARGS: ]]]]]] ' . print_r( $args,1 ) . ' [] path: ' . $path . "\r\n" );
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				$fo = false;
				
				if( !$this->db )
					return 'fail<!--separate-->[]';
			
				// Get the components of the path
				list( $volume, $subpath ) = explode( ':', $args->path );
				
				// No sub path? Root directory
				if( !trim( $subpath ) )
				{
					$ps = array( 'Products'=>'i18n_products' );
					$out = [];
					foreach( $ps as $k=>$p )
					{
						$o = new stdClass();
						$o->Filename = i18n( $k );
						$o->Title = i18n( $p );
						$o->Filesize = 16;
						$o->Type = 'Directory';
						$o->MetaType = 'Directory';
						$o->DateCreated = date ( 'Y-m-d H:i:s' );
						$o->DateModified = $o->DateCreated;
						$o->Path = $volume . ':' . $o->Filename . '/';
						$o->Shared = '';
						$o->SharedLink = '';
						$out[] = $o;
					}
					return $this->expunge( 'ok<!--separate-->' . json_encode( $out ) );
				}
				// Sub directory
				else
				{
					$subdirs = explode( '/', $subpath );
					if( !trim( $subdirs[ count( $subdirs ) - 1 ] ) )
						array_pop( $subdirs );
					
					// We got a subroot directory
					if( count( $subdirs ) )
					{
						// It's a products directory
						if( strtolower( i18n( 'i18n_products' ) ) == strtolower( $subdirs[0] ) )
						{
							//if( $res = sybase_query( 'SELECT ALL * FROM VUnderkat WHERE Webaktiv > 0 ', $this->db ) )
							if( $res = $this->db->query( 'SELECT ALL * FROM VUnderkat WHERE Webaktiv > 0 ' ) )
							{
								// Prepare filter								
								$filter = '';
								$subPath = '';
								if( count( $subdirs ) >= 2 )
								{
									for( $a = 1; $a < count( $subdirs ); $a++ )
									{
										$filter .= $subdirs[$a] . ' -> ';
										$subPath .= $subdirs[ $a ] . '/';
									}
								}
								
								$test = [];
								
								$out = [];
								
								//while( $row = sybase_fetch_assoc( $res ) )
								foreach( $res as $row )
								{
									// Simulate categories
									$groupName = utf8_encode( trim( $row[ 'UKATNAVN' ] ) );
									$firstPart = substr( $groupName, 0, strlen( $filter ) );
									$cat = end( explode( ' -> ', $groupName ) );
									
									//$row['groupName'] = $groupName;
									//$row['firstPart'] = $firstPart;
									//$row['cat'] = $cat;
									
									//$test[] = $row;
									
									if( $filter && ( $filter . $cat ) != $groupName )
									{
										continue;
									}
									else if ( !$filter && strstr( $groupName, ' -> ' ) )
									{
										continue;
									}
									
									// List the directory
									$o = new stdClass();
									$len = strlen( trim( $groupName ) );
									$trimmed = trim( substr( $groupName, strlen( $filter ), $len - strlen( $filter ) ) );
									$o->Filename = str_replace( '/', QUICK_SLASH_REPLACEMENT, $trimmed );
									$o->Filesize = 16;
									$o->Type = 'Directory';
									$o->MetaType = 'Directory';
									$o->DateCreated = date ( 'Y-m-d H:i:s', strtotime( $row['CrTime'] ) );
									$o->DateModifed = date ( 'Y-m-d H:i:s', strtotime( $row['ChTime'] ) );
									$o->ID = utf8_encode( $row['ID'] );
									$o->Path = $this->Name . ':' . i18n( 'i18n_products' ) . 
										'/' . $subPath . str_replace( '/', QUICK_SLASH_REPLACEMENT, $o->Filename ) . '/';
									$o->Shared = '';
									$o->UniqueID = 'product_cat-' . $row[ 'ID' ];
									$o->SharedLink = '';
									$out[] = $o;
									
									// Create .info file for directory
									$o = new stdClass();
									$len = strlen( $groupName );
									$o->Filename = str_replace( '/', QUICK_SLASH_REPLACEMENT, $trimmed ) . '.dirinfo';
									$o->Filesize = 16;
									$o->Type = 'File';
									$o->MetaType = 'DirectoryInformation';
									$o->DateCreated = date ( 'Y-m-d H:i:s', strtotime( $row['CrTime'] ) );
									$o->DateModifed = date ( 'Y-m-d H:i:s', strtotime( $row['ChTime'] ) );
									$o->ID = utf8_encode( $row['ID'] );
									$o->Path = $this->Name . ':' . i18n( 'i18n_products' ) . 
										'/' . $subPath . ( str_replace( '/', QUICK_SLASH_REPLACEMENT, $trimmed ) . '.dirinfo' );
									$o->Shared = '';
									$o->UniqueID = 'product_cat-' . $row[ 'ID' ] . '.dirinfo';
									$o->SharedLink = '';
									$out[] = $o;
								}
								if( $rows = $this->GetProducts( $this->Name . ':' . i18n( 'i18n_products' ) . '/' . $subPath ) )
								{
									foreach( $rows as $row )
									{
										$out[] = $row;
									}
								}
								
								$this->db = null;
								//sybase_free_result( $res );
								//sybase_close( $this->db );
								$GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ] = null;
								
								//die( print_r( $test,1 ) . ' --' );
								
								return $this->expunge( 'ok<!--separate-->' . json_encode( $out ) );
							}
							return $this->expunge( 'ok<!--separate-->[]' );
						}
					}
					// We got a sub directory
					else
					{
						// We got a product subdirectory
						if( strtolower( i18n( 'i18n_products' ) ) == strtolower( $subdirs[0] ) )
						{
							$ppath = implode( '/', $subdirs );
							$len = strlen( $subdirs[0] );
							$ppath = substr( $ppath, $len + 1, strlen( $ppath ) - $len );
							
							
							if( $rows = $this->GetProducts( $ppath ) )
							{
								return $this->expunge( 'ok<!--separate-->' . json_encode( $rows ) );
							}
							// Empty directory
							else if( $rows != false )
							{
								return $this->expunge( 'ok<!--separate-->[]' );
							}
							else
							{
								return $this->expunge( 'fail<!--separate-->' );
							}
						}
					}
				}
				
				// No entries
				return 'fail<!--separate-->[]';
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
			else if( $args->command == 'write' )
			{	
				return 'fail<!--separate-->Could not write file: ' . $Config->FCUpload . $fn;
			}
			else if( $args->command == 'read' )
			{
				$fo = false; $infoMode = false;
				
				//$Logger->log( 'QuickNG: Trying to read ' . $args->path );
				
				if( !$this->db )
					return 'fail<!--separate-->[]';
				
				// Get the components of the path
				list( $volume, $subpath ) = explode( ':', $args->path );
				
				// No sub path? Root directory
				if( !trim( $subpath ) )
				{
					return $this->expunge( 'fail<!--separate-->{ "response": "[1]File does not exist." }' );
				}
				// Sub directory
				else
				{
					$subdirs = explode( '/', $subpath );
					
					// Commented out because it removes the directory identifier "/" on the end of the path
					//if( !trim( $subdirs[ count( $subdirs ) - 1 ] ) )
					//	array_pop( $subdirs );
					
					// We got a subroot directory
					if( count( $subdirs ) == 1 )
					{
						// It's a products directory
						if( strtolower( i18n( 'i18n_products' ) ) == strtolower( $subdirs[0] ) )
						{
							return $this->expunge( 'fail<!--separate-->{ "response": "[2]File does not exist." }' );
						}
					}
					// We got a sub directory
					else
					{
						// We got a product subdirectory
						if( strtolower( i18n( 'i18n_products' ) ) == strtolower( $subdirs[0] ) )
						{
							$ppath = implode( '/', $subdirs );
							$len = strlen( $subdirs[0] );
							$ppath = substr( $ppath, $len + 1, strlen( $ppath ) - $len );
							
							if( $rows = $this->GetProduct( $ppath, $args->mode ) )
							{
								return $rows;
							}
							else
							{
								return 'fail<!--separate-->{ "response": "Could not read file." }';
							}
						}
					}
				}
				return $this->expunge( 'fail<!--separate-->{ "response": "No such file or directory." }' );
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				return $this->expunge( 'fail<!--separate-->{"reason": "No such command."}' );
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
				return $this->expunge( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					case 'mount':
						//$Logger->log( 'Mounting not needed here.. Always succeed.' );
						return $this->expunge( 'ok' );
					case 'unmount':
						//$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						return $this->expunge( 'ok' );
					case 'rename':
						return $this->expunge( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						return $this->expunge( 'fail<!--separate-->why: ' . /*print_r( $args, 1 ) . */'(' . $path . ')' );
						break;
					case 'delete':
						// Other combos not supported yet
						return 'fail';
					// Move files and folders or a whole volume to another door
					case 'copy':
						//
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						//$Logger->log( "Attempting to copy from $from to $to.." );
						if( isset( $from ) && isset( $to ) )
						{
							//$Logger->log( 'Trying from ' . $from . ' to ' . $to );
							if( $this->copyFile( $from, $to ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
				}
			}
			else if( $args->command == 'infoget' )
			{				
				$d = new Door();
				
				// TODO: Make sure to stream through the file!
				$pathHere = $args->path;
				if( substr( $pathHere, -1, 1 ) == '/' )
				{
					$pathHere = substr( $pathHere, 0, strlen( $pathHere ) - 1 ) . '.dirinfo';
				}	
				else $pathHere .= '.info';
				
				if( $data = $d->getFile( $pathHere ) )
				{
					//$Logger->log( 'Got data: '. $data->_content );
					// Strip the separator
					$dc = explode( '<!--separate-->', $data->_content );
					if( $json = json_decode( $dc[0] ) )
					{
						//$Logger->log( $args->path );
						if( $raw = $d->getFile( $args->path ) )
						{
							$pos = 0;
							foreach( $json as $k=>$v )
							{
								if( $k == $args->key )
								{
									$data = substr( $raw->_content, $pos, $v->Length );
									if( $v->Encoding != 'UTF-8' )
										$data = utf8_encode( $data );
									return 'ok<!--separate-->' . $data;
								}
								$pos += $v->Length;
							}
							//$Logger->log( 'fail<!--separate-->{"response":"Failed to find key in file.","file":"' . $args->path . '","key":"' . $args->key . '"}' );
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
			return 'fail<!--separate-->';
		}
		
		// Get products on a path
		private function GetProducts( $prodstr, $depth = 0 )
		{
			global $Logger;
			
			if( $cats = end( explode( $this->Name . ':' . i18n( 'i18n_products' ) . '/', $prodstr ) ) )
			{
				// Remove trailing slash
				$cats = substr( $cats, 0, strlen( $cats ) - 1 );
				$cats = str_replace( '/', ' -> ', $cats );
				
				// Get web link groups
				$out = [];
				
				$all_results = [];
				
				// One query for products, one for products with variants
				$all_queries = array( '
					SELECT ALL v.*, n.Varenavn, b.ChTime as ImageChTime, b.CrTime as ImageCrTime
					FROM 
						VKAT k, 
						VUnderkat u, 
						varereg v 
							LEFT JOIN MLVarenavn n ON 
							( 
								n.VareID = v.ID 
							)
							LEFT JOIN WebBilder b ON
							(
								v.ID = b.VareID
							)
					WHERE 
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $cats ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						v.WEBAKTIV > 0           AND 
						v.AKTIVVARE = \'1\'      AND 
						v.KLIENTNR = \'1\'       AND 
						v.VunderKatID > 0        AND 
						v.VunderKatID = u.ID     AND 
						v.VKatID = k.ID          AND
						v.VariantAvID = NULL 
					ORDER BY u.UKATNAVN 
				', '
					SELECT ALL v.*, n.Varenavn, b.ChTime as ImageChTime, b.CrTime as ImageCrTime
					FROM 
						VKAT k, 
						VUnderkat u, 
						varereg v 
							LEFT JOIN MLVarenavn n ON 
							( 
								n.VareID = v.ID 
							)
							LEFT JOIN WebBilder b ON
							(
								v.ID = b.VareID
							)
					WHERE 
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $cats ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						v.WEBAKTIV > 0           AND 
						v.AKTIVVARE = \'1\'      AND 
						v.KLIENTNR = \'1\'       AND 
						v.VunderKatID > 0        AND 
						v.VunderKatID = u.ID     AND 
						v.VKatID = k.ID          AND
						v.ID = v.VariantAvID
					ORDER BY u.UKATNAVN 
				' );
				
				// Prepare variables
				$out = [];
				
				foreach( $all_queries as $qk=>$qv )
				{
					//if( $q = sybase_query( $qv ) )
					if( $q = $this->db->query( $qv ) )
					{
						$prods = [];
						
						//while( $row = sybase_fetch_assoc( $q ) )
						foreach( $q as $row )
						{
							if( $row['VARENAVN'] && trim( $row['VARENR'] ) )
							{
								$prods[] = $row;
							}
						}
						
						$attr = [];
						
						foreach( $prods as $row )
						{
							$obj = new stdClass();
							
							/*
							//Picture test
							if( $browres = sybase_query( '
								SELECT ALL * FROM WebBilder AS b
								WHERE
									b.VareID = \'' . $row[ 'ID' ] . '\'
								
							' ) )
							{
								if( $rrr = sybase_fetch_assoc( $browres ) )
								{
									$Logger->log( print_r( $rrr, 1 ) );
								}
							}*/
							
							// TODO: There is more to what is a simple and a variable product and the ID change based on that and if there is sizes ... more work needed here ...
							
							$obj->size = false;
							
							if( /*$varinfo = sybase_query(*/$varinfo = $this->db->query( $q4 = '
								SELECT TOP 20 i.* 
								FROM VariantInfo i 
								WHERE i.VareID = \'' . $row['ID'] . '\' 
								ORDER BY i.ID 
							' ) )
							{
								//while( $rowl4 = sybase_fetch_assoc( $varinfo ) )
								foreach( $varinfo as $rowl4 )
								{
									if( trim( $rowl4['Variant'] ) && !$obj->size )
									{
										$obj->size = trim( $rowl4['Variant'] );
									}
								}
							}
							
							// Variable or Simple product ...
							if( $obj->size/* && $row['VariantAvID'] == $row['ID']*/ )
							{
								$obj->sku = $row['ID'];
							}
							else
							{
								$obj->sku = ( trim( $row['VARENR'] ) ? trim( $row['VARENR'] ) : $row['ID'] );
							}
							
							$attr[$row['ID']] = $obj;
						}
						
						foreach( $prods as $row )
						{
							$obj = ( isset( $attr[$row['ID']] ) ? $attr[$row['ID']] : new stdClass() );
							
							$cname = trim( trim( $row['Varenavn'] ) ? $row['Varenavn'] : $row['VARENAVN'] );
							
							// Original state of the file
							$o = new stdClass();
							//$o->Title = str_replace( '/', QUICK_SLASH_REPLACEMENT, ucfirst( strtolower( utf8_encode( $cname ) ) ) );
							$o->Title = str_replace( '/', QUICK_SLASH_REPLACEMENT, utf8_encode( $cname ) . ' (-' . $obj->sku . '-)' );
							//$o->Title = str_replace( '/', QUICK_SLASH_REPLACEMENT, trim( $row['ID'] ) );
							$o->Filename = $o->Title/* . '.jpg'*/;
							$o->Filesize = '16';
							$o->Type = 'File';
							$o->MetaType = 'MetaFile';
							//$o->MetaType = 'File';
							$o->UniqueID = $obj->sku;
							
							// Created time
							$crtime = strtotime( $row['CrTime'] );
							
							// Get last time this file was modified
							$chtime = strtotime( $row['ChTime'] );
							
							// Check if image is updated and use that on the "file" if so
							$imageCh = strtotime( $row[ 'ImageChTime' ] ? $row[ 'ImageChTime' ] : $row[ 'ImageCrTime' ] );
							if( $chtime < $imageCh )
								$chtime = $imageCh;
							
							$o->DateCreated = date( 'Y-m-d H:i:s', $crtime );
							$o->DateModified = date( 'Y-m-d H:i:s', $chtime );
							
							//$Logger->log( $row['VARENAVN' ] . ' changed at ' . $o->DateModified );
							
							$o->ID = $row['ID'];
							// Actually, use the title for the path, as we want it stylized
							// It's simple to check ucfirst( strtolower( utf8_encode( name ) ) )
							$o->Path = $prodstr . $o->Filename;
							$o->Shared = '';
							$o->SharedLink = '';
							$out[$o->ID.'1'] = $o;
							
							// File info
							$o = new stdClass();
							
							$o->Title = str_replace( '/', QUICK_SLASH_REPLACEMENT, utf8_encode( $cname ) . ' (-' . $obj->sku . '-)' ) . '.info';
							$o->Filename = $o->Title;
							$o->Filesize = '16';
							$o->Type = 'File';
							$o->MetaType = 'Information';
							$o->DateCreated = date( 'Y-m-d H:i:s', strtotime( $row['CrTime'] ) );
							$o->DateModified = date( 'Y-m-d H:i:s', strtotime( $row['ChTime'] ) );
							$o->ID = $row['ID'];
							
							// Actually, use the title for the path, as we want it stylized
							// It's simple to check ucfirst( strtolower( utf8_encode( name ) ) )
							$o->Path = $prodstr . $o->Filename;
							$o->Shared = '';
							$o->UniqueID = $obj->sku . '.info';
							
							$o->SharedLink = '';
							$out[$o->ID.'2'] = $o;
						}
					}
				}	
				if( count( $out ) )
				{
					return $out;
				}
			}
			return false;
		}
		
		// Get a single product
		private function GetProduct( $prodstr, $mode = false, $depth = 0 )
		{
			global $Logger;
			
			$out = [];
			
			if( $dir = explode( '/', $prodstr ) )
			{
				$productName = array_pop( $dir );
				
				$category = implode( ' -> ', $dir );
				
				// Product info or product data?
				$infoMode = substr( $productName, -5, 5 ) == '.info' ? true : false;
				if( $infoMode )
					$productName = substr( $productName, 0, strlen( $productName ) - 5 );
				
				// Check for directory info
				if( !$infoMode )
				{
					/*$infoMode = substr( $productName, -8, 8 ) == '.dirinfo' ? true : false;
					if( $infoMode )
						$productName = substr( $productName, 0, strlen( $productName ) - 8 );*/
				}
				
				// .info fil all data i en fil index i toppen og data i bunn ....
				
				$dirInfo = substr( $prodstr, strlen( $prodstr ) - 8, 8 ) == '.dirinfo';
				
				if( $dirInfo || substr( $prodstr, -1, 1 ) == '/' )
				{
					if( $dirInfo )
					{
						$p = explode( '/', $prodstr );
						$mem = array_pop( $p );
						$mem = substr( $mem, 0, strlen( $mem ) - 8 );
						$p[] = $mem;
						$category = implode( ' -> ', $p );
					}
						 
					//$Logger->log( 'Directory mode: ' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $category ) ) ) );
				
					// TODO: Perhaps put this code into a GetCategory function
					
					if( $dirInfo )
					{
						$infoMode = true;
					}
					
					if( /*$res = sybase_query(*/ $res = $this->db->query( $q = '
						SELECT TOP 1
							u.*, 
							b.Id AS ImageID,
							b.FilePath AS ImagePath, 
							b.FileSize AS ImageSize, 
							b.URLLink AS ImageUrl, 
							BASE64_ENCODE(xp_read_file( b.FilePath )) AS ImageData 
						FROM  
							VUnderkat u LEFT JOIN WebBilder AS b ON u.ID = b.VUnderkatID 
						WHERE 
							UPPER(u.UKATNAVN) = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $category ) ) ) . '\') AND u.Webaktiv > 0 
					' ) )
					{
						$imgname = ''; $imgmime = '';
						
						//if( $row = sybase_fetch_assoc( $res ) )
						foreach( $res as $row )
						{	
							if( $row['ImagePath'] && $row['ImageData'] )
							{
								if( strstr( $row[ 'ImagePath' ], '.' ) )
								{
									$imgname = utf8_encode( end( explode( '\\', $row['ImagePath'] ) ) );
									$imgmime = ( 'image/' . end( explode( '.', $row['ImagePath'] ) ) );
								}
							}
							
							$cid   = $row['ID'];
							$cname = str_replace( '/', QUICK_SLASH_REPLACEMENT, trim( $row['UKATNAVN'] ) );
							
							if( $cname = explode( ' -> ', $cname ) )
							{
								$cname = end( $cname );
							}
							
							$data = ( 
								utf8_encode( $cid ) . 
								ucfirst( strtolower( utf8_encode( trim( $cname ) ) ) ) . 
								utf8_encode( $row['Aktiv'] ) . 
								( trim( $row['ImageData'] ) ? $row['ImageData'] : ( trim( $row['ImageUrl'] ) ? $row['ImageUrl'] : $row['ImagePath'] ) )
							);
							
							// Original state of the file
							if( $infoMode )
							{
								//$Logger->log( 'Quickng: infomode' );
								
								// Add a meta information file
								$meta = array(
									'ID'      => array( 
										'Type' => 'string',
										'Length' => strlen( utf8_encode( $cid ) ), 
										'Encoding' => 'UTF-8', 'Value' => utf8_encode( $cid ) 
									),
									'Title'   => array( 
										'Type' => 'string', 
										'Length' => strlen( ucfirst( strtolower( utf8_encode( trim( $cname ) ) ) ) ), 
										'Encoding' => 'UTF-8' 
									),
									'Display' => array( 
										'Type' => 'string', 
										'Length' => strlen( utf8_encode( $row['Aktiv'] ) ), 
										'Encoding' => 'UTF-8' 
									) 
								);
								
								if( $row['ImageData'] )
								{
									$meta['Image'] = array( 
										'Type' => $imgmime, 
										'Length' => strlen( $row['ImageData'] ), 
										'Encoding' => 'base64', 
										'Name' => $imgname
									);
								}
								else
								{
									$meta['Image'] = array( 
										'Type' => 'string', 
										'Length' => strlen( trim( $row['ImageUrl'] ) ? $row['ImageUrl'] : $row['ImagePath'] ), 
										'Encoding' => 'UTF-8' 
									);
								}
								
								$meta[ 'Data' ] = array(
									'Type' => 'string', 
									'Offset' => strlen( json_encode( $meta ) . '<!--separate-->' . trim( $data ) ), 
									'Encoding' => 'plain' 
								);
								
								if( $mode )
								{
									return $this->expunge( json_encode( $meta ) . '<!--separate-->' . $data );
								}
								
								return ( json_encode( $meta ) . '<!--separate-->' . $data );
							}
							
							if( $mode )
							{
								if( $args->mode == 'rs' )
								{
									die( $row['ImageData'] ? base64_decode( $row['ImageData'] ) : '' );
								}
								else if( $mode == 'r' )
									print( 'ok<!--separate-->' );
								return $this->expunge( $data );
							}
							
							return $data;
						}
					}
					
					if( $mode )
					{
						return $this->expunge( 'fail<!--separate-->{"response":"Something didnt work as expected [Query]: ' . $q . '"}' );
					}
					
					return false;
				}
				
				if( $productName )
				{
					$prodparts = explode( ' (-', utf8_decode( trim( str_replace( array( '.jpg', '.info' ), '', str_replace( QUICK_SLASH_REPLACEMENT, '/', $productName ) ) ) ) );
				}
				
				$prodnam = ( isset( $prodparts[0] ) ? $prodparts[0] : $prodparts );
				$prodsku = ( isset( $prodparts[1] ) ? str_replace( '-)', '', $prodparts[1] ) : false );
				
				// TODO: Fix the problem with listing out two rows for one ID when there is an image attached to the product even if it's left joined.
				
				// One query for products, one for products with variants
				$all_queries = array( '
					SELECT ALL v.*, n.Varenavn, b.ChTime as ImageChTime, b.CrTime as ImageCrTime
					FROM 
						VKAT k, 
						VUnderkat u, 
						varereg v 
							LEFT JOIN MLVarenavn n ON 
							( 
								n.VareID = v.ID 
							)
							LEFT JOIN WebBilder b ON
							(
								v.ID = b.VareID
							)
					WHERE 
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $cats ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						v.WEBAKTIV > 0           AND 
						v.AKTIVVARE = \'1\'      AND 
						v.KLIENTNR = \'1\'       AND 
						v.VunderKatID > 0        AND 
						v.VunderKatID = u.ID     AND 
						v.VKatID = k.ID          AND
						v.VariantAvID = NULL 
					ORDER BY u.UKATNAVN 
				', '
					SELECT ALL v.*, n.Varenavn, b.ChTime as ImageChTime, b.CrTime as ImageCrTime
					FROM 
						VKAT k, 
						VUnderkat u, 
						varereg v 
							LEFT JOIN MLVarenavn n ON 
							( 
								n.VareID = v.ID 
							)
							LEFT JOIN WebBilder b ON
							(
								v.ID = b.VareID
							)
					WHERE 
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $cats ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						v.WEBAKTIV > 0           AND 
						v.AKTIVVARE = \'1\'      AND 
						v.KLIENTNR = \'1\'       AND 
						v.VunderKatID > 0        AND 
						v.VunderKatID = u.ID     AND 
						v.VKatID = k.ID          AND
						v.ID = v.VariantAvID
					ORDER BY u.UKATNAVN 
				' );
				
				// Prepare variables
				$out = [];
				
				if( $prodnam && ( $all_queries = array( '
					SELECT TOP 1 
						h.*,  
						b.Id AS ImageID,
						b.FilePath AS ImagePath, 
						b.FileSize AS ImageSize, 
						b.URLLink AS ImageUrl, 
						BASE64_ENCODE( xp_read_file( b.FilePath ) ) AS ImageData 
					FROM 
						VKAT k, 
						varereg h, 
						VUnderkat u 
							LEFT JOIN WebBilder AS b ON 
							( 
								u.ID = b.VUnderkatID 
							) 
					WHERE 						
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $category ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						h.WEBAKTIV > 0           AND 
						h.AKTIVVARE = \'1\'      AND 
						h.KLIENTNR = \'1\'       AND 
						h.VunderKatID > 0        AND 
						h.VunderKatID = u.ID     AND 
						h.VKatID = k.ID          AND 
						' . ( $prodsku ? 'h.VARENR = \'' . $prodsku . '\' ' : 'UPPER(h.VARENAVN) = (\'' . $prodnam . '\') ' ) . '
					ORDER BY u.UKATNAVN 
				',
				'
					SELECT TOP 1 
						h.*,  
						b.Id AS ImageID,
						b.FilePath AS ImagePath, 
						b.FileSize AS ImageSize, 
						b.URLLink AS ImageUrl, 
						BASE64_ENCODE( xp_read_file( b.FilePath ) ) AS ImageData 
					FROM 
						VKAT k, 
						varereg h, 
						VUnderkat u 
							LEFT JOIN WebBilder AS b ON 
							( 
								u.ID = b.VUnderkatID 
							) 
					WHERE 						
						UPPER(u.UKATNAVN)      = UPPER(\'' . utf8_decode( urldecode( str_replace( QUICK_SLASH_REPLACEMENT, '/', $category ) ) ) . '\') AND
						u.Webaktiv > 0           AND 
						u.HovedGrpID = k.ID      AND 
						h.WEBAKTIV > 0           AND 
						h.AKTIVVARE = \'1\'      AND 
						h.KLIENTNR = \'1\'       AND 
						h.VunderKatID > 0        AND 
						h.VunderKatID = u.ID     AND 
						h.VKatID = k.ID          AND 
						' . ( $prodsku ? 'h.ID = \'' . $prodsku . '\' ' : 'UPPER(h.VARENAVN) = (\'' . $prodnam . '\') ' ) . '
					ORDER BY u.UKATNAVN 
				' ) ) )
				{
					$out = []; $imgname = ''; $imgmime = ''; $imgdata = ''; $imgurl = ''; $url = ''; $test = []; $idnr = ''; $artnr = ''; $cname1 = ''; $cname2 = ''; $webinfo = ''; $data = []; $sizes = [];
					
					$iii = 0;
					
					$ids = []; $test = []; $test2 = [];
					
					$sku = ''; $price = ''; $totstock = 0;
					$dateModified = $dateCreated = 0;
					
					foreach( $all_queries as $qk=>$qv )
					{
						//if( $main = sybase_query( $qv ) )
						if( $main = $this->db->query( $qv ) )
						{
							
							//if( $prod = sybase_fetch_assoc( $main ) )
							foreach( $main as $prod )
							{
								// Modified and created
								$dateModified = strtotime( $prod[ 'ChTime' ] );
								$dateCreated  = strtotime( $prod[ 'CrTime' ] );
								
								if( $prod['ID'] )
								{
									$prods = [];
									
									$test[] = $prod;
									
									$res = /*sybase_query(*/$this->db->query( $q = '
										SELECT ALL 
											v.*, 
											n.Varenavn, 
											b.Id AS ImageID, 
											b.FilePath AS ImagePath, 
											b.FileSize AS ImageSize, 
											b.URLLink AS ImageUrl, 
											b.ChTime as ImageChTime,
											b.CrTime as ImageCrTime,
											BASE64_ENCODE( xp_read_file( b.FilePath ) ) AS ImageData 
										FROM  
											varereg v 
												LEFT JOIN MLVarenavn n ON 
												( 
													n.VareID = v.ID 
												)
												LEFT JOIN WebBilder AS b ON 
												( 
													v.ID = b.VareID 
												) 
										WHERE 
											v.WEBAKTIV  = \'1\' AND 
											v.KLIENTNR  = \'1\' AND 
											v.AKTIVVARE = \'1\' AND 
											' . ( $prod['VariantAvID'] ? 'v.VariantAvID = ' . $prod['VariantAvID'] : 'v.ID = ' . $prod['ID'] ) . '
										ORDER BY v.ID 
									' );
									
									if( $res )
									{
										//while( $row = sybase_fetch_assoc( $res ) )
										foreach( $res as $row )
										{
											// On pModified|Created compare with image dates
											$pModified = strtotime( $row[ 'ChTime' ] );
											$pCreated  = strtotime( $row[ 'CrTime' ] );
											$iModified = strtotime( $row[ 'ImageChTime' ] );
											$iCreated  = strtotime( $row[ 'ImageCrTime' ] );
											if( $iCreated > $pCreated )
												$pCreated = $iCreated;
											if( $iModified > $pModified )
												$pModified = $iModified;
									
											// Compare with product
											if( $dateModified < $pModified )
												$dateModified = $pModified;
											if( $dateCreated < $pCreated )
												$dateCreated = $pCreated;
											
											$test[] = $row;
											
											if( !in_array( $row['ID'], $ids ) )
											{
												$prods[] = $row;
												
												$ids[] = $row['ID'];
											}
										}
									}
									
									$attr = [];
									
									if( $prods )
									{
										foreach( $prods as $row )
										{
											$o = new stdClass();
											
											$o->mva = 1.25; $o->size = false;
								
											$o->price = 0;
								
											//$o->price = (string)( $row['KOSTPRIS'] * $o->mva );
											
											$o->price = (string)( $row['PRIS1'] * $o->mva );
											
											/*$test[] = 'SELECT TOP 1 * FROM vareview WHERE Klientnr = "1" AND ( id = "' . $row['ID'] . '" OR id = "' . $row['VariantAvID'] . '" ) ';
						
											if( $blabla = sybase_query( 'SELECT TOP 1 * FROM vareview WHERE Klientnr = "1" AND ( id = "' . $row['ID'] . '" OR id = "' . $row['VariantAvID'] . '" ) ' ) )
											{
												if( $bla = sybase_fetch_assoc( $blabla ) )
												{
													$test[] = $bla;
								
													$price = (string)$bla['_pris1inkl'];
								
													//die( print_r( $test,1 ) . ' [] ' . $price );
												}
											}*/
											
											if( $blabla = /*sybase_query(*/$this->db->query( 'SELECT TOP 1 * FROM vareekstern WHERE ID = \'' . trim( $row['ID'] ) . '\' AND KLIENTNR = \'1\' AND AKTIVVARE > 0 AND WEBAKTIV > 0 ' ) )
											{
												//$test[] = 'SELECT * FROM vareekstern WHERE ID = "' . trim( $row['ID'] ) . '" AND KLIENTNR = "1" AND AKTIVVARE > 0 AND WEBAKTIV > 0 ';
							
												//$pris2 = $pris;
												
												//if( $bla = sybase_fetch_assoc( $blabla ) )
												foreach( $blabla as $bla )
												{
													$o->price = round( (string)$bla['_Pris1Inkl'] );
												}
												
												//die( print_r( $bla,1 ) . ' [] pris: ' . $price . ' [] fallback: ' . $pris2 );
											}
											
											// lager -----------------------------------------------------------------------------------
											
											$o->stock = '0';
											
											if( $lager2 = /*sybase_query(*/$this->db->query( $q2 = '
												SELECT TOP 10 l.* 
												FROM lagerinfo l 
												WHERE l.VareId = \'' . $row['ID'] . '\' 
												ORDER BY l.ID 
											' ) )
											{
												$test[] = $q2;
												
												//while( $rowl2 = sybase_fetch_assoc( $lager2 ) )
												foreach( $lager2 as $rowl2 )
												{
													$test[] = $rowl2;
												
													if( trim( $rowl2['_disp'] ) )
													{
														$o->stock = floor( (string)( $o->stock + (string)$rowl2['_disp'] ) );
													
														//$totstock = floor( $totstock + $stock );
													}
												}
											
												//die( print_r( $test,1 ) . ' -- ' . $totstock . ' [] ' . $stock );
											}
											
											// variantinfo -----------------------------------------------------------------------------
											
											if( $varinfo = /*sybase_query(*/$this->db->query( $q4 = '
												SELECT TOP 20 i.* 
												FROM VariantInfo i 
												WHERE i.VareID = \'' . $row['ID'] . '\' 
												ORDER BY i.ID 
											' ) )
											{
												//$test[] = $q4;
												
												//while( $rowl4 = sybase_fetch_assoc( $varinfo ) )
												foreach( $varinfo as $rowl4 )
												{
													//$test[] = $rowl4;
												
													if( trim( $rowl4['Variant'] ) && !$o->size )
													{
														$o->size = trim( $rowl4['Variant'] );
													
														$sizes[] = $o->size;
													}
												}
											}
											
											// vareoversettelse ------------------------------------------------------------------------
											
											//$varlocal = sybase_query( $q5 = '
											//	SELECT TOP 1 n.* 
											//	FROM MLVarenavn n 
											//	WHERE n.VareID = \'' . $row['ID'] . '\' 
											//	ORDER BY n.ID 
											//' );
											
											//$test[] = $q5;
											
											//while( $rowl5 = sybase_fetch_assoc( $varlocal ) )
											//{
												//$test[] = $rowl5;
				
												//if( trim( $rowl5['Varenavn'] ) && !$artnr )
												//{
												//	$artnr = trim( (string)$rowl5['Varenavn'] );
												//}
				
												//if( trim( $rowl5['Webvarenavn'] ) )
												//{
												//	$cname = trim( (string)$rowl5['Webvarenavn'] );
												//}
				
												//if( trim( $rowl5['Varenavn'] ) && !$cname )
												//{
												//	$cname = trim( (string)$rowl5['Varenavn'] );
												//}
											//}
											
											// varianter -------------------------------------------------------------------------------
											
											// TODO: Find the correct table ...
											
											//$varianter = sybase_query( $q6 = '
											//	SELECT TOP 10 v.* 
											//	FROM Inkludervare v 
											//	WHERE v.VareID = \'' . $row['ID'] . '\' 
											//	ORDER BY v.ID 
											//' );
			
											//$test[] = $q6;
			
											//while( $rowl6 = sybase_fetch_assoc( $varianter ) )
											//{
											//	$test[] = $rowl6;
											//}
											
											$attr[$row['ID']] = $o;
										}
									
										// Loop through all products with the match on the product name in a certain category
										
										foreach( $prods as $row )
										{
											
											$o = ( isset( $attr[$row['ID']] ) ? $attr[$row['ID']] : new stdClass() );
											
											$price = $o->price;
											$stock = $o->stock;
											$size  = $o->size;
											
											if( $row['ImagePath'] && $row['ImageData'] )
											{
												if( strstr( $row[ 'ImagePath' ], '.' ) )
												{
													$imgname = end( explode( '\\', $row['ImagePath'] ) );
													$imgmime = ( 'image/' . end( explode( '.', $row['ImagePath'] ) ) );
												}
						
												$imgdata = $row['ImageData'];
											}
										
											
											$sku = trim( $row['VARENR'] );
								
											$artnr = trim( $row['VariantAvID'] );
											
											//$cname1 = $row['ID'];
											//$artnr = $row['ID'];
											//$sku = $row['ID'];
											
											if( !$row['VariantAvID'] || $row['VariantAvID'] == $row['ID'] )
											{
												$cname1 = str_replace( '/', QUICK_SLASH_REPLACEMENT, trim( $row['Varenavn'] ) );
												$cname2 = str_replace( '/', QUICK_SLASH_REPLACEMENT, trim( $row['VARENAVN'] ) );
											}
											
											$webinfo = ( !$webinfo ? str_replace( '#CRLF', "\n", $row['WEBINFO'] ) : $webinfo );
											
											$imgurl = ( !$imgurl ? $row['ImageUrl'] : $imgurl );
											
											$url = ( !$url ? $row['URL'] : $url );
															
											// TODO: Make this more universal, just for this one client, making it specific because of time restraint ...
								
											$obj = new stdClass();
											$obj->sku = $sku;
											$obj->regular_price = $price;
											$obj->manage_stock = true;
											
											if( !$stock )
											{
												$obj->backorders = 'notify';
											}
											else
											{
												$obj->backorders = 'yes';
											}
											
											$obj->stock_quantity = (string)$stock;
											
											if( $size )
											{
												$obj->attributes = json_decode( '[{"name": "Size", "option": "' . $size . '"}]' );
											}
											
											$data[] = $obj;
											
											$idnr = trim( $artnr ? $artnr : $row['ID'] );
											
										}
										
									}
									
									// If we are missing image on product check if category has an image and use that as fallback ...
										
									if( !$imgdata && $prod['ImagePath'] && $prod['ImageData'] )
									{
										if( strstr( $prod[ 'ImagePath' ], '.' ) )
										{
											$imgname = end( explode( '\\', $prod['ImagePath'] ) );
											$imgmime = ( 'image/' . end( explode( '.', $prod['ImagePath'] ) ) );
										}
							
										$imgdata = $prod['ImageData'];
									}
						
									if( !$imgurl && $prod['ImageUrl'] )
									{
										$imgurl = $prod['ImageUrl'];
									}
						
									if( $prod['WEBINFO'] )
									{
										$webinfo = str_replace( '#CRLF', "\n", $prod['WEBINFO'] );
									}
									
									// Only find one first or second sku or by id
									break;
								}
							}
						}
					}
					
					
					
					if( $sizes )
					{
						$ii = 0; $order = []; $def = array( 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL' );
						
						foreach( $def as $v )
						{
							foreach( $sizes as $s )
							{
								if( strtolower( $v ) == strtolower( $s ) && !isset( $order[$s] ) )
								{
									$order[$s] = $s;
								}
							}
						}
						
						for( $a = 0; $a < 100; $a++ )
						{
							foreach( $sizes as $s )
							{
								if( $a == $s && !isset( $order[$s] ) )
								{
									$order[$s] = $s;
								}
							}
						}
						
						$sizes = $order;
						
						$attributes = json_decode( '[{"name": "Size", "variation": "1", "options": ' . json_encode( $sizes ) . '}]' );
						
						$type = 'variable';
						
						$totstock = '';
						
						$price = '';
					}
					else
					{
						$attributes = false;
						
						$data = false;
						
						$type = 'simple';
						
						$idnr = $sku;
					}
					
					//die( print_r( $test,1 ) . ' -- [] -- ' . $q );
					
					// Add a meta information file
					$created  = date( 'Y-m-d H:i:s', $dateCreated  );
					$modified = date( 'Y-m-d H:i:s', $dateModified );
					
					// Original state of the file
					if( $infoMode )
					{
						$meta = array(
							'ID'           => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $idnr ) ), 'Encoding' => 'UTF-8' ),
							'Title'        => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( trim( $cname1 ? $cname1 : $cname2 ) ) ), 'Encoding' => 'UTF-8' ),
							'Type'         => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $type ) ), 'Encoding' => 'UTF-8' ),
							'Price'        => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $price ) ), 'Encoding' => 'UTF-8' ),
							'Stock'        => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $stock ) ), 'Encoding' => 'UTF-8' ),
							'Description'  => array( 'Type' => 'text',   'Length' => strlen( utf8_encode( $webinfo ) ), 'Encoding' => 'UTF-8' ),
							'Url'          => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $url ) ), 'Encoding' => 'UTF-8' ),
							'Attributes'   => array( 'Type' => 'string', 'Length' => strlen( utf8_encode( $attributes ? json_encode( $attributes ) : '' ) ), 'Encoding' => 'json' ), 
							'Data'         => array( 'Type' => 'string', 'Length' => strlen( $data ? json_encode( $data ) : '' ), 'Encoding' => 'json' ),
							//'Data2'        => array( 'Type' => 'string', 'Length' => strlen( $test ? json_encode( $test ) : '' ), 'Encoding' => 'json' ),
							'DateModified' => array( 'Type' => 'string', 'Length' => strlen( $modified ), 'Encoding' => 'UTF-8' ),
							'DateCreated'  => array( 'Type' => 'string', 'Length' => strlen( $created  ), 'Encoding' => 'UTF-8' )
						);
						
						if( trim( $imgdata ) )
						{
							$meta['Image'] = array( 'Type' => $imgmime, 'Length' => strlen( $imgdata ), 'Encoding' => 'base64', 'Name' => $imgname );
						}
						else
						{
							$meta['Image'] = array( 'Type' => 'string', 'Length' => strlen( $imgurl ), 'Encoding' => 'UTF-8' );
						}
						
						if( $mode )
						{
							return $this->expunge( json_encode( $meta ) );
						}
					
						return ( json_encode( $meta ) );
					}
					
					
					
					if( $mode )
					{
						if( $mode == 'rs' )
						{
							die( $imgdata ? base64_decode( $imgdata ) : '' );
						}
						else if( $mode == 'r' )
							print( 'ok<!--separate-->' );
						return $this->expunge( 
							utf8_encode( $idnr ) . 
							utf8_encode( trim( $cname1 ? $cname1 : $cname2 ) ) . 
							utf8_encode( $type ) . 
							utf8_encode( $price ) . 
							utf8_encode( $stock ) .
							utf8_encode( $webinfo ) . 
							utf8_encode( $url ) .
							utf8_encode( $attributes ? json_encode( $attributes ) : '' ) . 
							( $data ? json_encode( $data ) : '' ) . 
							//( $test ? json_encode( $test ) : '' ) . 
							utf8_encode( $modified ) .
							utf8_encode( $created ) .
							( trim( $imgdata ) ? $imgdata : $imgurl )
						);
					}
					
					return ( 
						utf8_encode( $idnr ) . 
						utf8_encode( trim( $cname1 ? $cname1 : $cname2 ) ) . 
						utf8_encode( $type ) . 
						utf8_encode( $price ) . 
						utf8_encode( $stock ) .
						utf8_encode( $webinfo ) . 
						utf8_encode( $url ) .
						utf8_encode( $attributes ? json_encode( $attributes ) : '' ) . 
						( $data ? json_encode( $data ) : '' ) . 
						//( $test ? json_encode( $test ) : '' ) .
						utf8_encode( $modified ) .
						utf8_encode( $created ) .
						( trim( $imgdata ) ? $imgdata : $imgurl )
					);
					
				}
				
				if( $mode )
				{
					return $this->expunge( 'fail<!--separate-->{"response":"[3]File does not exist."}' );
				}
			}
			return false;
		}
		
		/**
		 * @brief Close database connection and output a string
		 * 
		 * @param $string text string
		 * @return nothing
		**/
		private function expunge( $string )
		{
			if( $this->db )
			{
				$this->db = null;
				//sybase_close( $this->db );
				$GLOBALS[ 'quickDatabaseLink' . $this->Username . $this->Password . $this->Server ] = null;
			}
			return $string;
		}
		
		// Gets a file by path!
		function getFile( $path )
		{
			global $User, $Logger;
			
			$o = new stdClass();
			$o->path = $path;
			$o->command = 'read';
			
			$data = $this->dosAction( $o );
			
			$fobj = new stdClass();
			$fobj->_content = $data;
			
			// Return file object
			return $fobj;
			
			// TODO: DELETE OBSOLETE CODE
			
			/*// Get the components of the path
			list( $volume, $subpath ) = explode( ':', $path );
			
			//$Logger->log( 'Here is the sub path: ' . $subpath );
			
			if( trim( $subpath ) )
			{
				$subdirs = explode( '/', $subpath );
				
				//$Logger->Log( 'Here: ' . strtolower( i18n( 'i18n_products' ) ) . ' == ' . strtolower( $subdirs[0] ) );
				
				// We got a product subdirectory
				if( strtolower( i18n( 'i18n_products' ) ) == strtolower( $subdirs[0] ) )
				{
					$ppath = implode( '/', $subdirs );
					$len = strlen( $subdirs[0] );
					//$Logger->log( 'Trying path: ' . $ppath );
					$ppath = substr( $ppath, $len + 1, strlen( $ppath ) - $len );
					
					//$Logger->log( 'Trying path now: ' . $ppath );
					
					if( $file = $this->GetProduct( $ppath ) )
					{
						if( $this->db )
						{
							$this->db = null;
							//sybase_close( $this->db );
						}
						
						return $file;
					}
				}
			}
			
			return false;*/
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
			return false;
		}
		
		// Will read from file pointer x bytes
		function readFile( $fp, $bytes )
		{
			return NULL;
		}
	
		// Will write to pointer, data, x bytes
		function writeFile( $filePointer, $data, $bytes )
		{
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
			return false;
		}
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			/*// By ID
			if( preg_match( '/.*?\#\?([0-9]+)/i', $path, $m ) )
			{
				$fo = new dbIO( 'FSFolder' );
				if( $fo->Load( $m[1] ) )
				{
					// Security - make sure it's the right fs!
					if( $fo->FilesystemID != $this->ID ) return false;
					return $this->_deleteFolder( $fo, $recursive );
				}
				return false;
			}
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				//$Logger->log( 'Delete folder in subpath ' . $subPath . ' in fs ' . $this->Name . ': ---' );
				return $this->_deleteFolder( $fo, $recursive );
			}
			*/
			return false;
		}
	
		/**
		 * Gets a file by FriendUP path
		 * @param path the FriendUP full path
		 */ 
		function getFileByPath( $path )
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
	}
}

// Create a door...
$door = new DoorQuickNG( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
