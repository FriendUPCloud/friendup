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

//kvmglg

/* get candidate data and connected profiles */
if( (int)$args->args->profileid > 0 && (int)$args->args->candidateid > 0 )
{

	//just as a reminder... ;)
	global $User, $SqlDatabase, $CompCandSettings, $User;
	
	/* conenct to DB */
	$CSql = new SqlDatabase();
	$CSql->Open( $CompCandSettings->cand_host, $CompCandSettings->cand_username, $CompCandSettings->cand_password ) or die( 'fail<!--separate-->Failed to open Randstad Candidate database! ' .print_r($CompCandSettings,1) );
	$CSql->SelectDatabase( $CompCandSettings->cand_database );
	
	//check if candidata is in comp cand somewhere...
	$ret = (object) array('profile'=>'', 'candidate' => false, 'ratings'=>false);

	$ret->profile = $RSql->FetchObjects('
	SELECT 
		c.*, 
		c.ID AS CompetencyID, 
		g.ID AS GroupID, 
		g.Name AS GroupName, 
		g.Description AS GroupDescription, 
		cp.ID AS ProfileID, 
		cp.Status,
		cp.DateModified,
		p.Name AS ProfileTitle, 
		p.Description AS ProfileDescription, 
		s.Rate1, 
		s.Rate2, 
		s.Rate3, 
		s.Rate4, 
		s.Rate5 
	FROM 
		CmpCandidateProfile cp, 
		CmpProfile p, 
		CmpRelation r1, 
		CmpCompetencyGroup g, 
		CmpScale s, 
		CmpRelation r2, 
		CmpCompetency c 
	WHERE 
			cp.ID = ' . (int)$args->args->profileid . ' 
		AND cp.CandidateID = \'' . (int)$args->args->candidateid . '\' 
		AND cp.IsDeleted = "0"
		AND p.ID = cp.ProfileID 
		AND p.IsDeleted = "0" 
		AND r1.ConnectionID = p.ID 
		AND r1.ConnectionType = "Profile" 
		AND r1.Type = "CompetencyGroup" 
		AND r1.RowID = g.ID 
		AND s.ID = p.ScaleID 
		AND s.IsDeleted = "0" 
		AND r2.ConnectionID = g.ID 
		AND r2.ConnectionType = "CompetencyGroup" 
		AND r2.Type = "Competency" 
		AND r2.RowID = c.ID
		AND c.IsDeleted = "0" 
	ORDER BY 
		r1.SortOrder ASC, r2.SortOrder ASC 
		');
	$ret->candidate = $CSql->FetchObject('SELECT * FROM Users WHERE ID = \''. ((int)$args->args->candidateid)  .'\'');


	$rating = array();
	
	if ( $candcomp = $RSql->FetchObjects( '
		SELECT 
			* 
		FROM 
			CmpCandidateCompetency 
		WHERE 
				CandidateID = \'' . (int)$args->args->candidateid . '\' 
			AND ProfileID = ' . (int)$args->args->profileid . ' 
		ORDER BY 
			ID ASC 
	' ) )
	{
		foreach ( $candcomp as $cc )
		{
			$rating[$cc->GroupID.'_'.$cc->CompetencyID] = $cc;
		}
	}
	$ret->ratings = $rating;

	die('ok<!--separate-->'. json_encode($ret));
}
die('fail<!--separate-->No profile and candidate IDs sent to server.');


?>