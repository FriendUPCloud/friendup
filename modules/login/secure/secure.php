<?php
	
	error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
	ini_set( 'display_errors', '1' );
	
	// TODO Simplify this on cleanup !!! ....
	
	if( isset( $GLOBALS['request_variables']['encrypted'] ) )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		if( file_exists( 'cfg/crt/key.pem' ) )
		{
			if( $privateKey = file_get_contents( 'cfg/crt/key.pem' ) )
			{
				$fcrypt = new fcrypto();
				
				$decrypted = $fcrypt->decryptString( $GLOBALS['request_variables']['encrypted'], $privateKey );
				
				die( $GLOBALS['request_variables']['encrypted'] . ' [] ' . print_r( $decrypted,1 ) . ' [] ' . $privateKey );
				
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
								$s->CreationTime = time();
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
		//error_reporting( E_ALL );
		//ini_set( 'display_errors', '1' );
		
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		if( $json = json_decode( $GLOBALS['request_variables']['data'] ) )
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
					$s->LastActionTime = time();
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
		$providers = [];
		$provider = false;
		$lp = '';		
	
		if( isset( $GLOBALS['login_modules']['saml']['Providers'] ) )
		{
			foreach( $GLOBALS['login_modules']['saml']['Providers'] as $pk => $pv );
			{
				//do some checks here
			}
		}
		
		if( file_exists(dirname(__FILE__) . '/templates/login.html') )
			die( renderReplacements( file_get_contents(dirname(__FILE__) . '/templates/login.html') ) );
		
		
		die('<h1>Your FriendUP installation is incomplete!</h1>');
	}
	
	function renderReplacements( $template )
	{
		$welcome = $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] !== null ? $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] :'Secure Login';
		$samlendpoint = $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] !== null ? $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] : 'about:blank';
		
		$samlendpoint .= '?friendendpoint=' . urlencode($GLOBALS['request_path']);
		
		$publickey = '';
		
		if( file_exists( 'cfg/crt/key.pub' ) )
		{
			$publickey = file_get_contents( 'cfg/crt/key.pub' );
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

	//render the form
	renderSecureLoginForm();

?>
