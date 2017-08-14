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

global $SqlDatabase, $args, $User;

//
// Status 0: pending
// Status 1: verified
// Status 2: fixed
//

include_once( 'php/friend.php' );

$d = new DbTable( 'FIssue' );
if( !$d->Load() )
{
	$SqlDatabase->query( '
		CREATE TABLE FIssue
		(
			`ID` bigint(20) auto_increment NOT NULL,
			`IssueID` bigint(20) NOT NULL default \'0\',
			`UserID` bigint(20) default NULL,
			`Subject` varchar(255),
			`ShortDesc` text,
			`Description` text,
			`Reproduce` text,
			`Status` int(11),
			`IsDeleted` tinyint(4),
			`DateCreated` datetime,
			`DateModified` datetime,
			PRIMARY KEY(`ID`)
		);
	' );
}

if( !isset( $args->command ) )
{
	die( 'fail' );
}

switch( $args->command )
{
	case 'categories':
		if( $rows = $SqlDatabase->FetchObjects( '
			SELECT ID, Subject AS Category, Description FROM `FIssue` WHERE
			    `Status`=\'9\'
			AND !`IsDeleted`
			ORDER BY 
				Subject ASC
		' ) )
		{
			die( 'ok<!--separate-->' . friend_json_encode( $rows ) );
		}
		die( 'fail' );
		break;
	case 'categoryset':
		$o = new DbIO( 'FIssue' );
		if( (int)$args->args->id > 0 )
		{
			$o->Load( $args->args->id );
		}
		else $o->DateCreated = date( 'Y-m-d H:i:s' );
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->Subject = $args->args->category;
		$o->Description = $args->args->description;
		$o->Status = 9; // <- category!
		$o->IsDeleted = '0';
		$o->Save();
		die( 'ok<!--separate-->' . $o->ID );
		break;
	case 'categoryget':
		if( (int)$args->args->id > 0 )
		{
			$o = new DbIO( 'FIssue' );
			$o->Load( $args->args->id );
			die( 'ok<!--separate-->' . friend_json_encode( $o ) );
		}
		die( 'fail<!--separate-->' );
		break;
	// Save an issue
	case 'saveissue':
		$o = new DbIO( 'FIssue' );
		if( $args->args->object->ID > 0  )
		{
			$o->Load( $args->args->object->ID );
		}
		$o->Subject = $args->args->object->Subject;
		$o->ShortDesc = $args->args->object->ShortDesc;
		$o->Description = $args->args->object->Description;
		$o->Reproduce = $args->args->object->Reproduce;
		$o->IssueID = $args->args->object->CategoryID;
		if( !$o->ID )
		{
			$o->UserID = $User->ID;
			$o->Status = '0';
			$o->IsDeleted = '0';
			$o->DateCreated = date( 'Y-m-d H:i:s' );
		}
		else
		{
			$o->Status = $args->args->object->Status;
		}
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->Save();
		die( 'ok<!--separate-->' . $o->ID );
		break;
	case 'comment':
		if( !isset( $args->args->issueid ) ) die( 'fail' );
		// Make sure we can load parent
		$i = new DbIO( 'FIssue' );
		$i->Load( $args->args->issueid );
		if( $i->ID > 0 )
		{
			$c = new DbIO( 'FIssue' );
			$c->IssueID = $i->ID;
			$c->Subject = 'Re:' . $i->Subject;
			$c->Description = $args->args->comment;
			$c->UserID = $User->ID;
			$c->DateCreated = date( 'Y-m-d H:i:s' );
			$c->DateModified = $c->DateCreated;
			$c->Save();
			if( $c->ID > 0 ) 
			{
				$i->DateModified = $c->DateModified;
				$i->Save();
				die( 'ok' );
			}
		}
		break;
	case 'removecomment':
		if( !isset( $args->args->commentid ) ) die( 'fail' );
		$SqlDatabase->query( 'DELETE FROM FIssue WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->commentid ) . '\' AND UserID=\'' . $User->ID . '\'' );
		die( 'ok' );
	case 'getcomments':
		if( !isset( $args->args->issueid ) ) die( 'fail' );
		if( $rows = $SqlDatabase->fetchObjects( '
			SELECT i.*, u.Name FROM FIssue i, FUser u
			WHERE
			i.IssueID = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->issueid ) . '\'
			AND u.ID = i.UserID
			ORDER BY DateCreated ASC
		' ) )
		{
			$out = [];
			foreach ( $rows as $row )
			{
				$o = new stdClass();
				$o->ID = $row->ID;
				$o->Editable = $row->UserID == $User->ID ? '1' : '0';
				$o->Username = $row->Name;
				$o->Description = str_replace( "\n", '<br>', $row->Description );
				$o->Date = $row->DateCreated;
				$out[] = $o;
			}
			die( 'ok<!--separate-->' . friend_json_encode( $out ) );
		}
		die( 'fail' );
		break;
	// Get a list of the current root issues
	case 'getissues':
		if( $rows = $SqlDatabase->FetchObjects( $q = '
			SELECT i.*, u.Name as `Username`, ie.Subject AS `Category` FROM FIssue i
			LEFT JOIN FUser u ON ( i.UserID = u.ID )
			LEFT JOIN FIssue ie ON ( i.IssueID = ie.ID )
			WHERE
				( i.IssueID <= 0 OR ( i.IssueID = ie.ID AND ie.UserID <= 0 ) )
			AND i.IsDeleted <= 0
			AND u.Name IS NOT NULL
			' . ( $args->args->filter ? ( ' AND i.Status IN ' . stripslashes( mysqli_real_escape_string( $SqlDatabase->_link, $args->args->filter ) ) ) : '' ) . '
			' . ( $args->args->search ? ( ' AND i.Subject LIKE "%' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->search ) . '%"' ) : '' ) . '
			ORDER BY
				i.Status ASC, i.DateModified DESC
		' ) )
		{
			// Count comments
			foreach( $rows as $k=>$v )
			{
				if( $cnt = $SqlDatabase->FetchObject( 'SELECT COUNT(*) AS CNT FROM FIssue WHERE IssueID=\'' . $rows[$k]->ID . '\'' ) )
				{
					if( $cnt->CNT > 0 )
						$rows[$k]->Subject .= ' (' . $cnt->CNT . ' ' . ( $cnt->CNT == 1 ? 'comment' : 'comments' ) . ')';
				}
			}
			die( 'ok<!--separate-->' . friend_json_encode( $rows ) );
		}
		die( 'fail<!--separate-->' . $q . ' ' . mysql_error() );
		break;
	case 'loadissue':
		$o = new DbIO( 'FIssue' );
		if( $args->args->issueid > 0  )
		{
			$o->Load( $args->args->issueid );
			if( $o->ID > 0 )
			{
				$std = new stdClass();
				$fields = array( 'ID', 'IssueID', 'Subject', 'ShortDesc', 'Description', 'Reproduce', 'Status' );
				foreach( $fields as $fl ) $std->$fl = $o->$fl;
				die( 'ok<!--separate-->' . friend_json_encode( $std ) );
			}
		}
		break;
	case 'deleteissue':
		$o = new DbIO( 'FIssue' );
		if( $args->args->issueid > 0  )
		{
			$o->Load( $args->args->issueid );
			if( $o->ID > 0 )
			{
				if( $o->UserID == $User->ID )
				{
					$o->Delete();
					die( 'ok<!--separate-->' . friend_json_encode( $std ) );
				}
			}
		}
		die( 'fail<!--separate-->' );
		break;
}

die( 'fail' );

?>
