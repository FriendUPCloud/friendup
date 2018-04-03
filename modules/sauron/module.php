<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

global $User, $args, $SqlDatabase;

include( 'php/friend.php' );

if( !isset( $args->command ) ) die( 'fail' );

include_once( 'php/classes/file.php' );

// Get user level
if( $level = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE g.Type = \'Level\' AND ug.UserID=\'' . $User->ID . '\' AND ug.UserGroupID = g.ID' ) )
{
	$level = $level->Name;
}
else $level = false;

$conf = new stdClass();

$sett = new dbIO( 'FSetting' );
$sett->UserID = '-1';
$sett->Type = 'system';
$sett->Key = 'SauronPrefs';
if( $sett->Load() )
{
	$conf = json_decode( $sett->Data );
}

$db = new SqlDatabase();
if( $db->Open( $conf->databasehost, $conf->databaseuser, $conf->databasepass ) )
{
	$db->SelectDatabase( $conf->databasebase );
	
	$d = new DbTable( 'Customer', $db );
	if( !$d->Load() )
	{
		$db->query( '
			CREATE TABLE `Customer` (
			 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
			 `ParentID` bigint(20) NOT NULL,
			 `Name` varchar(255) NOT NULL,
			 `Notes` text NOT NULL,
			 `Level` int(11) NOT NULL default \'1\',
			 `Image` longblob NOT NULL,
			 `Active` tinyint(4) NOT NULL DEFAULT \'0\',
			 PRIMARY KEY (`ID`)
			)
		' );
	}

	$d = new DbTable( 'CustomerCoreRelation', $db );
	if( !$d->Load() )
	{
		$db->query( '
			CREATE TABLE `CustomerCoreRelation` (
			 `CustomerID` bigint(20) NOT NULL,
			 `FriendCoreID` bigint(20) NOT NULL
			)
		' );
	}

	$d = new DbTable( 'FriendCore', $db );
	if( !$d->Load() )
	{
		$db->query( '
			CREATE TABLE `FriendCore` (
			 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
			 `ParentID` bigint(20) NOT NULL,
			 `Name` varchar(255) NOT NULL,
			 `Host` varchar(255) NOT NULL,
			 `Config` text NOT NULL,
			 `Status` varchar(255) NOT NULL,
			 PRIMARY KEY (`ID`)
			) 
		' );
	}
}
else
{
	$db = false;
}


/*$DocUser = new dbIO( 'DocuUser', $db );
$DocUser->Name = $User->Name;
if( !$DocUser->Load() )
{
	$DocUser->Save();
}*/

switch( $args->command )
{
	case 'getpreferences':
		if( $level != 'Admin' ) die( 'fail' );
		$d = new dbIO( 'FSetting' );
		$d->UserID = '-1';
		$d->Type = 'system';
		$d->Key = 'SauronPrefs';
		$d->Load();
		if( $d->ID > 0 )
			die( 'ok<!--separate-->' . $d->Data );
		die( 'fail<!--separate-->' );
		break;
	case 'savepreferences':
		if( $level != 'Admin' ) die( 'fail' );
		
		$d = new dbIO( 'FSetting' );
		$d->UserID = '-1';
		$d->Type = 'system';
		$d->Key = 'SauronPrefs';
		$d->Load();
		$d->Data = json_encode( $args->args->prefs );
		$d->Save();
		if( $d->ID > 0 )
			die( 'ok' );
		die( 'fail<!--separate-->' );
		break;
	case 'savecustomer':
		if( !$db || $level != 'Admin' ) die( 'fail' );
		
		// TODO: Check if server exists!
		
		$d = new dbIO( 'Customer', $db );
		$d->Name = $args->args->Name;
		$d->Load();
		$d->Notes = $args->args->Notes;
		$d->Active = $args->args->Active;
		$d->Save();
		if( $d->ID > 0 )
			die( 'ok' );
		die( 'fail' );
		break;
	case 'savecore':
		if( !$db || $level != 'Admin' ) die( 'fail' );
		
		// Setup our conf
		$conf = new stdClass();
		$list = array( 'SSLEnable', 'Port', 'Username', 'Password' );
		foreach( $list as $arg ) $conf->$arg = $args->args->$arg;
		
		// TODO: Check if server exists!
		
		// Create core entry
		$d = new dbIO( 'FriendCore', $db );
		$d->Name = $args->args->Name;
		$d->Load();
		$d->Host = $args->args->Server;
		$d->Notes = $args->args->Notes;
		$d->Config = json_encode( $conf );
		$d->Status = 'idle';
		$d->Save();
		if( $d->ID > 0 )
			die( 'ok' );
		die( 'fail' );
		break;
	case 'viewcustomer':
		if( !$db || $level != 'Admin' ) die( 'fail' );
		$d = new dbIO( 'Customer', $db );
		$d->Name = $args->args->label;
		$d->Load();
		if( $d->ID > 0 )
		{
			$o = new stdClass();
			$o->Name = $d->Name;
			$o->Notes = $d->Notes;
			$o->Level = $d->Level;
			die( 'ok<!--separate-->' . json_encode( $o ) );
		}
		die( 'fail' );
		break;
	case 'customers':
		if( !$db || $level != 'Admin' ) die( 'fail' );
		if( $rows = $db->fetchObjects( 'SELECT * FROM Customer ORDER BY `Name` ASC' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail' );
		break;
}

?>
