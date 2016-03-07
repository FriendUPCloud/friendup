<?php

/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

global $args, $SqlDatabase, $User;

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
	foreach( $o->fieldnames as $fn )
	{
		if( $fn == 'DockID' ) $DockID = true;
		if( $fn == 'Type' ) $Type = true;
	}
	if( !$DockID )
	{
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `DockID` bigint(20) NOT NULL AFTER `Parent`' );
	}
	if( !$Type )
	{
		$SqlDatabase->query( 'ALTER TABLE `DockItem` ADD `Type` varchar(255) default \'executable\' AFTER `UserID`' );
	}
}

// End run things first time ---------------------------------------------------

// Let's examine arguments!
if( isset( $args->command ) )
{
	switch( $args->command )
	{
		case 'items':
			// Load root items if nothing else is requested
			if( $rows = $SqlDatabase->FetchObjects( 'SELECT * FROM DockItem WHERE UserID=\'' . $User->ID . '\' AND Parent=0 ORDER BY SortOrder ASC' ) )
			{
				$eles = [];
				foreach ( $rows as $row )
				{
					$o = new stdClass();
					if( $row->ID == isset( $args->args ) && isset( $args->args->itemId ) ? $args->args->itemId : false )
						$o->Current = true;
					else $o->Current = false;
					$o->Id = $row->ID;
					$o->Type = $row->Type;
					$o->Name = trim( $row->Application ) ? $row->Application : i18n( 'Unnamed' );
					$o->Title = trim( $row->ShortDescription ) ? $row->ShortDescription : '';
					$o->Image = ( trim( $row->Application ) && $row->Type == 'executable' ) ? '' : 'gfx/icons/128x128/status/weather-none-available.png';
					$eles[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $eles ) );
			}
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
						$tmp = $out[$i-1];
						$out[$i-1] = $row;
						$out[$i] = $tmp;
					}
					// Shift down
					else if( $args->args->direction == 'down' && $row->ID == $args->args->itemId && $i+1 < $len )
					{
						$tmp = $out[$i+1];
						$out[$i+1] = $row;
						$out[$i] = $tmp;
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
			$application = mysql_real_escape_string( $args->args->application );
			$shortdesc = mysql_real_escape_string( $args->args->shortdescription );
			$SqlDatabase->Query( '
				UPDATE DockItem SET
					Application = \'' . $application . '\',
					ShortDescription = \'' . $shortdesc . '\'
				WHERE
					ID=\'' . $id . '\' AND
					UserID=\'' . $User->ID . '\'
			' );
			die( 'ok' );
			break;
		case 'additem':
			$max = $SqlDatabase->FetchRow( 'SELECT MAX(SortOrder) MX FROM DockItem WHERE UserID = \'' . $User->ID . '\' AND Parent = 0' );
			if( $args->args->application )
			{
				$exe = mysql_real_escape_string( $args->args->application );
				$desc = mysql_real_escape_string( $args->args->shortdescription );
				$type = mysql_real_escape_string( $args->args->type );
				$SqlDatabase->Query( '
					INSERT INTO DockItem 
						( UserID, `Type`, Application, ShortDescription, Parent, SortOrder ) 
					VALUES 
						( 
							\'' . $User->ID . '\', 
							\'' . $type . '\', 
							\'' . $exe . '\', 
							\'' . $desc . '\', 
							0, 
							\'' . $max['MX'] . '\' 
						)
				' );
			}
			else
			{
				$SqlDatabase->Query( '
					INSERT INTO DockItem ( UserID, Parent, SortOrder ) VALUES ( \'' . $User->ID . '\', 0, \'' . $max['MX'] . '\' )
				' );
			}
			die( 'ok<!--separate-->' );
			break;
	}
}

die( 'fail' );

?>
