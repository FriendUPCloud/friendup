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

// Check a Friend user
// TODO: Fix deprecated password hashing (deprecated soon!)
function checkFriendUser( $data, $create = false )
{
	global $Config, $SqlDatabase;
	$conf =& $Config;
	$dbo =& $SqlDatabase;
	
	// Resulting identity object to return to caller
	$identity = new stdClass();
	
	// Check vars and attributes
	if( $data && isset( $data->username ) && isset( $data->password ) )
	{
		if( $data->password && ( !strstr( $data->password, 'HASHED' ) && !strstr( $data->password, '{S6}' ) ) )
		{
			$data->password = ( 'HASHED' . hash( 'sha256', $data->password ) );
		}
		
		// TODO: Handle password different for an external system ...
		$creds = false;
		
		// TODO: Base it on username and forget about password only one unique username is allowed for users ...
		/*$query = '
			SELECT fu.ID FROM FUser fu 
			WHERE 
					fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
				AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $data->password ) ) . '\' 
		';*/
		
		// Select query
		$query = '
			SELECT fu.ID FROM FUser fu 
			WHERE fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
		';
		
		if( !$creds = $dbo->fetchObject( $query ) )
		{
			// Check if user exists and password is wrong ...		
			if( $dbo->fetchObject( '
				SELECT 
					fu.* 
				FROM 
					FUser fu 
				WHERE 
					fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
			' ) )
			{
				return 'fail<!--separate-->{"message":"Error! User exists but Friend password is incorrect.","response":-1}';
			}
			
			// TODO: Make sure username is unique for the external service and that the password is not the users original ...
			
			// Create new user ...
			
			if( $create )
			{
				
				if( $dbo->Query( '
				INSERT INTO FUser ( `Name`, `Password`, `PublicKey`, `Fullname`, `Email`, `LastActionTime`, `CreationTime`, `LoginTime`, `UniqueID` ) 
				VALUES ('
					. ' \'' . mysqli_real_escape_string( $dbo->_link, $data->username                                    ) . '\'' 
					. ',\'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $data->password ) ) . '\'' 
					. ',\'' . mysqli_real_escape_string( $dbo->_link, isset( $data->publickey ) ? trim( $data->publickey ) : '' ) . '\'' 
					. ',\'' . mysqli_real_escape_string( $dbo->_link, isset( $data->fullname )  ? trim( $data->fullname  ) : '' ) . '\'' 
					. ',\'' . mysqli_real_escape_string( $dbo->_link, isset( $data->email )     ? trim( $data->email     ) : '' ) . '\'' 
					. ','   . time() 
					. ','   . time() 
					. ','   . time() 
					. ',\'' . mysqli_real_escape_string( $dbo->_link, generateFriendUniqueID( $data->username )          ) . '\'' 
				.') ' ) )
				{
					if( $creds = $dbo->fetchObject( $query ) )
					{
						// add user to users group....
						$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'' . ( 'User' ) . '\' AND `Type` = \'Level\' ORDER BY `ID` ASC LIMIT 1 ) );' );
						
						// Check if the "External" group exists
						checkExternalUserGroup();
						
						// add user to External users group....
						$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'External\' ORDER BY `ID` ASC LIMIT 1 ) );' );
						
						if( $data->mobile )
						{
							// Add phone number ...
							$dbo->Query( 'INSERT INTO `FMetaData` ( `DataTable`, `DataID`, `Key`, `ValueString` ) VALUES ( "FUser", '. intval( $creds->ID ) .', "Mobile", "' . $data->mobile . '" );' );
						}
						
						// TODO: Find out what template to use, and define based on user level or admin access, for later ...
						
						firstLoginSetup( 0, $creds->ID );
						
						// Success now log the user in and activate it ...	
						if( $login = remoteAuth( '/system.library/login', 
						[
							'username' => $data->username, 
							'password' => $data->password, 
							'deviceid' => $data->deviceid 
						] ) )
						{
							if( strstr( $login, '<!--separate-->' ) )
							{
								if( $ret = explode( '<!--separate-->', $login ) )
								{
									if( isset( $ret[1] ) )
									{
										$login = $ret[1];
									}
								}
							}
							
							if( $ses = json_decode( $login ) )
							{
								// We got a sessionid!
								if( $ses->sessionid )
								{
									if( !remoteAuth( '/system.library/user/update?sessionid=' . $ses->sessionid, 
									[
										'setup' => '0' 
									] ) )
									{
										return 'fail<!--separate-->{"message":"Error! Fail from friendcore.","response":-1}';
									}
									// We were successful - set the sessionid on the identity object
									else
									{
										$identity->sessionid = $ses->sessionid;
									}
								}
								else
								{
									return 'fail<!--separate-->{"message":"Error! Fail, no session.","response":-1}';
								}
							}
						}
						else
						{
							// Couldn't login ...
							return 'fail<!--separate-->{"message":"Error! Could not log in.","response":-1}';
						}
					}
					else
					{
						return 'fail<!--separate-->{"message":"Error!","response":-1}';
					}
				}
				else
				{
					// Couldn't create user ...
					return 'fail<!--separate-->{"message":"Error! Couldn\'t create user.","response":-1}';
				}
			}
		}
		else
		{
			// return data ...
			// Update password if different ... TODO: Look at this in the future ...
			if( $creds && $creds->ID )
			{
				$rname = mysqli_real_escape_string( $dbo->_link, $data->username );
				$dbo->query( 'DELETE FROM FUser WHERE `Name` = "' . $rname . '" AND ID != \'' . $creds->ID . '\'' );
				
				// 3.b. Set 2 workspaces
				$t = new dbIO( 'FSetting', $dbo );
				$t->UserID = $creds->ID;
				$t->Type = 'system';
				$t->Key = 'workspacecount';
				$t->Load();
				$t->Data = '2';
				$t->Save();
				
				// Check login
				$u = new dbIO( 'FUser', $dbo );
				$u->ID = $creds->ID;
				if( $u->Load() )
				{
					if( $u->Password != ( '{S6}' . hash( 'sha256', $data->password ) ) )
					{
						$u->Password = '{S6}' . hash( 'sha256', $data->password );
						$u->Save();
					
						if( $u->ID > 0 )
						{
							if( $login = remoteAuth( '/system.library/login', 
							[
								'username' => $data->username, 
								'password' => $data->password, 
								'deviceid' => $data->deviceid 
							] ) )
							{
								if( strstr( $login, '<!--separate-->' ) )
								{
									if( $ret = explode( '<!--separate-->', $login ) )
									{
										if( isset( $ret[1] ) )
										{
											$login = $ret[1];
										}
									}
								}
							}
							else
							{
								// Couldn't login ...
								return 'fail<!--separate-->{"message":"Error! Couldn\'t log in.","response":-1}';
							}
						}
					}
				}
			}
		}
		
		if( $creds )
		{
			if( !$login )
			{
				if( $login = remoteAuth( '/system.library/login', 
				[
					'username' => $data->username, 
					'password' => $data->password, 
					'deviceid' => $data->deviceid 
				] ) )
				{
					if( strstr( $login, '<!--separate-->' ) )
					{
						if( $ret = explode( '<!--separate-->', $login ) )
						{
							if( isset( $ret[1] ) )
							{
								$login = $ret[1];
							}
						}
					}
					// Decode response string (TODO: Remove the need to escape backward slashes)
					if( $decoded = json_decode( str_replace( '\\', urlencode( '\\' ), $login ) ) )
					{
						foreach( $decoded as $k=>$v )
						{
							$identity->$k = $v;
						}
					}
					else
					{
						return 'fail<!--separate-->{"message":"Could not decode login.","response":-1}';
					}
				}
				else
				{
					// Couldn't login ...
					return 'fail<!--separate-->{"message":"Error! Couldn\'t log in.","response":-1}';
				}
			}
			else
			{
				if( $decoded = json_decode( str_replace( '\\', urlencode( '\\' ), $login ) ) )
				{
					foreach( $decoded as $k=>$v )
					{
						$identity->$k = $v;
					}
				}
				else
				{
					return 'fail<!--separate-->{"message":"Could not decode login.","response":-1}';
				}
			}
			
			
			if( $creds->ID )
			{
				// Add custom DockItem temporary solution ...
				$hostip = false/*'185.116.5.93'*/;
				$cluster = 'LINE';
				$domain = 'KJELL';
				
				$line = ' usefriendcredentials ad-hoc ' . ( $cluster ? ( 'cluster=' . $cluster ) : 'ip=' . $hostip );
				if( $domain )
				{
					$line .= ' domain=' . $domain;
				}
				
				if( addCustomDockItem( $creds->ID, 'Mitra', true, true, $line ) )
				{
					// It was added with success ...
				}
				
				// Add Outlook Web Access
				if( addCustomDockItem( $creds->ID, 'Epat', true, true, '' ) )
				{
					// It was added with success ...
				}
				
				$identity->userid = $creds->ID;
			}
			if( !$identity->sessionid )
			{
				return 'fail<!--separate-->{"message":"Could not obtain sessionid.","response":-1}';
			}
			return $identity;
			
		}
		// TODO: Allways get user data as output on success ...
	}
	return false;
}

// Convert login data using hashing function
function convertLoginData( $data )
{
	if( $data && ( $data->username && isset( $data->password ) ) )
	{
		// TODO: Look if we are going to add a ID from the external service to the username ...
		if( $data->password )
		{
			$data->password = generateExternalFriendPassword( $data->password );
			
			// TODO: Look at this ...
			// Password will have to be something that cannot be changed ...
			//$data->password = generateExternalFriendPassword( $data->username );
		}
		
		if( $data->username )
		{
			$data->username = generateExternalFriendUsername( $data->username );
		}
	}
	return $data;
}

// Hashing function
function generateExternalFriendUsername( $input )
{
	if( $input )
	{
		return hash( 'md5', 'HASHED' . $input );
	}
	
	return '';
}

// Password hashing function
function generateExternalFriendPassword( $input )
{
	if( $input )
	{
		if( strstr( $input, 'HASHED' ) )
		{
			return ( $input );
		}
		return ( 'HASHED' . hash( 'sha256', 'TOKEN' . $input ) );
	}
	return '';
}

// Check if we have "External" type user's group
function checkExternalUserGroup(  )
{
	global $Config, $SqlDatabase;
	$conf =& $Config;
	$dbo =& $SqlDatabase;

	if( $rs = $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `Name`=\'User\' AND `Type`=\'External\' ORDER BY `ID` ASC LIMIT 1' ) )
	{
		return;
	}
	
	$rs = $dbo->Query( 'INSERT INTO `FUserGroup` (`UserID`,`ParentID`,`Name`,`Type`) VALUES (\'0\',\'0\',\'User\',\'External\');' );
	
	return;
}

