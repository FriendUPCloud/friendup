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
$sett->Key = 'FDocumentationPrefs';
if( $sett->Load() )
{
	$conf = json_decode( $sett->Data );
}

$db = new SqlDatabase();
if( $db->Open( $conf->databasehost, $conf->databaseuser, $conf->databasepass ) )
{
	$db->SelectDatabase( $conf->databasebase );
}
else
{
	die('fail<!--separate-->could not connect to db');
}

$d = new DbTable( 'FDocumentation', $db );
if( !$d->Load() )
{
	$db->query( '
		CREATE TABLE FDocumentation
		(
			`ID` bigint(20) auto_increment NOT NULL,
			`TopicID` bigint(20) NOT NULL default \'0\',
			`Type` varchar(32) NOT NULL default \'topic\',
			`UserID` bigint(20) default NULL,
			`Subject` varchar(255),
			`ShortDesc` text,
			`Description` text,
			`Examples` text,
			`Status` int(11),
			`SortOrder` int(11) NOT NULL default \'0\',
			`IsDeleted` tinyint(4),
			`DateCreated` datetime,
			`DateModified` datetime,
			PRIMARY KEY(`ID`)
		)
	' );
}

$d = new DbTable( 'DocuFile', $db );
if( !$d->Load() )
{
	$db->query( '
		CREATE TABLE DocuFile
		(
			`ID` bigint(20) auto_increment NOT NULL,
			`ParentID` bigint(20) NOT NULL default \'0\',
			`Type` varchar(32) NOT NULL default \'Image\',
			`UserID` bigint(20) default NULL,
			`Name` varchar(255),
			`Data` longblob,
			`Width` int(11),
			`Height` int(11),
			`IsDeleted` tinyint(4),
			`DateCreated` datetime,
			`DateModified` datetime,
			PRIMARY KEY(`ID`)
		)
	' );
}

$d = new DbTable( 'DocuUser', $db );
if( !$d->Load() )
{
	$db->query( '
		CREATE TABLE `DocuUser` (
		 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
		 `Name` varchar(255) DEFAULT NULL,
		 `Password` varchar(255) DEFAULT NULL,
		 `FullName` varchar(255) DEFAULT NULL,
		 `Email` varchar(255) DEFAULT NULL,
		 `LoggedTime` bigint(32) NOT NULL,
		 `CreatedTime` bigint(32) NOT NULL,
		 `Image` varchar(255) DEFAULT NULL,
		 PRIMARY KEY (`ID`)
		)
	' );
}

$DocUser = new dbIO( 'DocuUser', $db );
$DocUser->Name = $User->Name;
if( !$DocUser->Load() )
{
	$DocUser->Save();
}

if( !isset( $args->command ) )
{
	die( 'fail' );
}

switch( $args->command )
{
	case 'getpreferences':
		if( $level == 'Admin' )
		{
			$d = new dbIO( 'FSetting' );
			$d->UserID = '-1';
			$d->Type = 'system';
			$d->Key = 'FDocumentationPrefs';
			$d->Load();
			if( $d->ID > 0 )
				die( 'ok<!--separate-->' . $d->Data );
		}
		die( 'fail<!--separate-->' );
		break;
	case 'savepreferences':
		if( $level == 'Admin' )
		{
			$d = new dbIO( 'FSetting' );
			$d->UserID = '-1';
			$d->Type = 'system';
			$d->Key = 'FDocumentationPrefs';
			$d->Load();
			$d->Data = json_encode( $args->args->prefs );
			$d->Save();
			if( $d->ID > 0 )
				die( 'ok' );
		}
		die( 'fail<!--separate-->' );
		break;
	case 'registerimage':
		foreach( $args->args->files as $file )
		{
			$f = new File( $file->Path );
			if( $f->Load() )
			{
				$img = getimagesizefromstring( $f->_content );
				$db->query( 'INSERT INTO `DocuFile` ( `Type`, `UserID`, `Name`, `Width`, `Height`, `DateCreated`, `DateModified`, `Data` ) VALUES ( ' . 
					'\'Image\', \'' . $User->ID . '\', \'' . mysqli_real_escape_string( $SqlDatabase->_link, $file->Filename ) . '\', \'' . $img[0] . '\', \'' . $img[1] . '\', NOW(), NOW(), "' . base64_encode( $f->_content ) . '" )' );
			}
		}
		die( 'ok' );
		break;
	case 'categories':
		if( $rows = $db->FetchObjects( '
			SELECT ID, Subject AS Category, Description FROM `FDocumentation` WHERE
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
	case 'topichierarchy':
		if( $rows = $db->FetchObjects( '
			SELECT i.*, u.Name as `Username`, ie.Subject AS `Category` FROM FDocumentation i
			LEFT JOIN DocuUser u ON ( i.UserID = u.ID )
			LEFT JOIN FDocumentation ie ON ( i.TopicID = ie.ID )
			WHERE
			    i.IsDeleted <= 0
			AND i.Type = "topic"
			AND u.Name IS NOT NULL			
			ORDER BY
				i.SortOrder ASC, i.Status ASC, i.DateModified DESC
		' ) )
		{
			die( 'ok<!--separate-->' . friend_json_encode( $rows ) );
		}
		die( 'fail' );
		break;
	case 'categoryset':
		$o = new DbIO( 'FDocumentation', $db );
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
			$o = new DbIO( 'FDocumentation', $db );
			$o->Load( $args->args->id );
			die( 'ok<!--separate-->' . friend_json_encode( $o ) );
		}
		die( 'fail<!--separate-->' );
		break;
	case 'setsortorder':
		if( $level == 'Admin' )
		{
			$db->query( 'UPDATE FDocumentation SET SortOrder=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->sortorder ) . '\' WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->topicid ) . '\'' );	
			die( 'ok' );
		}
		break;
	// Save an topic
	case 'savetopic':
		$o = new DbIO( 'FDocumentation', $db );
		if( $args->args->object->ID > 0  )
		{
			$o->Load( $args->args->object->ID );
		}
		$o->Subject = $args->args->object->Subject;
		$o->ShortDesc = $args->args->object->ShortDesc;
		$o->Description = $args->args->object->Description;
		$o->Examples = $args->args->object->Examples;
		$o->TopicID = $args->args->object->TopicID;
		$o->Type = 'topic';
		
		if( !$o->ID )
		{
			$o->UserID = $DocUser->ID;
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
		if( !isset( $args->args->topicid ) ) die( 'fail' );
		// Make sure we can load parent
		$i = new DbIO( 'FDocumentation', $db );
		$i->Load( $args->args->topicid );
		if( $i->ID > 0 )
		{
			$c = new DbIO( 'FDocumentation', $db );
			$c->TopicID = $i->ID;
			$c->Subject = 'Re:' . $i->Subject;
			
			$comment = preg_replace( '/\<[^>]*?\>[\w\W]*?\<\/[^>]*?\>/i', '', $args->args->comment );
			$comment = str_replace( array( '[pre]', '[/pre]' ), array( '<pre>', '</pre>' ), $comment );
			
			$c->Description = $comment;
			$c->UserID = $DocUser->ID;
			$c->DateCreated = date( 'Y-m-d H:i:s' );
			$c->DateModified = $c->DateCreated;
			$c->Type = "comment";
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
		$db->query( 'DELETE FROM FDocumentation WHERE ID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->commentid ) . '\' AND UserID=\'' . $DocUser->ID . '\'' );
		die( 'ok' );
	case 'getcomments':
		if( !isset( $args->args->topicid ) ) die( 'fail' );
		if( $rows = $db->fetchObjects( '
			SELECT i.*, u.Name FROM FDocumentation i, DocuUser u
			WHERE
			i.TopicID = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->topicid ) . '\'
			AND u.ID = i.UserID
			AND i.Type = "comment"
			ORDER BY DateCreated ASC
		' ) )
		{
			$out = [];
			foreach ( $rows as $row )
			{
				$o = new stdClass();
				$o->ID = $row->ID;
				$o->Editable = $row->UserID == $DocUser->ID ? '1' : '0';
				$o->Username = $row->Name;
				$o->Description = str_replace( "\n", '<br>', $row->Description );
				$o->Date = $row->DateCreated;
				$out[] = $o;
			}
			die( 'ok<!--separate-->' . friend_json_encode( $out ) );
		}
		die( 'fail' );
		break;
	// Get a list of the current root topics
	case 'gettopics':
		if( $rows = $db->FetchObjects( $q = '
			SELECT i.*, u.Name as `Username`, ie.Subject AS `Category` FROM FDocumentation i
			LEFT JOIN DocuUser u ON ( i.UserID = u.ID )
			LEFT JOIN FDocumentation ie ON ( i.TopicID = ie.ID )
			WHERE
				( i.TopicID = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->parentId ) . '\' OR ( i.TopicID = ie.ID AND ie.UserID <= 0 ) )
			AND i.IsDeleted <= 0
			AND i.Type = "topic"
			AND u.Name IS NOT NULL
			' . ( $args->args->filter ? ( ' AND i.Status IN ' . stripslashes( mysqli_real_escape_string( $SqlDatabase->_link, $args->args->filter ) ) ) : '' ) . '
			' . ( $args->args->search ? ( ' AND i.Subject LIKE "%' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->search ) . '%"' ) : '' ) . '
			ORDER BY
				i.SortOrder ASC, i.Status ASC, i.DateModified DESC
		' ) )
		{
			// Count comments
			foreach( $rows as $k=>$v )
			{
				if( $cnt = $db->FetchObject( 'SELECT COUNT(*) AS CNT FROM FDocumentation WHERE Type="topic" AND TopicID=\'' . $rows[$k]->ID . '\'' ) )
				{
					if( $cnt->CNT > 0 )
						$rows[$k]->Subject .= ' (' . $cnt->CNT . ' ' . ( $cnt->CNT == 1 ? '{i18n_lower_topic}' : '{i18n_lower_topics}' ) . ')';
				}
				if( $cnt = $db->FetchObject( 'SELECT COUNT(*) AS CNT FROM FDocumentation WHERE Type="comment" AND TopicID=\'' . $rows[$k]->ID . '\'' ) )
				{
					if( $cnt->CNT > 0 )
						$rows[$k]->Subject .= ' (' . $cnt->CNT . ' ' . ( $cnt->CNT == 1 ? '{i18n_lower_comment}' : '{i18n_lower_comments}' ) . ')';
				}
			}
			die( 'ok<!--separate-->' . friend_json_encode( $rows ) );
		}
		die( 'fail<!--separate-->' . $q . ' #2# ' . print_r( $db ) );
		break;
	case 'loadtopic':
		$o = new DbIO( 'FDocumentation', $db );
		if( $args->args->topicid > 0  )
		{
			$o->Load( $args->args->topicid );
			if( $o->ID > 0 )
			{
				$std = new stdClass();
				$fields = array( 'ID', 'TopicID', 'Subject', 'ShortDesc', 'Description', 'Examples', 'Status' );
				foreach( $fields as $fl ) $std->$fl = $o->$fl;
				die( 'ok<!--separate-->' . friend_json_encode( $std ) );
			}
		}
		break;
	case 'deletetopic':
		$o = new DbIO( 'FDocumentation', $db );
		if( $args->args->topicid > 0  )
		{
			$o->Load( $args->args->topicid );
			if( $o->ID > 0 )
			{
				if( $o->UserID == $DocUser->ID )
				{
					$o->Delete();
					die( 'ok<!--separate-->' . friend_json_encode( $std ) );
				}
			}
		}
		die( 'fail<!--separate-->' );
		break;
	/* Reader mode */
	// Get table of contents
	case 'gettoc':
		if( $rows = $db->FetchObjects( $q = '
			SELECT i.Subject, i.TopicID, i.ID, u.Name as `Username`, ie.Subject AS `Category` FROM FDocumentation i
			LEFT JOIN DocuUser u ON ( i.UserID = u.ID )
			LEFT JOIN FDocumentation ie ON ( i.TopicID = ie.ID )
			WHERE
			    i.IsDeleted <= 0
			AND i.Type = "topic"
			AND u.Name IS NOT NULL
			ORDER BY
				i.SortOrder ASC, i.Status ASC, i.DateModified DESC
		' ) )
		{
			// Count comments
			$o = [];
			foreach( $rows as $row )
			{
				$ob = new stdClass();
				$ob->Subject = $row->Subject;
				$ob->TopicID = $row->TopicID;
				$ob->ID = $row->ID;
				$o[] = $ob;
			}
			die( 'ok<!--separate-->' . json_encode( $o ) );
		}
		die( 'fail<!--separate-->' . $q );
		break;
	// Read a topic
	case 'readtopic':
		$o = new dbIO( 'FDocumentation', $db );
		if( $o->Load( $args->args->topicid ) )
		{
			$oo = new stdClass();
			$oo->Subject = $o->Subject;
			$oo->ShortDesc = $o->ShortDesc;
			$oo->Description = $o->Description;
			$oo->Examples = $o->Examples;
			die( 'ok<!--separate-->' . json_encode( $oo ) );
		}
		break;
	case 'getimage':
		$o = new dbIO( 'DocuFile', $db );
		if( $o->load( $args->args->imageid ) )
		{
			die( base64_decode( $o->Data ) );
		}
		break;
	case 'getimagethumb':
		
		// Get or set image dimensions
		if( isset( $args->args->width ) && isset( $args->args->height ) )
		{
			// Protect memory
			if( $args->args->width > 1000 )
				$args->args->width = 1000;
			if( $args->args->height > 1000 )
				$args->args->height = 1000;
		}
		else
		{
			if( !isset( $args->args->width ) )
				$args->args->width = 160;
			$args->args->height = 'auto';
		}
		
		// Get original image dimensions
		if( $dim = $db->FetchObject( 'SELECT ID, Width, Height FROM DocuFile WHERE ID=\'' . $args->args->imageid . '\'' ) )
		{
			// Make destination image dimensions
			$nwi = $args->args->width;
			if( $args->args->height == 'auto' )
				$nhe = floor( $nwi / $dim->Width * $dim->Height );
			else $nhe = $args->args->height;
			
			// Try to get thumbnail
			if( $o = $db->FetchObject( $q = '
				SELECT t.Data FROM DocuFile t, DocuFile f
				WHERE
						f.ID = \'' . $args->args->imageid . '\'
					AND t.ParentID = f.ID
					AND t.Type = \'Thumbnail\'
					AND t.Width = \'' . $nwi . '\'
					AND t.Height = \'' . $nhe . '\'
			' ) )
			{
				die( base64_decode( $o->Data ) );
			}
			// Else, generate thumbnail
			$o = new dbIO( 'DocuFile', $db );
			if( $o->load( $args->args->imageid ) )
			{
				// Check for thumbnail
				$t = new dbIO( 'DocuFile', $db );
				$t->ParentID = $args->args->imageid;
				$t->Type = 'Thumbnail';
				$t->Width = $nwi;
				$t->Height = $nhe;
			
				// Get full image
				$dec = base64_decode( $o->Data );
				$img = imagecreatefromstring( $dec );
				$siz = getimagesizefromstring( $dec );
				unset( $dec );
					
				// Create destination image
				$des = imagecreatetruecolor( $nwi, $nhe );
			
				// Resize to thumbnail
				imagecopyresized( $des, $img, 0, 0, 0, 0, $nwi, $nhe, $siz[0], $siz[1] );
				unset( $img );
			
				// Create jpeg thumbnail
				//$dataUri = "data:image/jpeg;base64," . base64_encode($contents);
				ob_start();
				imagejpeg( $des, false, 95 );
				$contents = ob_get_contents();
				ob_end_clean();
			
				// Save jpeg thumbnail
				$t->Data = base64_encode( $contents );
				$t->DateModified = date( 'Y-m-d H:i:s' );
				$t->DateCreated = $t->DateModified;
				$t->Width = $nwi;
				$t->Height = $nhe;
				$t->Name = $o->Name;
				$t->UserID = $o->UserID;
				$t->Save();
			
				// Output thumbnail
				die( $contents );
			}
		}
	case 'getimages':
		// TODO: Allow to get other parents
		if( $rows = $db->FetchObjects( '
			SELECT ID, `Name` FROM DocuFile
			WHERE `Type` = \'Image\' AND ParentID=\'0\'
			ORDER BY `Name` ASC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		break;
	case 'deleteimage':
		if( $level == 'Admin' )
		{
			$db->query( 'DELETE FROM DocuFile WHERE ID = \'' . intval( $args->args->imageid, 10 ) . '\' OR ParentID=\'' . intval( $args->args->imageid, 10 ) . '\'' );
			die( 'ok' );
		}
		break;
}

die( 'fail' );

?>
