<?php
	
	error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
	ini_set( 'display_errors', '1' );
	
	// TODO Simplify this on cleanup !!! ....
	
	// TODO: Check why this fails when adding a bigger server publickey to encrypt data and the server respons with a error message with no info, most likely before it arrives here ...
	
	if( isset( $GLOBALS['request_variables']['encrypted'] ) )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		if( ( $file1 = file_exists( 'cfg/crt/key.pem' ) ) || ( $file2 = file_exists( 'cfg/crt/server_encryption_key.pem' ) ) )
		{
			$privateKey = false;
			
			if( $file1 && ( $key = file_get_contents( 'cfg/crt/key.pem' ) ) )
			{
				$privateKey = $key;
			}
			else if( $file2 && ( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) ) )
			{
				if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
				{
					if( isset( $keys[0] ) )
					{
						$privateKey = ( $keys[0] . '-----' );
					}
				}
			}
			
			//die( 'JAVELL ||| ' );
			
			if( $privateKey )
			{
				$fcrypt = new fcrypto();
				
				$decrypted = $fcrypt->decryptString( $GLOBALS['request_variables']['encrypted'], $privateKey );
				
				die( $GLOBALS['request_variables']['encrypted'] . ' [] ' . print_r( $decrypted,1 ) . ' [] ' . $privateKey );
				
				
				
				
				// TODO: Simplify into one return place for both methods ....
				
				
				
				
				
				if( $decrypted && $decrypted->plaintext )
				{
					if( $json = json_decode( $decrypted->plaintext ) )
					{
						// Setup mysql abstraction
						if( file_exists( 'cfg/cfg.ini' ) )
						{
							$configfilesettings = parse_ini_file( 'cfg/cfg.ini', true );
							include_once( 'php/classes/dbio.php' );
							
							// Set config object
							$Config = new stdClass();
							$car = array( 'Hostname', 'Username', 'Password', 'DbName',
										  'FCHost', 'FCPort', 'FCUpload', 
										  'SSLEnable', 'FCOnLocalhost', 'Domains' );
							
							foreach( array(
								'host', 'login', 'password', 'dbname', 
								'fchost', 'fcport', 'fcupload',
								'SSLEnable', 'fconlocalhost', 'domains'
							) as $k=>$type )
							{
								$val = '';
								switch( $type )
								{
									case 'host':
									case 'login':
									case 'password':
									case 'dbname':
										$val = isset( $configfilesettings['DatabaseUser'][$type] ) ? $configfilesettings['DatabaseUser'][$type] : '';
										break;	
									
									case 'fchost':
									case 'fcport':
									case 'fcupload':
									case 'fconlocalhost':
										$val = isset( $configfilesettings['FriendCore'][$type] ) ? $configfilesettings['FriendCore'][$type] : '';
										break;
										
									case 'SSLEnable':	
										$val = isset( $configfilesettings['Core'][$type] ) ? $configfilesettings['Core'][$type] : '';
										break;
										
									case 'domains':
										$val = isset( $configfilesettings['Security'][$type] ) ? $configfilesettings['Security'][$type] : '';
										break;		
									default:
										$val = '';
										break;	
								}
								$Config->{$car[$k]} = $val;
							}
							
							$SqlDatabase = new SqlDatabase();
							if( !$SqlDatabase->Open( $Config->Hostname, $Config->Username, $Config->Password ) )
							{
								die( 'fail<!--separate-->Could not connect to database.' );
							}
							$SqlDatabase->SelectDatabase( $Config->DbName );
							
							// DeviceID, PublicKey and Username
							
							if( $usr = $SqlDatabase->FetchObject( '
								SELECT * 
								FROM FUser 
								WHERE Name = \'' . $json->username . '\' 
							' ) )
							{
								// If PublicKey is missing add it once and use the PublicKey from the database to send data back to client
								
								$json->publickey = $fcrypt->encodeKeyHeader( trim( $json->publickey ) );
								
								if( !isset( $usr->PublicKey ) || !$usr->PublicKey )
								{
									$d = new DbTable( 'FUser', $SqlDatabase );
									if( $d->LoadTable() )
									{
										$publickey = false;
										
										if ( isset( $d->_fieldnames ) )
										{
											foreach( $d->_fieldnames as $f )
											{
												if( $f == 'PublicKey' )
												{
													$publickey = true;
												}
											}
											
											if( !$publickey )
											{
												$d->AddField ( 'PublicKey', 'text', array ( 'after'=>'Password' ) );
											}
										}
									}
									
									$u = new dbIO( 'FUser', $SqlDatabase );
									$u->ID = $usr->ID;
									if( $u->Load() )
									{
										if( isset( $u->PublicKey ) )
										{
											$u->PublicKey = $json->publickey;
											$u->Save();
										
											$usr->PublicKey = $u->PublicKey;
										}
									}
								}
								
								if( !$usr->PublicKey || ( $json->publickey != $usr->PublicKey ) )
								{
									//die( print_r( $json,1 ) . ' [] ' . print_r( $usr,1 ) );
									die( 'failed ... wrong login information' );
								}
								
								$s = new dbIO( 'FUserSession', $SqlDatabase );
								$s->UserID = $usr->ID;
								$s->DeviceIdentity = $json->deviceid;
								if( !$s->Load() )
								{
									$s->SessionID = hash( 'sha256', ( time().$usr->Name.rand(0,999).rand(0,999).rand(0,999) ) );
								}
								$s->LoggedTime = time();
								$s->Save();
								
								if( $s->ID > 0 && ( $ses = $SqlDatabase->FetchObject( '
									SELECT * 
									FROM FUserSession 
									WHERE ID = \'' . $s->ID . '\' 
									AND UserID = \'' . $usr->ID . '\' 
								' ) ) )
								{
									$ret = new stdClass();
									$ret->result    = 0;
									$ret->userid    = $usr->ID;
									$ret->fullname  = $usr->FullName;
									$ret->sessionid = $ses->SessionID;
									$ret->loginid   = $ses->ID;
									
									//die( json_encode( $ret ) . ' [] ' . $usr->PublicKey );
									
									$encrypted = $fcrypt->encryptString( json_encode( $ret ), $usr->PublicKey );
									
									if( $encrypted && $encrypted->cipher )
									{
										die( $encrypted->cipher );
									}
								}
							}
						}
					}
				}
			}
		}
		
		die( 'fail ......' );
	}
	else if( isset( $GLOBALS['request_variables']['data'] ) )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		if( $json = json_decode( $GLOBALS['request_variables']['data'] ) )
		{
			$dbiopath = __DIR__ . '/../../../php/classes/dbio.php';
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
			
			
			
			// TODO: Make support for managing to login to Friend if login to DoormanOffice fails if there is a Friend user that matches ??? Or do we want or need that ...
			
			
			// Setup mysql abstraction
			if( file_exists( 'cfg/cfg.ini' ) )
			{
				$data = [];
				
				if( $auth = remoteAuth( 
					'https://doormanoffice.friendup.cloud' . '/admin.php?module=restapi', 
					array(
						'username' => $json->username, 
						'password' => $json->password, 
				) ) )
				{
					$query = ''; $rs = '';
					
					if( $data = json_decode( $auth ) )
					{
						// TODO: Make support for checking on publickey if security ever is uppgraded in the future and we are not using passwords to authenticate ...
						
						// TODO: Perhaps look at storing userid's from DoormanOffice instead of names for matching both ways if needed ...
						
						$query = '
							SELECT 
								fu.* 
							FROM 
								FUser fu, 
								FUserToGroup futg, 
								FUserGroup fug 
							WHERE 
									fu.Name          = \'' . mysqli_real_escape_string( $dbo->_link, $json->username ) . '\' 
								AND fu.Password      = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) ) ) . '\' 
								AND fu.ID            = futg.UserID 
								AND futg.UserGroupID = fug.ID 
								AND fug.Name         = \'User\' 
								AND fug.Type         = \'Doorman\' 
						';
						
						if( $rs = $dbo->fetchObject( $query ) )
						{
							
							// There is a user ...
							
								
							
						}
						else
						{
							
							// Create new user when nothing found ...
							
							/*$rs = $dbo->Query( '
							INSERT INTO FUser ( `Name`, `Password`, `Fullname`, `Email`, `LoggedTime`, `CreatedTime`, `LoginTime` ) 
							VALUES ('
								. ' \'' . mysqli_real_escape_string( $dbo->_link, $json->username ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateDoormanUserPassword( $json->password ) )  ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, $data->User->Fullname ) . '\'' 
								. ',\'' . mysqli_real_escape_string( $dbo->_link, $data->User->Email ) . '\'' 
								. ','   . time() 
								. ','   . time() 
								. ','   . time() 
							.') ' );*/
							
							//$udata = $dbo->fetchObject( 'SELECT fu.* FROM FUser fu, FUserToGroup futg, FUserGroup fug WHERE fu.Name = \''. mysqli_real_escape_string($dbo->_link, $uid) .'\' AND fu.Password = \''. mysqli_real_escape_string($dbo->_link, '{S6}' . hash('sha256', generateSAMLUserPassword( $uid ) )  ) .'\';' );
							
							// add user to users group....
							//$rs = $dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $udata->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'Level\' ) )' );
							
							//checkSAMLUserGroup( $dbo );
							
							// add user to SAML users group....
							//$rs = $dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`, `UserGroupID` ) VALUES ('. intval( $udata->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'Doorman\' ) )' );
							
							
							// get users data...
							$rs = $dbo->fetchObject( $query );
							
						}
						
					}
					else
					{
						die( 'fail .....' . $auth );
					}
				}
				
				die( print_r( $json,1 ) . ' ... ' . $query . ' [] ' . print_r( $data,1 ) . ' -||- ' . print_r( $rs,1 ) );
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				$configfilesettings = parse_ini_file( 'cfg/cfg.ini', true );
				include_once( 'php/classes/dbio.php' );
				
				// Set config object
				$Config = new stdClass();
				$car = array( 'Hostname', 'Username', 'Password', 'DbName',
							  'FCHost', 'FCPort', 'FCUpload', 
							  'SSLEnable', 'FCOnLocalhost', 'Domains' );
				
				foreach( array(
					'host', 'login', 'password', 'dbname', 
					'fchost', 'fcport', 'fcupload',
					'SSLEnable', 'fconlocalhost', 'domains'
				) as $k=>$type )
				{
					$val = '';
					switch( $type )
					{
						case 'host':
						case 'login':
						case 'password':
						case 'dbname':
							$val = isset( $configfilesettings['DatabaseUser'][$type] ) ? $configfilesettings['DatabaseUser'][$type] : '';
							break;	
						
						case 'fchost':
						case 'fcport':
						case 'fcupload':
						case 'fconlocalhost':
							$val = isset( $configfilesettings['FriendCore'][$type] ) ? $configfilesettings['FriendCore'][$type] : '';
							break;
							
						case 'SSLEnable':	
							$val = isset( $configfilesettings['Core'][$type] ) ? $configfilesettings['Core'][$type] : '';
							break;
							
						case 'domains':
							$val = isset( $configfilesettings['Security'][$type] ) ? $configfilesettings['Security'][$type] : '';
							break;		
						default:
							$val = '';
							break;	
					}
					$Config->{$car[$k]} = $val;
				}
				
				$SqlDatabase = new SqlDatabase();
				if( !$SqlDatabase->Open( $Config->Hostname, $Config->Username, $Config->Password ) )
				{
					die( 'fail<!--separate-->Could not connect to database.' );
				}
				$SqlDatabase->SelectDatabase( $Config->DbName );
				
				// DeviceID, PublicKey and Username
						
				if( $usr = $SqlDatabase->FetchObject( '
					SELECT * 
					FROM FUser 
					WHERE Name = \'' . $json->username . '\' 
				' ) )
				{
					// If PublicKey is missing add it once and use the PublicKey from the database to send data back to client
					
					$fcrypt = new fcrypto();
					
					$json->publickey = $fcrypt->encodeKeyHeader( trim( $json->publickey ) );
					
					if( !isset( $usr->PublicKey ) || !$usr->PublicKey )
					{
						$d = new dbTable( 'FUser', $SqlDatabase );
						if( $d->LoadTable() )
						{
							$publickey = false;
							
							if ( isset( $d->_fieldnames ) )
							{
								foreach( $d->_fieldnames as $f )
								{
									if( $f == 'PublicKey' )
									{
										$publickey = true;
									}
								}
								
								if( !$publickey )
								{
									$d->AddField ( 'PublicKey', 'text', array ( 'after'=>'Password' ) );
								}
							}
						}
						
						$u = new dbIO( 'FUser', $SqlDatabase );
						$u->ID = $usr->ID;
						if( $u->Load() )
						{
							if( isset( $u->PublicKey ) )
							{
								$u->PublicKey = $json->publickey;
								$u->Save();
							
								$usr->PublicKey = $u->PublicKey;
							}
						}
					}
					
					if( !$usr->PublicKey || ( $json->publickey != $usr->PublicKey ) )
					{
						//die( print_r( $json,1 ) . ' [] ' . print_r( $usr,1 ) . ' [] "' . $json->publickey . '" [] "' . $usr->PublicKey . '"' );
						die( 'failed ... wrong login information' );
					}
					
					$s = new dbIO( 'FUserSession', $SqlDatabase );
					$s->UserID = $usr->ID;
					$s->DeviceIdentity = $json->deviceid;
					if( !$s->Load() )
					{
						$s->SessionID = hash( 'sha256', ( time().$usr->Name.rand(0,999).rand(0,999).rand(0,999) ) );
					}
					$s->LoggedTime = time();
					$s->Save();
					
					if( $s->ID > 0 && ( $ses = $SqlDatabase->FetchObject( '
						SELECT * 
						FROM FUserSession 
						WHERE ID = \'' . $s->ID . '\' 
						AND UserID = \'' . $usr->ID . '\' 
					' ) ) )
					{
						$ret = new stdClass();
						$ret->result    = 0;
						$ret->userid    = $usr->ID;
						$ret->fullname  = $usr->FullName;
						$ret->sessionid = $ses->SessionID;
						$ret->loginid   = $ses->ID;
						
						$encrypted = $fcrypt->encryptString( json_encode( $ret ), $usr->PublicKey );
						
						//die( json_encode( $ret ) . ' [] ' . $usr->PublicKey . ' [] ' . $json->publickey );
						
						if( $encrypted && $encrypted->cipher )
						{
							die( $encrypted->cipher );
						}
					}
				}
			}
		}
		
		die( 'fail ......' );
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
		
		$welcome = $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] !== null ? $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] : 'Doorman';
		$samlendpoint = $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] !== null ? $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] : 'about:blank';
		
		$samlendpoint .= '?friendendpoint=' . urlencode($GLOBALS['request_path']);
		
		$publickey = '';
		
		if( file_exists( 'cfg/crt/key.pub' ) )
		{
			$publickey = file_get_contents( 'cfg/crt/key.pub' );
		}
		else if( file_exists( 'cfg/crt/server_encryption_key.pem' ) )
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
		
		return str_replace($finds, $replacements, $template);
	}
	
	function generateDoormanUserPassword( $input )
	{
		// TODO: Look at this and see if everyone connected via this method is supposed to be unique ...
		
		$ret = 'HASHED' . hash('sha256', 'DOORMAN' . $input );
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
