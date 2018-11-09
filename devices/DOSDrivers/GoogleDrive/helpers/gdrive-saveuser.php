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

        /*
                
                This files saves a users Google Drive authorisation into the database. This works 99% like the Dropbox stuff.
                
                The expected intut is the hashval request parameter that needs to be parsed and is exptected to contain all relevant information.
                
                Variables needed for configuration are on top of the script. The variable names are selv explanatory
                
                This file should be made available on the same server as the FriendUP install it is meant to work for. It will need access to the DB and the HTTP path to this file must be defined as
                
                system/googldrive ==> interfaceurl property
                
                This file depends on the oAUTH redirect that right now is located at friendup.cloud/gdrive/gdrive.php
                
        */

        $friend_location = '/home/friend/friendup/';


        $db_host = 'localhost';
        $db_user = '';
        $db_pass = '';
        $db_dbname = '';

        /* END OF CONFIGURATION SECTION. NO NEED TO CHANGE BELOW THIS LINE! */
        
        /*
                
                This script runs in simple steps
                
                1. check if code and state is there
                2. explode it into pieces and parse through the given pieces
                3. extract detailed information from the state piece and check that the contained information is valid
                4. save data and say thank you to the user
                
        */

		$cfg = file_exists($friend_location.'/build/cfg/cfg.ini') ? parse_ini_file($friend_location.'/build/cfg/cfg.ini',true) : [];
		
		if( is_array($cfg) && isset( $cfg['GoogleDriveAPI'] ) )
		{
			$sysinfo = $cfg['GoogleDriveAPI'];
		}
		else
		{
			die('invalid cfg.ini');
		}

        //include db class....
        $dbio_location = $friend_location . 'build/php/classes/dbio.php';
        $gdrive_classes_location = $friend_location . 'devices/DOSDrivers/GoogleDrive/Google/vendor/autoload.php';

        include_once( $dbio_location );
		require_once( $gdrive_classes_location ); 


		/*
			check the request for our vars and try to get valid info out of them :)
		*/
        if( isset( $_REQUEST['code'] ) && isset( $_REQUEST['state']  ) )
        {
			$result = (object) array('friendly' => 'property');
            $friend_userid = $friend_mountname = false;

            $result->access_code = $_REQUEST['code'];
			unset($result->friendly);
            $decoded = hex2bin( $_REQUEST['state'] );
            $t2 = explode('::',$decoded);
            if( is_array( $t2 ) && count($t2) > 2 )
            {
              $friend_userid = intval( $t2[0] );
              $friend_mountname = $t2[1];
              $friend_sessionid = $t2[2];
            }
  		}  
  		    
  		// if we have what we need check with google that it works and store token into DB.
        if( isset($result->access_code) && $friend_userid !== false &&  $friend_mountname !== false )
        {

			//if we have a code we want to create a token from it...
			$client = new Google_Client();
			$client->setApplicationName($sysinfo['project_id']);
			$client->setClientId($sysinfo['client_id']);
			$client->setClientSecret($sysinfo['client_secret']);	
			$client->setDeveloperKey($sysinfo['key']);
			$client->setIncludeGrantedScopes(true);
			$client->addScope(Google_Service_Drive::DRIVE);
			$client->setState( rawurlencode( bin2hex( $statevar ) ) );
			$client->setAccessType('offline');
			$client->setRedirectUri($sysinfo['redirect_uri']);	
	
			
			//authenticate
			if( $client->authenticate( $_REQUEST['code'] ) )
			{
				$access_token = $client->getAccessToken();

				if(!$access_token ) die('Could not authorize user!');
					
				$result->access = $access_token;

				unset( $result->access_code );
				
				$db = new SqlDatabase();
				if( $db->Open($db_host,$db_user,$db_pass) && $db->SelectDatabase($db_dbname) )
				{
					$rs = $db->FetchObject('SELECT * FROM Filesystem WHERE Name="'. $friend_mountname .'" AND UserID = ' . $friend_userid);
					if( $rs && $rs->ID )
					{

						if( $rs->Config )
						{
							$tmp = (array)json_decode($rs->Config);

							if( $tmp )
							{
								foreach ($result as $key => $value) {
									$tmp[ $key ] = $value;
								}
								$result = $tmp;
							}
						}

						if( $db->Query('UPDATE Filesystem SET Config=\''. mysqli_real_escape_string( $db->_link, json_encode($result) ) .'\' WHERE Name="'. mysqli_real_escape_string( $db->_link, $friend_mountname ) .'" AND UserID = ' . intval( $friend_userid ) ) )
						{
							die('<h1>Thank you for authorizing FriendUP. You can now safely close this window.</h1>');
						}
						else
						{
							die( 'Could not store into database ' . $db->_lastError );
						}
					}
					else
					{
						die('Could not find Google Drive mount for this user! ' . $friend_userid . ' / Google Drive mountname given was: ' . $friend_mountname);
					}
				}
				else
				{
					die('Could not connect to database');
				}
			}
			die('Could not authenticate!');
		}
		die('Go away!');

?>
