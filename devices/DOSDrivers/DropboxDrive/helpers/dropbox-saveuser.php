<?php
	
        /*
                
                This files saves a users Dropbox authorisation into the database.
                
                The expected intut is the hashval request parameter that needs to be parsed and is exptected to contain all relevant information.
                
                Variables needed for configuration are on top of the script. The variable names are selv explanatory
                
        */

        $dbio_location = '/home/friend/friendup/build/php/classes/dbio.php';

        $db_host = 'localhost';
        $db_user = '';
        $db_pass = '';
        $db_dbname = '';


        /* END OF CONFIGURATION SECTION. NO NEED TO CHANGE BELOW THIS LINE! */
        
        /*
                
                This script runs in simple steps
                
                1. check if hashval is there
                2. explode it into pieces and parse through the given pieces
                3. extract detailed information from the state piece and check that the contained information is valid
                4. save data and say thank you to the user
                
        */
	
       //include db class....
        include_once( $dbio_location );

        if( isset( $_REQUEST['hashval'] ) )
        {
                $tmp = explode( '&', urldecode( $_REQUEST['hashval'] ) );
                if( is_array($tmp) )
                {
                        $result = new object();
                        $friend_userid = $friend_mountname = false;
                        
                        for( $i = 0; $i < count($tmp); $i++ )
                        {
                                $pair = explode('=', $tmp[ $i ] );
                                
                                if( is_array( $pair ) )
                                {
                                        if( substr($pair[0], 0, 1 ) == '#' ) $pair[0] = substr($pair[0],1 );
                                        //print( $pair[0] . " == " . $pair[1] . "<hr />" );
                                        
                                        switch( $pair[0] )
                                        {
                                                
                                                case 'access_token':
                                                        $result->access_token = $pair[1];
                                                        break;
                                                        
                                                case 'uid':
                                                        $result->db_uid = $pair[1];
                                                        break;
                                                
                                                case 'state':
                                                        $decoded = hex2bin( $pair[1] );
                                                        $t2 = explode('::',$decoded);
                                                        if( is_array( $t2 ) && count($t2) > 2 )
                                                        {
                                                                $friend_userid = intval( $t2[0] );
                                                                $friend_mountname = $t2[1];
                                                                $friend_sessionid = $t2[2];
                                                        }
                                                        break;
                                                        
                                                
                                                default:
                                                        
                                                        break;                                          
                                                
                                        }
                                } 
                        }
                        	
                        if( isset($result->access_token) && isset( $result->db_uid ) && $friend_userid !== false &&  $friend_mountname !== false )
                        {
                                //write auth data to database
                                $db = new SqlDatabase();
                                if(     $db->Open($db_host,$db_user,$db_pass) && $db->SelectDatabase($db_dbname) )
                                {
                                        $rs = $db->FetchObject('SELECT ID FROM Filesystem WHERE Name="'. $friend_mountname .'" AND UserID = ' . $friend_userid);
                                        if( $rs )
                                        {
                                                if( $db->Query('UPDATE Filesystem SET Config=\''. json_encode($result) .'\' WHERE Name="'. $friend_mountname .'" AND UserID = ' . $friend_userid) )
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
                                                die('Could not find Dropbox mount for this user! ' . $friend_userid . ' / Dropbox mountname given was: ' . $friend_mountname);
                                        }
                                }
                                else
                                {
                                        die('Could not connect to database');
                                }
                        }
                        else
                        {
                                die('Input to our script was incomplete and/or invalid. Unable to proceed.');
                        }
                        
                }
        }
        else
        {
                die('Go away');
        }	
	
?>