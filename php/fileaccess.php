	<?php			
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/*
	File access interface.
	
	Originally created for OnlyOffice integration - many request are specific to their REST API.
*/

//faLog( 'all data we got ' . print_r( $argv, 1 ) );

if( $argv[1] )
{
	$tmp = explode( '/', $argv[ 1 ] );

	if( !isset( $tmp[1] ) ) { friend404(); } // dies...
	
	faLog('complete request: ' .  print_r( $tmp,1  ) );
	
	ob_clean();
	switch( strtolower( $tmp[2] ) ) 
	{
		case 'newfile':
			if( strtolower( $tmp[4] ) == 'user' )
			{
				if( isset( $tmp[6] ) ) faLog('Our authID is' . $tmp[6] );
			}
			break;
		case 'getfile':
			if( strtolower( $tmp[4] ) == 'user' )
			{
				/* SECURITY HOLE! WE MIGHT CIRCUMVENT ALL SECURITY HERE */
				loadUserFile( $tmp[5] , rawurldecode( $tmp[3] ) );
			}
			break;
			
		case 'callback':
			if( strtolower( $tmp[3] ) == 'file' )
			{
				
				/* SECURITY HOLE! WE MIGHT CIRCUMVENT ALL SECURITY HERE */
				$filepath = rawurldecode( $tmp[4] );
				$user = isset( $tmp[6] ) ? $tmp[6]  : false;
				$authID = isset( $tmp[7] ) ? $tmp[7]  : false;
				$windowID = isset( $tmp[8] ) ? $tmp[8]  : false; 
				if( $user ) handleFileCallback( $user, $filepath, ( isset( $argv[2] ) ? $argv[2] : false ), $authID, $windowID );
			}
			break;
			
		default:
			die( '{"error":0}');
			break;
	}

	
}

die('500 - unable to process your request');


/* TODO: SECURITY HOLE! WE CIRCUMVENT ALL SECURITY HERE */
/*
	Handle a "callback" from third party application.	
*/	
function handleFileCallback( $user, $filepath, $requestjson, $authid = false, $windowid = false )
{	
	
	//faLog('handleFileCallback' .  $user . ' :: ' .  $filepath . ':: ' . print_r( $requestjson, 1) );
	
	if( $requestjson == false )
	{
		die( '{"error":0}');
	}
	
	if( substr($requestjson, 0, 23) == 'friendrequestparameters' )
	{
		$requestjson = file_get_contents( end( explode( '=' , $requestjson ) ) );
	}

	if( substr($requestjson, 0, 11) == '?post_json=' )
	{
		$requestjson = substr( $requestjson, 11 );
	}
	
	//faLog('request json is' . $requestjson );
	
	try
	{
		$json = json_decode($requestjson);
	}
	catch(Exception $e)
	{
		die( '{"error":1}');
	}
	
	if( !isset( $json->status ) ) die( '{"error":1}');

	switch( $json->status  )
	{
		//these statuses give us access to update file contents
		case '2':
			/* 
				status 2 is only called by document server when all active users have closed a file
				as we warn for unsaved changes and notify once file has been saved, we just will drop the file here and tell document server "everything is fine dave"	
			*/
			die( '{"error":0}' );
			break;
		case '3':
		case '6':
			// Check if this is just a callback on an as of yet not saved file
			if( $filepath == 'newpresentation' || $filepath == 'newsheet' || $filepath == 'newdocument' )
			{
				//we pretend everything is ok to the Document server but send a message to the app to open a save as dialog at the same time - that forces
				// the user to choose a location which in return will result in a proper save :)
				//faLog('new file... do we have a windowid ? ' . $windowid );
				if( $windowid )
				{
					tellApplication( 'open_save_as', $user, $windowid, $authid );
					die( '{"error":0}' );
				}
				else
				{
					die( '{"error":3}' );					
				}
				break;
			}
			
			//faLog( '#saveUserFile will be called ' . $user . ' :: ' . $filepath . ' :: ' . print_r( $json, 1 ) );
			
			// Ok, go ahead and save the file
			saveUserFile( $user, $filepath, $json, $windowid, $authid );
			break;
	}
	die( '{"error":0}');
}

