<?php

global $SqlDatabase, $args, $User, $Logger;

global $mitradb;
$mitradb = false;

include_once( 'php/friend.php' );

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
// Get user level // some security here...

if( $level = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE ug.UserID=\'' . $User->ID . '\' AND ug.UserGroupID = g.ID' ) )
{
	$level = $level->Name;
}
else $level = false;

/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
if( $args->command )
{
	switch( $args->command )
	{
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadappsettings':
			//non admin users will only get app config
			if( $rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Key = 'apps' AND s.Type = 'mitra' ORDER BY s.Key ASC;" ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			die('ok<!--separate-->[]');		
			break;
			
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadsettings':
			if( $level != 'Admin' ) die('fail');
			
			if( $rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Type = 'mitra' ORDER BY s.Key ASC;" ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
			else
			{
				//insert settings
				$defaultserversettings = (object) array('url' => 'https://localhost/guacamole/');
				$defaultadminsettings =  (object) array('admin_username'=>'guacadmin', 'admin_password' =>'guacadmin','connection_container'=>'ROOT','default_domain'=>'foobarsam','storage_root'=>'/var/mitra');
				$defaultapps = (object) array('desktop' => '');
				$defaultdb = (object) array('host' => 'localhost', 'username'=>'foobar','password'=>'sambar','database'=>'guacamole');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'host\',\''. json_encode($defaultserversettings) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'admin\',\''. json_encode($defaultadminsettings) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'apps\',\''. json_encode($defaultapps) .'\');');
				$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'mitra\',\'database\',\''. json_encode($defaultdb) .'\');');
				$rows = $SqlDatabase->FetchObjects( "SELECT * FROM FSetting s WHERE	s.UserID = '-1' AND s.Type = 'mitra' ORDER BY s.Key ASC;" );
				
				die('ok<!--separate-->' . ($rows ? json_encode( $rows ) : 'bigbaderror' ) );	
			}
			die( 'ok<!--separate-->Settings to be loaded here.' );
			break;
		
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 	
		case 'listusers':
			if( $level != 'Admin' ) die('fail');
			
			connectMitraDb(); // this one dies on errors :)
			
			// SQL ROCKS !!!
			$mquery = 'SELECT gu.user_id,gu.username,GROUP_CONCAT(gcp.parameter_value SEPARATOR \',\') AS connections,GROUP_CONCAT(gcp.connection_id SEPARATOR \',\') AS connection_ids FROM guacamole_user gu,guacamole_connection_permission gp, guacamole_connection_parameter gcp WHERE gu.username LIKE \'mitra_%\' AND gu.user_id = gp.user_id AND gp.connection_id = gcp.connection_id AND gcp.parameter_name = \'initial-program\' GROUP BY gu.user_id ORDER BY gu.username;';
			
			if( $users = $mitradb->FetchObjects($mquery) )
			{
				die( 'ok<!--separate-->' . json_encode( $users ) );
			}
			else
			{
				$Logger->log('No Mitra users at all? ' . print_r($mitradb,1) . ' ::: ' . $mquery);
				die( 'ok<!--separate-->[]' );
			}
			break;		
		
		case 'saveconnectionsetting':
			if( $level != 'Admin' ) die('fail');
		
			connectMitraDb(); // this one dies on errors :)
			if( $args->args->mitrauser == 0 )
			{
				$uid = createMitraUser( $args->args->frienduser );
			}
			else
			{
				$uid = $args->args->mitrauser;
			}
				
		// --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- ===  --- === 
		case 'loadusersettings':
			connectMitraDb(); // this one dies on errors :)
			
			$query = 'SELECT gu.user_id,gu.username,GROUP_CONCAT(gcp.parameter_value SEPARATOR \',\') AS connections,GROUP_CONCAT(gcp.connection_id SEPARATOR \',\') AS connection_ids FROM guacamole_user gu,guacamole_connection_permission gp, guacamole_connection_parameter gcp WHERE gu.username=\'mitra_'. $User->Name .'\' AND gu.user_id = gp.user_id AND gp.connection_id = gcp.connection_id AND gcp.parameter_name = \'initial-program\' GROUP BY gu.user_id ORDER BY gu.username;';
			
			if( $connections = $mitradb->FetchObject($query) )
			{
				
				if( $level == 'Admin' ) $connections->mitradesktop=1;
				if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'host' ORDER BY s.Key ASC;" ) )
				{
					$connections->mitrahost=$row->Data;
				}
				
				die( 'ok<!--separate-->' . json_encode( $connections ) );
			}
			else
			{
				die( 'ok<!--separate-->[]' );
			}
				
			break;
			
		case 'enablestorage':
			//initial checks...
			if( $level != 'Admin' ) die('fail');
			if( !($args && $args->args && $args->args->username && $args->args->username != '') ) { die('fail<!--separate-->No user given. '); }
			
			//check if systme is set up and store or fail :)
			if( $row = $SqlDatabase->FetchObject( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'admin';" ) )
			{
				$Logger->log('ROW' . print_r( $row,1 ));
				
				$tmp = json_decode($row->Data);
				if( $tmp && $tmp->storage_root )
				{
					if( substr( $tmp->storage_root , -1 ) != '/' ) $tmp->storage_root .= '/';
					if( file_exists( $tmp->storage_root  . $args->args->username ) ) die('ok<!--separate-->DIR_EXISTED');
					if( mkdir( $tmp->storage_root . $args->args->username ) ) die('ok<!--separate-->DIR_CREATED');
					die('fail<!--separate-->Could not create user storage directory.');
				}
				else
				{
					die('fail<!--separate-->Mitra storage settings could not be found. Please make sure storage_root is set in mitra/admin in server settings.');
				}
			}
			else
			{
				die('fail<!--separate-->Mitra settings could not be found. How did you get here?');
			}
			
			break;
			
		
		default:
			die( 'ok<!--separate-->No known command given. Nothing to show here.');
			break;
		
	}
}
else
	die( 'ok<!--separate-->No command given. Nothing to show here.' );


/* ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## ##--## */
function connectMitraDb()
{
	global $mitradb, $SqlDatabase;

	$rs = $SqlDatabase->FetchRow( "SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'database';" );
	$settings = json_decode($rs['Data']);
	
	$mitradb = new SqlDatabase( );
	if( $mitradb->open(  $settings->host,$settings->username,$settings->password ) )
	{
		if( $mitradb->SelectDatabase( $settings->database ) )
		{
			return true;
		}
		else
			die('fail<!--separate-->Could find database '. $settings->database .'. Is your configuration correct?');
	}
	else
		die('fail<!--separate-->Could not connect to Mitra database at '. $settings->host .'. Is your configuration correct?');	
	
}

?>
