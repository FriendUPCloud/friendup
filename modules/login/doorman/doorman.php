<?php
	
	error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
	ini_set( 'display_errors', '1' );
	
	// TODO Simplify this on cleanup !!! ....
	
	// TODO: Check why this fails when adding a bigger server publickey to encrypt data and the server respons with a error message with no info, most likely before it arrives here ...
	
	if( isset( $GLOBALS['request_variables']['encrypted'] ) || isset( $GLOBALS['request_variables']['data'] ) )
	{
		
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		$fcrypt = new fcrypto(); $privateKey = false; $json = false;
		
		if( $file2 = file_exists( 'cfg/crt/server_encryption_key.pem' ) )
		{
			if( $file2 && ( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) ) )
			{
				if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
				{
					if( isset( $keys[0] ) )
					{
						$privateKey = ( $keys[0] . '-----' );
					}
				}
			}
		}
		
		if( isset( $GLOBALS['request_variables']['encrypted'] ) )
		{
			if( $privateKey )
			{
				$decrypted = $fcrypt->decryptString( $GLOBALS['request_variables']['encrypted'], $privateKey );
				
				if( $decrypted && $decrypted->plaintext )
				{
					$json = json_decode( $decrypted->plaintext );
				}
			}
		}
		else if( isset( $GLOBALS['request_variables']['data'] ) )
		{
			$json = json_decode( $GLOBALS['request_variables']['data'] );
			
			if( $json && $json->password )
			{
				if( $privateKey )
				{
					$decrypted = $fcrypt->decryptString( $json->password, $privateKey );
					
					if( $decrypted && $decrypted->plaintext )
					{
						$json->password = $decrypted->plaintext;
					}
				}
			}
		}
		
		
		
		if( $json )
		{
			
			$dbiopath   = __DIR__ . '/../../../php/classes/dbio.php';
			$configpath = __DIR__ . '/../../../cfg/cfg.ini';
			
			if( !( file_exists( $dbiopath ) && file_exists( $configpath ) ) ) 
			{
				die( 'CORRUPT FRIEND INSTALL! Cfg files are off.' );
			}
			
			//get some files
			include_once( $dbiopath );
			$conf = parse_ini_file( $configpath, true );
			
			if( !( isset( $conf['DatabaseUser']['host'] ) && isset( $conf['DatabaseUser']['login'] ) && isset( $conf['DatabaseUser']['password'] ) && isset( $conf['DatabaseUser']['dbname'] ) ) )
			{
				die( 'CORRUPT FRIEND INSTALL!' );
			}
			
			$dbo = new SqlDatabase( );
			if( $dbo->open( $conf['DatabaseUser']['host'], $conf['DatabaseUser']['login'], $conf['DatabaseUser']['password'] ) )
			{
				if( !$dbo->SelectDatabase( $conf['DatabaseUser']['dbname'] ) )
				{
					die( 'ERROR! DB not found!' );
				}
			}
			else
			{
				die( 'ERROR! MySQL unavailable!' );
			}	
			
			$server = getServerSettings( $dbo );
			
			if( !( $server && $server->host && $server->user_template_id && $server->admin_template_id ) )
			{
				die( 'ERROR! Server settings is missing! doormanoffice/settings 
{
	"host":'.$server->host.',
	"user_template_id":'.$server->user_template_id.',
	"admin_template_id":'.$server->admin_template_id.',
	"parent_workgroup_id":'.$server->parent_workgroup_id.'
} 
				' );
			}
			
			// TODO: Make support for managing to login to Friend if login to DoormanOffice fails if there is a Friend user that matches ??? Or do we want or need that ...
			
			
			if( $auth = remoteAuth( 
				$server->host . '/admin.php?module=restapi', 
				array(
					'username' => $json->username, 
					'password' => $json->password 
			) ) )
			{
				$query = ''; $userdata = '';
				
				if( $data = json_decode( $auth ) )
				{
					// TODO: Make support for checking on publickey if security ever is uppgraded in the future and we are not using passwords to authenticate ...
				
					// TODO: Perhaps look at storing userid's from DoormanOffice instead of names for matching both ways if needed ...
					
					$query = '
						SELECT 
							fu.*, fug2.Name AS Level 
						FROM 
							FUser fu, 
							FUserToGroup futg1, 
							FUserGroup fug1, 
							FUserToGroup futg2, 
							FUserGroup fug2 
						WHERE 
								fu.Name           = \'' . mysqli_real_escape_string( $dbo->_link, $json->username . '#' . $data->User->ID ) . '\' 
							AND fu.Password       = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) ) ) . '\' 
							AND fu.ID             = futg1.UserID 
							AND futg1.UserGroupID = fug1.ID 
							AND fug1.Name         = \'User\' 
							AND fug1.Type         = \'Doorman\' 
							AND futg2.UserID      = fu.ID 
							AND futg2.UserGroupID = fug2.ID 
							AND fug2.Type         = \'Level\' 
					';
					
					if( !( $json->username && $json->password && $json->publickey && $json->deviceid ) )
					{
						die( 'ERROR! Missing required login parameters ...' ); 
					}
				
					if( !( $data->User && $data->User->ID && $data->User->Level ) )
					{
						die( 'ERROR! Missing required api data from DoormanOffice ...' ); 
					}
					
					//die( $query . ' [] ' . print_r( $json,1 ) . ' [] ' . print_r( $data,1 ) );
					
					if( !$userdata = $dbo->fetchObject( $query ) )
					{
						
						// Create new user when nothing found ...
						
						if( !$udata = $dbo->fetchObject( '
							SELECT 
								fu.* 
							FROM 
								FUser fu 
							WHERE 
									fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $json->username . '#' . $data->User->ID ) . '\' 
								AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) ) ) . '\' 
						' ) )
						{
							$rs = $dbo->Query( '
							INSERT INTO FUser ( `Name`, `Password`, `PublicKey`, `Fullname`, `Email`, `LoggedTime`, `CreatedTime`, `LoginTime` ) 
							VALUES ('
								. ' \'' . mysqli_real_escape_string( $dbo->_link, $json->username . '#' . $data->User->ID ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) )  ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, $json->publickey ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, $data->User->Fullname ? $data->User->Fullname : '' ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, $data->User->Email ? $data->User->Email : '' ) . '\'' 
								. ','   . time() 
								. ','   . time() 
								. ','   . time() 
							.') ' );
						
							$udata = $dbo->fetchObject( '
								SELECT 
									fu.* 
								FROM 
									FUser fu 
								WHERE 
										fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $json->username . '#' . $data->User->ID ) . '\' 
									AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) ) ) . '\' 
							' );
						}
						
						//die( print_r( $udata,1 ) . ' -- ' );
						
						// add user to users group....
						$rs = $dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $udata->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'' . ( $data->User->Level >= 99 ? 'Admin' : 'User' ) . '\' AND `Type` = \'Level\' ) );' );
						
						checkDoormanUserGroup( $dbo );
						
						// add user to Doorman users group....
						$rs = $dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $udata->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'Doorman\' ) );' );
						
						// get users data...
						$rs = $dbo->fetchObject( $query );
						
						$userdata = $rs;
						
						
					}
					
					if( !$userdata ) 
					{ 
						die( 'CORRUPT FRIEND INSTALL! Could not get user data.' ); 
					}
					
					// TODO: Check if firstlogin has allready been inited
						
					// TODO: If it fails it should be retried ... create a check ...
					
					switch( $userdata->Level )
					{
				
						case 'User':
					
							if( !firstLoginSetup( $server->user_template_id, $userdata->ID, $dbo ) )
							{
								die( 'First Login Setup Error! Could not create user template!' );
							}
					
							break;
					
						case 'Admin':
					
							if( !firstLoginSetup( $server->admin_template_id, $userdata->ID, $dbo ) )
							{
								die( 'First Login Setup Error! Could not create admin template!' );
							}
					
							break;
				
						default:
					
							die( 'First Login Setup Error! User Level missing!' );
					
							break;
				
					}
					
					// If missing add login credentials to doormanoffice for the client in key management ...
					
					checkDoormanStoredKeys( $json, $userdata->ID, $dbo );
					
					
					
					// All done then ???
					
					
					$s = new dbIO( 'FUserSession', $dbo );
					$s->UserID = $userdata->ID;
					$s->DeviceIdentity = $json->deviceid;
					if( !$s->Load() )
					{
						$s->SessionID = hash( 'sha256', ( time().$userdata->Name.rand(0,999).rand(0,999).rand(0,999) ) );
					}
					$s->LoggedTime = time();
					$s->Save();
				
					if( $s->ID > 0 && ( $ses = $dbo->FetchObject( '
						SELECT * 
						FROM FUserSession 
						WHERE ID = \'' . $s->ID . '\' 
						AND UserID = \'' . $userdata->ID . '\' 
					' ) ) )
					{
						$ret = new stdClass();
						$ret->result    = 0;
						$ret->userid    = $userdata->ID;
						$ret->fullname  = $userdata->FullName;
						$ret->sessionid = $ses->SessionID;
						$ret->loginid   = $ses->ID;
					
						$encrypted = $fcrypt->encryptString( json_encode( $ret ), $userdata->PublicKey );
					
						//die( json_encode( $ret ) . ' [] ' . $usr->PublicKey . ' [] ' . $json->publickey );
				
						if( $encrypted && $encrypted->cipher )
						{
							die( $encrypted->cipher );
						}
					}
					
				}
				else
				{
					die( 'fail ... could not login to doormanoffice .....' . $server->host . '/admin.php?module=restapi ' . json_encode( array( 'username' => $json->username, 'password' => $json->password ) ) . ' ' . $auth );
				}
				
			}
			
			die( 'fail ......' );
			
		}
	}
	
	/*
		define some functions.
	*/
	function renderSecureLoginForm()
	{
	
		if( file_exists( dirname(__FILE__) . '/templates/login.html' ) )
		{
			die( renderReplacements( file_get_contents( dirname(__FILE__) . '/templates/login.html' ) ) );
		}
		
		die( '<h1>Your FriendUP installation is incomplete!</h1>' );
	}
	
	function renderReplacements( $template )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		$welcome = $GLOBALS['login_modules']['doorman']['Login']['logintitle_en'] !== null ? $GLOBALS['login_modules']['doorman']['Login']['logintitle_en'] : 'Doorman';
		$samlendpoint = $GLOBALS['login_modules']['doorman']['Module']['samlendpoint'] !== null ? $GLOBALS['login_modules']['doorman']['Module']['samlendpoint'] : 'about:blank';
		
		$samlendpoint .= '?friendendpoint=' . urlencode($GLOBALS['request_path']);
		
		$publickey = '';
		
		if( file_exists( 'cfg/crt/server_encryption_key.pem' ) )
		{
			if( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) )
			{
				if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
				{
					if( isset( $keys[1] ) )
					{
						$publickey = ( '-----' . $keys[1] );
					}
				}
			}
		}
		
		if( $publickey )
		{
			$fcrypt = new fcrypto();
					
			$publickey = $fcrypt->encodeKeyHeader( trim( $publickey ) );
		}
		
		$finds = [
			'{scriptpath}'
			,'{welcome}'
			,'{samlendpoint}'
			,'{publickey}'
		];
		
		$replacements = [
				$GLOBALS['request_path']
				,$welcome
				,$samlendpoint
				,$publickey
		];
		
		return str_replace( $finds, $replacements, $template );
	}
	
	
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
	
	
	function firstLoginSetup( $setupid, $uid, $dbo )
	{
		
		if( $setupid && $uid && $dbo )
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
						g.ID = \'' . $setupid . '\' 
					AND g.Type = "Setup" 
					AND s.Type = "setup" 
					AND s.Key = "usergroup" 
					AND s.UserID = g.ID 
			' ) )
			{
				
				// TODO: Connect this to the main handling of user templates so it doesn't fall out of sync ...
				
				$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
						
				
				if( $ug->Data && $uid )
				{
					// Language ----------------------------------------------------------------------------------------
	
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

					// Startup -----------------------------------------------------------------------------------------

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

					// Theme -------------------------------------------------------------------------------------------

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
	
	function getServerSettings( $dbo )
	{
		if( $dbo )
		{
			if( $row = $dbo->FetchObject( '
				SELECT * FROM FSetting s
				WHERE
					s.UserID = \'-1\'
				AND s.Type = \'doormanoffice\'
				AND s.Key = \'settings\'
				ORDER BY s.Key ASC
			' ) )
			{
				if( $resp = json_decode( $row->Data ) )
				{
					return $resp;
				}
			}
		}
		
		return false;
	}
	
	function checkDoormanUserGroup( $dbo )
	{
		if( $dbo )
		{
			if( $rs = $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `Name`=\'User\' AND `Type`=\'Doorman\' ' ) )
			{
				return;
			}
			
			$rs = $dbo->Query( 'INSERT INTO `FUserGroup` (`UserID`,`ParentID`,`Name`,`Type`) VALUES (\'0\',\'0\',\'User\',\'Doorman\');' );
			
			return;
		}
	}
	
	function checkDoormanStoredKeys( $data, $uid, $dbo )
	{
		if( $data && $data->username && $data->password && $data->publickey && $uid && $dbo )
		{
			if( $app = $dbo->fetchObject( '
				SELECT 
					a.* 
				FROM 
					FApplication a 
				WHERE 
						a.Name = "DoormanOffice" 
					AND a.UserID = \'' . $uid . '\' 
			' ) )
			{
				include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
				
				// Store key
				$k = new dbIO( 'FKeys', $dbo );
				$k->UserID = $uid;
				$k->ApplicationID = $app->ID;
				$k->IsDeleted = 0;
				if( !$k->Load() || !$k->Data )
				{
					$fcrypt = new fcrypto();
					
					$encrypted = $fcrypt->encryptString( '{"username":"' . $data->username . '","password":"' . $data->password . '"}', $data->publickey );
					
					if( $encrypted && $encrypted->cipher )
					{
						$k->Name         = 'credentials';
						$k->Data         = $encrypted->cipher;
						$k->PublicKey    = $data->publickey;
						$k->DateModified = date( 'Y-m-d H:i:s' );
						$k->DateCreated  = date( 'Y-m-d H:i:s' );
						$k->Save();
						
						return true;
					}
				}
			}
			else
			{
				// didn't find the application ...
			}
		}
		
		return false;
	}
	
	function generateDoormanUserPassword( $input )
	{
		// TODO: Look at this and see if everyone connected via this method is supposed to be unique ...
		
		$ret = 'HASHED' . hash( 'sha256', 'DOORMAN' . $input );
		return $ret;
	}
	
	function remoteAuth( $url, $args = false, $method = 'POST', $headers = false )
	{
		$curl = curl_init();
		
		//$headers = ( $headers ? $headers : array( 'Content-Type: application/json' ) );
		
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
		
			curl_setopt( $curl, CURLOPT_POST, true );
			curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
		}
	
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
	
		$output = curl_exec( $curl );
	
		$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	
	
		curl_close( $curl );
	
		return $output;
	}
	
	
	
	//render the form
	renderSecureLoginForm();

?>
