<?PHP

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
	This file implements US-280.
	
	It looks up Liberator SAML groups, compares them with existing user 
	Liberator applications, adds the apps when necessary, removes apps that the
	user should not have and adds/removes dock icons. It also creates new 
	Guacamole user for a new Friend user.

	Corner cases:
	When an existing app path is modified then it will be added (because 
	technically it is a new app) and a user will have yet another icon in the
	dock. This case should be handled manually by the admin by meddling in the 
	database and removing old apps by hand.

	Better approach:
	When an app is updated all old configuration should remain. It should be 
	added as a new app and the old app entry should have dummy/non-existing SAML
	groups set so that it will be automatically removed.

	To enable debugging comment out the return statement in debug() function.
*/

function debug( $format, ...$arg )
{
//     return; //comment this out to enable debug log file!
    static $f = FALSE;
    if (!$f){
        $f = fopen('/tmp/auth_saml.log', 'a+');
    }
    $argv = func_get_args();
    $x = sprintf($format, $argv);
    fwrite($f, date('ydm H:i:s ').$x."\n");
}

function auth_SAML_liberator_check_user_apps($friend_db, $friend_user_data, $saml_data)
{

	debug("********************** SAML LOGIN **********************");
	debug("User data".print_r($friend_user_data,TRUE));

    //dock placement and windowlist setting moved to firstlogin.php TK-821
    /* ------------------------------------------------- */

    // Step 1 - check if the key to look for in SAML data containing user groups 
    // is set in the DB
    if( $rs = $friend_db->fetchObject( '
    	SELECT 
    		Data 
    	FROM 
    		FSetting 
    	WHERE 
    		FSetting.Type = "mitra" AND FSetting.Key = "admin"
    ' ) )
    {
        $mitra_admin_settings = json_decode( $rs->Data );
        if( array_key_exists( 'saml_appenforce', $mitra_admin_settings ) )
        {
            $user_group_membership_string = join( 
            	$saml_data[ 'user' ][ $mitra_admin_settings->saml_appenforce], '::' 
            );

            // Step 2 - get a list of apps that have SAML access groups set
            if( $app_set = $friend_db->FetchObjects( '
            	SELECT 
            		ID as id, Data as data 
            	FROM 
            		FSetting 
            	WHERE
            		FSetting.Type = "mitraapp" AND FSetting.Data LIKE "%saml_accessgroups%"
            ' ) )
            {

                // Step 3 - build a list of Liberator apps that the user should 
                // have access to
                $desired_apps = array();
                $undesired_apps = array();
                foreach( $app_set as $app )
                {
                    $app_settings = json_decode( $app->data );
                    // Groups are separated by commas in the DB JSON entry
                    $app_groups = explode( ',', $app_settings->saml_accessgroups );
                    if( is_user_group_in_app_group( $user_group_membership_string, $app_groups ) )
                    {
                        $desired_apps[ $app->id ] = $app_settings;
                        // Assume that the user does not have them configured
                        $desired_apps[ $app->id ]->present = FALSE;
                    } 
                    else
                    {
                        $undesired_apps[ $app->id ] = $app_settings;
                    }
                }

                // Step 4 - connect to Guacamole database
                $rs = $friend_db->FetchRow( '
                	SELECT 
                		Data 
                	FROM 
                		FSetting s 
                	WHERE 
                		s.UserID = \'-1\' AND 
                		s.Type = "mitra" AND 
                		s.Key = "database";
                ' );
                
                $settings = json_decode( $rs[ 'Data' ] );

                $guacamole_db = new SqlDatabase();
                
                if( $guacamole_db->open(
                	$settings->host,
                	$settings->username,
                	$settings->password
                ) )
                {
                    if( $guacamole_db->SelectDatabase( $settings->database ) )
                    {
                        // Step 5 - check if the particular user has the 
                        // required apps already set in guacamole (and if the 
                        // user exists at all)
                        // FIXME use prepared statements
                        $user_pattern = 'mitra\_'. $guacamole_db->EscapeString( $friend_user_data[ 'username' ], TRUE/*strict*/ ) .'\_%';

                        $query = '
                        	SELECT 
                        		COUNT(*) 
                        	AS 
                        		c 
                        	FROM 
                        		guacamole_user 
                        	WHERE 
                        		username LIKE "mitra_' . $guacamole_db->EscapeString( $friend_user_data[ 'username' ] ) . '"
                        ';
                        $user_entry = $guacamole_db->fetchObjects( $query );

						// User exists?
                        if( $user_entry[ 0 ]->c > 0 )
                        { 
                            debug( 'User exists in guacamole_user' );

                            $query = '
                            	SELECT 
                            		connection_id, connection_name 
                            	FROM 
                            		guacamole_connection 
                            	WHERE 
                            		connection_name LIKE "' . $user_pattern . '" AND protocol = "rdp"
                            ';
                            
                            $user_connections = $guacamole_db->fetchObjects( $query );

                            $application_ids_to_remove = array();
                            $application_ids_to_add = array();

							// Has user got any connections?
                            if( $user_connections )
                            {
                                $user_connections_to_remove = array();

                                debug( 'Existing connections: ' . print_r( $user_connections, TRUE ) );

                                // Step 6 - get Liberator application IDs from the connections table
                                foreach( $user_connections as $user_connection )
                                {
                                    $connection_string_chunks = explode( '_', $user_connection->connection_name );
                                    $user_connection->app_id = end( $connection_string_chunks );

                                    // Step 7 - list apps that the user has but should NOT have
                                    foreach( $undesired_apps as $undesired_app_id => $undesired_app )
                                    {
                                        if( $user_connection->app_id == $undesired_app_id )
                                        {
                                            $application_ids_to_remove[] = $undesired_app_id;
                                        }
                                    }

                                    // Step 8 - list apps that the user should have
                                    foreach( $desired_apps as $desired_app_id => $desired_app )
                                    {
                                        if( $user_connection->app_id == $desired_app_id)
                                        {
                                            $desired_apps[$desired_app_id]->present = TRUE;
                                        }
                                    }
                                }
                                // End of loop of user connections

                                foreach( $desired_apps as $desired_app_id => $desired_app )
                                {
                                    if( $desired_apps[$desired_app_id]->present === FALSE )
                                    {
                                        $application_ids_to_add[] = $desired_app_id;
                                    }
                                }

                                $application_ids_to_add = array_unique( $application_ids_to_add );
                                $application_ids_to_remove = array_unique( $application_ids_to_remove );

                                debug( 'missing desired apps '. print_r( $application_ids_to_add, TRUE ) );
                                debug( 'existing undesired apps '. print_r( $application_ids_to_remove, TRUE ) );

                                // Step 9 - add missing apps to Liberator and dock
                                add_apps(
                                	$guacamole_db, 
                                	$friend_db, 
                                	$desired_apps, 
                                	$application_ids_to_add, 
                                	$friend_user_data
                                );

                                // Step 10 - remove apps from Liberator and dock that the user has but should NOT have
                                remove_apps(
                                	$guacamole_db, 
                                	$friend_db, 
                                	$undesired_apps, 
                                	$application_ids_to_remove, 
                                	$friend_user_data
                                );
                            } 
                            // User has no RDP connections, it probably does not exist
                            else
                            { 
                                debug( 'adding new user (path 1)' );
                                create_guacamole_account( $guacamole_db, $friend_db, $friend_user_data );
                                add_apps( $guacamole_db, $friend_db, $desired_apps, array_keys($desired_apps), $friend_user_data );
                            }
                        } 
                        // User does not exist - create connections
                        else
                        { 
                            debug( 'adding new user (path 2)' );

                            // Delete any previous connections that may exist - 
                            // this could only happen if the user has been
                            // Deleted in Friend and then logged in again via 
                            // SAML with the same credentials
                            
                            $deletequery = '
                            DELETE FROM 
	                            guacamole_connection 
                            WHERE
                            	connection_name LIKE "' . $user_pattern . '" AND protocol = "rdp"
                            ';
                            
                            $guacamole_db->query( $deletequery );

                            create_guacamole_account( $guacamole_db, $friend_db, $friend_user_data );
                            add_apps(
                            	$guacamole_db, 
                            	$friend_db, 
                            	$desired_apps, 
                            	array_keys( $desired_apps ), 
                            	$friend_user_data
                            );
                        }

                    } 
                    else 
                    {
                        // TODO: log DB failure
                        return;
                    }
                }
                // End if Guacamole DB has been opened
            }
            // End if apps with SAML permissions exist in the DB
        }
        // End if saml_appenforce is in settings
    }
    // End if mitra/admin settings exist
}

function create_guacamole_account( $guacamole_db, $friend_db, $friend_user_data )
{
    // Step 1 - create new guacamole user
    $guacamole_username = 'mitra_' . $friend_user_data[ 'username' ];
    $guacamole_password = md5( openssl_random_pseudo_bytes( 32 ) );

    $saltquery = 'SET @salt = UNHEX( SHA2( UUID(), 256 ) );';
    $insertquery = '
    INSERT INTO 
	guacamole_user
	(
		username, 
		password_salt, 
		password_hash,
		password_date
	) 
	VALUES 
	(
		"' . $guacamole_db->EscapeString( $guacamole_username ) . '", 
		@salt, 
		UNHEX(
			SHA2(
				CONCAT(
					"' . $guacamole_db->EscapeString( $guacamole_password ) . '", 
					HEX( @salt ) 
				), 
				256 
			) 
		), 
		NOW() 
	);';

    $guacamole_db->query( $saltquery );
    $guacamole_db->query( $insertquery );

    // Step 2 - get the newly created guacamole user ID
    $query = 'SELECT user_id FROM guacamole_user WHERE username = "' . $guacamole_db->EscapeString( $guacamole_username ) . '"';
    debug( $query );
    $user_id_object = $guacamole_db->fetchObject( $query );
    $guacamole_user_id = $user_id_object->user_id;

    // Step 3 - get guacamole "admin" user ID
    $query = 'SELECT MIN(user_id) AS user_id FROM guacamole_system_permission WHERE permission = "CREATE_USER"';
    debug( $query );
    $guacamole_admin_id_object = $guacamole_db->FetchObject( $query );
    $guacamole_admin_id = intval( $guacamole_admin_id_object->user_id );

    // Step 4 - add guacamole permissions for the newly created user
    // FIXME: Figure out if all those permissions are necessary 
    //        (as connections are configured by poking in the database anyway)
    $query = 'INSERT INTO guacamole_user_permission (user_id,affected_user_id,permission) VALUES (' . $guacamole_user_id . ', ' . $guacamole_user_id . ',"READ" )';
    $guacamole_db->Query( $query );
    debug( $query );

    $query = 'INSERT INTO guacamole_user_permission ( user_id,affected_user_id,permission ) VALUES ( ' . $guacamole_admin_id . ', ' . $guacamole_user_id . ', "READ" )';
    // FIXME: Figure out if setting the READ permission twice is necessary
    $guacamole_db->Query( $query );
    debug( $query );

    $guacamole_db->Query( 'INSERT INTO guacamole_user_permission (user_id,affected_user_id,permission) VALUES ( ' . $guacamole_admin_id . ', ' . $guacamole_user_id . ', "UPDATE" )' );
    $guacamole_db->Query( 'INSERT INTO guacamole_user_permission (user_id,affected_user_id,permission) VALUES ( ' . $guacamole_admin_id . ', ' . $guacamole_user_id . ', "DELETE" )' );
    $guacamole_db->Query( 'INSERT INTO guacamole_user_permission (user_id,affected_user_id,permission) VALUES ( ' . $guacamole_admin_id . ', ' . $guacamole_user_id . ', "ADMINISTER" )' );

    // Step 5 - store the plaintext password in FriendCore database
    $clean_query = 'DELETE FROM FSetting WHERE UserID = ' . intval( $friend_user_data[ 'userid' ] ) . ' AND `Type`= "mitra" AND `Key` = "passhash"';
    $query = 'INSERT INTO FSetting ( UserID, Type, `Key`, Data ) VALUES ( ' . $friend_user_data[ 'userid' ]. ', "mitra", "passhash", "' . $guacamole_password . '" )';
    debug( $query );
    // Yes, we need to clean in case somebody gave that user manual access sometime in the past.
    $friend_db->Query( $clean_query );
    // Yes - the password in the DB is "enclosed within quotes"
    $friend_db->Query( $query );
}

function add_apps($guacamole_db, $friend_db, $apps, $app_ids_to_add, $friend_user_data)
{
    $guacamole_username = 'mitra_' . $friend_user_data[ 'username' ];

    foreach( $app_ids_to_add as $app_id )
    {
        debug( "Adding app %d", $app_id );
        
        $guacamole_connection_name = 'mitra_' . $friend_user_data[ 'username' ] . '_' . $app_id;

        // Step 1 - create new connection
        $insert_connection_query = '
        INSERT INTO 
        guacamole_connection 
        ( 
        	connection_name, parent_id, protocol 
        ) 
        VALUES
        (
        	"' . $guacamole_db->EscapeString( $guacamole_connection_name ) . '", 1, "rdp"
        );';
        
        $guacamole_db->Query( $insert_connection_query );
        $new_connection_id = $guacamole_db->fetchObject( 'SELECT LAST_INSERT_ID() AS id;' )->id;

        // Step 2 - get guacamole user id
        $guacamole_user_id = $guacamole_db->fetchObject( '
        SELECT 
        	user_id AS id 
        FROM 
        	guacamole_user 
        WHERE 
        	username = "' . $guacamole_db->EscapeString( $guacamole_username, FALSE/*not strict*/ ) . '";' 
        )->id;

        //step 3 - add permissions for the new connection
        $add_permission_query = '
        INSERT INTO 
        guacamole_connection_permission 
        (
        	user_id, connection_id, permission 
        ) 
        VALUES
        (
        	' . $guacamole_user_id . ',
        	' . $new_connection_id . ',
        	"READ"
        )';
        
        $guacamole_db->Query( $add_permission_query );

        //step 4 - add connection parameters
        $dummy_value = md5( $friend_user_data[ 'username' ] );
		$uexplode = explode( '@', $friend_user_data[ 'username' ] );
		$para_username = $uexplode[ 0 ];
		$para_userdomain = ( $uexplode[ 1 ] ? $uexplode[ 1 ] : '' );

        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'username', $para_username );
        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'password', $dummy_value );
        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'domain', $para_userdomain );

        if( $apps[ $app_id ]->{'alternate shell'} == 'REMOTEAPP' )
        {
           	guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'remote-app', $apps[$app_id]->remoteapplicationprogram );
        }
        else
        {
	        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'initial-program', $apps[$app_id]->remoteapplicationprogram );
	    }

        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'hostname', $apps[$app_id]->{'full address'} );
        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'port', $apps[$app_id]->{'server port'} );
        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'security', 'any' );
        guacamole_add_connection_parameter( $guacamole_db, $new_connection_id, 'ignore-cert', 'true' );
        // Private-key? probably not needed
        // Passphrase?  probably not needed

        // Step 5 - add icon to dock
        $icon_path = 'System:gfx/icons/64x64/apps/akonadi.png';
        if( isset( $apps[ $app_id ]->icon ) )
        {
            if( strlen($apps[$app_id]->icon) > 3 )
            {
                $icon_path = str_replace('/webclient/', 'System:', $apps[$app_id]->icon);
            }
        }
        add_dock_icon(
            $friend_db,
            $friend_user_data[ 'userid' ],
            $apps[ $app_id ]->name,
            'Mitra ' . $apps[ $app_id ]->remoteapplicationprogram,
            $icon_path
        );
    }
}

