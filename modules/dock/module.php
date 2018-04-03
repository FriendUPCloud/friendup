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

global $args, $SqlDatabase, $User, $Logger;

// Include API
require( 'php/friend.php' );

// TODO: Only run this the first time ------------------------------------------

// Check database!
$o = new DbTable( 'DockItem' );
if( !$o->LoadTable() )
{
	$SqlDatabase->query( '
		CREATE TABLE DockItem 
		( 
			`ID` bigint(20) NOT NULL auto_increment, 
			`Parent` bigint(20) default \'0\', 
			`DockID` bigint(20) NOT NULL,
			`UserID` bigint(20) default \'0\', 
			`Type` varchar(255) default \'executable\',
			`Icon` varchar(255) default \'\',
			`Application` varchar(255), 
			`ShortDescription` varchar(255), 
			`SortOrder` int(11) default \'0\',
			PRIMARY KEY(ID)
		)
	' );
}
// Do the tango, add the fields
else
{
	$DockID = false;
	$Type = false;
	$Icon = false;
	$DisplayName = false;
	foreach( $o->_fieldnames as $fn )
	{
		if( $fn == 'DockID' ) $DockID = true;
		if( $fn == 'Type' ) $Type = true;
		if( $fn == 'Icon' ) $Icon = true;
		if( $fn == 'DisplayName' ) $DisplayName = true;
	}
	if( !$DockID )
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `DockID` bigint(20) NOT NULL AFTER `Parent`' );
	if( !$Type )
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `Type` varchar(255) default \'executable\' AFTER `UserID`' );
	if( !$Icon )
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `Icon` varchar(255) AFTER `Type`' );
	if( !$DisplayName )
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `DisplayName` varchar(255) default \'\' AFTER `Application`' );
}

// End run things first time ---------------------------------------------------

