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
	
/*
	PHP file that will be include by simplesamlscript after the user has 
	successfully authenticated him/herself.
*/

if( !function_exists( 'authoriseFriendSAMLUser' ) )
{
	$mitradb = false;
	
	// Authorize the Friend SAML user
	function authoriseFriendSAMLUser( $uid, $usermail, $displayname, $samldata )
	{
		$dbiopath = __DIR__ . '/../../../php/classes/dbio.php';
		$configpath = __DIR__ . '/../../../cfg/cfg.ini';
		$samlconfig = __DIR__ . '/../../../cfg/saml.ini';

		if( 
			!(file_exists( $dbiopath ) && 
			file_exists( $configpath ) && 
			file_exists( $samlconfig ) )
		) 
		{
			die( 'CORRUPT FRIEND INSTALL! Config file(s) are off.' );
		}

		//get some files
		include_once( $dbiopath );
		
		$conf = parse_ini_file($configpath,true);
		$samlconf = parse_ini_file($samlconfig,true);
		
		if( 
			!( isset( $conf[ 'DatabaseUser' ][ 'host' ] ) &&
			isset( $conf[ 'DatabaseUser' ][ 'login' ] ) && 
			isset( $conf[ 'DatabaseUser' ][ 'password' ] ) &&
			isset( $conf[ 'DatabaseUser' ][ 'dbname' ] ) &&
			isset( $samlconf[ 'Module' ][ 'samlendpoint' ] ) ) 
		) 
		{
			die( 'CORRUPT FRIEND INSTALL! Config file has erroneous information.' );
		}
		
		$dbo = new SqlDatabase();
		if( $dbo->open( 
			$conf[ 'DatabaseUser' ][ 'host' ],
			$conf[ 'DatabaseUser' ][ 'login' ],
			$conf[ 'DatabaseUser' ][ 'password' ] 
		) )
		{
			if( $dbo->SelectDatabase( $conf[ 'DatabaseUser' ][ 'dbname' ] ) )
			{
				//we just go on here...
			}
			else
			{
				die( 'ERROR! DB not found!' );
			}
		}
		else
		{
			die('ERROR! MySQL unavailable!');	
		}

		$friend_user_id = FALSE;
		
		$getuserquery = '
			SELECT 
				fu.* 
			FROM 
				FUser fu, FUserToGroup futg, FUserGroup fug 
			WHERE 
				fu.Name = \''. mysqli_real_escape_string( $dbo->_link, $uid ) .'\' AND 
				fu.Password = \''. mysqli_real_escape_string( $dbo->_link, '{S6}' . hash('sha256', generateSAMLUserPassword( $uid ) ) ) .'\' AND 
				fu.ID = futg.UserID AND 
				futg.UserGroupID = fug.ID AND 
				fug.Name=\'User\' AND 
				fug.Type=\'SAML\';
		';
		
		$userdata = false;
		
		if( $rs = $dbo->fetchObject( $getuserquery ) )
		{
			$userdata = $rs;
			$friend_user_id = $userdata->ID;
		}
		else
		{
			//create new user...
			$insertquery = 'INSERT INTO FUser (`Name`,`Password`,`Fullname`,`Email`,`LastActionTime`,`CreationTime`,`LoginTime`) VALUES ('
				. '\'' . mysqli_real_escape_string($dbo->_link, $uid) . '\''
				. ',\'' . mysqli_real_escape_string($dbo->_link, '{S6}' . hash('sha256', generateSAMLUserPassword( $uid ) )  ) .'\''
				. ',\'' . mysqli_real_escape_string($dbo->_link, $displayname) .'\''
				. ',\'' . mysqli_real_escape_string($dbo->_link, $usermail) .'\''
				. ',' . time()
				. ',' . time()
				. ',' . time()
			.');';
			
			$rs = $dbo->Query( $insertquery );
			$udata = $dbo->fetchObject( '
				SELECT 
					fu.* 
				FROM 
					FUser fu, FUserToGroup futg, FUserGroup fug 
				WHERE 
					fu.Name = \''. mysqli_real_escape_string( $dbo->_link, $uid ) .'\' AND 
					fu.Password = \''. mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', generateSAMLUserPassword( $uid ) ) ) .'\';
			' );

			
			if (!$udata)
			{
                echo 'Noudata';
                die();
			}
			
			$friend_user_id = $udata->ID;
			
			// Add user to users group....
			$groupquery = '
			INSERT INTO 
				`FUserToGroup` (`UserID`,`UserGroupID`) 
				VALUES ( 
					'. intval( $udata->ID ) . ', 
					( SELECT `ID` 
						FROM `FUserGroup` 
					  WHERE `Name`=\'User\' AND `Type`=\'Level\'
					) 
				)
			;';
			$rs = $dbo->Query( $groupquery );

			checkSAMLUserGroup( $dbo );
			
			// Add user to SAML users group....
			$groupquery = '
			INSERT INTO 
				`FUserToGroup` (`UserID`,`UserGroupID`) 
				VALUES ( 
					' . intval( $udata->ID ) . ', 
					( SELECT `ID` 
						FROM `FUserGroup` 
					  WHERE `Name`=\'User\' AND `Type`=\'SAML\'
					)
				)
			;';
			$rs = $dbo->Query( $groupquery );

			// Get users data...
			$userdata = $dbo->fetchObject( $getuserquery );				
		}
		if( !$userdata )
		{ 
			die('CORRUPT FRIEND INSTALL! Could not get user data.'); 
		}
					
		$getfirstloginsetting = '
			SELECT 
				Data 
			FROM 
				FSetting 
			WHERE 
				`UserID` = -1 AND 
				`Type` = "global" AND 
				`Key` = "firstlogin"
		';
		
		if( $set = $dbo->fetchObject( $getfirstloginsetting ) )
		{
			try
			{
				$tmp = json_decode( $set->Data );
			}
			catch( Exception $e )
			{
				$tmp = false;
			}
			
			if( $tmp && isset( $tmp->locale ) )
			{
				$localequery = 'INSERT INTO `FSetting` (`UserID`,`Type`,`Key`,`Data`) VALUES ('. intval( $udata->ID ) .', "system","locale","'. $tmp->locale .'");';
				$rs = $dbo->Query($localequery);
			}
			else
			{
				// no locale... defaults to english
			}
		}			
		
		$udata = [];
		$udata[ 'userid' ]   = $friend_user_id;
		$udata[ 'username' ] = $uid;
		$udata[ 'userpass' ] = generateSAMLUserPassword( $uid );
		$udata[ 'logout' ]   = $samlconf[ 'Module' ][ 'samlendpoint' ] . '?logout';
		
		
		// Check potential Mitra setup for this user! 
		// Add items to dock if he has groups that match mitra apps.
		require( 'auth_saml_liberator.php' );
		
		auth_SAML_liberator_check_user_apps( $dbo, $udata, $samldata );

		if( function_exists( 'postLogin' ) )
		{
			$us = new stdClass();
			$us->ID = $friend_user_id;
			postLogin( $dbo, $us );
		}
		
		die( generateLoginOutput( $udata, $samldata ) );
		
	};
	
	function checkSAMLUserGroup( $dbo )
	{
		if( $rs = $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `Name`=\'User\' AND `Type`=\'SAML\';' ) )
		{
			return;
		}
		
		$dbo->Query( 'INSERT INTO `FUserGroup` (`Name`,`Type`) VALUES (\'User\',\'SAML\');' );
		return;
	}
	
	function generateSAMLUserPassword( $input )
	{
		$ret = 'HASHED' . hash('sha256', 'SAMLUSER' . $input );
		return $ret;
	}
	
	function generateLoginOutput( $userdata, $samldata )
	{
		$username = $userdata['username'];
		$userpass = $userdata['userpass'];
		$logouturl = $userdata['logout'];
		if ( !$samldata )
			$samldata = '';
		else
			$samldata = json_encode( $samldata );
		
$ret = <<<EOT
<html>
	<head>
		<title>Friend OS logging in, please wait...</title>
	</head>
	<body>
	<div id="result"></div>
	<script type="text/javascript">
		var loginTries = 0;
		function showLoginError()
		{ 
			document.getElementById("result").innerHTML = "<h1>Error during login! Please try again!</h1>"; 
		}
		function loginSAMLUser()
		{
			if( window.opener )
			{
				window.opener.location.href=''; window.close();
			}
			else
			{
				parent.postMessage({'cmd':'login','username':'{$username}','password':'{$userpass}','logouturl':'{$logouturl}', 'samldata':{$samldata}},'*');
			}
		}
		setTimeout( loginSAMLUser, 500 );
	</script>
	</body>
</html>
EOT;
		return $ret;
		
	}
}
?>
