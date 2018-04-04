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

/* get candidate data and connected profiles */
if( (int)$args->args->id > 0 )
{

	//just as a reminder... ;)
	global $User, $SqlDatabase, $CompCandSettings, $User;
	
	/* conenct to DB */
	$CSql = new SqlDatabase();
	$CSql->Open( $CompCandSettings->cand_host, $CompCandSettings->cand_username, $CompCandSettings->cand_password ) or die( 'fail<!--separate-->Failed to open Randstad Candidate database! ' .print_r($CompCandSettings,1) );
	$CSql->SelectDatabase( $CompCandSettings->cand_database );
	
	//check if candidata is in comp cand somewhere...
	$ret = (object) array('candidate'=>'', 'connectedprofiles' => false, 'availableprofiles' => false);

	$ret->connectedprofiles = $RSql->FetchObjects('SELECT cp.ID,c.Name,cp.UserID, cp.Status FROM CmpProfile c, CmpCandidateProfile cp WHERE cp.IsDeleted = \'0\' AND c.ID = cp.ProfileID AND cp.CandidateID = \''. ((int)$args->args->id)  .'\' ORDER BY c.Name ASC');
	$ret->candidate 		= $CSql->FetchObject('SELECT * FROM Users WHERE ID = \''. ((int)$args->args->id)  .'\'');
	$ret->availableprofiles = $RSql->FetchObjects('SELECT p.*, g.Name AS GroupName FROM CmpProfile p, CmpGroup g WHERE ( p.UserID = \'-1\' OR p.UserID = \''. $User->ID .'\') AND p.GroupID = g.ID');

	die('ok<!--separate-->'. json_encode($ret));
}
die('fail<!--separate-->No candidate ID sent to server.');

?>