// Get user level
if( $level = $SqlDatabase->FetchObject( '
	SELECT g.Name FROM FUserGroup g, FUserToGroup ug
	WHERE
		g.Type = \'Level\' AND
		ug.UserID=\'' . $User->ID . '\' AND
		ug.UserGroupID = g.ID
' ) )
{
	$level = $level->Name;
}
else $level = false;

// Let's examine arguments!
if( isset( $args->command ) )
{
	switch( $args->command )
	{
		case 'items':
			// Load root items if nothing else is requested
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT d.* FROM
					DockItem d
				WHERE
					d.UserID=\'' . $User->ID . '\' AND d.Parent=0 AND d.Type != \'Dock\'
				ORDER BY 
					d.SortOrder ASC
			' ) )
			{
				$eles = [];
				foreach ( $rows as $row )
				{
					$path = FindAppInSearchPaths( $row->Application );
					$o = new stdClass();
					if( $row->ID == isset( $args->args ) && isset( $args->args->itemId ) ? $args->args->itemId : false )
						$o->Current = true;
					else $o->Current = false;
					$o->Id = $row->ID;
					$o->Type = $row->Type;
					$o->Icon = $row->Icon;
					$o->DisplayName = trim( $row->DisplayName ) ? $row->DisplayName : '';
					$o->Name = trim( $row->Application ) ? $row->Application : i18n( 'Unnamed' );
					$o->Title = trim( $row->ShortDescription ) ? $row->ShortDescription : '';
					$o->Workspace = $row->Workspace;
					$apath = 'apps/' . $row->Application . '/';
					if( !strstr( $o->Icon, ':' ) && !strstr( $o->Icon, '/system.library' ) )
						$o->Icon = file_exists( $path . '/icon_dock.png' ) ? ( $apath . 'icon_dock.png' ) : '';
					$o->Image = '';
					
					// Get config
					$eles[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $eles ) );
			}
			break;
		case 'removefromdock':
			if( $args->args->userID && $args->args->userID != $User->ID )
			{
				if( $level != 'Admin' ) die('fail<!--separate-->not authorized to add dockitems');
			}
			//prepare....
			$userid = ( $args->args->userID ? intval( $args->args->userID ) : $User->ID );
			$s = filter_var( $args->args->name, FILTER_SANITIZE_STRING );
			if( $args->args->fuzzy )
			{
				$q = ( 'DELETE FROM DockItem WHERE UserID=\'' . $userid . '\' AND `Application` LIKE "' . $s . ' %"' );
				//$Logger->log('cleaning a dock here... ' . $q);
			}
			else
			{
				$q = ( 'DELETE FROM DockItem WHERE UserID=\'' . $userid . '\' AND `Application`="' . $s . '" LIMIT 1' );
			}
			if( $SqlDatabase->Query( $q ) )
			{
				die( 'ok<!--separate-->{"response":1,"message":"Dock item(s) removed","item":"' . $s . '"}' );
			}
			die( 'fail<!--separate-->{"response":0,"message":"Could not find dock item"}' );
			break;

		case 'deleteitem';
			if( $rows = $SqlDatabase->Query( 'DELETE FROM DockItem WHERE UserID=\'' . $User->ID . '\' AND ID=\'' . intval( $args->args->itemId, 10 ) . '\' LIMIT 1' ) )
			{
				die( 'ok<!--separate-->' . $args->args->itemId );
			}
			die( 'fail' );
		case 'getitem':
			if( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE ID=\'' . intval( $args->args->itemId, 10 ) . '\' AND UserID=\'' . $User->ID . '\'' ) )
			{
				if( isset( $args->args ) && $args->args->method == 'html' )
				{
					die( 'ok<!--separate-->' . $template );
				}
				else
				{
					die( 'ok<!--separate-->' . json_encode( $row ) );
				}
			}
			die( 'fail' );
		case 'sortorder':
			if( $out = $SqlDatabase->FetchObjects( 'SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\' ORDER BY SortOrder ASC' ) )
			{
				$i = 0;
				$len = count( $out );
				
				for( $i = 0; $i < $len; $i++ )
				{
					$row = $out[$i];
					
					// Shift up
					if( $args->args->direction == 'up' && $row->ID == $args->args->itemId && $i > 0 )
					{
						$tmp = $out[ $i - 1 ];
						$out[ $i - 1 ] = $row;
						$out[ $i ] = $tmp;
					}
					// Shift down
					else if( $args->args->direction == 'down' && $row->ID == $args->args->itemId && $i+1 < $len )
					{
						$tmp = $out[ $i + 1 ];
						$out[ $i + 1 ] = $row;
						$out[ $i ] = $tmp;
						$i++;
						continue;
					}
				}
				$i = 0;
				foreach( $out as $o )
				{
					$SqlDatabase->Query( 'UPDATE DockItem SET SortOrder = \'' . $i . '\' WHERE ID=\'' . $o->ID . '\' AND UserID=\'' . $User->ID . '\'' );
					$i++;
				}
				die( 'ok' );
			}
			die( 'fail' );
			break;
		case 'saveitem':
			$id = intval( $args->args->itemId, 10 );
			$application = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application );
			$shortdesc = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->shortdescription );
			$icon = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->icon );
			$work = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->workspace );
			$dname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->displayname );
			$SqlDatabase->Query( '
				UPDATE DockItem SET
					Application = \'' . $application . '\',
					DisplayName = \'' . $dname . '\',
					ShortDescription = \'' . $shortdesc . '\',
					`Icon` = \'' . $icon . '\',
					`Workspace` = \'' . $work . '\'
				WHERE
					ID=\'' . $id . '\' AND
					UserID=\'' . $User->ID . '\'
			' );
			die( 'ok' );
			break;
			
		// several items in an array.. here we wont add items that alredy are in the users dock.
		case 'additems':
			//sanitize...
			if( !$args->args->dockitems ) die('fail<!--separate-->bad request to add dockitems');
			if( $args->args->userID && $args->args->userID != $User->ID )
			{
				if( $level != 'Admin' ) die('fail<!--separate-->not authorized to add dockitems');
			}
			
			
			//prepare....
			$userid = ( $args->args->userID ? intval( $args->args->userID ) : $User->ID );
			$sortindex = 1;
			$userdock = $SqlDatabase->FetchObjects( 'SELECT ID,Application,SortOrder FROM DockItem WHERE UserID=\'' . $userid . '\' ORDER BY SortOrder DESC' );

			
			//load dock commands first to avoid duplicates; gives us highest current sort index as well
			$itemstoadd = [];
			if($userdock)
			{
				for( $j = 0; $j < count( $args->args->dockitems ); $j++ )
				{
					$addit = true;
					for($i = 0; $i < count( $userdock ); $i++)
					{
						if( $sortindex < $userdock[$i]->SortOrder ) $sortindex = $userdock[$i]->SortOrder;
						if( $args->args->dockitems[ $j ]->application == $userdock[$i]->Application ) $addit = false;
					}
					if( $addit ) $itemstoadd[] = $args->args->dockitems[ $j ];
				}
			}
			else
				$itemstoadd = $args->args->dockitems;
				
			//now add them...
			for( $i = 0; $i < count( $itemstoadd ); $i++ )
			{
				$type = ( isset( $itemstoadd[ $i ]->type ) ? mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->type ) : '' );
				$exe = ( isset( $itemstoadd[ $i ]->application ) ? mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->application ) : '' );
				$dname = ( isset( $itemstoadd[ $i ]->displayname ) ? mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->displayname ) : '' );
				$desc = ( isset( $itemstoadd[ $i ]->desc ) ? mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->desc ) : '' );
				$icon = ( isset( $itemstoadd[ $i ]->icon ) ? mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->icon ) : '' );
				$work = ( isset( $itemstoadd[ $i ]->workspace ) ? intval( mysqli_real_escape_string( $SqlDatabase->_link, $itemstoadd[ $i ]->workspace ) ) : 0 );

				if( $exe == '' ) continue;
				
				$addquery =  '
					INSERT INTO DockItem 
						( UserID, `Type`, Application, DisplayName, ShortDescription, Icon, Parent, SortOrder, Workspace ) 
					VALUES 
						( 
							\'' . $userid . '\', 
							\'' . $type . '\', 
							\'' . $exe . '\', 
							\'' . $dname . '\',
							\'' . $desc . '\',
							\'' . $icon . '\',
							0, 
							\'' . ( intval( $sortindex + $i ) + 1 ) . '\',
							\'' . $work . '\'
						)
				';
				$SqlDatabase->Query( $addquery );
			}
			
			break;
			
		case 'additem':
			$max = $SqlDatabase->FetchRow( 'SELECT MAX(SortOrder) MX FROM DockItem WHERE UserID = \'' . $User->ID . '\' AND Parent = 0' );
			if( isset( $args->args->application ) )
			{
				$exe = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application );
				$desc = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->shortdescription );
				$type = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->type );
				if( $args->args->icon )
					$icon = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->icon );
				else $icon = '';
				if( $args->args->workspace )
					$work = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->workspace );
				else $work = '0';
				$dname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->displayname );
				$SqlDatabase->Query( '
					INSERT INTO DockItem 
						( UserID, `Type`, Application, DisplayName, ShortDescription, Icon, Parent, SortOrder, Workspace ) 
					VALUES 
						( 
							\'' . $User->ID . '\', 
							\'' . $type . '\', 
							\'' . $exe . '\', 
							\'' . $dname . '\',
							\'' . $desc . '\',
							\'' . $icon . '\',
							0, 
							\'' . ( intval( $max[ 'MX' ] ) + 1 ) . '\',
							\'' . $work . '\'
						)
				' );
			}
			else
			{
				$SqlDatabase->Query( '
					INSERT INTO DockItem ( UserID, DockID, Parent, SortOrder, Workspace ) VALUES ( \'' . $User->ID . '\', 0, 0, \'' . ( intval($max['MX']) + 1 ) . '\', \'1\' )
				' );
			}
			//get ID and give it back to the user...
			$maxquery = 'SELECT ID FROM DockItem WHERE UserID = \'' . $User->ID . '\' AND Parent = 0 AND DockID = 0 AND SortOrder = \'' . ( intval( $max[ 'MX' ] ) + 1 ) . '\'';
			$newid = $SqlDatabase->FetchRow( $maxquery );
			//$Logger->log( 'Dock item saved' . print_r( $newid, 1 ) . ' :: ' . $maxquery );
			die( 'ok<!--separate-->' .  $newid[ 'ID' ] );
			break;
		case 'getdock':
			$o = new DbIO( 'DockItem' );
			if( $dock = $SqlDatabase->FetchObject( '
				SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\' AND `Type`=\'Dock\' AND `DockID`=\'' . $args->args->dockid . '\'
			' ) )
			{
				if( $o->Load( $dock->ID ) )
				{
					die( 'ok<!--separate-->' . $o->ShortDescription );
				}
			}
			die('ok');
			break;
		case 'savedock':
			$o = new DbIO( 'DockItem' );
			if( $dock = $SqlDatabase->FetchObject( '
				SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\' AND `Type`=\'Dock\' AND `DockID`=\'' . $args->args->dockid . '\'
			' ) )
			{
				$o->Load( $dock->ID );
			}
			if( !$o->ID )
			{
				$o->DockID = $args->args->dockid;
				$o->UserID = $User->ID;
				$o->Type = 'Dock';
			}
			$cfg = new stdClass();
			$cfg->options = $args->args->options;
			$o->Type = 'Dock';
			$o->Workspace = $args->args->workspace;
			$o->DisplayName = $args->args->displayname;
			$o->ShortDescription = json_encode( $cfg );
			$o->Save();
			if( $o->ID > 0 ) die( 'ok' );
			break;
	}
}

die( 'fail' );

?>