function remove_apps( $guacamole_db, $friend_db, $apps, $app_ids_to_remove, $friend_user_data )
{
    $guacamole_username = 'mitra_' . $friend_user_data[ 'username' ];

    foreach( $app_ids_to_remove as $app_id )
    {
        debug( 'Removing app' . print_r( $apps[ $app_id ], TRUE ) );

        $guacamole_connection_name = 'mitra_' . $friend_user_data[ 'username' ] . '_' . $app_id;
        debug( 'Guacamole connection name = ' . $guacamole_connection_name );

        // Step 1 - get connection ID
        $query = 'SELECT * FROM guacamole_connection WHERE connection_name = "' . $guacamole_db->EscapeString($guacamole_connection_name) . '"';
        $connection_object = $guacamole_db->fetchObject( $query );

        if( !$connection_object )
        {
            debug( 'connection does not exist?' );
            return;
        }

        $connection_id = $connection_object->connection_id;
        debug( "Removing connection id %d", $connection_id );

        // Step 2 - delete connection permissions
        $query = 'DELETE FROM guacamole_connection_permission WHERE connection_id = ' . $connection_id;
        $guacamole_db->Query($query);
        debug($query);

        // Step 3 - delete connection parameters
        $query = 'DELETE FROM guacamole_connection_parameter WHERE connection_id = ' . $connection_id;
        debug( $query );
        $guacamole_db->Query( $query );

        // Step 4 - delete connection
        $query = 'DELETE FROM guacamole_connection WHERE connection_id = ' . $connection_id;
        $guacamole_db->Query( $query );
        debug( $query );

        // Step 5 - remove icon from dock
        $query = '
        DELETE FROM 
        	DockItem 
        WHERE 
        	UserID = ' . $friend_user_data[ 'userid' ] . ' AND 
        	Application = "' . $friend_db->EscapeString( 'Mitra ' . $apps[ $app_id ]->remoteapplicationprogram ) . '"
        ';
        debug( $query );
        $friend_db->Query( $query );
    }
}

