<?php

global $configfilesettings;

require( 'php/friend.php' );

/* 

Layout of config in cfg/cfg.ini

[FriendProject]
phost = "hostname/localhost"
pbase = "dbname"
puser = "youruser"
ppass = "yourpass"

*/

if( !$configfilesettings[ 'FriendProject' ] )
{
	die( 'fail<!--separate-->{"response":"Please set up your server properly."}' );
}

define( 'PPREFIX', 'Project'                                         );
define( 'PHOST',   $configfilesettings[ 'FriendProject' ][ 'phost' ] );
define( 'PUSER',   $configfilesettings[ 'FriendProject' ][ 'puser' ] );
define( 'PPASS',   $configfilesettings[ 'FriendProject' ][ 'ppass' ] );
define( 'PBASE',   $configfilesettings[ 'FriendProject' ][ 'pbase' ] );

/* Connect */

$db = new mysqli( PHOST, PUSER, PPASS, PBASE );
if( $db->connect_errno )
	die( 'fail<!--separate-->{"response":"Could not connect to database."}' );

if( !isset( $args->command ) ) die( 'fail<!--separate-->{"response":"No command given."}' );

switch( $args->command )
{
	case 'refreshprojects':
		$projects = 'fail<!--separate-->{"response":"No projects available."}';
		if( $r = $db->query( 'SELECT * FROM `' . PPREFIX . 'Project` WHERE `UserID`=\'1\' ORDER BY `DateCreated` DESC' ) )
		{
			$array = array();
			while( $row = $r->fetch_assoc() )
			{
				$array[] = $row;
			}
			$projects = 'ok<!--separate-->' . json_encode( $array );
		}
		die( $projects );
	// Delete a project
	case 'deleteproject':
		if( $args->args->ids )
		{
			$ids = explode( ',', $args->args->ids );
			foreach( $ids as $id )
			{
				$db->query( 'DELETE FROM `' . PPREFIX . 'Project` WHERE ID=\'' . intval( $id, 10 ) . '\' AND `UserID`=\'' . intval( 1, 10 ) . '\'' );
			}
			die( 'ok<!--separate-->{"response":"Items were deleted."}' );
		}
		die( 'fail<!--separate-->{"response":"No IDs selected."}' );
		break;
	// Save or update a project
	case 'saveproject':
		$arr = array( 'Name', 'Status', 'Description', 'DateCreated' );
		$out = array();
		$key = array();
		if( $args->args->ID )
		{
			foreach( $arr as $ar )
				$out[] = '`' . $ar . '` = "' . mysqli_real_escape_string( $db, $args->args->$ar ) . '"';		
			$db->query( '
				UPDATE
					`' . PPREFIX . 'Project`
					SET ' . implode( ', ', $out ) . '
				WHERE
					`ID`=\'' . intval( $args->args->ID, 10 ) . '\' AND
					`UserID`=\'1\'
			' );
			die( 'ok<!--separate-->' );
		}
		else
		{
			foreach( $arr as $ar )
			{
				$key[] = '`' . $ar . '`';
				$out[] = '"' . mysqli_real_escape_string( $db, $args->args->$ar ) . '"';
			}
			$key[] = '`UserID`';
			$out[] = intval( 1, 10 );
			$db->query( '
				INSERT INTO `' . PPREFIX . 'Project`
				( ' . implode( ', ', $key ) . ' )
				VALUES
				( ' . implode( ', ', $out ) . ' )
			' );
			die( 'ok<!--separate-->' );
		}
		break;
	// Load a project
	case 'project':
		if( $q = $db->query( 'SELECT * FROM `' . PPREFIX . 'Project` WHERE ID=\'' . intval( (int)$args->args->id, 1 ) . '\' AND `UserID`=\'' . intval( 1, 10 ) . '\'' ) )
		{
			if( $row = $q->fetch_assoc() )
			{
				die( 'ok<!--separate-->' . json_encode( $row ) );
			}
		}
		die( 'fail<!--separate-->{"response":"Could not load project."}' );
		break;
	default: break;
}

die( 'fail<!--separate-->{"response":"Unknown command given."}' );

?>
