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

	//just as a reminder... ;)
	global $User, $SqlDatabase, $CompCandSettings, $User;
	

	if( $rows = $RSql->FetchObjects('SELECT cp.ID,cp.CandidateID,cp.Status, c.Name, cp.Status FROM CmpProfile c, CmpCandidateProfile cp WHERE cp.IsDeleted = \'0\' AND cp.UserID = \''. $User->ID .'\' AND c.ID = cp.ProfileID ORDER BY cp.DateModified DESC') )
	{
		//get candidate IDs and fetch their names
		$ids = [];
		for($i = 0; $i < count( $rows ); $i++ )
			$ids[] = $rows[$i]->CandidateID;
		
		
		$sql = "SELECT ID,Name,Email,Mobile FROM Users WHERE ID IN (" . join(',', array_unique($ids) ) . ")";

		/* conenct to DB */
		$CSql = new SqlDatabase();
		$CSql->Open( $CompCandSettings->cand_host, $CompCandSettings->cand_username, $CompCandSettings->cand_password ) or die( 'fail<!--separate-->Failed to open Randstad Candidate database! ' .print_r($CompCandSettings,1) );
		$CSql->SelectDatabase( $CompCandSettings->cand_database );
		
		$cands = $CSql->FetchObjects( $sql );
		
		$ret = (object) array('profiles'=>$rows, 'candidates' => $cands);
		die('ok<!--separate-->'. json_encode($ret));
	}
	else
	{
		die('ok<!--separate-->[]');
	}



?>
