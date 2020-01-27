<?php

/*©lgpl*************************************************************************
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

global $SqlDatabase, $Config, $Logger;

require_once( 'php/classes/dbio.php' );
require_once( 'php/classes/door.php' );
require_once( 'php/classes/file.php' );

if( !function_exists( 'findInSearchPaths' ) )
{
	function findInSearchPaths( $app )
	{
		$ar = array(
			'repository/',
			'resources/webclient/apps/'
		);
		foreach ( $ar as $apath )
		{
			if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
			{
				return $apath . $app;
			}
		}
		return false;
	}
}

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 1);

if( $args->args->id > 0 )
{
	if( $ug = $SqlDatabase->FetchObject( '
		SELECT 
			g.*, s.Data
		FROM 
			`FUserGroup` g, 
			`FSetting` s 
		WHERE 
				g.ID = \'' . $args->args->id . '\' 
			AND g.Type = "Setup" 
			AND s.Type = "setup" 
			AND s.Key = "usergroup" 
			AND s.UserID = g.ID 
	' ) )
	{
		
		// TODO: Make support for multiple users using template via worgroups ...
		// 1. Find workgroup and the members connected to this workgroup ...
		// 2. Get data for workground and connected template ...
		// 3. Loop through each member and set template for everyone, also overwrite template set on the user display ... 
		
		$users = ( isset( $args->args->members ) ? explode( ',', $args->args->members ) : array( $args->args->userid ) );
		
		$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
		
		// Try to get wallpaper
		$wallpaper = new dbIO( 'FMetaData' );
		$wallpaper->DataID = $ug->ID;
		$wallpaper->DataTable = 'FSetting';
		$wallpaper->Key = 'UserTemplateSetupWallpaper';
		$wallpaperContent = false;
		if( !$wallpaper->Load() )
		{
			$wallpaper = false;
		}
		else
		{
			if( !( $wallpaperContent = file_get_contents( $wallpaper->ValueString ) ) )
			{
				$wallpaper = false;
			}
		}
		
		if( $users )
		{
			foreach( $users as $uid )
			{
				// Make sure the user exists!
				$theUser = new dbIO( 'FUser' );
				$theUser->load( $uid );
				if( !$theUser->ID ) continue;
				
				// Great, we have a user
				if( $ug->Data && $uid )
				{
					// Language ----------------------------------------------------------------------------------------
			
					if( $ug->Data->language )
					{
						// 1. Check and update language!
	
						$lang = new dbIO( 'FSetting' );
						$lang->UserID = $uid;
						$lang->Type = 'system';
						$lang->Key = 'locale';
						$lang->Load();
						$lang->Data = $ug->Data->language;
						$lang->Save();
					}
		
					// Wallpaper -----------------------------------------------
					// TODO: Support other filesystems than SQLDrive! (right now, not possible!)
					
					if( $wallpaper )
					{
						$fnam = $wallpaper->ValueString;
						$fnam = explode( '/', $fnam );
						$fnam = end( $fnam );
						$ext  = explode( '.', $fnam );
						$fnam = $ext[0];
						$ext  = $ext[1];
						
						$f = new dbIO( 'Filesystem' );
						$f->UserID = $uid;
						$f->Name   = 'Home';
						$f->Type   = 'SQLDrive';
						$f->Server = 'localhost';
						if( !$f->Load() )
						{
							$f->ShortDescription = 'My data volume';
							$f->Mounted = '1';
							
							// TODO: Enable this when we have figured out a better way to handle firstlogin.defaults.php if Home: is created it fucks up the first login procedure ...
							
							//$f->Save();
							
							$f->ID = 0;
						}
						
						if( $f->ID > 0 && $fnam && $ext && $theUser->Name )
						{
							// Make sure we have wallpaper folder
							$fl = new dbIO( 'FSFolder' );
							$fl->FilesystemID = $f->ID;
							$fl->UserID = $uid;
							$fl->Name = 'Wallpaper';
							$fl->FolderID = 0;
							if( !$fl->Load() )
							{
								$fl->DateCreated = date( 'Y-m-d H:i:s' );
								$fl->DateModified = $fl->DateCreated;
								
								$fl->Save();
							}
							
							$fi = new dbIO( 'FSFile' );
							$fi->Filename = ( 'default_wallpaper_' . $fl->FilesystemID . '_' . $fl->UserID . '.jpg' );
							$fi->FolderID = $fl->ID;
							$fi->FilesystemID = $f->ID;
							$fi->UserID = $uid;
							if( $fi->Load() && $fi->DiskFilename )
							{
								if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
								{
									unlink( $Config->FCUpload . $fi->DiskFilename );
								}
							}
							
							// Find disk filename
							$uname = str_replace( array( '..', '/', ' ' ), '_', $theUser->Name );
							if( !file_exists( $Config->FCUpload . $uname ) )
							{
								mkdir( $Config->FCUpload . $uname );
							}
							
							while( file_exists( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext ) )
							{
								$fnam = ( $fnam . rand( 0, 999999 ) );
							}
							
							if( $fp = fopen( $Config->FCUpload . $uname . '/' . $fnam . '.' . $ext, 'w+' ) )
							{
								fwrite( $fp, $wallpaperContent );
								fclose( $fp );
								
								
								
								$fi->DiskFilename = ( $uname . '/' . $fnam . '.' . $ext );
								$fi->Filesize = filesize( $wallpaper->ValueString );
								$fi->DateCreated = date( 'Y-m-d H:i:s' );
								$fi->DateModified = $fi->DateCreated;
								$fi->Save();
								
								
								
								// Set the wallpaper in config
								$s = new dbIO( 'FSetting' );
								$s->UserID = $uid;
								$s->Type = 'system';
								$s->Key = 'wallpaperdoors';
								$s->Load();
								$s->Data = '"Home:Wallpaper/' . $fi->Filename . '"';
								$s->Save();
								
								
								
								// Fill Wallpaper app with settings and set default wallpaper
								$wp = new dbIO( 'FSetting' );
								$wp->UserID = $uid;
								$wp->Type = 'system';
								$wp->Key = 'imagesdoors';
								if( $wp->Load() && $wp->Data )
								{
									$data = substr( $wp->Data, 1, -1 );
	
									if( $data && !strstr( $data, '"Home:Wallpaper/' . $fi->Filename . '"' ) )
									{
										if( $json = json_decode( $data, true ) )
										{
											$json[] = ( 'Home:Wallpaper/' . $fi->Filename );
			
											if( $data = json_encode( $json ) )
											{
												$wp->Data = stripslashes( '"' . $data . '"' );
												$wp->Save();
											}
										}
									}
								}
								
							}
							
							
						}
					}
					
					// Startup -----------------------------------------------------------------------------------------
		
					if( isset( $ug->Data->startups ) )
					{
						// 2. Check and update startup!
	
						$star = new dbIO( 'FSetting' );
						$star->UserID = $uid;
						$star->Type = 'system';
						$star->Key = 'startupsequence';
						$star->Load();
						$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
						$star->Save();
					}
		
					// Theme -------------------------------------------------------------------------------------------
		
					if( $ug->Data->theme )
					{
						// 3. Check and update theme!
	
						$them = new dbIO( 'FSetting' );
						$them->UserID = $uid;
						$them->Type = 'system';
						$them->Key = 'theme';
						$them->Load();
						$them->Data = $ug->Data->theme;
						$them->Save();
					}
					
					if( $ug->Data->themeconfig && $ug->Data->theme )
					{
						// 3. Check and update look and feel config!
						
						$them = new dbIO( 'FSetting' );
						$them->UserID = $uid;
						$them->Type = 'system';
						$them->Key = 'themedata_' . strtolower( $ug->Data->theme );
						$them->Load();
						$them->Data = json_encode( $ug->Data->themeconfig );
						$them->Save(); 
					}
					
					if( $ug->Data->workspacecount )
					{
						// 3. Check and update look and feel workspace numbers!
						
						$them = new dbIO( 'FSetting' );
						$them->UserID = $uid;
						$them->Type = 'system';
						$them->Key = 'workspacecount';
						$them->Load();
						$them->Data = $ug->Data->workspacecount;
						$them->Save(); 
					}
					
					// Software ----------------------------------------------------------------------------------------
					
					if( !isset( $ug->Data->software ) )
					{
						$ug->Data->software = json_decode( '[["Dock","1"]]' );
					}
					
					if( $ug->Data->software )
					{
						// 4. Check dock!
						
						// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...
	
						if( 1==1 || !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
						{
							$i = 0;
		
							foreach( $ug->Data->software as $r )
							{
								if( $r[0] )
								{
									// 5. Store applications
				
									if( $path = findInSearchPaths( $r[0] ) )
									{
										if( file_exists( $path . '/Config.conf' ) )
										{
											$f = file_get_contents( $path . '/Config.conf' );
											// Path is dynamic!
											$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
					
											// Store application!
											$a = new dbIO( 'FApplication' );
											$a->UserID = $uid;
											$a->Name = $r[0];
											if( !$a->Load() )
											{
												$a->DateInstalled = date( 'Y-m-d H:i:s' );
												$a->Config = $f;
												$a->Permissions = 'UGO';
												$a->DateModified = $a->DateInstalled;
												$a->Save();
											}
						
											// 6. Setup dock items
						
											if( $r[1] )
											{
												$d = new dbIO( 'DockItem' );
												$d->Application = $r[0];
												$d->UserID = $uid;
												$d->Parent = 0;
												if( !$d->Load() )
												{
													//$d->ShortDescription = $r[1];
													$d->SortOrder = $i++;
													$d->Save();
												}
											}
							
											// 7. Pre-install applications
						
											if( $ug->Data->preinstall != '0' && $a->ID > 0 )
											{
												if( $a->Config && ( $cf = json_decode( $a->Config ) ) )
												{
													if( isset( $cf->Permissions ) && $cf->Permissions )
													{
														$perms = [];
														foreach( $cf->Permissions as $p )
														{
															$perms[] = [$p,(strtolower($p)=='door all'?'all':'')];
														}
								
														// TODO: Get this from Config.ini in the future, atm set nothing
														$da = new stdClass();
														$da->domain = '';
									
														// Collect permissions in a string
														$app = new dbIO( 'FUserApplication' );
														$app->ApplicationID = $a->ID;
														$app->UserID = $a->UserID;
														if( !$app->Load() )
														{
															$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
															$app->Permissions = json_encode( $perms );
															$app->Data = json_encode( $da );
															$app->Save();
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
				
				
				
				if( $uid )
				{
					if( $dels = $SqlDatabase->FetchObjects( $q = '
						SELECT 
							g.* 
						FROM 
							`FUserGroup` g, 
							`FUserToGroup` ug 
						WHERE 
								g.Type = "Setup" 
							AND ug.UserGroupID = g.ID 
							AND ug.UserID = \'' . $uid . '\' 
						ORDER BY 
							g.ID ASC 
					' ) )
					{
		
						foreach( $dels as $del )
						{
							if( $del->ID != $args->args->id )
							{
								$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
							}
						}
					}
		
					if( $SqlDatabase->FetchObject( '
						SELECT 
							ug.* 
						FROM 
							`FUserToGroup` ug 
						WHERE 
								ug.UserGroupID = \'' . $ug->ID . '\' 
							AND ug.UserID = \'' . $uid . '\' 
					' ) )
					{
						$SqlDatabase->query( '
							UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
							WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
						' );
					}
					else
					{
						// This method doesn't work for a table without a prime col, must support it in dbIO
						//$utg = new dbIO( 'FUserToGroup' );
						//$utg->UserGroupID = $ug->ID;
						//$utg->UserID = $args->args->userid;
						//$utg->Load();
						//$utg->Save();
						
						$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
					}
				}
			}
		}
		
		die( 'ok<!--separate-->' . ( $ug->Data ? json_encode( $ug->Data ) : 'false' ) );
	}
}
else if ( !$args->args->id || $args->args->id == 0 )
{
	$users = ( isset( $args->args->members ) ? explode( ',', $args->args->members ) : array( $args->args->userid ) );	
	
	if( $users )
	{
		foreach( $users as $uid )
		{
			if( $uid )
			{
				if( $dels = $SqlDatabase->FetchObjects( $q = '
					SELECT 
						g.* 
					FROM 
						`FUserGroup` g, 
						`FUserToGroup` ug 
					WHERE 
							g.Type = "Setup" 
						AND ug.UserGroupID = g.ID 
						AND ug.UserID = \'' . $uid . '\' 
					ORDER BY 
						g.ID ASC 
				' ) )
				{
					foreach( $dels as $del )
					{
						$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
					}
				}
			}
		}
		
		die( 'ok<!--separate-->' );
	}
}

die( 'fail' );

?>