function guacamole_add_connection_parameter( $guacamole_db, $connection_id, $name, $value )
{
    $query = '
    INSERT INTO 
    guacamole_connection_parameter 
    (
    	connection_id, 
    	parameter_name, 
    	parameter_value
    ) 
    VALUES 
    (
    	' . $connection_id . ',
    	"' . $guacamole_db->EscapeString( $name ) . '",
    	"' . $guacamole_db->EscapeString($value) . '"
    )';
    $guacamole_db->Query( $query );
}

function add_dock_icon( $friend_db, $friend_user_id, $application_name, $application_cmd, $application_icon )
{
    $clean_query = 'DELETE FROM DockItem WHERE UserID=' . intval( $friend_user_id ) . ' AND Application = "' . $friend_db->EscapeString( $application_cmd ) . '"';

    $query = 'INSERT INTO DockItem ( UserID, Type, Icon, Application, ShortDescription ) VALUES ( ' . intval( $friend_user_id ) . ', "executable", "' . $friend_db->EscapeString($application_icon) . '", "' . $friend_db->EscapeString( $application_cmd ) . '", "' . $friend_db->EscapeString( $application_name ) . '")';

    $friend_db->Query( $clean_query ); //just make sure we clean up and dont have icons for the same actual app twice
    $friend_db->Query( $query );
}

function is_user_group_in_app_group( $user_groups/*string*/, $app_groups/*array*/ )
{
    /* Current logic simply looks if any of the app groups is a substring of the user group string. */
    foreach( $app_groups as $app_group )
    {
        if( $app_group != '' && strpos($user_groups, $app_group) !== FALSE )
        {
            return true;
        }
    }
    return false;
}

?>