// Generate random hash
function generateFriendUniqueID( $data = '' )
{
	return hash( 'sha256', ( time().$data.rand(0,999).rand(0,999).rand(0,999) ) );
}

// Find application in search paths
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

function addCustomDockItem( $uid, $appname, $dock = false, $preinstall = false, $params = '' )
{
	global $Config, $SqlDatabase;
	$conf =& $Config;
	$dbo =& $SqlDatabase;
	
	if( $uid && $appname )
	{
		// 5. Store applications
		
		if( $path = findInSearchPaths( $appname ) )
		{
			if( file_exists( $path . '/Config.conf' ) )
			{
				$f = file_get_contents( $path . '/Config.conf' );
				// Path is dynamic!
				$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
			
				// Store application!
				$a = new dbIO( 'FApplication', $dbo );
				$a->UserID = $uid;
				$a->Name = $appname;
				if( !$a->Load() )
				{
					$a->DateInstalled = date( 'Y-m-d H:i:s' );
					$a->Config = $f;
					$a->Permissions = 'UGO';
					$a->DateModified = $a->DateInstalled;
					$a->Save();
				}
			
				// 6. Setup dock items
				
				if( $dock )
				{
					$d = new dbIO( 'DockItem', $dbo );
					$d->Application = ( $appname . $params );
					$d->UserID = $uid;
					$d->Parent = 0;
					if( !$d->Load() )
					{
						$d->Type = 'executable';
						$d->Icon = '/webclient/apps/' . $appname . '/icon.png';
						if( strtolower( $appname ) == 'mitra' && $params && strstr( $params, 'domain=' ) )
						{
							$d->DisplayName = 'Desktop';
							$d->Workspace = 2;
						}
						else
						{
							$d->Workspace = 1;
							$d->DisplayName = ucfirst( $appname );
						}
						//$d->ShortDescription = $r[1];
						$d->SortOrder = $i++;
						$d->Save();
					}
				}
				
				// 7. Pre-install applications
				
				if( $preinstall && $a->ID > 0 )
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
							$app = new dbIO( 'FUserApplication', $dbo );
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
				
				return true;
			}
		}
	}
	
	return false;
								
}

