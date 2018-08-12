	<?php			
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

/*
	File access interface.
	
	Originally created for OnlyOffice integration
*/

faLog( 'all data we got ' . print_r( $argv, 1 ) );

if( $argv[1] )
{
	$tmp = explode( '/', $argv[ 1 ] );

	if( !isset( $tmp[1] ) ) { friend404(); } // dies...
	
	//faLog( print_r( $tmp,1  ) );
	
	ob_clean();
	switch( strtolower( $tmp[2] ) ) 
	{
		case 'newfile':
			if( strtolower( $tmp[4] ) == 'user' )
			{
				faLog( 'We are saving a new file.' );
			}
			break;
		case 'getfile':
			if( strtolower( $tmp[4] ) == 'user' )
			{
				faLog( 'We are loading the user file.' );
				/* SECURITY HOLE! WE CIRCUMVENT ALL SECURITY HERE */
				loadUserFile( $tmp[5] , rawurldecode( $tmp[3] ) );
			}
			break;
			
		case 'callback':
			if( strtolower( $tmp[3] ) == 'file' )
			{
				faLog( 'We\'re asked for a file.' );
				/* SECURITY HOLE! WE CIRCUMVENT ALL SECURITY HERE */
				$filepath = rawurldecode( $tmp[4] );
				$user = $tmp[6];
				handleFileCallback( $user, $filepath, ( isset( $argv[2] ) ? $argv[2] : false ) );
			}
			break;
			
		default:
			die( '{"error":0}');
			break;
	}

	
}

faLog( print_r( $argv,1  ) );
die( '<pre>' . print_r( $argv,1  ) );	





/* TODO: SECURITY HOLE! WE CIRCUMVENT ALL SECURITY HERE */
/*
	Handle a "callback" from third party application.	
*/	
function handleFileCallback( $user, $filepath, $requestjson, $authid = false )
{	
	if( $requestjson == false )
	{
		die( '{"error":0}');
	}
	if( substr($requestjson, 0, 11) == '?post_json=' )
	{
		$requestjson = substr( $requestjson, 11 );
	}

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
		case '3':
		case '6':
			// Check if this is just a callback on an as of yet not saved file
			if( $filepath == 'newpresentation' || $filepath == 'newsheet' || $filepath == 'newdocument' )
			{
				if( $authid )
				{
					tellApplication( 'Please save the file before quicksaving.', $authid );
				}
				faLog( 'Could not save previously unsaved file.' );
				die( '{"error":3}' );
				break;
			}
			// Ok, go ahead and save the file
			saveUserFile( $user, $filepath, $json );
			faLog( 'save the file... ' . $filepath . ' for user ' . $user .'  to ..' . print_r( $json,1  ) );
			break;
	}

	faLog( 'filecallback... cleaned..' . print_r( $pr,1  ) );

	die( '{"error":0}');
}

function tellApplication( $message, $authid = false )
{
	global $SqlDatabase, $Config, $User;
	
	if( !$authid ) return false;
	
	if( $rec = $SqlDatabase->fetchObject( 'SELECT * FROM FUserApplication WHERE AuthID=\'' . $authid . '\' AND UserID=\'' . $User->ID . '\'' ) )
	{
		// The message must always be in JSON format
		if( !is_object( $message ) )
		{
			$c = new stdClass();
			$c->message = $message;
			$message = $c;
		}
		
		// Send the GET request
		/*$response = file_get_contents( $Config->FCHost . ':' . $Config->FCPort . 
			'/system.library/user/session/sendmsg/?authid=' . $authid . '&message=' . json_encode( $message );
		return $response;*/
	}
	
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
		faLog( 'New file returned.' );
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.pptx' );
		$o->type = 'newfile';
		return $o;
	}
	else if( $filePath == 'newdocument' )
	{
		faLog( 'New file returned.' );
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.docx' );
		$o->type = 'newfile';
		return $o;
	}
	else if( $filePath == 'newsheet' )
	{
		faLog( 'New file returned.' );
		$o = new stdClass();
		$o->content = file_get_contents( 'modules/onlyoffice/data/new.xlsx' );
		$o->type = 'newfile';
		return $o;
	}
	
	faConnectDB();
	
	//we log the user in here and load the requested file if he has access
	faLog( 'Get file at ' . $filePath . ' :: for user ' . $username );
	
	/* SECURITY HOLE! */ 
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
	
	include_once( 'classes/file.php' );
	include_once( 'classes/door.php' );

	faLog('Trying tp load file from ' . $filePath );

	
	$f = new File( $filePath );
	
	
	faLog('File object is now ' . print_r( $f, 1 ) );
	
	if( $f->Load() )
	{
		//faLog( 'Did it loaD? ' . $f->ID . ' ' . $f->_content );
		return $f;
	}
	else
	{
		//faLog( 'Did not load... :(' );
		return false;
	}
}

/*
	load a user file....
*/
function loadUserFile( $username, $filePath )
{
	faLog( "Running getUserFile( $username, $filePath );" );
	$file = getUserFile( $username, $filePath );
	
	// New file?
	if( isset( $file->type ) && $file->type == 'newfile' )
	{
		faLog( 'Setting content..' . strlen( $file->content ) );
		die( $file->content );
	}
	
	faLog( 'Not caught..' ); // ' . print_r( $file, 1 ) );
		
	// Loaded file
	if( $file )
		die( $file->GetContent() ); 
	else
	{
		faLog( 'Could not find file : ' . $filePath . '!' );
		friend404(); //dies....
	}
}

/*
	save a user file
*/
function saveUserFile( $username, $filePath, $json )
{
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
			faLog( 'Could not find load file from document server : ' . print_r($json,1) .  '!' . print_r( $c ,1 ) );
			die( '{"error":1}');
		}
		if( $file )
		{
			$result = $file->Save( $fc );
			if( $result )
			{
				faLog( 'File saved :) ' . $filePath . '!' . $result );
				die( '{"error":0}');					
			}
			else
			{
				faLog( 'File saved FAILED!' . $filePath . '!' . print_r( $file,1 ) );
				die( '{"error":1}');					
			}

		}
		else
		{
			faLog( 'Could not find file : ' . $filePath . '!' );
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
	file_put_contents('log.txt', $stringtolog.PHP_EOL , FILE_APPEND | LOCK_EX);
}




/**
	Connect to our database
*/
function faConnectDB()
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
	
	faLog('Config set ' . print_r( $Config,1 ) );
	
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
}

?>
