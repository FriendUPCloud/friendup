<?php

global $SqlDatabase;

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
		
		if( $users )
		{
			foreach( $users as $uid )
			{
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