// Check database for first login
function firstLoginSetup( $setupid, $uid )
{
	global $Config, $SqlDatabase;
	$conf =& $Config;
	$dbo =& $SqlDatabase;
	
	if( $uid )
	{
		// If we have a populated dock it's not firstime and the template will have to be updated manual through the users app ...
		
		if( ( $row = $dbo->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
		{
			return true;
		}
		
		if( $ug = $dbo->FetchObject( '
			SELECT 
				g.*, s.Data 
			FROM 
				`FUserGroup` g, 
				`FSetting` s 
			WHERE 
					' . ( $setupid ? 'g.ID = ' . $setupid . ' AND ' : '' ) . ' 
					g.Type = "Setup" 
				AND s.Type = "setup" 
				AND s.Key = "usergroup" 
				AND s.UserID = g.ID 
			ORDER BY g.ID ASC 
			LIMIT 1
		' ) )
		{
			$setupid = $ug->ID;
			
			// TODO: Connect this to the main handling of user templates so it doesn't fall out of sync ...
			
			$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
					
			
			if( $ug->Data && $uid )
			{
				// Language ----------------------------------------------------

				if( $ug->Data->language )
				{
					// 1. Check and update language!

					$lang = new dbIO( 'FSetting', $dbo );
					$lang->UserID = $uid;
					$lang->Type = 'system';
					$lang->Key = 'locale';
					$lang->Load();
					$lang->Data = $ug->Data->language;
					$lang->Save();
				}

				// Startup -----------------------------------------------------
				if( isset( $ug->Data->startups ) )
				{
					// 2. Check and update startup!

					$star = new dbIO( 'FSetting', $dbo );
					$star->UserID = $uid;
					$star->Type = 'system';
					$star->Key = 'startupsequence';
					$star->Load();
					$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
					$star->Save();
				}

				// Theme -------------------------------------------------------
				if( $ug->Data->theme )
				{
					// 3. Check and update theme!

					$them = new dbIO( 'FSetting', $dbo );
					$them->UserID = $uid;
					$them->Type = 'system';
					$them->Key = 'theme';
					$them->Load();
					$them->Data = $ug->Data->theme;
					$them->Save();
				}
				
				// 3.b. Set 2 workspaces
				$t = new dbIO( 'FSetting', $dbo );
				$t->UserID = $uid;
				$t->Type = 'system';
				$t->Key = 'workspacecount';
				$t->Load();
				$t->Data = '2';
				$t->Save();
		
				// Software ----------------------------------------------------------------------------------------
				if( !isset( $ug->Data->software ) )
				{
					$ug->Data->software = json_decode( '[["Dock","1"]]' );
				}
		
				if( $ug->Data->software )
				{
					// 4. Check dock!
					// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...
					if( 1==1/* || !( $row = $dbo->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) )*/ )
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
										$a = new dbIO( 'FApplication', $dbo );
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
											$d = new dbIO( 'DockItem', $dbo );
											$d->Application = $r[0];
											$d->UserID = $uid;
											$d->Parent = 0;
											if( !$d->Load() )
											{
												$d->Workspace = 1;
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
													$app = new dbIO( 'FUserApplication', $dbo );
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
				if( $dels = $dbo->FetchObjects( $q = '
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
						if( $del->ID != $setupid )
						{
							$dbo->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
						}
					}
				}

				if( $dbo->FetchObject( '
					SELECT 
						ug.* 
					FROM 
						`FUserToGroup` ug 
					WHERE 
							ug.UserGroupID = \'' . $ug->ID . '\' 
						AND ug.UserID = \'' . $uid . '\' 
				' ) )
				{
					$dbo->query( '
						UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
						WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
					' );
				}
				else
				{
					$dbo->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
				}
			}
			return ( $ug->Data ? json_encode( $ug->Data ) : false );
		}
	}
	return false;
}

// Authenticate with Friend Core
function remoteAuth( $url, $args = false, $method = 'POST', $headers = false, $auth = false )
{
	global $Config, $SqlDatabase;
	$conf =& $Config;
	$dbo =& $SqlDatabase;
	
	// Generate valid url
	$url = ( $conf['Core']['SSLEnable'] ? 'https://' : 'http://' ) . $conf['FriendCore']['fchost'] . ( $conf['FriendCore']['port'] ? ':' . $conf['FriendCore']['port'] : '' ) . $url;
	
	if( function_exists( 'curl_init' ) )
	{
		$curl = curl_init();
	
		if( $headers && $auth && $auth['username'] && $auth['password'] )
		{
			$base64 = base64_encode( trim( $auth['username'] ) . ':' . trim( $auth['password'] ) );	
			$headers[] = ( 'Authorization: Basic ' . $base64 );
		}
	
		// Create properly encoded URL
		if( $url && strstr( $url, '?' ) )
		{
			$thispath = $url;
			$url = explode( '?', $url );
	
			if( isset( $url[1] ) )
			{
				if( strstr( $url[1], '&' ) && strstr( $url[1], '=' ) )
				{
					$url[1] = explode( '&', $url[1] );
					foreach( $url[1] as $k=>$p )
					{
						if( strstr( $url[1][$k], '=' ) )
						{
							$url[1][$k] = explode( '=', $url[1][$k] );
							if( isset( $url[1][$k][1] ) )
							{
								$url[1][$k][1] = urlencode( $url[1][$k][1] );
							}
							$url[1][$k] = implode( '=', $url[1][$k] );
						}
					}
					$url[1] = implode( '&', $url[1] );
				}
				else if( strstr( $url[1], '=' ) )
				{
					$url[1] = explode( '=', $url[1] );
					if( isset( $url[1][1] ) )
					{
						$url[1][1] = urlencode( $url[1][1] );
					}
					$url[1] = implode( '=', $url[1] );
				}
			}
			// Reconstitute url
			$url = implode( '?', $url );
		}

		curl_setopt( $curl, CURLOPT_URL, $url );

		if( $headers )
		{
			curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
		}
		if( $method != 'POST' )
		{
			curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
		}
		if( $args )
		{
			if( is_object( $args ) )
			{
				$args = array(
					'args' => urlencode( json_encode( $args ) )
				);
			}
			else if( is_string( $args ) )
			{
				$args = array(
					'args' => urlencode( $args )
				);
			}
		
			$json = false;
		
			if( $headers )
			{
				foreach( $headers as $v )
				{
					if( strstr( $v, 'application/json' ) )
					{
						$json = true;
					}
				}
				if( $json )
				{
					$args = json_encode( $args );
				}
			}
		
			curl_setopt( $curl, CURLOPT_POST, true );
			curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
		}
		
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
		$output = curl_exec( $curl );
		$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
		
		if( !$httpCode && !$output )
		{
			curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
			curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
		
			$output = curl_exec( $curl );	
		}
		
		curl_close( $curl );
	
		return $output;
	}
	return 'fail<!--separate-->{"response":-1,"message":"CURL is not installed, contact support ..."}';
}

?>
