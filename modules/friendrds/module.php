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

global $SqlDatabase, $User, $Config, $args;

include_once( 'php/friend.php' );

$wname = $Config->FCUpload;
if( substr( $wname, -1, 1 ) != '/' ) $wname .= '/';
if( !file_exists( $wname . 'apps' ) )
{
	mkdir( $wname . 'apps' );
}
if( !file_exists( $wname . 'apps/friendrds' ) )
{
	mkdir( $wname . 'apps/friendrds' );
}

$folderpath = ( $wname . 'apps/friendrds/' );

if( $args->command )
{
	switch( $args->command )
	{
		
		case 'list':
			
			if( isset( $args->args->installPath ) && $args->args->installPath )
			{
				if( $rows = $SqlDatabase->FetchObjects( 'SELECT * FROM FApplication WHERE UserID = "-1" AND `InstallPath` LIKE "'.strtolower( $args->args->installPath ).'%" ORDER BY ID ASC' ) )
				{
					foreach( $rows as $obj )
					{
						// Backwards compatibility
						
						if( $obj->Name )
						{
							if( strstr( $obj->Name, 'Mitra ' ) )
							{
								$obj->Name = str_replace( 'Mitra ', '', $obj->Name );
							}
							else if( strstr( $obj->Name, 'Liberator ' ) )
							{
								$obj->Name = str_replace( 'Liberator ', '', $obj->Name );
							}
						}
						
						$hash = hash( 'sha256', $obj->InstallPath );
						
						// Fix filename
						$fname = ( $hash . '_' . strtolower( $obj->Name ) ) . '.png';
						
						$obj->Preview = ( '/system.library/module/?module=liberator&command=getappicon&appname=' . strtolower( $obj->Name ) . '&appid=' . $hash );
						
					}
					
					die( 'ok<!--separate-->' . json_encode( $rows ) );
				}
			}
			
			die( 'ok<!--separate-->[]' );	
			
			break;
			
		case 'create':
			
			if( isset( $args->args->installPath ) && $args->args->installPath && $args->args->name && $args->args->data )
			{
				// Store application!
				$a = new dbIO( 'FApplication' );
				$a->UserID = '-1';
				$a->Name = $args->args->name;
				
				// Backwards compatibility
				
				if( !strstr( $a->Name, 'Mitra ' ) && !strstr( $a->Name, 'Liberator ' ) )
				{
					$a->Name = ( 'Liberator ' . $a->Name );
				}
				
				$a->InstallPath = strtolower( $args->args->installPath );
				if( !$a->Load() )
				{
					$a->DateInstalled = date( 'Y-m-d H:i:s' );
					$a->Config = $args->args->data;
					
					// TODO: Fix this properly for paths like for ex. C:\Windows\system32\mspaint.exe
					
					if( strstr( $a->Config, '/""' ) )
					{
						$a->Config = str_replace( $a->Config, [ '/""', '"/"' ], '' );
					}
					
					$a->Permissions = 'UGO';
					$a->DateModified = $a->DateInstalled;
					$a->Save();
					
					// Handle app icon ...
					
					if( isset( $args->args->icon ) && $args->args->icon )
					{
						if( $data = explode( ',', $args->args->icon ) )
						{
							if( $binary = base64_decode( array_pop( $data ) ) )
							{
								if( $im = imagecreatefromstring( $binary ) )
								{
									$hash = hash( 'sha256', $args->args->installPath );
									
									imagesavealpha( $im, true );
									
									imagepng( $im, $folderpath . ( $hash . '_' . strtolower( $args->args->name ) ) . '.png', 9 );
								
									// TODO: Maby add path to icon in config?
								
									die( 'ok<!--separate-->' . $folderpath . ( $hash . '_' . strtolower( $args->args->name ) ) . '.png' );

								}
							
							}
						}
						
						die( 'fail<!--separate-->' . $args->args->icon );
					}
					
					die( 'ok<!--separate-->' . $a->ID );
				}
			}
			
			die( 'fail<!--separate-->' );
			
			break;
			
		case 'update':
				
			if( isset( $args->args->id ) && $args->args->id > 0 && $args->args->installPath && $args->args->name && $args->args->data )
			{
				// Update application!
				$a = new dbIO( 'FApplication' );
				$a->UserID = '-1';
				$a->ID = $args->args->id;
				if( $a->Load(  ) )
				{
					$a->Name = $args->args->name;
					
					// Backwards compatibility
					
					if( !strstr( $a->Name, 'Mitra ' ) && !strstr( $a->Name, 'Liberator ' ) )
					{
						$a->Name = ( 'Liberator ' . $a->Name );
					}
					
					$a->InstallPath = strtolower( $args->args->installPath );
					$a->Config = $args->args->data;
					
					// TODO: Fix this properly for paths like for ex. C:\Windows\system32\mspaint.exe
					
					if( strstr( $a->Config, '/""' ) )
					{
						$a->Config = str_replace( $a->Config, [ '/""', '"/"' ], '' );
					}
					
					$a->Permissions = 'UGO';
					$a->DateModified = date( 'Y-m-d H:i:s' );
					$a->Save();
					
					// Handle app icon ...
					
					if( isset( $args->args->icon ) && $args->args->icon )
					{
						if( $data = explode( ',', $args->args->icon ) )
						{
							if( $binary = base64_decode( array_pop( $data ) ) )
							{
								if( $im = imagecreatefromstring( $binary ) )
								{
									$hash = hash( 'sha256', $args->args->installPath );
									
									imagesavealpha( $im, true );
									
									imagepng( $im, $folderpath . ( $hash . '_' . strtolower( $args->args->name ) ) . '.png', 9 );
								
									// TODO: Maby add path to icon in config?
								}
							
							}
						}
					}
					
					die( 'ok<!--separate-->' . $a->ID );
				}
			}
			
			
			die( 'fail<!--separate-->' );
			
			break;
		
		case 'updateicon':
			
			if( isset( $args->args->icon ) && $args->args->icon && $args->args->installPath && $args->args->name )
			{
				// Handle app icon ...
				
				if( $data = explode( ',', $args->args->icon ) )
				{
					if( $binary = base64_decode( array_pop( $data ) ) )
					{
						if( $im = imagecreatefromstring( $binary ) )
						{
							$hash = hash( 'sha256', $args->args->installPath );
							
							imagesavealpha( $im, true );
							
							imagepng( $im, $folderpath . ( $hash . '_' . strtolower( $args->args->name ) ) . '.png', 9 );
							
							// TODO: Maby add path to icon in config?
							
							die( 'ok<!--separate-->' . $folderpath . ( $hash . '_' . strtolower( $args->args->name ) ) . '.png' );
						}
					
					}
				}
			}
			
			die( 'fail<!--separate-->' );
			
			break;
		
		case 'remove':
			
			if( isset( $args->args->id ) && $args->args->id > 0 )
			{
				// Remove application!
				$a = new dbIO( 'FApplication' );
				$a->ID = $args->args->id;
				$a->UserID = '-1';
				if( $a->Load() )
				{
					$SqlDatabase->query( 'DELETE FROM `FUserApplication` WHERE `ApplicationID`=\'' . $a->ID . '\'' );
					
					$a->Delete();
					
					die( 'ok<!--separate-->[]' );
				}
			}
			
			die( 'fail<!--separate-->' );
			
			break;
		
		case 'getappicon':
			
			if( $args->appid && $args->appname )
			{
				function _file_output( $filepath )
				{
					if( $filepath )
					{
						ob_clean();
		
						FriendHeader( 'Content-Type: image/png' );
		
						FriendHeader( 'Expires: ' . gmdate( 'D, d M Y H:i:s \G\M\T', time() + 86400 ) );
		
						// Generate some useful time vars based on file date
						$last_modified_time = filemtime( $filepath ); 
						$etag = md5_file( $filepath );
		
						// Always send headers
						FriendHeader( 'Last-Modified: ' . gmdate( 'D, d M Y H:i:s', $last_modified_time ) . ' GMT' ); 
						FriendHeader( 'Etag: ' . $etag ); 
		
						// TODO: Fix this so it works in FriendCore ... only works in apache, nginx, etc ...
		
						// Exit if not modified
						if ( ( @strtotime( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) == $last_modified_time ) ||  ( @trim( $_SERVER['HTTP_IF_NONE_MATCH'] ) == $etag ) )
						{
							FriendHeader( 'HTTP/1.1 304 Not Modified' ); 
							die();
						}
						
						die( file_get_contents( $filepath ) );
					}
				}
				
				
				
				if( file_exists( $folderpath . ( $args->appid . '_' . strtolower( $args->appname ) ) . '.png' ) )
				{
					_file_output( $folderpath . ( $args->appid . '_' . strtolower( $args->appname ) ) . '.png' );
				}
				
			}
			
			die(  );
			
			break;
		
		case 'getremoteapps':
			
			// TODO: Add dependencies ... php-ssh2 libssh2-php --- and maybe more? confirm on new setup ...
			
			if( function_exists( 'ssh2_connect' ) )
			{
				
				if( $args->args->protocol && $args->args->hostname && $args->args->identifier && $args->args->username && $args->args->password )
				{
					
					// TODO: Get useful information from failed connection ...
					
					function _ssh_disconnect( $reason, $message, $language ) 
					{
						die( 'fail<!--separate-->server disconnected with reason code ' . $reason . ' and message: ' . $message );
					}
					
					$methods = [
						'kex' => 'diffie-hellman-group1-sha1',
						'client_to_server' => [
							'crypt' => '3des-cbc',
							'comp'  => 'none' 
						],
						'server_to_client' => [
							'crypt' => 'aes256-cbc,aes192-cbc,aes128-cbc',
							'comp'  => 'none' 
						] 
					];
					
					$callbacks = [ 'disconnect' => '_ssh_disconnect' ];
					
					if( !$connection = ssh2_connect( $args->args->hostname, 22 ) )
					{
						die( 'fail<!--separate-->failed to connect.' );
					}
				
					if( !ssh2_auth_password( $connection, $args->args->username, $args->args->password ) )
					{
						die( 'fail<!--separate-->failed to authenticate.' );
					}
					
					if( !$sftp = ssh2_sftp( $connection ) )
					{
						die('fail<!--separate-->failed to create a sftp connection.');
					}
					
					$remote_dir = "/C:/Windows/RemotePackages/CPubFarms/QuickSessionCollection/CPubRemoteApps/";
					
					$icons = [];
					
					if( $objects = scandir( "ssh2.sftp://$sftp$remote_dir" ) )
					{
						foreach( $objects as $file )
				        {
							if ( $file == '.' || $file == '..' || !strstr( $file, '.ico' ) )
							{
				                continue;
							}
						
							$icons[] = $file;
						}
					}
				
					$imgs = [];
					
					if( $icons )
					{
						require_once( 'php/3rdparty/ico/class.ico.php' );
						
						$installpath = ( $args->args->protocol . '://' . $args->args->hostname . ( $args->args->port ? ':' . $args->args->port : '' ) . '/' . $args->args->identifier );
						
						foreach( $icons as $i )
						{
							$file_name = str_replace( '.ico', '', $i );
							
							$hash = hash( 'sha256', $installpath . '/' . strtolower( $file_name ) );
							
							// Fix filename
							$fname = ( $hash . '_' . strtolower( $file_name ) ) . '.png';
						
							$obj = new stdClass();
							$obj->name = $i;
							$obj->icon = ( '/system.library/module/?module=liberator&command=getappicon&appname=' . strtolower( $file_name ) . '&appid=' . $hash );
							$obj->data = [];
						
							if( !file_exists( $wname . 'apps/friendrds/' . $fname ) )
							{
								$ico = new Ico( "ssh2.sftp://$sftp$remote_dir$i" );
								$ico->SetBackgroundTransparent();
								$source = $ico->GetIcon( 11 );
							
								// Save
								imagepng( $source, $wname . 'apps/friendrds/' . $fname, 9 );
							
								for( $ii = 1; $ii < $ico->TotalIcons(); $ii++ )
								{
									$obj->data[$ii] = ( $ico->formats[$ii]['Width'] . 'x' . $ico->formats[$ii]['Height'] );
								}
							}
						
							$imgs[$file_name] = $obj;
							 
						}
					}
					
					
					
					// Close the sftp connection
					fclose( $sftp );
				
					$stream = ssh2_exec( $connection, "powershell;Get-RDRemoteApp" );
				
					$outputStream = ssh2_fetch_stream( $stream, SSH2_STREAM_STDIO );
					$errorStream  = ssh2_fetch_stream( $stream, SSH2_STREAM_STDERR );
				
					// Enable blocking for both streams
					stream_set_blocking( $outputStream, true );
					stream_set_blocking( $errorStream, true );
				
					$data  = stream_get_contents( $outputStream );
					$error = stream_get_contents( $errorStream );
				
					// Close the streams        
					fclose( $errorStream );
					fclose( $stream );
				
					
				
					$output = [];
				
					if( $data )
					{
						if( $parts = explode( "\n", $data ) )
						{
							$header = false;
						
							foreach( $parts as $i )
							{
							
								if( trim( $i ) && !strstr( trim( $i ), '---' ) && trim( substr( $i, 0, 13 ) ) )
								{
									if( !$header )
									{
										$vars = [];
								
										if( $cols = explode( " ", $i ) )
										{
											foreach( $cols as $ii )
											{
												if( trim( $ii ) )
												{
													$obj = new stdClass();
													$obj->pos = strpos( $i, trim( $ii ) );
													$obj->len = ( strlen( $i ) - $obj->pos );
													$obj->col = trim( $ii );
												
													$vars[] = $obj;
												}
											}
									
											foreach( $vars as $k=>$v )
											{
												if( isset( $vars[ $k+1 ] ) && $vars[ $k+1 ]->pos )
												{
													$vars[ $k ]->len = ( $vars[ $k+1 ]->pos - $vars[ $k ]->pos );
												}
											}
										}
									
										if( $vars )
										{
											$header = $vars;
										}
									
										continue;
									}
								
								
								
									if( $header )
									{
										$vars = [];
									
										foreach( $header as $ii )
										{
											if( substr( $i, $ii->pos, $ii->len ) )
											{
												$obj = new stdClass();
												$obj->pos = $ii->pos;
												$obj->len = $ii->len;
												$obj->col = $ii->col;
												$obj->val = trim( substr( $i, $ii->pos, $ii->len ) );
											
												if( isset( $imgs[$obj->val]->icon ) )
												{
													$obj->icon = $imgs[$obj->val]->icon;
												}
											
												$vars[] = $obj;
											}
										}
									
										if( $vars )
										{
											$output[] = $vars;
										}
									}
								
								}
							
							}
						
							if( $output )
							{
								$output = json_encode( $output );
							}
						}
					}
					
					
				
					if( $output )
					{
						die( 'ok<!--separate-->' . $output );
					}
				
					if( $error )
					{
						die( 'fail<!--separate-->' . $error );
					}
				
					die( 'fail<!--separate-->couldn\'t connect ...' );
					
				}
				
				die( 'fail<!--separate-->args missing ...' );
				
			}
			
			die( 'fail<!--separate-->function ssh2_connect doesn\'t exist' );
			
			break;
		
		case 'ssh_test':
			
			// TODO: Add dependencies ... php-ssh2 libssh2-php --- and maybe more? confirm on new setup ...
			
			if( function_exists( 'ssh2_connect' ) )
			{
				
				/*// scp chris@185.116.5.93:/C:/Windows/RemotePackages/CPubFarms/QuickSessionCollection/CPubRemoteApps/* ~/Desktop/
				
				function _ssh_disconnect( $reason, $message, $language ) 
				{
					die( 'fail<!--separate-->server disconnected with reason code ' . $reason . ' and message: ' . $message );
				}
				
				$methods = [
					'kex' => 'diffie-hellman-group1-sha1',
					'client_to_server' => [
						'crypt' => '3des-cbc',
						'comp'  => 'none' 
					],
					'server_to_client' => [
						'crypt' => 'aes256-cbc,aes192-cbc,aes128-cbc',
						'comp'  => 'none' 
					] 
				];
				
				$callbacks = [ 'disconnect' => '_ssh_disconnect' ];
				
				if( !$connection = ssh2_connect( '185.116.5.93', 22 ) )
				{
					die( 'fail<!--separate-->failed to connect.' );
				}
				
				if( !ssh2_auth_password( $connection, 'chris', 'SuperSablaSsh22!' ) )
				{
					die( 'fail<!--separate-->failed to authenticate.' );
				}
				
				// TODO: Copy .ico files from windows to a temp folder or something on the Friend server first then meanwhile go to next step ...
				
				//ssh2_scp_recv( $connection, '/C:/Windows/RemotePackages/CPubFarms/QuickSessionCollection/CPubRemoteApps/Paint.ico', '/home/acezerox/Desktop/Paint.ico' );
				//ssh2_scp_recv( $connection, 'C:\Windows\RemotePackages\CPubFarms\QuickSessionCollection\CPubRemoteApps\Paint.ico', '/home/acezerox/Desktop/Paint.ico' );
				
				//sftp_scp_rec( $connection, "/C:/Windows/RemotePackages/CPubFarms/QuickSessionCollection/CPubRemoteApps", "/home/acezerox/Desktop/CPubRemoteApps" );
				
				if( !$sftp = ssh2_sftp( $connection ) )
				{
					die('fail<!--separate-->failed to create a sftp connection.');
				}
				
				//$remote_dir = "C:\Windows\RemotePackages\CPubFarms\QuickSessionCollection\CPubRemoteApps";
				$remote_dir = "/C:/Windows/RemotePackages/CPubFarms/QuickSessionCollection/CPubRemoteApps/";
				//$local_dir  = "/home/acezerox/Projects/friendup/build/storage/";
				
				$icons = [];
				
				if( $objects = scandir( "ssh2.sftp://$sftp$remote_dir" ) )
				{
					foreach( $objects as $file )
		            {
						if ( $file == '.' || $file == '..' || !strstr( $file, '.ico' ) )
						{
		                    continue;
						}
						
						$icons[] = $file;
					}
				}
				
				$imgs = [];
				
				if( $icons )
				{
					require_once( 'php/3rdparty/ico/class.ico.php' );
					
					foreach( $icons as $i )
					{
						$file_name = str_replace( '.ico', '', $i );
						
						$hash = hash( 'sha256', 'rdp://185.116.5.93:3389/1/' . strtolower( $file_name ) );
						
						// Fix filename
						$fname = ( $hash . '_' . strtolower( $file_name ) ) . '.png';
						
						$obj = new stdClass();
						$obj->name = $i;
						$obj->icon = ( '/system.library/module/?module=liberator&command=getappicon&appname=' . strtolower( $file_name ) . '&appid=' . $hash );
						$obj->data = [];
						
						if( !file_exists( $wname . 'apps/friendrds/' . $fname ) )
						{
							$ico = new Ico( "ssh2.sftp://$sftp$remote_dir$i" );
							$ico->SetBackgroundTransparent();
							$source = $ico->GetIcon( 11 );
							
							// Save
							imagepng( $source, $wname . 'apps/friendrds/' . $fname, 9 );
							
							for( $ii = 1; $ii < $ico->TotalIcons(); $ii++ )
							{
								$obj->data[$ii] = ( $ico->formats[$ii]['Width'] . 'x' . $ico->formats[$ii]['Height'] );
							}
						}
						
						$imgs[$file_name] = $obj;
						 
					}
				}
				
				//die( 'fail<!--separate-->' . json_encode( $imgs ) );
				
				//$errorStream = ssh2_fetch_stream( $stream, SSH2_STREAM_STDERR );
				//$error = stream_get_contents( $errorStream );
				
				//ssh2_scp_recv( $connection, 'C:\Windows\RemotePackages\CPubFarms\QuickSessionCollection\CPubRemoteApps\Paint.ico', '/home/acezerox/Desktop/Paint.ico' );
				
				//die( 'fail<!--separate-->result: ' . json_encode( $out ) );
				
				// Close the sftp connection
				fclose( $sftp );
				
				$stream = ssh2_exec( $connection, "powershell;Get-RDRemoteApp" );
				
				$outputStream = ssh2_fetch_stream( $stream, SSH2_STREAM_STDIO );
				$errorStream  = ssh2_fetch_stream( $stream, SSH2_STREAM_STDERR );
				
				// Enable blocking for both streams
				stream_set_blocking( $outputStream, true );
				stream_set_blocking( $errorStream, true );
				
				$data  = stream_get_contents( $outputStream );
				$error = stream_get_contents( $errorStream );
				
				// Close the streams        
				fclose( $errorStream );
				fclose( $stream );
				
				
				
				$output = [];
				
				if( $data )
				{
					if( $parts = explode( "\n", $data ) )
					{
						$header = false;
						
						foreach( $parts as $i )
						{
							
							if( trim( $i ) && !strstr( trim( $i ), '---' ) && trim( substr( $i, 0, 13 ) ) )
							{
								if( !$header )
								{
									$vars = [];
								
									if( $cols = explode( " ", $i ) )
									{
										foreach( $cols as $ii )
										{
											if( trim( $ii ) )
											{
												$obj = new stdClass();
												$obj->pos = strpos( $i, trim( $ii ) );
												$obj->len = ( strlen( $i ) - $obj->pos );
												$obj->col = trim( $ii );
												
												$vars[] = $obj;
											}
										}
									
										foreach( $vars as $k=>$v )
										{
											if( isset( $vars[ $k+1 ] ) && $vars[ $k+1 ]->pos )
											{
												$vars[ $k ]->len = ( $vars[ $k+1 ]->pos - $vars[ $k ]->pos );
											}
										}
									}
									
									if( $vars )
									{
										$header = $vars;
									}
									
									continue;
								}
								
								
								
								if( $header )
								{
									$vars = [];
									
									foreach( $header as $ii )
									{
										if( substr( $i, $ii->pos, $ii->len ) )
										{
											$obj = new stdClass();
											$obj->pos = $ii->pos;
											$obj->len = $ii->len;
											$obj->col = $ii->col;
											$obj->val = trim( substr( $i, $ii->pos, $ii->len ) );
											
											if( isset( $imgs[$obj->val]->icon ) )
											{
												$obj->icon = $imgs[$obj->val]->icon;
											}
											
											$vars[] = $obj;
										}
									}
									
									if( $vars )
									{
										$output[] = $vars;
									}
								}
								
							}
							
						}
						
						if( $output )
						{
							$output = json_encode( $output );
						}
					}
				}
				
				
				
				if( $output )
				{
					die( 'ok<!--separate-->' . $output );
				}
				
				if( $error )
				{
					die( 'fail<!--separate-->' . $error );
				}*/
				
				die( 'fail<!--separate-->couldn\'t connect ...' );
			}
			
			die( 'fail<!--separate-->function ssh2_connect doesn\'t exist' );
			
			break;
		
	}
	
	// TODO: Add admin guacamole communication here ...
	
	// TODO: For the furture look into how to protect another users remote desktop admin password, unless this will only be to the guacamole server and not all the way to the remote server ...
	
	// TODO: Move Guacamole Curl calls here, add for Adding, Updating, Removing Users and User Connections.
	
	// TODO: addMitraConnections()
	
	// TODO: callMitraUserAdd()
	
	// TODO: main-mitrafunctions.js
	
	// cd C:\Windows\RemotePackages\CPubFarms\QuickSessionCollection\CPubRemoteApps\
	// ssh scp
	
	// Change name to friendrds
	
	// implement "module=friendrds&command=getappicon&app=mspaint" for icons cashed in "/storage/apps/friendrds/" e.g. hash('protocol_server_appname') + '.png'
	
}

die( 'fail' );

?>
