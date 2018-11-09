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

global $args, $SqlDatabase, $User, $Config, $Logger;

include_once( 'php/classes/door.php' );

if( !defined( 'NODEDRIVE_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'NODEDRIVE_FILE_LIMIT', 524288000 );
}

// TODO: Implement connections to User, Result, Construct, etc And add UniqueID to all nodes, test adding files etc.

if( !class_exists( 'DoorNodeDrive' ) )
{
	class DoorNodeDrive extends Door
	{
		var $_NodeDatabase;
		var $_DatabaseCache; // Holds active database connection objects
		
		function onConstruct()
		{
			global $args, $SqlDatabase;
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			$this->_DatabaseCache = []; // Ready to use several databases if needed
			
			if( $this->ID && $this->Server && $this->Username && $this->Password && $this->Config )
			{
				$conf = json_decode( $this->Config );
				
				// TODO: Get better reporting on closed ports in dbIo ...
				
				$db = new SqlDatabase();
				if( isset( $conf->Database ) && $conf->Database && $db->Open( $this->Server . ( $this->Port ? ':' . $this->Port : '' ), $this->Username, $this->Password ) )
				{
					$db->SelectDatabase( $conf->Database );
					
					$this->_NodeDatabase = $db;
				}
				else
				{
					die('fail<!--separate-->could not connect to db');
				}
			}
			else
			{
				$this->_NodeDatabase = $SqlDatabase;
			}
			
			/* --- Node ---------------------------------------------------- */
			
			$d = new DbTable( 'Node', $this->_NodeDatabase );
			if( !$d->LoadTable() )
			{
				$this->_NodeDatabase->query( '
					CREATE TABLE IF NOT EXISTS `Node` 
					(
						`ID` bigint(20) auto_increment NOT NULL,
						`UniqueID` varchar(255),
						`Name` varchar(255),
						`IsDeleted` tinyint(4) NOT NULL default \'0\',
						`Timestamp` datetime,
						PRIMARY KEY(`ID`)
					)
				' );
			}
			else
			{
				$isdeleted = false;
				if ( isset ( $d->_fieldnames ) )
				{
					foreach ( $d->_fieldnames as $f )
					{
						if ( $f == 'IsDeleted' )
						{
							$isdeleted = true;
						}
					}
					if ( !$isdeleted )
					{
						$d->AddField ( 'IsDeleted', 'tinyint', array ( 'after'=>'Name', 'default_value'=>'\'0\'' ) );
					}
				}
			}
			
			/* --- NodeRelation -------------------------------------------- */
			
			$d = new DbTable( 'NodeRelation', $this->_NodeDatabase );
			if( !$d->LoadTable() )
			{
				$this->_NodeDatabase->query( '
					CREATE TABLE IF NOT EXISTS `NodeRelation`
					(
						`ID` bigint(20) auto_increment NOT NULL,
						`NodeID` varchar(255),
						`RelationID` varchar(255),
						`InfoID` varchar(255),
						`Timestamp` datetime,
						PRIMARY KEY(`ID`,`NodeID`,`RelationID`)
					)
				' );
			}
			
			/* --- RelationInfo --------------------------------------------- */
			
			$d = new DbTable( 'RelationInfo', $this->_NodeDatabase );
			if( !$d->LoadTable() )
			{
				$this->_NodeDatabase->query( '
					CREATE TABLE IF NOT EXISTS `RelationInfo`
					(
						`ID` bigint(20) auto_increment NOT NULL,
						`ValueBint` bigint(20) NOT NULL default \'0\',
						`ValueChar` varchar(255),
						`Name` varchar(255),
						PRIMARY KEY(`ID`)
					)
				' );
			}
			
			/* --- Blob --------------------------------------------- */
			
			$d = new DbTable( 'Blob', $this->_NodeDatabase );
			if( !$d->LoadTable() )
			{
				$this->_NodeDatabase->query( '
					CREATE TABLE IF NOT EXISTS `Blob`
					(
						`ID` bigint(20) auto_increment NOT NULL,
						`NodeID` varchar(255),
						`Name` varchar(255),
						`Filesize` varchar(255),
						`Data` longblob,
						`Uri` varchar(255),
						`Timestamp` datetime,
						PRIMARY KEY(`ID`,`NodeID`)
					)
				' );
			}
			
		}
		
		function makeLinks( $str )
		{
			// Convert x:// a href linkes into just x:// text
			$str = preg_replace( "/\<a[^>]*?\>[a-zA-Z]+\:\/\/(.*?)\<\/a\>/i", "$1", $str );
			// Convert www. text into http:// text
			$str = preg_replace( "/([^\w\/])(www\.[a-z0-9\-]+\.[a-z0-9\-]+)/i", "$1http://$2", $str );
			// Convert some x:// text that doesn't start with >http:// (ex) into <a href> links
			$str = preg_replace( "/[^>=\"a-z]{0,1}([a-zA-Z]*\:\/\/[\w-?&;\!\æ\ø\å\:\%\+#~=\.\/\@\(\)]+[\w-?&;\!\æ\ø\å\:\%\+#~=\.\/\@\(\)])/i", " <a " . ( strstr( $str, '/library/' ) ? '' : 'target="_blank"' ) . " href=\"$1\">$1</a>", $str );
			// Convert emails into links
			$str = preg_replace( "/([\w-?&;#~=\.\/]+\@(\[?)[a-zA-Z0-9\-\.]+\.([a-zA-Z]{2,3}|[0-9]{1,3})(\]?))/i", " <a href=\"mailto:$1\">$1</a>", $str );
			return $str;
		}
		
		function checkmimetype( $blob )
		{
			$imagesize = getimagesizefromstring( $blob );
			
			if( $imagesize !== false && isset( $imagesize['mime'] ) )
			{
				$mimetype = $imagesize['mime'];
			}
			else if ( class_exists( 'finfo' ) )
			{
				$finfo    = new finfo( FILEINFO_MIME );
				$mimetype = $finfo->buffer( $blob );
			}
			else
			{
				$mimetype = "application/octet-stream";
			}
			
			return $mimetype;
		}
		
		function embedYoutube ( $url, $width, $height, $auto = true, $control = true, $active = true )
		{
			$url = explode( '/', $url );
			$url = end( $url );
			
			if( strstr( $url, '?v=' ) )
			{
				$url = explode( '?v=', $url );
				$url = end( $url );
			}
			
			$str = '<iframe ' . ( $active ? 'class="active" ' : 'onmouseover="this.className=\'active\'" onclick="this.className=\'active\'" ' ) . 'width="' . $width . '" height="' . $height . '" src="//www.youtube.com/embed/' . $url . ( $auto ? '?autoplay=1' : '?autoplay=0' ) . ( $control ? '&controls=1' : '&controls=0' ) . '&showinfo=0" frameborder="0" allowfullscreen></iframe>';
			return trim( $str );
		}
		
		function embedPDF ( $url, $width, $height, $active = true )
		{
			$str = '<iframe type="application/pdf" ' . ( $active ? 'class="active" ' : 'onmouseover="this.className=\'active\'" onclick="this.className=\'active\'" ' ) . 'width="' . $width . '" height="' . $height . '" src="' . trim( $url ) . '" frameborder="0"></iframe>';
			return trim( $str );
		}
		
		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function getSubFolder( $subPath, $dirid = false, $trash = false )
		{
			global $Logger, $SqlDatabase;
			
			// Overwrite ... something is wrong somewhere else in the system -_-
			$trash = false;
			
			if( $subPath && substr( $subPath, 0, 6 ) == 'Trash/' )
			{
				$trash = ( !$trash ? true : $trash ); 
				$subPath = str_replace( 'Trash/', '', $subPath );
			}
			
			//$inputPath = $subPath;
			
			if( $subPath == '/' ) return false;
			
			//$Logger->log( 'Ok, we have subpath: ' . print_r( $subPath, 1 ) );
			
			$fo = false;
			// If we got a filename, strip the last joint
			if( strstr( $subPath, ':' ) )
			{
				list( , $subPath ) = explode( ':', $subPath );
			}
			
			// Watch out for wrong formatting! (just for validation)
			if( substr( $subPath, -1, 1 ) != '/' )
			{
				return false;
			}
			
			// But we don't need the trailing slash here
			$subPath = substr( $subPath, 0, strlen( $subPath ) - 1 );
			
			// Get all parts
			$finalPath = explode( '/', $subPath );
			
			$lastdata = end( $finalPath );
			
			if( $lastdata && strstr( $lastdata, '#?' ) && ( $nid = trim( str_replace( '#?', '', $lastdata ) ) ) )
			{
				if( $do = $this->_NodeDatabase->FetchObject( $q = '
					SELECT n.*, r.NodeID AS DirectoryID 
					FROM Node n, NodeRelation r 
					WHERE
							n.ID = \'' . $nid . '\' 
						AND r.RelationID = n.ID 
				' ) )
				{
					//$Logger->log( 'We found final path3: ' . $lastdata . ' [] ' . strstr( $lastdata, '#?' ) . ' [] ' . trim( str_replace( '#?', '', $lastdata ) ) . ' [] ' . print_r( $do,1 ) );
					return $do;
				}
				
				return false;
			}
			
			//$Logger->log( 'We found final path: ' . implode( '/', $finalPath ) );
			
			$fld = [];
			$fo = false;
			$parID = '0';
			$pfo = false;
			while( count( $finalPath ) > 0 )
			{
				//$Logger->log('We do now check this path: ' . implode( '/', $finalPath ) . ' with Parent Folder ID of ' . $parID );
				if( $fo ) $pfo = $fo; // Previous folder
				$do = $this->_NodeDatabase->FetchObject( '
					SELECT n.*, r.NodeID AS DirectoryID 
					FROM Node n, NodeRelation r 
					WHERE
							n.Name = \'' . $finalPath[0] . '\' 
						AND r.RelationID = n.ID 
						AND r.NodeID = \'' . $parID . '\' 
						' . ( $trash ? 'AND n.IsDeleted = "1"' : 'AND n.IsDeleted = "0"' ) . '
				' );
				if( $do && $do->ID > 0 )
				{
					// Create a usable object
					//$fo = new DbIO( 'Node', $this->_NodeDatabase );
					//$fo->SetFromObject( $do );
					
					$out = [];
					for( $a = 1; $a < count( $finalPath ); $a++ )
					{
						//$Logger->log('stuck here? ...' . $a);
						$out[] = $finalPath[$a];
					}
					$finalPath = $out;
					//$parID = $fo->ID;
					//$fld[] = $fo->Name;
					$parID = $do->ID;
					$fld[] = $do->Name;
					
					$fo = $do;
				}
				else
				{
					// If this last joint might be a file, return parent id
					$Logger->log('Not a real folder "' . $finalPath[0] . '"? -> COULD NOT LOAD NodeDrive Folder // FilesystemID: ' . $this->ID .  ' // FolderID ' . $fo->DirectoryID . ' // Name ' . $fo->Name . ' // ParID ' . $parID . ' // Trash ' . $trash );
					//return false;
					return $fo;
				}
				//$Logger->log('Our current folder ID is '. $fo->ID . ' || ' . $fo->Name . ' || ' . json_encode($finalPath));
			}
			
			$Logger->log('We return the folder ID ' . $fo->ID . ' for the original input ' . $inputPath );
			return $fo;
		}
		
		function _getSubFolders( $fo = false, $recursive = false, $fld = false, $dir = false, $trash = false )
		{
			global $Logger, $User, $SqlDatabase;
			
			// Also list all sub folders!
			if( $recursive )
			{
				if( is_array( $fld ) && $fo )
				{
					$fld[] = $fo;
					
					$obj = new stdClass();
					//$obj->_data = $fo;
					
					foreach( $fo as $k=>$v )
					{
						$obj->{$k} = $v;
					}
					
					$obj->_files = false;
					
					if( $fil = $this->_NodeDatabase->FetchObjects( $q = '
						SELECT "File" AS Type, f.ID, "" AS UniqueID, f.FolderID AS DirectoryID, f.Filename AS Name, f.UserID, f.Filesize, f.Permissions, "0" AS IsDeleted, f.DateModified, f.DateCreated 
						FROM FSFile f 
						WHERE
								f.FilesystemID = \'' . $this->ID . '\'
							AND f.UserID = \'' . $User->ID . '\'
							AND f.FolderID = \'' . $fo->ID . '\'
							
					' ) )
					{
						if( !$obj->_files )
						{
							$obj->_files = [];
						}
						
						foreach( $fil as $fi )
						{
							$obj->_files[] = $fi;
						}
					}
					
					if( $fil = $this->_NodeDatabase->FetchObjects( $q = '
						SELECT "File" AS Type, ID, "" AS UniqueID, NodeID AS DirectoryID, Name, Data, Uri, "" AS UserID, Filesize, "" AS Permissions, "0" AS IsDeleted, "" AS DateModified, Timestamp AS DateCreated 
						FROM `Blob` 
						WHERE NodeID = \'' . $fo->ID . '\' 
					' ) )
					{
						if( !$obj->_files )
						{
							$obj->_files = [];
						}
						
						foreach( $fil as $fi )
						{
							if( $fi->Data )
							{
								$data = '';
								
								if( base64_encode( base64_decode( $fi->Data, true ) ) === $fi->Data )
                                {
                               		$fi->Data = base64_decode( $fi->Data );
                                }
								
								if( $mimetype = $this->checkmimetype( $fi->Data ) )
								{
									if( strstr( $mimetype, 'image' ) )
									{
										$data = 'data:image/jpeg;base64,' . base64_encode( $fi->Data );
									}
									else if( strstr( $fi->Name, '.pdf' ) )
									{
										$data = 'data:application/octet-stream;base64,' . base64_encode( $fi->Data );
										//$data = $this->embedPDF( 'data:application/octet-stream;base64,' . base64_encode( $fi->Data ), 230, 460, false );
									}
									else if( strstr( $fi->Name, '.mp3' ) || strstr( $fi->Name, '.mp4' ) )
									{
										$data = 'data:audio/mp3;base64,' . base64_encode( $fi->Data );
									}
									else if( strstr( $fi->Data, 'youtube.com/watch?v=' ) || strstr( $fi->Data, 'youtu.be/' ) )
									{
										$data = $this->embedYoutube( $fi->Data, 230, 160, false );
									}
									else if ( is_string( $fi->Data ) )
									{
										$data = $this->makeLinks( $fi->Data );
									}
								}
								
								$fi->Data = $data;
							}
							
							$obj->_files[] = $fi;
						}
					}
					
					$obj->_directories = false;
				}
				
				if( $fop = $this->_NodeDatabase->FetchObjects( '
					SELECT
						"Directory" AS Type,
						n.ID, n.UniqueID,
						r.NodeID AS DirectoryID,
						n.Name,
						"0" AS UserID,
						n.IsDeleted,
						n.Timestamp,
						r.InfoID
					FROM
						Node n,
						NodeRelation r 
					WHERE
							r.RelationID = n.ID 
						AND r.NodeID = \'' . ( $fo ? $fo->ID : '0' ) . '\'
						' . ( !$trash ? '
						AND n.IsDeleted = "0"' : '
						' ) . '
				' ) )
				{					
					$ri = [];
					
					if( $relinfo = $this->_NodeDatabase->FetchObjects( '
						SELECT 
							i.*,
							f.ID AS FSID, 
							f.Name AS FSName, 
							f.Type AS FSType, 
							f.Server AS FSServer, 
							f.Path AS FSPath, 
							f.Mounted AS FSMounted, 
							u.ID AS FUID, 
							u.Name AS FUName, 
							u.Fullname AS FUFullname 
						FROM 
							RelationInfo i 
								LEFT JOIN Filesystem f ON 
								(
										i.Name = "Filesystem" 
									AND f.ID = i.ValueBint 
								)
								LEFT JOIN FUser u ON 
								(
										i.Name = "FUser" 
									AND u.ID = i.ValueBint 
								)
					' ) )
					{
						foreach( $relinfo as $re )
						{
							$ri[$re->ID] = $re;
						}
					}
					
					foreach( $fop as $fopp )
					{
						if( $fopp->InfoID )
						{
							if( $info = explode( ',', $fopp->InfoID ) )
							{
								foreach( $info as $in )
								{
									if( isset( $ri[$in] ) )
									{
										if( !isset( $fopp->Data ) )
										{
											$fopp->Data = new stdClass();
										}
										
										if( !isset( $fopp->Data->{$ri[$in]->Name} ) )
										{
											$fopp->Data->{$ri[$in]->Name} = $ri[$in];
										}
									}
								}
							}
						}
						
						$fopp->Name = htmlentities( $fopp->Name );
						
						$fopp->Path = ( ( $fo->Path && substr( $fo->Path, -1, 1 ) != ':' ) ? ( $fo->Path . '/' ) : $fo->Path ) . $fopp->Name;
						
						/*if( isset( $fopp->Data->Filesystem->FSName ) )
						{
							if( strstr( $fopp->Path, ':' ) )
							{
								$ph = explode( ':', $fopp->Path );
								
								$fopp->Path = str_replace( ( $ph[0] . ':' ), '', $fopp->Path );
							}
							
							$fopp->Path = $fopp->Data->Filesystem->FSName . ':' . $fopp->Path;
						}*/
						
						$fld = $this->_getSubFolders( $fopp, $recursive, ( $fld ? $fld : [] ), $dir, $trash );
						
						if( $fld[1] )
						{
							if( !isset( $obj->_files ) )
							{
								if( !isset( $obj ) )
								{
									$obj = [];
								}
								
								$obj[] = $fld[1];
							}
							else
							{
								if( !$obj->_directories )
								{
									$obj->_directories = [];
								}
								
								$obj->_directories[] = $fld[1];
							}
						}
						
						$fld = $fld[0];
					}
				}
				
				if( isset( $obj ) )
				{
					$dir = $obj;
				}
			}
			else
			{
				// Get folder based on id
				if( $fop = $this->_NodeDatabase->FetchObjects( '
					SELECT
						"Directory" AS Type,
						n.ID, n.UniqueID,
						r.NodeID AS DirectoryID,
						n.Name, "0" AS UserID,
						n.IsDeleted,
						n.Timestamp,
						r.InfoID 
					FROM
						Node n,
						NodeRelation r 
					WHERE
							r.RelationID = n.ID 
						AND r.NodeID = \'' . ( $fo ? $fo->ID : '0' ) . '\'
						' . ( !$trash ? '
						AND n.IsDeleted = "0"' : '
						' ) . '
				' ) )
				{
					if( !$fld )
					{
						$fld = [];
					}
					
					$ri = [];
					
					if( $relinfo = $this->_NodeDatabase->FetchObjects( '
						SELECT 
							i.*,
							f.ID AS FSID, 
							f.Name AS FSName, 
							f.Type AS FSType, 
							f.Server AS FSServer, 
							f.Path AS FSPath, 
							f.Mounted AS FSMounted, 
							u.ID AS FUID, 
							u.Name AS FUName, 
							u.Fullname AS FUFullname 
						FROM 
							RelationInfo i 
								LEFT JOIN Filesystem f ON 
								(
										i.Name = "Filesystem" 
									AND f.ID = i.ValueBint 
								)
								LEFT JOIN FUser u ON 
								(
										i.Name = "FUser" 
									AND u.ID = i.ValueBint 
								)
					' ) )
					{
						foreach( $relinfo as $re )
						{
							$ri[$re->ID] = $re;
						}
					}
					
					foreach( $fop as $fopp )
					{
						if( $fopp->InfoID )
						{
							if( $info = explode( ',', $fopp->InfoID ) )
							{
								foreach( $info as $in )
								{
									if( isset( $ri[$in] ) )
									{
										if( !isset( $fopp->Data ) )
										{
											$fopp->Data = new stdClass();
										}
										
										if( !isset( $fopp->Data->{$ri[$in]->Name} ) )
										{
											$fopp->Data->{$ri[$in]->Name} = $ri[$in];
										}
									}
								}
							}
						}
						
						$fopp->Name = htmlentities( $fopp->Name );
						
						$fopp->Path = ( ( $fo->Path && substr( $fo->Path, -1, 1 ) != ':' ) ? ( $fo->Path . '/' ) : $fo->Path ) . $fopp->Name;
						
						/*if( isset( $fopp->Data->Filesystem->FSName ) )
						{
							if( strstr( $fopp->Path, ':' ) )
							{
								$ph = explode( ':', $fopp->Path );
								
								$fopp->Path = str_replace( ( $ph[0] . ':' ), '', $fopp->Path );
							}
							
							$fopp->Path =  $fopp->Data->Filesystem->FSName . ':' . $fopp->Path;
						}*/
						
						$obj = new stdClass();
						//$obj->_data = $fopp;
						
						foreach( $fopp as $k=>$v )
						{
							$obj->{$k} = $v;
						}
						
						$obj->_files = false;
						
						if( $fil = $this->_NodeDatabase->FetchObjects( '
							SELECT "File" AS Type, f.ID, "" AS UniqueID, f.FolderID AS DirectoryID, f.Filename AS Name, f.UserID, f.Filesize, f.Permissions, "0" AS IsDeleted, f.DateModified, f.DateCreated 
							FROM FSFile f 
							WHERE
									f.FilesystemID = \'' . $this->ID . '\'
								AND f.UserID = \'' . $User->ID . '\'
								AND f.FolderID = \'' . $fopp->ID . '\' 
						' ) )
						{
							$obj->_files = [];
							
							foreach( $fil as $fi )
							{
								$obj->_files[] = $fi;
							}
						}
						
						if( $fil = $this->_NodeDatabase->FetchObjects( $q = '
							SELECT "File" AS Type, ID, "" AS UniqueID, NodeID AS DirectoryID, Name, Data, Uri, "" AS UserID, Filesize, "" AS Permissions, "0" AS IsDeleted, "" AS DateModified, Timestamp AS DateCreated 
							FROM `Blob` 
							WHERE NodeID = \'' . $fopp->ID . '\' 
						' ) )
						{
							if( !$obj->_files )
							{
								$obj->_files = [];
							}
							
							foreach( $fil as $fi )
							{
								$obj->_files[] = $fi;
							}
						}
						
						$obj->_directories = false;
						
						//$fld[] = $fopp;
						$fld[] = $obj;
						$dir[] = $obj;
					}
				}
			}
			
			if( $fld )
			{
				return array( $fld, $dir );
			}
			
			return false;
		}
		
		/*function _setObjectInStructure( $array, $obj = false )
		{
			if( $array && $obj )
			{
				foreach( $array as $val )
				{
					if( ( ( $val->_data && $val->_data->ID == $obj->DirectoryID ) || $val->ID == $obj->DirectoryID ) && $obj->Type == 'File' )
					{
						if( !$val->_files )
						{
							$val->_files = [];
						}
						
						$val->_files[] = $obj;
					}
					else if( ( ( $val->_data && $val->_data->ID == $obj->ID ) || $val->ID == $obj->ID ) && $obj->Type == 'Directory' )
					{
						//$val->_data = $obj;
						
						foreach( $obj as $k=>$v )
						{
							$val->{$k} = $v;
						}
						
						return $array;
					}
					else if( $val->_directories )
					{
						$val->_directories = $this->_setObjectInStructure( $val->_directories, $obj );
					}
				}
				
				return $array;
			}
			
			return false;
		}*/
		
		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
			
			//$Logger->log( 'Executing a dos action: ' . $args->command );
			//$Logger->log( 'Pure args: ' . print_r( $args, 1 ) );
			
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
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$args->path = $path[1] . ':' . $path[2];
				}
				else $args->path = implode( ':', $path );
				if( isset( $args->args ) && isset( $args->args->path ) )
				{
					unset( $args->args->path );
				}
			}
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				$fo = false; $fids = []; $struct = false; $trash = true;
				
				$id = isset( $args->id ) ? $args->id : ( isset( $args->args->id ) ? $args->args->id : false );
				
				// Can we get sub folder?
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				
				// Testing .... Have to find out how to get the correct path from the external source or try to find by virtual path and check by uniqueid
				if( strstr( $thePath, 'WisdomWork:Everything/Morten' ) )
				{
					$thePath = str_replace( 'Everything/Morten', 'Morten', $thePath );
				}
				
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					//$subPath = str_replace( 'Trash/', '', $subPath );
					
					$fo = $this->getSubFolder( $subPath, $id, $trash );
					
					if( strstr( $thePath, ':*' ) || strstr( $thePath, ':#?*' ) || strstr( $thePath, '/*' ) || strstr( $thePath, '/#?*' ) )
					{
						if( $flds = $this->_getSubFolders( $fo, true, false, false, $trash ) )
						{
							if( isset( $flds[0] ) )
							{
								foreach( $flds[0] as $fld )
								{
									if( !isset( $fids[$fld->FolderID] ) )
									{
										$fids[$fld->FolderID] = $fld->FolderID;
									}
								}
							}
							if( isset( $flds[1] ) )
							{
								// TODO: Set paths in this object because we need recursive paths
								
								$struct = $flds[1];
							}
						}
						
						$thePath = str_replace( array( ':*', ':#?*', '/*', '/#?*' ), array( ':', ':', '', '' ), $thePath );
					}
					else if( $fo && is_object( $fo ) )
					{
						$fids[] = $fo->ID;
					}
					
					// Failed to find a path
					if( !strstr( $thePath, ':Trash' ) && !$fo && !$fids ) die( 'fail<!--separate-->Path error.' );
				}
				
				$fids = ( $fids && is_array( $fids ) ? implode( ',', $fids ) : '0' );
				
				$out = []; $del = [];
				
				$entries = false;
				
				$entries1 = $this->_NodeDatabase->FetchObjects( $q1 = '
					SELECT * FROM
					(
						(
							SELECT 
								"Directory" AS `Type`, 
								n.ID, n.UniqueID, 
								n.Name, "" AS Permissions, 
								"0" AS DateModified, 
								n.Timestamp AS DateCreated, 
								"0" AS Filesize, 
								"0" AS UserID, 
								r.NodeID AS DirectoryID,
								r.InfoID, 
								n.IsDeleted 
							FROM 
								Node n, 
								NodeRelation r 
							WHERE 
									n.ID = r.RelationID
								AND r.NodeID IN (' . $fids . ') 
						)
					) z
					/*ORDER BY `Name` ASC*/ 
				' );
				
				$entries2 = $this->_NodeDatabase->FetchObjects( $q2 = '
					SELECT * FROM
					(
						(
							SELECT
								"File" AS `Type`,
								ID,
								"" AS UniqueID,
								Filename AS `Name`,
								Permissions,
								DateModified,
								DateCreated,
								Filesize,
								UserID,
								FolderID AS DirectoryID,
								"0" AS IsDeleted 
							FROM
								FSFile
							WHERE
									FilesystemID=\'' . $this->ID . '\'
								AND UserID=\'' . $User->ID . '\'
								AND FolderID IN (' . $fids . ') 
						)
					) z
					/*ORDER BY `Name` ASC*/ 
				' );
				
				$entries3 = $this->_NodeDatabase->FetchObjects( $q3 = '
					SELECT * FROM
					(
						(
							SELECT
								"File" AS `Type`,
								ID,
								"" AS UniqueID,
								Name,
								/*Data,*/
								Uri,
								"" AS Permissions,
								"" AS DateModified,
								Timestamp AS DateCreated,
								Filesize,
								"" AS UserID,
								NodeID AS DirectoryID,
								"0" AS IsDeleted 
							FROM
								`Blob` 
							WHERE
								NodeID IN (' . $fids . ') 
						)
					) z
					/*ORDER BY `Name` ASC*/ 
				' );
				
				$entries = false;
				
				if( $entries1 )
				{
					$entries = $entries1;
				}
				
				if( $entries2 )
				{
					$entries = ( $entries ? array_merge( $entries, $entries2 ) : $entries2 );
				}
				
				if( $entries3 )
				{
					$entries = ( $entries ? array_merge( $entries, $entries3 ) : $entries3 );
				}
				
				$Logger->log( print_r( $entries,1 ) . ' -- ' );
				
				if( $entries )
				{
					// Get shared files
					$files = [];
					$paths = [];
					$userids = [];
					
					$ri = [];
					
					// TODO: Find a way to join tables that exists another place or run the queck of other tables under the query
					
					if( $relinfo = $this->_NodeDatabase->FetchObjects( $qi = '
						SELECT 
							i.*,
							f.ID AS FSID, 
							f.Name AS FSName, 
							f.Type AS FSType, 
							f.Server AS FSServer, 
							f.Path AS FSPath, 
							f.Mounted AS FSMounted, 
							u.ID AS FUID, 
							u.Name AS FUName, 
							u.Fullname AS FUFullname 
						FROM 
							RelationInfo i 
								LEFT JOIN Filesystem f ON 
								(
										i.Name = "Filesystem" 
									AND f.ID = i.ValueBint 
								)
								LEFT JOIN FUser u ON 
								(
										i.Name = "FUser" 
									AND u.ID = i.ValueBint 
								)
					' ) )
					{
						foreach( $relinfo as $re )
						{
							$ri[$re->ID] = $re;
						}
					}
					//die( print_r( $ri,1 ) . ' --' );
					foreach( $entries as $k=>$entry )
					{
						if( $entry->Type == 'File' )
						{
							$entries[$k]->Path = $thePath . $entry->Name . ( $entry->Type == 'Directory' ? '/' : '' );
							$paths[] = $entry->Path;
							$files[] = $entry->ID;
							$f = false;
							foreach( $userids as $kk=>$v )
							{
								if( $v == $entry->UserID )
								{
									$f = true;
									break;
								}
							}
							if( !$f )
							{
								$userids[] = $entry->UserID;
							}
							$entries[$k]->Shared = 'Private';
						}
						
						if( $entry->Type == 'Directory' && $entry->InfoID )
						{
							if( $info = explode( ',', $entry->InfoID ) )
							{
								foreach( $info as $in )
								{
									if( isset( $ri[$in] ) )
									{
										if( !isset( $entry->Data ) )
										{
											$entry->Data = new stdClass();
										}
										
										if( !isset( $entry->Data->{$ri[$in]->Name} ) )
										{
											$entry->Data->{$ri[$in]->Name} = $ri[$in];
										}
									}
								}
							}
						}
					}
					
					if( $shared = $SqlDatabase->FetchObjects( $q = '
						SELECT Path, UserID, ID, `Name`, `Hash` FROM FFileShared s
						WHERE
							s.DstUserSID = "Public" AND s.Path IN ( "' . implode( '", "', $paths ) . '" ) AND
							s.UserID IN ( ' . implode( ', ', $userids ) . ' )
					' ) )
					{
						foreach( $entries as $k=>$entry )
						{
							foreach( $shared as $sh )
							{
								if( isset( $entry->Path ) && isset( $sh->Path ) && $entry->Path == $sh->Path && $entry->UserID == $sh->UserID )
								{
									$entries[$k]->Shared = 'Public';
									
									$link = ( $Config->SSLEnable == 1 ? 'https' : 'http' ) . '://';
									$link .= $Config->FCHost . ':' . $Config->FCPort . '/sharedfile/' . $sh->Hash . '/' . $sh->Name;
									$entries[$k]->SharedLink = $link;
								}
							}
						}
					}
					
					/*if( $blobs = $SqlDatabase->FetchObjects( $q = '
						SELECT * 
						FROM Blob 
						WHERE NodeID IN ( ' . $fids . ' ) 
					' ) )
					{
						foreach( $blobs as $blob )
						{
							$o = new stdClass();
							$o->Filename = $blob->Name;
							$o->Type = 'File';
							$o->ID = $blob->ID;
							$o->DirectoryID = $blob->NodeID;
							$o->UniqueID = '';
							$o->Permissions = '';
							$o->DateModified = '';
							$o->DateCreated = '';
							$o->Filesize = $blob->Filesize;
							$o->Data = $blob->Data;
							
							$entries[] = $o;
						}
					}*/
					
					// List files
					foreach( $entries as $entry )
					{
						$o = new stdClass();
						$o->Filename = $entry->Name;
						$o->Type = $entry->Type;
						
						if( $o->Type == 'Directory' && isset( $entry->Data->Symlink ) )
						{
							$o->MetaType = 'Symlink';
						}
						else
						{
							$o->MetaType = $entry->Type; // TODO: Is this really needed??
						}
						
						$o->ID = $entry->ID;
						$o->DirectoryID = $entry->DirectoryID;
						$o->UniqueID = $entry->UniqueID;
						$o->Permissions = $entry->Permissions;
						$o->DateModified = $entry->DateModified;
						$o->DateCreated = $entry->DateCreated;
						$o->Filesize = $entry->Filesize;
						$o->Path = end( explode( ':', $thePath . $o->Filename . ( $o->Type == 'Directory' ? '/' : '' ) ) );
						$o->Data = $entry->Data;
						
						$o->Uri = ( isset( $entry->Uri ) ? $entry->Uri : '' );
						
						if( $o->Type == 'Directory' && isset( $entry->Data->Result ) )
						{
							$o->IconClass = 'System_Result';
						}
						else if( $o->Type == 'Directory' && isset( $entry->Data->Construct ) )
						{
							$o->IconClass = 'System_Construct';
						}
						
						if( isset( $entry->Data->Filesystem->FSName ) )
						{
							if( strstr( $o->Path, ':' ) )
							{
								$ph = explode( ':', $o->Path );
								
								$o->Path = str_replace( ( $ph[0] . ':' ), '', $o->Path );
							}
							
							$o->Path = $entry->Data->Filesystem->FSName . ':' . $o->Path;
						}
						
						$o->Shared = isset( $entry->Shared ) ? $entry->Shared : '';
						$o->SharedLink = isset( $entry->SharedLink ) ? $entry->SharedLink : '';
						
						if( $entry->IsDeleted == 1 )
						{
							$del[] = $o;
						}
						else
						{
							$out[] = $o;
						}
						
						
						
						//if( $struct )
						//{
						//	$struct = $this->_setObjectInStructure( $struct, $o );
						//}
					}
					
					
					// If we are browsing Trash
					if( strstr( $thePath, ':Trash' ) )
					{
						$out = $del;
					}
					// Else If we are at root add the virtual file .library
					else if( $fids == '0' )
					{
						$vf = new stdClass();
						$vf->Filename = 'wisdom.library';
						$vf->Type = 'File';
						$vf->MetaType = 'Executable'; // TODO: Is this really needed??
						$vf->ID = 0;
						$vf->DirectoryID = 0;
						$vf->UniqueID = 0;
						$vf->Permissions = '';
						$vf->DateModified = 0;
						$vf->DateCreated = 0;
						$vf->Filesize = 0;
						$vf->Path = end( explode( ':', $thePath . $vf->Filename ) );
						$vf->Shared = '';
						$vf->SharedLink = '';
						
						$out[] = $vf;
						
						$vf = new stdClass();
						$vf->Filename = 'Trash';
						$vf->Type = 'Directory';
						$vf->MetaType = 'Directory'; // TODO: Is this really needed??
						$vf->IconClass = 'System_Trashcan' . ( $del ? '_Full' : '' );
						$vf->ID = 0;
						$vf->DirectoryID = 0;
						$vf->UniqueID = 0;
						$vf->Permissions = '';
						$vf->DateModified = 0;
						$vf->DateCreated = 0;
						$vf->Filesize = 0;
						$vf->Path = end( explode( ':', $thePath . $vf->Filename . '/' ) );
						$vf->Shared = '';
						$vf->SharedLink = '';
						
						$out[] = $vf;
					}
					//die( print_r( $del,1 ) . ' --' );
					//die( print_r( $out,1 ) );
					//die( print_r( $out,1 ) . ' -- ' . print_r( $struct,1 ) );
					return 'ok<!--separate-->' . json_encode( $out )/* . ( $struct ? ( '<!--separate-->' . json_encode( $struct ) ) : '' )*/;
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'call' )
			{
				//
				
				if( strstr( $args->path, ':wisdom.library' ) )
				{
					if( $args->args->id > 0 || $args->args->directoryId > 0 || $args->args->uniqueId > 0 )
					{
						$fop = $this->_NodeDatabase->FetchObject( $q = '
							SELECT "Directory" AS Type, n.*, r.NodeID AS DirectoryID, "0" AS UserID 
							FROM Node n, NodeRelation r 
							WHERE
									n.IsDeleted = "0" 
								AND r.RelationID = n.ID
								' . ( $args->args->id > 0 ? '
								AND r.RelationID = \'' . $args->args->id . '\'
								' : '' )
								. ( $args->args->directoryId > 0 ? '
								AND r.NodeID = \'' . $args->args->directoryId . '\'
								' : '' )
								. ( $args->args->uniqueId > 0 ? '
								AND n.UniqueID = \'' . $args->args->uniqueId . '\'
								' : '' ) . '
						' );
						
						$fop->Path = $args->path;
					}
					else $fop = false;
					//die( print_r( $fop,1 ) . ' [] ' . $q . ' .. ' . print_r( $args,1 ) );
					switch( $args->args->query )
					{
						case 'listdir':
							
							if( $flds = $this->_getSubFolders( $fop, $args->args->recursions ) )
							{
								if( $args->args->hierarchical )
								{
									if( $flds[1] )
									{
										die( 'ok<!--separate-->' . json_encode( $flds[1] ) );
									}
								}
								else
								{
									if( $flds[0] )
									{
										die( 'ok<!--separate-->' . json_encode( $flds[0] ) );
									}
								}
							}
							
							die( 'failed' );
							
							break;
						
						//case 'renamedir':
						//	
						//	if( $fop && $args->args->name != '' )
						//	{
						//		$f = new DbIO( 'Node', $this->_NodeDatabase );
						//		$f->ID = $fop->ID;
						//		if( $f->Load() )
						//		{
						//			$f->Name = $args->args->name;
						//			$f->Timestamp = date( 'Y-m-d H:i:s' );
						//			$f->Save();
						//			
						//			die( 'ok<!--separate-->Renamed the directory.' );
						//		}
						//	}
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'makedir':
						//	
						//	if( $args->args->name != '' )
						//	{
						//		// Make sure the folder does not already exist!
						//		if( $this->_NodeDatabase->FetchObject( '
						//			SELECT n.*, r.NodeID AS DirectoryID 
						//			FROM Node n, NodeRelation r 
						//			WHERE 
						//					n.Name = \'' . $args->args->name . '\' 
						//				AND r.RelationID = n.ID 
						//				AND r.NodeID = \'' . ( $fop ? $fop->ID : '0' ) . '\' 
						//		' ) )
						//		{
						//			die( 'fail<!--separate-->Directory already exists.' );
						//		}
						//		else
						//		{
						//			$n = new DbIO( 'Node', $this->_NodeDatabase );
						//			$n->UniqueID = hash( 'sha256', str_replace( ' ', '', rand(0,999).rand(0,999).rand(0,999).microtime() ) );
						//			$n->Name = $args->args->name;
						//			$n->Timestamp = date( 'Y-m-d H:i:s' );
						//			if( $n->Save() )
						//			{
						//				// User connected to creation of node
						//				
						//				$i1 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
						//				$i1->Name = 'FUser';
						//				$i1->ValueBint = $User->ID;
						//				$i1->Load();
						//				$i1->Save();
						//				
						//				// Filesystem connected to creation of node
						//				
						//				$i2 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
						//				$i2->Name = 'Filesystem';
						//				$i2->ValueBint = $this->ID;
						//				$i2->Load();
						//				$i2->Save();
						//				
						//				// Relation data connected to creation of node
						//				
						//				$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
						//				$r->NodeID = ( $fop ? $fop->ID : '0' );
						//				$r->RelationID = $n->ID;
						//				$r->Load();
						//				$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i1->ID."," ) ) ? ( $r->InfoID.",".$i1->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i1->ID ) : $i1->ID ) );
						//				$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i2->ID."," ) ) ? ( $r->InfoID.",".$i2->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i2->ID ) : $i2->ID ) );
						//				$r->Timestamp = date( 'Y-m-d H:i:s' );
						//				$r->Save();
						//			}
						//			
						//			//$this->_NodeDatabase->query( 'INSERT INTO `NodeRelation` ( `NodeID`, `RelationID`, `InfoID`, `Timestamp` ) VALUES ( \'' . ( $fop ? $fop->ID : '0' ) . '\', \'' . $n->ID . '\', \'' . $r->ID . '\', \'' . date( 'Y-m-d H:i:s' ) . '\' )' );
						//			
						//			die( 'ok<!--separate-->' . $f->ID );
						//		}
						//	}
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'deletedir':
						//	
						//	if( $fop )
						//	{
						//		// Delete all folders and files recursive
						//		if( $this->_deleteFolder( $fop, true ) )
						//		{
						//			die( 'ok' );
						//		}
						//	}
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'movedir':
						//	
						//	die( 'TODO' );
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'renamefile':
						//	
						//	die( 'TODO' );
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'deletefile':
						//	
						//	die( 'TODO' );
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						//case 'movefile':
						//	
						//	die( 'TODO' );
						//	
						//	die( 'failed' );
						//	
						//	break;
						
						case 'typeset':
							
							if( isset( $fop->ID ) && ( $args->args->infoId || $args->args->infoName != '' ) )
							{
								// Make sure the folder does not already exist!
								if( $node = $this->_NodeDatabase->FetchObject( '
									SELECT 
										n.*, 
										r.ID AS NodeRelationID, 
										r.NodeID AS DirectoryID 
									FROM 
										Node n, 
										NodeRelation r 
									WHERE 
											n.ID = \'' . $fop->ID . '\' 
										AND r.RelationID = n.ID 
								' ) )
								{
									// Type of node found in RelationInfo
									
									$i = new DbIO( 'RelationInfo', $this->_NodeDatabase );
									if( $args->args->infoId   ) $i->ID = $args->args->infoId;
									if( $args->args->infoName ) $i->Name = $args->args->infoName;
									$i->Load();
									$i->Save();
									
									if( $i->ID > 0 )
									{
										// Relation data connected RelationInfo
										
										$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
										$r->ID = $node->NodeRelationID;
										if( $r->Load() && !strstr( ( ",".$r->InfoID."," ), ( ",".$i->ID."," ) ) )
										{
											$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i->ID."," ) ) ? ( $r->InfoID.",".$i->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i->ID ) : $i->ID ) );
											$r->Save();
											
											die( 'ok<!--separate-->' . $r->ID );
										}
										
										die( 'ok<!--separate-->no change' );
									}
								}
							}
							
							die( 'failed' );
							
							break;
						
						case 'typeremove':
							
							if( isset( $fop->ID ) && ( $args->args->infoId || $args->args->infoName != '' ) )
							{
								// Make sure the folder does not already exist!
								if( $node = $this->_NodeDatabase->FetchObject( '
									SELECT 
										n.*, 
										r.ID AS NodeRelationID, 
										r.NodeID AS DirectoryID 
									FROM 
										Node n, 
										NodeRelation r 
									WHERE 
											n.ID = \'' . $fop->ID . '\' 
										AND r.RelationID = n.ID 
								' ) )
								{
									// Type of node found in RelationInfo
									
									$i = new DbIO( 'RelationInfo', $this->_NodeDatabase );
									if( $args->args->infoId   ) $i->ID = $args->args->infoId;
									if( $args->args->infoName ) $i->Name = $args->args->infoName;
									if( $i->Load() )
									{
										// Relation data connected RelationInfo
										
										$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
										$r->ID = $node->NodeRelationID;
										if( $r->Load() && strstr( ( ",".$r->InfoID."," ), ( ",".$i->ID."," ) ) )
										{
											$r->InfoID = str_replace( ( ",".$i->ID."," ), ",", ( ",".$r->InfoID."," ) );
											$r->InfoID = ( substr( $r->InfoID, 0, 1 ) == "," ? substr( $r->InfoID, 1 )     : $r->InfoID );
											$r->InfoID = ( substr( $r->InfoID, -1 ) == ","   ? substr( $r->InfoID, 0, -1 ) : $r->InfoID );
											$r->Save();
											
											die( 'ok<!--separate-->' . $r->ID );
										}
										
										die( 'ok<!--separate-->no change' );
									}
								}
							}
							
							die( 'failed' );
							
							break;
						
						case 'link':
							
							//die( print_r( $args,1 ) . ' --' );
							
							// Only supports node id for link atm path will be in the future for dos commands
							if( $args->args->link && $fop->ID > 0 )
							{
								// Make sure the link does not already exist!
								if( $this->_NodeDatabase->FetchObject( '
									SELECT n.*, r.NodeID AS DirectoryID 
									FROM Node n, NodeRelation r 
									WHERE 
											n.ID = \'' . $args->args->link . '\' 
										AND r.RelationID = n.ID 
										AND r.NodeID = \'' . $fop->ID . '\' 
								' ) )
								{
									die( 'fail<!--separate-->Symlink already exists.' );
								}
								else
								{
									// User connected to creation of relation
									
									$i1 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
									$i1->Name = 'FUser';
									$i1->ValueBint = $User->ID;
									$i1->Load();
									$i1->Save();
									
									// Filesystem connected to creation of relation
									
									$i2 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
									$i2->Name = 'Filesystem';
									$i2->ValueBint = $this->ID;
									$i2->Load();
									$i2->Save();
									
									// Symlink connected to creation of relation
									
									$i3 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
									$i3->Name = 'Symlink';
									$i3->Load();
									$i3->Save();
									
									// Relation data connected to creation of node
									
									$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
									$r->NodeID = $fop->ID;
									$r->RelationID = $args->args->link;
									$r->Load();
									$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i1->ID."," ) ) ? ( $r->InfoID.",".$i1->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i1->ID ) : $i1->ID ) );
									$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i2->ID."," ) ) ? ( $r->InfoID.",".$i2->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i2->ID ) : $i2->ID ) );
									$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i3->ID."," ) ) ? ( $r->InfoID.",".$i3->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i3->ID ) : $i3->ID ) );
									$r->Timestamp = date( 'Y-m-d H:i:s' );
									$r->Save();
									
									die( 'ok<!--separate-->' . $r->ID );
								}
							}
							
							die( 'failed' );
							
							break;
						
						default:
							
							die( 'failed: ' . $args->args->query . ' is not defined' );
							
							break;
					}
				}
				
				die( 'fail' );
			}
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
				
				// TODO: Get this to work through webdav don't seem to manage to read root of Disk no specific error message ...
				
				// Is it a folder?
				if( substr( $path, -1, 1 ) == '/' )
				{
					if( $sp = $this->getSubFolder( trim( end( explode( ':', $path ) ) ) ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = end( explode( ':', $path ) );
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = $sp->Name;
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
				}
				else if( substr( $path, -1, 1 ) == ':' )
				{
					// its our mount itself

					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = '';
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
					if( strstr( $path, 'wisdom.library' ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'File';
						$fldInfo->MetaType = 'Executable';
						$fldInfo->Path = $path;
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = 'wisdom.library';
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					else if( strstr( $path, 'Trash' ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = end( explode( ':', $path ) );
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = 'Trash';
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					
										
										
					/*// Create a file object
					$f = new dbIO( 'FSFile' );
					$f->FilesystemID = $this->ID;
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Filename = $fname;
					//$f->UserID = $User->ID; // TODO: Add for security!
					$f->FolderID = '0';
					$fn = '';
	
					// Can we get sub folder?
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{	
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						if( $fo = $this->getSubFolder( $subPath ) )
							$f->FolderID = $fo->ID;	
					}
	
					// Try to load database object
					if( $f->Load() )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'File';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = $path;
						$fldInfo->Filesize = $f->Filesize;
						$fldInfo->Filename = $f->Filename;
						$fldInfo->DateCreated = $f->DateCreated;
						$fldInfo->DateModified = $f->DateModified;
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					// We added a directory after all..
					else
					{
						if( $sp = $this->getSubFolder( $path . '/' ) )
						{
							$fldInfo = new stdClass();
							$fldInfo->Type = 'Directory';
							$fldInfo->MetaType = $fldInfo->Type;
							$fldInfo->Path = end( explode( ':', $path ) );
							$fldInfo->Filesize = 0;
							$fldInfo->Filename = $sp->Name;
							$fldInfo->DateCreated = $sp->DateCreated;
							$fldInfo->DateModified = $sp->DateModified;
							die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
						}
					}*/
				}
				die( 'fail<!--separate-->Could not find file!' );
			}
			else if( $args->command == 'write' )
			{
				// We need to check how much is in our database first
				$deletable = false;
				$total = 0;
				
				$Logger->log( 'write => ' . $args->path );
				
				// If we have Blob database use the blob
				$d = new DbTable( 'Blob', $this->_NodeDatabase );
				if( $d->LoadTable() )
				{
					if( $sum = $this->_NodeDatabase->FetchObject( 'SELECT SUM(b.Filesize) z FROM `Blob` b' ) )
					{
						$total = $sum->z;
					}
					
					// Create a file object
					$f = new dbIO( 'Blob', $this->_NodeDatabase );
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Name = $fname;
					$f->NodeID = '0';
					
					// Can we get sub folder?
					$fo = false;
					
					$args->path = str_replace( ':/', ':', $args->path );
					
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						
						$Logger->log( '[1] We will try to find the folder ID for this path now ' . $subPath );
						if( $fo = $this->getSubFolder( $subPath ) )
						{
							$f->NodeID = $fo->ID;
						}
					}
					
					// Check if file exists
					if( $f->Load() )
					{
						// Just overwrite file...
						//die( 'fail<!--separate-->File exists' );
					}
					
					$len = 0;
					
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
									$f->Data = base64_encode( $fr );
								}
								else
								{
									$fr = file_get_contents( $args->tmpfile );
									$f->Data = base64_encode( $fr );
								}
							}
						}
						else
						{
							$Logger->log( 'Write: Tempfile does not exist.' );
							die( 'fail<!--separate-->Tempfile does not exist!' );
						}
					}
					else
					{
						if( $total + strlen( $args->data ) < NODEDRIVE_FILE_LIMIT )
						{
							$f->Data = base64_encode( $args->data );
						}
						else
						{
							$Logger->log( 'Write: Limit broken' );
							die( 'fail<!--separate-->Limit broken' );
						}
					}
					
					$f->Filesize = $len;
					$f->Timestamp = date( 'Y-m-d H:i:s' );
					$f->Save();
					$Logger->log( '[1] Write: wrote new file with id: ' . $f->ID . ' [] ' . $f->_lastError );
					return 'ok<!--separate-->' . $len . '<!--separate-->' . $f->ID;
				}
				// Use default FSFile for storage of files
				else
				{
					if( $sum = $SqlDatabase->FetchObject( '
						SELECT SUM(u.Filesize) z FROM FSFile u 
						WHERE u.UserID=\'' . $User->ID . '\' AND FilesystemID = \'' . $this->ID . '\'
					' ) )
					{
						$total = $sum->z;
					}
					
					// Create a file object
					$f = new dbIO( 'FSFile' );
					$f->FilesystemID = $this->ID;
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Filename = $fname;
					$f->UserID = $User->ID;
					$f->FolderID = '0';
					
					// Can we get sub folder?
					$fo = false;
					
					$args->path = str_replace( ':/', ':', $args->path );
					
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						
						$Logger->log( '[2] We will try to find the folder ID for this path now ' . $subPath );
						if( $fo = $this->getSubFolder( $subPath ) )
						{
							$f->FolderID = $fo->ID;	
						}
					}
					
					// Overwrite existing and catch object
					if( $f->Load() )
					{
						$deletable = $Config->FCUpload . $f->DiskFilename;
						$Logger->log( 'Yay, overwriting existing file -> ' . $f->DiskFilename . '!: ' . $f->FolderID );
						$fn = $f->DiskFilename;
					}
					else
					{
						$fn = $f->Filename;
						$f->DiskFilename = '';
					}
					
					// Write the file
					
					// The file is new, make sure we don't overwrite any existing file
					if( $f->ID <= 0 )
					{
						$ofn = $fn;
						$fna = end( explode( '.', $ofn ) );
						while( file_exists( $Config->FCUpload . $fn ) )
						{
							// Keep extension last
							if( $fna )
							{
								$fn = substr( $ofn, 0, strlen( $ofn ) - 1 - strlen( $fna ) ) . rand(0,9999) . rand(0,9999) . rand(0,9999) . '.' . $fna;
							}
							// Has no extension
							else $fn .= rand(0,99999); 
						}
					}
					if( $file = fopen( $Config->FCUpload . $fn, 'w+' ) )
					{
						// Delete existing file
						if( $deletable ) unlink( $deletable );
						
						if( isset( $args->tmpfile ) )
						{
							if( file_exists( $args->tmpfile ) )
							{
								fclose( $file );
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
										if( $fo = fopen( $args->tmpfile, 'w' ) )
										{
											fwrite( $fo, $fr );
											fclose( $fo );
										}
									}
								}
								
								if( $total + $len < NODEDRIVE_FILE_LIMIT )
								{
									rename( $args->tmpfile, $Config->FCUpload . $fn );
								}
								else
								{
									$Logger->log( 'Write: Limit broken' );
									die( 'fail<!--separate-->Limit broken' );
								}
							}
							else
							{
								$Logger->log( 'Write: Tempfile does not exist.' );
								die( 'fail<!--separate-->Tempfile does not exist!' );
							}
						}
						else
						{
							if( $total + strlen( $args->data ) < NODEDRIVE_FILE_LIMIT )
							{
								$len = fwrite( $file, $args->data );
								fclose( $file );
							}
							else
							{
								fclose( $file );
								$Logger->log( 'Write: Limit broken' );
								die( 'fail<!--separate-->Limit broken' );
							}
						}
						
						$f->DiskFilename = $fn;
						$f->Filesize = filesize( getcwd() . '/' . $Config->FCUpload . $fn );
						if( !$f->DateCreated ) $f->DateCreated = date( 'Y-m-d H:i:s' );
						$f->DateModified = date( 'Y-m-d H:i:s' );
						$f->Save();
						$Logger->log( '[2] Write: wrote new file with id: ' . $f->ID );
						return 'ok<!--separate-->' . $len . '<!--separate-->' . $f->ID;
					}
				}
				$Logger->log( 'Write: could not write file..' );
				return 'fail<!--separate-->Could not write file: ' . $Config->FCUpload . $fn;
			}
			else if( $args->command == 'read' )
			{
				// TODO: Create Support for blob file output and meta data output from external sources
				
				// If we have Blob database use the blob
				$d = new DbTable( 'Blob', $this->_NodeDatabase );
				if( $d->LoadTable() )
				{
					// Create a file object
					$f = new dbIO( 'Blob', $this->_NodeDatabase );
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Name = $fname;
					$f->NodeID = '0';
					
					// Can we get sub folder?
					$fo = false;
					
					$args->path = str_replace( ':/', ':', $args->path );
					
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						
						$Logger->log( '[3] We will try to find the folder ID for this path now ' . $subPath );
						
						if( $fo = $this->getSubFolder( $subPath ) )
						{
							$f->NodeID = $fo->ID;
						}
					}
					
					// Try to load database object
					if( $f->Load() )
					{
						// Read the file
						
						if( $f->Data )
						{
							$mime = false; $found = false;
							
							if( base64_encode( base64_decode( $f->Data, true ) ) === $f->Data )
							{
								$f->Data = base64_decode( $f->Data );
							}
							
							$imagesize = @getimagesizefromstring( $f->Data );
							
							if( $imagesize !== false && isset( $imagesize['mime'] ) )
							{
								$found = true;
								$mime = $imagesize['mime'];
							}
							else if ( class_exists( 'finfo' ) )
							{
								$found = true;
								$finfo    = new finfo( FILEINFO_MIME );
								$mime = $finfo->buffer( $f->Data );
							}
							
							// Try to guess the mime type
							if( !$mime && $ext = end( explode( '.', $f->Name ) ) )
							{
								switch( strtolower( $ext ) )
								{
									case 'mp3': $mime = 'audio/mp3'; break;
									case 'avi': $mime = 'video/avi'; break;
									case 'mp4': $mime = 'video/mp4'; break;
									case 'ogg': $mime = 'audio/ogg'; break;
									case 'jpg': $mime = 'image/jpeg'; break;
									case 'mpeg':
									case 'mpg': $mime = 'video/mpeg'; break;
									default: break;
								}
							}
							
							if( strstr( $f->Name, '.meta' ) && ( strstr( $f->Data, 'youtube.com/watch?v=' ) || strstr( $f->Data, 'youtu.be/' ) ) )
							{
								$f->Data = $this->embedYoutube( $f->Data, 240, 150, false );
							}
							
							// Some data is raw
							if( isset( $args->mode ) && ( $args->mode == 'rb' || $args->mode == 'rs' ) )
							{
								die( $f->Data );
							}
							
							// Return ok
							$okRet = 'ok<!--separate-->';
							
							if( $mime && $found )
							{
								friendHeader( 'Content-Length: ' . $f->Filesize + strlen( $okRet ) );
								return $okRet . base64_encode( $f->Data );
							}
						
							friendHeader( 'Content-Length: ' . $f->Filesize + strlen( $okRet ) );
							return $okRet . trim( $f->Data );
						}
					}
				}
				else
				{
					// Create a file object
					$f = new dbIO( 'FSFile' );
					$f->FilesystemID = $this->ID;
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Filename = $fname;
					//$f->UserID = $User->ID; // TODO: Add for security!
					$f->FolderID = '0';
					$fn = '';
				
					// Can we get sub folder?
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						if( $fo = $this->getSubFolder( $subPath ) )
						{
							$f->FolderID = $fo->ID;
						}
					}
				
					// Try to load database object
					if( $f->Load() )
					{
						// Read the file
						$fn = $f->DiskFilename;
						$fname = $Config->FCUpload . $fn;
						if( file_exists( $fname ) )
						{
							$info = @getimagesize( $fname );
						
							// Only give this on images
							// TODO: Perhaps content-length is for binary types!
							$mime = false;
							if( isset( $info ) && isset( $info[0] ) && $info[0] > 0 )
							{
								$mime = $info['mime'];
							}
						
							// Try to guess the mime type
							if( !$mime && $ext = end( explode( '.', $fname ) ) )
							{
								switch( strtolower( $ext ) )
								{
									case 'mp3': $mime = 'audio/mp3'; break;
									case 'avi': $mime = 'video/avi'; break;
									case 'mp4': $mime = 'video/mp4'; break;
									case 'ogg': $mime = 'audio/ogg'; break;
									case 'jpg': $mime = 'image/jpeg'; break;
									case 'mpeg':
									case 'mpg': $mime = 'video/mpeg'; break;
									default: break;
								}
							}
						
							// Some data is raw
							if( isset( $args->mode ) && ( $args->mode == 'rb' || $args->mode == 'rs' ) )
							{
								if( $df = fopen( $fname, 'r' ) )
								{
									$buffer = 10240;
									while( $str = fread( $df, $buffer ) )
									{
										echo( $str );
									}
									fclose( $df );
									die();
								}
							}
						
							// Return ok
							$okRet = 'ok<!--separate-->';
						
							if( isset( $info[0] ) && $info[0] > 0 && $info[1] > 0 )
							{
								friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
								return $okRet . base64_encode( file_get_contents( $fname ) );
							}
						
							friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
							return $okRet . trim( file_get_contents( $fname ) );
						}
					}
				}
				return 'fail<!--separate-->Could not read file: ' . $Config->FCUpload . $fn . '<!--separate-->' . print_r( $f, 1 );
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				if( $dir = opendir( 'import' ) )
				{
					$fcount = 0;
					while( $f = readdir( $dir ) )
					{
						if( $f{0} == '.' ) continue;
						
						$fl = new dbIO( 'FSFile' );
						$fl->FilesystemID = $this->ID;
						$fl->FolderID = '0';
						$fl->UserID = $User->ID;
						$fl->Filename = $f;
						$fl->Filesize = filesize( 'import/' . $f );
						
						$ext = end( explode( '.', $f ) );
						$fname = substr( $f, 0, strlen( $f ) - ( strlen( $ext ) + 1 ) );
						$filename = $fname . '.' . $ext;
						
						while( file_exists( $Config->FCUpload . $filename ) )
						{
							$filename = $fname . rand(0,999) . '.' . $ext;
						}
						
						$fl->DiskFilename = $filename;
						
						copy( 'import/' . $f, $Config->FCUpload . $filename );
						if( file_exists( $Config->FCUpload . $filename ) )
						{
							unlink( 'import/' . $f );
							
							$fl->Save();
							
							// Only on success
							if( $fl->ID > 0 )
							{
								$fcount++;
							}
							else
							{
								unlink( $Config->FCUpload . $filename );
							}
						}
					}
					closedir( $dir );
					if( $fcount > 0 )
					{
						die( 'ok<!--separate-->' . $fcount );
					}
					die( 'fail<!--separate-->Wrote no files.' );
				}
				die( 'fail<!--separare-->Could not open dir.' );
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
					WHERE FilesystemID = \'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\' 
				' ) )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = $row->FZ;
					$o->Filesize = NODEDRIVE_FILE_LIMIT;
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}
				die( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$id 	= false;
				$path   = $args->path;
				
				switch( $action )
				{
					case 'mount':
						$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						//$Logger->log( 'Are we even here? ' . $path );
						ob_clean();
						// Is it a folder?
						if( substr( $path, -1, 1 ) == '/' )
						{
							//$Logger->Log( 'Node drive tries to getSubFolder: ' . $path );
							$sp = $this->getSubFolder( $path, $id );
							if( $sp )
							{
								// Make sure the folder does not already exist!
								if( $this->_NodeDatabase->FetchObject( '
									SELECT n.*, r.NodeID AS FolderID 
									FROM Node n, NodeRelation r 
									WHERE 
											n.Name = \'' . $args->newname . '\' 
										AND r.RelationID = n.ID 
										AND r.NodeID = \'' . ( $sp->DirectoryID ? $sp->DirectoryID : '0' ) . '\' 
								' ) )
								{
									//$Logger->log( 'Directory already exists.' );
									die( 'fail<!--separate-->Directory already exists.' );
								}
								else
								{
									$f = new DbIO( 'Node', $this->_NodeDatabase );
									$f->ID = $sp->ID;
									if( $f->Load() )
									{
										$f->Name = $args->newname;
										$f->Timestamp = date( 'Y-m-d H:i:s' );
										$f->Save();
										//$Logger->log( 'Renamed the directory.' );
										die( 'ok<!--separate-->Renamed the directory.' );
									}
								}
								//$Logger->log( 'Could not find directory.' );
								die( 'fail<!--separate-->Could not find the directory.' );
							}
						}
						// Ok, it's a file
						else
						{
							$p = explode( ':', $path );
							$fname = false;
							if( strstr( $p[1], '/' ) )
							{
								$pth = explode( '/', $p[1] );
								$fname = array_pop( $pth );
								$p[1] = implode( '/', $pth ) . '/';
							}
							else
							{
								$fname = array_pop( $p );	
							}
							$p = implode( ':', $p );
							$sp = $this->getSubFolder( $p, $id );
							if( $fname )
							{
								$f = new dbIO( 'FSFile' );
								if( $sp ) $f->FolderID = $sp->ID;
								else $f->FolderID = '0';
								$f->Filename = $fname;
								$f->FilesystemID = $this->ID;
								if( $f->Load() )
								{
									$f->Filename = $args->newname;
									$f->Save();
									die( 'ok<!--separate-->Renamed the file.' );
								}
							}
						}
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						
						// Add trailing '/'
						if( substr( $path, -1, 1 ) != '/' && substr( $path, -1, 1 ) != ':' )
						{
							$path .= '/';
						}
						
						if( $path )
						{
							// Get by path (subfolder)
							$subPath = false;
							if( is_string( $path ) && strstr( $path, ':' ) )
							{
								$subPath = end( explode( ':', $path ) );
							}
							
							// Remove filename
							$fo = false;
							if( $subPath )
							{
								// Strip '/' here
								if( substr( $subPath, -1, 1 ) == '/' )
								{
									$subPath = substr( $subPath, 0, strlen( $subPath ) - 1 );
								}
								if( strstr( $subPath, '/' ) )
								{
									$subPath = explode( '/', $subPath );
									array_pop( $subPath );
									$subPath = implode( '/', $subPath ) . '/';
								}
								$fo = $this->getSubFolder( $subPath, $id );
							}
							
							// Do it
							$name = end( explode( ':', $path ) );
							if( substr( $name, -1, 1 ) == '/' )
							{
								$name = substr( $name, 0, strlen( $name ) - 1 );
							}
							if( strstr( $name, '/' ) )
							{
								$name = end( explode( '/', $name ) );
							}
							
							if( trim( $name ) )
							{
								$name = trim( $name );
								if( substr( $name, -1, 1 ) == '/' )
								{
									$name = substr( $name, 0, strlen( $name ) - 1 );
								}
								$newFolder = end( explode( '/', $name ) );
								
								// Make sure the folder does not already exist!
								if( !strstr( $path, ':Trash' ) && $this->_NodeDatabase->FetchObject( '
									SELECT n.*, r.NodeID AS FolderID 
									FROM Node n, NodeRelation r 
									WHERE
											n.IsDeleted = "0"
										AND n.Name = \'' . $newFolder . '\' 
										AND r.RelationID = n.ID 
										AND r.NodeID = \'' . ( $fo ? $fo->ID : '0' ) . '\' 
								' ) )
								{
									$Logger->log( 'Directory already exists. ' . $newFolder . ' (in ' . $path . ') did ' . ( $fo ? $fo->ID : '0' ) );
									//die( 'fail<!--separate-->Directory already exists.' );
									die( 'ok<!--separate-->{"message":"Directory already exists","response":-2}' );
								}
								else
								{
									//$n = new DbIO( 'Node', $this->_NodeDatabase );
									//$n->UniqueID = hash( 'sha256', str_replace( ' ', '', rand(0,999).rand(0,999).rand(0,999).microtime() ) );
									//$n->Name = $newFolder;
									//$n->Timestamp = date( 'Y-m-d H:i:s' );
									//if( strstr( $path, ':Trash' ) )
									//{
									//	$n->IsDeleted = 1;
									//}
									//$n->Save();
									
									//$this->_NodeDatabase->query( 'INSERT INTO `NodeRelation` ( `NodeID`, `RelationID`, `InfoID`, `Timestamp` ) VALUES ( \'' . ( $fo ? $fo->ID : '0' ) . '\', \'' . $n->ID . '\', \'\', \'' . date( 'Y-m-d H:i:s' ) . '\' )' );
									
									$n = new DbIO( 'Node', $this->_NodeDatabase );
									$n->UniqueID = hash( 'sha256', str_replace( ' ', '', rand(0,999).rand(0,999).rand(0,999).microtime() ) );
									$n->Name = $newFolder;
									$n->Timestamp = date( 'Y-m-d H:i:s' );
									if( strstr( $path, ':Trash' ) )
									{
										$n->IsDeleted = 1;
									}
									if( $n->Save() )
									{
										// User connected to creation of node
										
										$i1 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
										$i1->Name = 'FUser';
										$i1->ValueBint = $User->ID;
										$i1->Load();
										$i1->Save();
										
										// Filesystem connected to creation of node
										
										$i2 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
										$i2->Name = 'Filesystem';
										$i2->ValueBint = $this->ID;
										$i2->Load();
										$i2->Save();
										
										// Relation data connected to creation of node
										
										$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
										$r->NodeID = ( $fo ? $fo->ID : '0' );
										$r->RelationID = $n->ID;
										$r->Load();
										$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i1->ID."," ) ) ? ( $r->InfoID.",".$i1->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i1->ID ) : $i1->ID ) );
										$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i2->ID."," ) ) ? ( $r->InfoID.",".$i2->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i2->ID ) : $i2->ID ) );
										$r->Timestamp = date( 'Y-m-d H:i:s' );
										$r->Save();
									}
									
									$Logger->log( 'Made directory ' . $n->Name . ' (in ' . $path . ') id ' . $n->ID );
									return 'ok<!--separate-->' . $n->ID;
								}
							}
						}
						die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						if( isset( $path ) )
						{
							if( $this->deleteFile( $path, true, ( $args->notrash ? true : false ) ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
					// Move files and folders or a whole volume to another door
					case 'copy':
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						$Logger->log( "Attempting to copy from $from to $to.." );
						if( isset( $from ) && isset( $to ) )
						{
							$Logger->log( 'Trying from ' . $from . ' to ' . $to );
							if( $this->copyFile( $from, $to ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
					
					case 'ln':
					case 'link':
					case 'symlink':
						die( print_r( $args,1 ) . ' --' );
						break;
				}
			}
			return 'fail<!--separate-->' . print_r( $args, 1 );
		}
		
		// Gets a file by path!
		function getFile( $path )
		{
			global $User, $Logger;
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
			
			$Logger->log( 'Trying to get file.. ------------------->' );
			$Logger->log( 'Path was: ' . $path );
			$Logger->log( 'Sub path is therefore: ' . $subPath );
			
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
			else $fi->Filename = end( explode( ':', $path ) );
			
			if( $fi->Load() )
			{
				$fobject = new Object();
				$fobject->Path = end( explode( ':', $path ) );
				$fobject->Filename = $fi->Filename;
				$fobject->Filesize = $fi->Filesize;
				$fobject->Type = 'NodeDrive';
				$fobject->FileInfo = $fi;
				$fobject->Permissions = $fi->Permissions;
				$fobject->Door = $this;
				return $fobject;
			}
			return false;
		}
		
		// Will open and return a file pointer set with options
		function openFile( $path, $mode )
		{
			global $Config, $User;
			
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
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
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
			}
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
			{
				return NULL;
			}
			
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
			{
				return NULL;
			}
			
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
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
			else $fi->Filename = end( explode( ':', $path ) );
			
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$ext = end( explode( '.', $fi->DiskFilename ) );
					$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
					$filename = $fname . '.' . $ext;		
					while( file_exists( $Config->FCTmp . $filename ) )
					{
						$filename = $fname . rand(0,999) . '.' . $ext;
					}
					// Make tmp file
					copy( $Config->FCUpload . $fi->DiskFilename, $Config->FCTmp . $filename );
					return $Config->FCTmp . $filename;
				}
			}
			return false;
		}
		
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;
			
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
				{
					$filename = $fname . rand(0,999) . '.' . $ext;
				}
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
			
			return false;
		}
		
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;
			
			// TODO: Put creator of node in relation
			
			// New folder		
			//$nfo = new DbIO( 'Node', $this->_NodeDatabase );
			//$nfo->UserID = $User->ID;
			//$nfo->FilesystemID = $this->ID;
			
			// TODO: Check if this where is correct for finding path
			
			// Remove file from path
			$subFolder = $where;
			if( strstr( $subFolder, ':' ) )
			{
				$subFolder = end( explode( ':', $subFolder ) );
			}
			if( substr( $subFolder, -1, 1 ) == '/' )
			{
				$subFolder = substr( $subFolder, 0, strlen( $subFolder ) - 1 );
			}
			if( strstr( $subFolder, '/' ) )
			{
				$subFolder = explode( '/', $subFolder );
				array_pop( $subFolder );
				$subFolder = implode( '/', $subFolder ) . '/';
			}
			
			$fo = $this->getSubFolder( $subFolder );
			
			$n = false;
			
			if( $this->_NodeDatabase->FetchObject( '
				SELECT n.*, r.NodeID AS FolderID 
				FROM Node n, NodeRelation r 
				WHERE 
						n.Name = \'' . $folderName . '\' 
					AND r.RelationID = n.ID 
					AND r.NodeID = \'' . ( $fo ? $fo->ID : '0' ) . '\' 
			' ) )
			{
				die( 'fail<!--separate-->Directory already exists.' );
			}
			else
			{
				//$n = new DbIO( 'Node', $this->_NodeDatabase );
				//$n->UniqueID = hash( 'sha256', str_replace( ' ', '', rand(0,999).rand(0,999).rand(0,999).microtime() ) );
				//$n->Name = $folderName;
				//$n->Timestamp = date( 'Y-m-d H:i:s' );
				//$n->Save();
				
				//$this->_NodeDatabase->query( 'INSERT INTO `NodeRelation` ( `NodeID`, `RelationID`, `InfoID`, `Timestamp` ) VALUES ( \'' . ( $fo ? $fo->ID : '0' ) . '\', \'' . $n->ID . '\', \'\', \'' . date( 'Y-m-d H:i:s' ) . '\' )' );
				
				$n = new DbIO( 'Node', $this->_NodeDatabase );
				$n->UniqueID = hash( 'sha256', str_replace( ' ', '', rand(0,999).rand(0,999).rand(0,999).microtime() ) );
				$n->Name = $folderName;
				$n->Timestamp = date( 'Y-m-d H:i:s' );
				if( strstr( $where, ':Trash' ) )
				{
					$n->IsDeleted = 1;
				}
				if( $n->Save() )
				{
					// User connected to creation of node
					
					$i1 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
					$i1->Name = 'FUser';
					$i1->ValueBint = $User->ID;
					$i1->Load();
					$i1->Save();
					
					// Filesystem connected to creation of node
					
					$i2 = new DbIO( 'RelationInfo', $this->_NodeDatabase );
					$i2->Name = 'Filesystem';
					$i2->ValueBint = $this->ID;
					$i2->Load();
					$i2->Save();
					
					// Relation data connected to creation of node
					
					$r = new DbIO( 'NodeRelation', $this->_NodeDatabase );
					$r->NodeID = ( $fo ? $fo->ID : '0' );
					$r->RelationID = $n->ID;
					$r->Load();
					$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i1->ID."," ) ) ? ( $r->InfoID.",".$i1->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i1->ID ) : $i1->ID ) );
					$r->InfoID = ( $r->InfoID && !strstr( ( ",".$r->InfoID."," ), ( ",".$i2->ID."," ) ) ? ( $r->InfoID.",".$i2->ID ) : ( $r->InfoID ? ( $r->InfoID.",".$i2->ID ) : $i2->ID ) );
					$r->Timestamp = date( 'Y-m-d H:i:s' );
					$r->Save();
				}
			}
			
			// Check save result
			if( $n && $n->ID > 0 )
			{
				return true;
			}
			return false;
		}
		
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true, $delete = false )
		{
			global $Config, $User, $Logger;
			
			// Also delete all sub folders!
			if( $recursive )
			{
				if( $fop = $this->_NodeDatabase->FetchObjects( '
					SELECT n.*, r.NodeID AS FolderID 
					FROM Node n, NodeRelation r 
					WHERE 
							r.RelationID = n.ID 
						AND r.NodeID = \'' . $fo->ID . '\' 
				' ) )
				{
					foreach( $fop as $fopp )
					{
						$Logger->log( 'Attempting to delete sub folder -> ' . $fopp->Name . '/ (' . $fopp->ID . ')' );
						$this->_deleteFolder( $fopp, $recursive, ( ( isset( $fopp->IsDeleted ) && $fopp->IsDeleted == 1 ) || $delete ? true : false ) );
					}
				}
			}
			
			// TODO: Check if the FSFile database can be used together with the Node table instead of FSFolder
			
			if( $delete )
			{
				// Also delete all files!
				$fi = new dbIO( 'FSFile' );
				$fi->UserID = $User->ID;
				$fi->FilesystemID = $this->ID;
				$fi->FolderID = $fo->ID;
				if( $files = $fi->find() )
				{
					foreach( $files as $file )
					{
						$Logger->log( 'Attempting to delete file ' . $file->Filename . ' in ' . $fo->Name . '/ (' . $fo->ID . ')' );
						if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
						{
							unlink( $Config->FCUpload . $file->DiskFilename );
						}
						$file->Delete();
					}
				}
				$Logger->log( 'Deleting database entry of folder ' . $fo->Name . '/ (' . $fo->ID . ')' );
				
				$this->_NodeDatabase->query( 'DELETE FROM `Node` WHERE ID = \'' . $fo->ID . '\'' );
				$this->_NodeDatabase->query( 'DELETE FROM `NodeRelation` WHERE RelationID = \'' . $fo->ID . '\'' );
				$this->_NodeDatabase->query( 'DELETE FROM `Blob` WHERE NodeID = \'' . $fo->ID . '\'' );
			}
			else
			{
				$f = new dbIO( 'Node', $this->_NodeDatabase );
				$f->ID = $fo->ID;
				if( $f->Load() )
				{
					$f->IsDeleted = 1;
					$f->Save();
				}
			}
			
			return true;
		}
		
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true, $delete = false )
		{
			global $Config, $User, $Logger;
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
			
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				$Logger->log( 'Delete folder in subpath ' . $subPath . ' in fs ' . $this->Name . ': ---' );
				return $this->_deleteFolder( $fo, $recursive, ( ( isset( $fo->IsDeleted ) && $fo->IsDeleted == 1 ) || $delete ? true : false ) );
			}
			
			return false;
		}
		
		// Delete a file
		function deleteFile( $path, $recursive = false, $delete = false )
		{
			global $Config, $User, $Logger;
			
			// If it's a folder
			if( substr( $path, -1, 1 ) == '/' )
			{
				return $this->deleteFolder( $path, $recursive, $delete );
			}
			
			
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			if( strstr( $path, '#?' ) )
			{
				$fid = explode( '#?', $path );
				$fi->ID = trim( end( $fid ) );
			}
			else
			{
				// Remove file from path
				$subPath = explode( '/', end( explode( ':', $path ) ) );
				array_pop( $subPath );
				$subPath = implode( '/', $subPath ) . '/';
				
				$fo = $this->getSubFolder( $subPath );
				
				$Logger->log( 'Trying to delete a file in folder: ' . ( $fo ? $fo->Name : ( '(don\'t know, but in subfolder ' . $subPath . ')' ) ) );
				
				$fi->FolderID = $fo ? $fo->ID : '0';
				
				if( strstr( $path, '/' ) )
				{
					$fi->Filename = end( explode( '/', $path ) );
				}
				else $fi->Filename = end( explode( ':', $path ) );
			}
			
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$Logger->log( 'Deleting file in folder ' . ( $fo ? $fo->Name : '' ) . '/ (' . $fi->FolderID . ')' );
					unlink( $Config->FCUpload . $fi->DiskFilename );
					$fi->Delete();
					return true;
				}
				else 
				{
					$Logger->log( 'Deleting db only (corrupt) file in folder ' . $fi->Name . '/ (' . $fi->FolderID . ')' );
					$fi->Delete();
				}
			}
			return false;
		}
	}
}

// Create a door...
if( isset( $args->pathid ) )
	$door = new DoorNodeDrive( $args->pathid );
else $door = new DoorNodeDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