function tellApplication( $command, $user, $windowid, $authid )
{
	global $SqlDatabase, $Config, $User;
	
	if( !$windowid ) return false;
	if( !$Config ) faConnectDB( $user );
	
	
	$messagestring = '/system.library/user/servermessage?message=' . rawurlencode( addslashes( '{"msgtype":"applicationmessage","targetapp":"' .  $windowid . '","applicationcommand":"'. $command .'"}' ) );

	$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
		( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $messagestring;
	$url .= '&sessionid=' . $User->SessionID;

	$c = curl_init();
	curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
	curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
	curl_setopt( $c, CURLOPT_URL,            $url                );
	curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
	$r = curl_exec( $c );
	curl_close( $c );

	return false;
}

/* TODO: SECURITY HOLE! WE CIRCUMVENT ALL SECURITY HERE */
/*
	
*/
function getUserFile( $username, $filePath )
{

	global $SqlDatabase, $Config, $User;
	
	if( $filePath == 'newpresentation' )
	{	
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.pptx' );
		$o->type = 'newfile';
		return $o;
	}
	else if( $filePath == 'newdocument' )
	{
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.docx' );
		$o->type = 'newfile';
		return $o;
	}
	else if( $filePath == 'newsheet' )
	{
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.xlsx' );
		$o->type = 'newfile';
		return $o;
	}
	
	faConnectDB( $username );
	

	
	include_once( 'classes/file.php' );
	include_once( 'classes/door.php' );

	
	$f = new File( getOriginalFilePath( $filePath ) );
	
	if( $f->Load() )
	{
		return $f;
	}
	else
	{
		return false;
	}
}

/*
	check if we have a shadow file... make sure we access the correct one
	
	this function must be the same as in the onlyoffice module!
*/
function getOriginalFilePath( $inpath )
{
	//check that we dont write to a hidden version lockfile - correct the path if we do get this...
	$filename =  strpos($inpath, '/') > 1 ? end( explode('/', $inpath) ) : end( explode(':', $inpath) );
	if( strpos($filename, '._') == 0 )
	{
		//we are trying to write to a temp version copy here.... no no no no
		$newname = preg_replace('/\._[^_]*_/', '', $filename);
		return str_replace($filename, $newname, $inpath);
	}
	return $inpath;
}

/*
	load a user file....
*/
function loadUserFile( $username, $filePath )
{
	//faLog( "Running getUserFile( $username, $filePath );" );
	$file = getUserFile( $username, $filePath );
	
	// New file?
	if( isset( $file->type ) && $file->type == 'newfile' )
	{
		die( $file->content );
	}

	// Loaded file
	if( $file )
	{
		//we need to set the correct header for our file...
		//copied form catch_all lines 143ff
		print( "---http-headers-begin---\n" );
		switch( strtolower( end( explode( '.', $file->Filename ) ) ) )
		{
			case 'css':
				print( "Content-Type: text/css\n" );
				break;
			case 'js':
				print( "Content-Type: text/javascript\n" );
				break;
			case 'html':
			case 'htm':
				print( "Content-Type: text/html\n" );
				break;
			case 'xml':
				print( "Content-Type: text/xml\n" );
				break;
			case 'jpeg':
			case 'jpg':
				print( "Content-Type: image/jpeg\n" );
				break;
			case 'png':
				print( "Content-Type: image/png\n" );
				break;
			case 'gif':
				print( "Content-Type: image/gif\n" );
				break;
			case 'svg':
				print( "Content-Type: image/svg\n" );
				break;
			case 'log':
			case 'txt':
				print( "Content-Type: text/plain\n" );
				break;
			case 'mp3':
				print( "Content-Type: audio/mp3\n" );
				break;
			case 'wav':
				print( "Content-Type: audio/wav\n" );
				break;
			case 'ogg':
				print( "Content-Type: audio/ogg\n" );
				break;
			//dont do anything for office types... seemed to work without.
			case 'docx':
			case 'xlsx':
			case 'pptx':
				break;
			default:
				print( "Content-Type: application/octet-stream\n" );
				break;
		}
		print( "---http-headers-end---\n" );
		die( $file->GetContent() ); 
	}
	else
	{
		faLog( 'Could not find file : ' . $filePath . '!' );
		friend404(); //dies....
	}
}

/*
	save a user file
*/
function saveUserFile( $username, $filePath, $json, $windowid = false, $authid = false )
{
	global $SqlDatabase, $Config, $User;


	if( isset(  $json->url ) )
	{
		/*$contextOptions = array(
		    'ssl' => array(
		        'verify_peer_name' => false,
		        'verify_peer'       => false,
		        'allow_self_signed'=> true
		    )
		);
		$sslContext = stream_context_create($contextOptions);
		$fc = file_get_contents( urlencode( $json->url ), false, $sslContext );*/
		$c = curl_init();
		curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
		curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
		curl_setopt( $c, CURLOPT_URL,            $json->url          );
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
		$fc = curl_exec( $c );
		curl_close( $c );
		
		$file = getUserFile( $username, $filePath );
		
		if( !$fc )
		{
			//faLog( 'Could not find load file from document server : ' . print_r($json,1) .  '!' . print_r( $c ,1 ) );
			die( '{"error":1}');
		}
		if( $file )
		{
			$result = $file->Save( $fc );
			if( $result )
			{
				//faLog( 'File saved :) ' . $filePath . '!' . $result );
				if( !$Config ) faConnectDB( $username );		
				if( $windowid )
				{
					tellApplication( 'file_saved', $username, $windowid, $authid);
				}
				die( '{"error":0}');					
			}
			else
			{
				//faLog( 'File saved FAILED!' . $filePath . '!' . print_r( $file,1 ) );
				die( '{"error":1}');					
			}

		}
		else
		{
			//faLog( 'Could not find file : ' . $filePath . '!' );
			die( '{"error":1}');
		}
	}
	die( '{"error":1}');
}

/*
	some helper function definitions...
	
*/
if( !function_exists( 'friend404') )
{
	function friend404()
	{
		print( "---http-headers-begin---\n" );
		print( "Status Code: 404\n" );
		print( "---http-headers-end---\n" );
		die( '<!DOCTYPE html>
		<html>
			<head>
				<title>Friend Core - 404</title>
			</head>
			<body>
				<h1>404 - File not found!</h1>
				<p>Friend Core has failed to find your file. '. ( $path ? $path : $argv[1] ) .'</p>
				<p><a href="javascript:history.back(-1)">Go back</a>.</p>
			</body>
		</html>
		' );
	}
}


if( !function_exists('jsUrlEncode') )
{
	function jsUrlEncode( $in )
	{ 
		$out = '';
		for( $i = 0; $i < strlen( $in ); $i++ )
		{
			$hex = dechex( ord( $in[ $i ] ) );
			if( $hex == '' ) $out = $out . urlencode( $in[ $i ] );
			else $out = $out . '%' . ( ( strlen( $hex ) == 1 ) ? ( '0' . strtoupper( $hex ) ) : ( strtoupper( $hex ) ) );
		}
		return str_replace(
			array( '+', '_', '.', '-' ),
			array( '%20', '%5F', '%2E', '%2D' ),
			$out
		);
	}
}

/*
	helper function for logging
*/
function faLog( $stringtolog )
{
	file_put_contents('log/php_log.txt', $stringtolog.PHP_EOL , FILE_APPEND | LOCK_EX);
}




/**
	Connect to our database
*/
function faConnectDB( $username )
{
	global $SqlDatabase, $Config;
	
	$configfilesettings = parse_ini_file( 'cfg/cfg.ini', true);
	
	
	// Set config object
	$Config = new stdClass();
	$car = array( 'Hostname', 'Username', 'Password', 'DbName',
	              'FCHost', 'FCPort', 'FCUpload', 'FCPort', 
	              'SSLEnable', 'FCOnLocalhost', 'Domains', 'friendnetwork', 
	              'WorkspaceShortcuts', 'preventWizard'
	);

	// Shortcuts
	$dataUser = $configfilesettings[ 'DatabaseUser' ];
	$dataCore = $configfilesettings[ 'FriendCore' ];
	$datCore2 = $configfilesettings[ 'Core' ]; // TODO: Deprecated?
	if( isset( $configfilesettings[ 'Security' ] ) )
		$security = $configfilesettings[ 'Security' ];
	else $security = [];
	if( isset( $configfilesettings[ 'FriendNetwork' ] ) )
	{
		$frindNet = $configfilesettings[ 'FriendNetwork' ];
	}
	else $frindNet = [];
	
	foreach( array(
		'host', 'login', 'password', 'dbname', 
		'fchost', 'fcport', 'fcupload', 'port', 
		'SSLEnable', 'fconlocalhost', 'domains','friendnetwork',
		'workspaceshortcuts', 'preventwizard'
	) as $k=>$type )
	{
		$val = '';
		
		switch( strtolower( $type ) )
		{
			case 'workspaceshortcuts':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : [];
				if( is_string( $val ) )
				{
					$val = trim( $val );
					$o = array();
					$val = explode( ',', $val );
					foreach( $val as $v )
						$o[] = trim( $v );
					$val = $o;
					$o = null;
				}
				break;
			case 'host':
			case 'login':
			case 'password':
			case 'dbname':
				$val = isset( $dataUser[ $type ] ) ? $dataUser[ $type ] : '';
				break;	
			case 'fcupload':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				if( substr( $val, 0, 1 ) != '/' )
					$val = getcwd() . '/' . $val;
				break;
			case 'preventwizard':
			case 'port':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'fcport':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'fchost':
			case 'fconlocalhost':
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				break;
			case 'sslenable':	
				$val = isset( $dataCore[ $type ] ) ? $dataCore[ $type ] : '';
				// Check in deprecated location
				if( !$val )
				{
					$val = isset( $datCore2[ $type ] ) ? $datCore2[ $type ] : '';
				}
				break;
				
			case 'domains':
				$val = isset( $security[ $type ] ) ? $security[ $type ] : '';
				break;	
			case 'friendnetwork':
				$val = isset( $frindNet[ 'enabled' ] ) ? $frindNet[ 'enabled' ] : '0';	
				break;
			default:
				$val = '';
				break;	
		}
		// Make sure the value is valid
		if( isset( $val ) && $val )
		{
			//$Logger->log( 'Setting: ' . $car[$k] . ' = ' . $val );
			$Config->{$car[$k]} = $val;
		
		}		
	}	
	
	//faLog('Config set ' . print_r( $Config,1 ) );
	
	if( $configfilesettings && isset( $configfilesettings['DatabaseUser'] ) )
	{
		include_once( 'classes/dbio.php' );
		$SqlDatabase = new SqlDatabase();
		if( !$SqlDatabase->Open( $configfilesettings['DatabaseUser']['host'], $configfilesettings['DatabaseUser']['login'], $configfilesettings['DatabaseUser']['password'] ) )
		{
			faLog('Could not connect DB in fileaccess');
			friend404();
		}	
		$SqlDatabase->SelectDatabase( $configfilesettings['DatabaseUser']['dbname'] );
	}
	else
	{
		faLog('Could not find cfg from fileaccess.php');
		friend404();
	}

	/* SECURITY HOLE!? */ 
	global $User;
	$User = new dbIO( 'FUser' );
	$User->Name = $username;
	if( !$User->Load() ){ faLog('Could not load user: ' . $username ); friend404(); }

	define( 'FRIEND_USERNAME', $username );
	define( 'FRIEND_PASSWORD', 'NOT_THE_REAL_PASSWORD' );

	global $GLOBALS;
	if( !isset( $GLOBALS[ 'args' ] ) )
	{
		$GLOBALS[ 'args' ] = (object) array('sessionid' => $User->SessionID);
	}
	else
	{
		$GLOBALS[ 'args' ]->sessionid = $User->SessionID;
	}

}

?>
