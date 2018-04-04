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

global $User, $SqlDatabase, $CompCandSettings;

include_once( 'php/friend.php' );

// ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ### 
//get database settings and connect to it
if( $row = $SqlDatabase->FetchObject( "SELECT s.* FROM FSetting s WHERE	s.UserID = '-1' AND s.Type = 'competentcandidate' AND s.Key = 'database' ORDER BY s.Key ASC;" ) )
{
	$tmp = json_decode($row->Data);
	if( $tmp && $tmp->host && $tmp->username && $tmp->password && $tmp->database && $tmp && $tmp->cand_host && $tmp->cand_username && $tmp->cand_password && $tmp->cand_database )
	{
		$RSql = new SqlDatabase();
		$RSql->Open( $tmp->host, $tmp->username, $tmp->password ) or die( 'fail<!--separate-->Failed to open Randstad Candidate database!' );
		$RSql->SelectDatabase( $tmp->database );
	}
	else
	{
		die('fail<!--separate-->invalid CompCand database settings. ::  ' . print_r( json_decode( $row->Data ), 1 ) );
	}
	$CompCandSettings = $tmp;
}
else
{
	
	$defaultdbsettings =  (object) array('host'=>'localhost', 'username' =>'dbuser','password'=>'dbpass','database'=>'dbname','cand_host'=>'localhost', 'cand_username' =>'dbuser','cand_password'=>'dbpass','cand_database'=>'dbname');
	$SqlDatabase->query('INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES (-1,\'competentcandidate\',\'database\',\''. json_encode($defaultdbsettings) .'\');');
	
	die('fail<!--separate-->CompCand database settings could not be found. Please contact your administrator.');
}



// ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ### 
/* Check that DB is set up --------------------------------------------------------- */
$t = new DbTable( 'CmpCompetencyGroup', $RSql );
if( !$t->load() ) include_once( 'modules/competentcandidate/include/dbsetup.php' );
$t = new DbTable( 'CmpCompetency', $RSql );
if( !$t->load() ) include_once( 'modules/competentcandidate/include/dbsetup.php' );
$t = new DbTable( 'CmpProfile', $RSql );
if( !$t->load() ) include_once( 'modules/competentcandidate/include/dbsetup.php' );

if( !isset( $args->command ) )
{
	die( 'fail' );
}

// ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ###  ### 
/* Command parsing ---------------------------------------------------------- */
switch( $args->command )
{
	case 'checkdatabase':
		if( !( $mx = $RSql->FetchObject( 'SELECT MAX(ID) AS MX FROM CmpGroup' ) ) )
		{
			die('fail<!--separate-->Database is not is not set up.');
		}
		else
		{
			$group = '';
			$r = $SqlDatabase->FetchObject( "SELECT * FROM FSetting s WHERE	s.UserID = '" . $User->ID . "' AND s.Type = 'competentcandidate' AND s.Key = 'globalgroup' ORDER BY s.Key ASC;" );
			if( !$r & $g = $RSql->FetchObject( 'SELECT MIN(ID) AS GroupID FROM CmpGroup' ))
			{
				$o = new DbIO( 'FSetting', $SqlDatabase );
				$o->UserID = $User->ID;
				$o->Type = 'competentcandidate';
				$o->Key = 'globalgroup';
				$o->Data = $g->GroupID;
				
				$o->Save();
				
				$group = (object) array('GlobalGroup' => $g->GroupID);
			}
			else
			{
				$group = (object) array('GlobalGroup' => $r->Data);

			}
			die('ok<!--separate-->'. json_encode( $group ));
		}
		break;
	


	case 'lists':
		include_once( 'modules/competentcandidate/include/cmd_lists.php' );
		break;
	case 'listset':
		include_once( 'modules/competentcandidate/include/cmd_listset.php' );
		break;
	case 'listget':
		include_once( 'modules/competentcandidate/include/cmd_listget.php' );
		break;
	case 'listdelete':
		include_once( 'modules/competentcandidate/include/cmd_listdelete.php' );
		break;
	case 'groupsbyrelation':
		if( $rows = $RSql->FetchObjects( '
			SELECT c.*, r.ID AS RelationID, r.SortOrder FROM CmpCompetencyGroup c, CmpRelation r
			WHERE
				c.ID = r.RowID AND r.Type="CompetencyGroup" AND
				r.ConnectionType="' . $args->args->connectiontype . '" AND
				r.ConnectionID=\'' . $args->args->connectionid . '\'
			ORDER BY r.SortOrder ASC, c.Name ASC
		' ) )
		{
			foreach( $rows as $k=>$row )
			{
				// TODO: Optimize this!
				if( $ro = $RSql->FetchObjects( 'SELECT `Name` FROM CmpGroup WHERE ID IN ( ' . $row->GroupID . ' )' ) )
				{
					$row->Groups = [];
					foreach( $ro as $r )
					{
						$row->Groups[] = $r->Name;
					}
					$rows[$k]->Groups = implode( ', ', $row->Groups );
				}
				else $rows[$k]->Groups = '';
				
				$rows[$k]->DateModified = date( 'd/m/Y', strtotime( $row->DateModified ) );
			}
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail' );
		break;
	case 'groups':
		if( $rows = $RSql->FetchObjects( '
			SELECT ID, `Name`, Description, DateModified, GroupID FROM `CmpCompetencyGroup` 
			WHERE
				!`IsDeleted`
				' . ( isset( $args->args->groupid ) ? ' AND GroupID IN (' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->groupid ) . ')' : '' ) . '
			ORDER BY 
				`Name` ASC
		' ) )
		{
			foreach( $rows as $k=>$row )
			{
				// TODO: Optimize this!
				if( $ro = $RSql->FetchObjects( 'SELECT `Name` FROM CmpGroup WHERE ID IN ( ' . $row->GroupID . ' )' ) )
				{
					$row->Groups = [];
					foreach( $ro as $r )
					{
						$row->Groups[] = $r->Name;
					}
					$rows[$k]->Groups = implode( ', ', $row->Groups );
				}
				else $rows[$k]->Groups = '';
				
				$rows[$k]->DateModified = date( 'd/m/Y', strtotime( $row->DateModified ) );
			}
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail' );
		break;
	case 'groupset':
		$o = new DbIO( 'CmpCompetencyGroup', $RSql );
		if( (int)$args->args->id > 0 )
		{
			$o->Load( $args->args->id );
		}
		else $o->DateCreated = date( 'Y-m-d H:i:s' );
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->Name = $args->args->group;
		$o->Description = $args->args->description;
		$o->GroupID = $args->args->groupId;
		$o->Save();
		die( 'ok<!--separate-->' . $o->ID );
		break;
	case 'groupget':
		if( (int)$args->args->id > 0 )
		{
			$o = new DbIO( 'CmpCompetencyGroup', $RSql );
			$o->Load( $args->args->id );
			
			$ob = new stdClass();
			$ob->ID = $o->ID;
			$ob->Name = $o->Name;
			$ob->DateModified = $o->DateModified;
			$ob->Description = $o->Description;
			$ob->GroupID = $o->GroupID;
			die( 'ok<!--separate-->' . json_encode( $ob ) );
		}
		die( 'fail<!--separate-->' );
		break;
	case 'globalgroups':
		if( $rows = $RSql->FetchObjects( '
			SELECT ID, `Name`, Description, DateModified FROM `CmpGroup` 
			WHERE
			    `GroupID`=\'0\'
		    AND `Type`=\'Global\'
			AND !`IsDeleted`
			ORDER BY 
				`Name` ASC
		' ) )
		{
			foreach( $rows as $k=>$row )
			{
				$rows[$k]->DateModified = date( 'd/m/Y', strtotime( $row->DateModified ) );
			}
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail' );
		break;
	case 'globalgroupset':
		$o = new DbIO( 'CmpGroup', $RSql );
		if( (int)$args->args->id > 0 )
		{
			$o->Load( $args->args->id );
		}
		else $o->DateCreated = date( 'Y-m-d H:i:s' );
		$o->Type = 'Global';
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->Name = $args->args->group;
		$o->Description = $args->args->description;
		$o->Save();
		die( 'ok<!--separate-->' . $o->ID );
		break;
	case 'globalgroupget':
		if( (int)$args->args->id > 0 )
		{
			$o = new DbIO( 'CmpGroup', $RSql );
			$o->Load( $args->args->id );
			
			$ob = new stdClass();
			$ob->ID = $o->ID;
			$ob->Type = 'Global';
			$ob->Name = $o->Name;
			$ob->DateModified = $o->DateModified;
			$ob->Description = $o->Description;
			
			die( 'ok<!--separate-->' . json_encode( $ob ) );
		}
		die( 'fail<!--separate-->' );
		break;
		
	case 'competency_set':
		$o = new DbIO( 'CmpCompetency', $RSql );
		if( (int)$args->args->id > 0 )
		{
			$o->Load( $args->args->id );
		}
		else $o->DateCreated = date( 'Y-m-d H:i:s' );
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->Name         = $args->args->name;
		$o->Description  = $args->args->description;
		$o->Question     = $args->args->question;
		$o->Answer       = $args->args->answer;
		$o->Save();
		die( 'ok<!--separate-->' . $o->ID );
		break;

	case 'competency_delete':
		$o = new DbIO( 'CmpCompetency', $RSql );
		if ( (int)$args->args->id > 0 && $o->Load( $args->args->id ) )
		{
			$o->IsDeleted = 1;
			$o->Save();
			die( 'ok<!--separate-->' . $o->ID );
		}
		else
		{
			die('fail<!--separate-->Could not delete competency.');
		}
		break;

	case 'competency_get':
		if( (int)$args->args->id > 0 )
		{
			$o = new DbIO( 'CmpCompetency', $RSql );
			$o->Load( $args->args->id );
			$ob               = new stdClass();
			$ob->ID           = $o->ID;
			$ob->Name         = $o->Name;
			$ob->Description  = $o->Description;
			$ob->Question     = $o->Question;
			$ob->Answer       = $o->Answer;			
			$ob->DateModified = $o->DateModified;
			die( 'ok<!--separate-->' . json_encode( $ob ) );
		}
		die( 'fail<!--separate-->' );
		break;
	case 'addrelation':
		$io = new DbIO( 'CmpRelation', $RSql );
		$io->Type = $args->args->type;
		$io->RowID = $args->args->rowid;
		$io->ConnectionType = $args->args->connectiontype;
		$io->ConnectionID = $args->args->connectionid;
		$io->SortOrder = $args->args->sortorder;
		break;
	// Remove a database relation
	case 'delrelation':
		$io = new DbIO( 'CmpRelation', $RSql );
		if( $io->Load( $args->args->id ) )
		{
			$io->Delete();
			die( 'ok' );
		}
		die( 'fail' );
		break;
	// Set a database relation
	case 'setrelation':
		$io = new DbIO( 'CmpRelation', $RSql );
		if( isset( $args->args->id ) )
			$io->Load( $args->args->id );
		if( isset( $args->args->type ) )
			$io->Type = $args->args->type;
		if( isset( $args->args->rowid ) && (int)$args->args->rowid > 0 )
			$io->RowID = $args->args->rowid;
		if( isset( $args->args->connectiontype ) )
			$io->ConnectionType = $args->args->connectiontype;
		if( isset( $args->args->connectionid ) && (int)$args->args->connectionid > 0 )
			$io->ConnectionID = $args->args->connectionid;
		if( isset( $args->args->sortorder ) )
			$io->SortOrder = $args->args->sortorder;
		$io->Save();
		if( $io->ID > 0 )
		{
			die( 'ok' );
		}
		die( 'fail' );
		break;
	// List competencies (by or not by sort competency group)
	case 'competencies':
		if( isset( $args->args->competencygroupid ) && (int)$args->args->competencygroupid > 0 )
		{
			if( $rows = $RSql->FetchObjects( '
				SELECT c.*, r.SortOrder, r.ID AS `RelationID` FROM CmpCompetency c, CmpRelation r
				WHERE
					r.Type = \'Competency\' AND r.RowID = c.ID AND
					r.ConnectionType = \'CompetencyGroup\' AND r.ConnectionID = \'' . $args->args->competencygroupid . '\'
				ORDER BY r.SortOrder, c.Name ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
		}
		else if( isset( $args->args->connectionid ) && int($args->args->connectionid) > 0 && isset( $args->args->connectiontype ) )
		{
			if( $rows = $RSql->FetchObjects( '
				SELECT c.*, r.SortOrder, r.ID AS `RelationID` FROM CmpCompetency c, CmpRelation r
				WHERE
					r.Type = \'Competency\' AND r.RowID = c.ID AND
					r.ConnectionType = \'' . $args->args->connectiontype . '\' AND r.ConnectionID = \'' . $args->args->connectionid . '\'
				ORDER BY r.SortOrder, c.Name ASC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
		}
		else if( isset( $args->args->onlyunconnected ) &&  $args->args->onlyunconnected + '' == '1' )
		{
			if( $rows = $RSql->FetchObjects( '
				SELECT c.* FROM CmpCompetency c
				WHERE
					!IsDeleted 
				AND c.ID NOT IN ( SELECT r.RowID FROM CmpRelation r WHERE r.Type = \'Competency\' )
				ORDER BY c.Name ASC
				' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}	
			else
			{
				die('ok<!--separate-->[]');
			}		
		}
		else
		{
			// TODO: Update GroupID to CompetencyGroupID in db
			if( $rows = $RSql->FetchObjects( '
				SELECT c.* FROM CmpCompetency c
				WHERE
					!IsDeleted 
				ORDER BY `Name` ASC
				' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
		}
		die( 'fail<!--separate-->Could nor load competencies. ' . print_r($args->args,1) );
		break;
	default:
		if( file_exists( 'modules/competentcandidate/include/cmd_' . $args->command . '.php' ) )
		{
			include( 'modules/competentcandidate/include/cmd_' . $args->command . '.php' );
		}
		break;
}

die( 'fail' );

?>
