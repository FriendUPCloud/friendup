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
if( (int)$args->args->profileid > 0 && (int)$args->args->candidateid > 0)
{

	//just as a reminder... ;)
	global $User, $SqlDatabase, $CompCandSettings, $User;

	$o = new DbIO( 'CmpCandidateProfile', $RSql );
	$o->CandidateID = $args->args->candidateid;
	$o->ProfileID = $args->args->profileid;
	$o->UserID = $User->ID;
	$o->DateModified = date( 'Y-m-d H:i:s' );
	$o->Status = 'pending';
	$o->Save();
	
	
	$Logger->log( print_r($o,1) );
	
	$profiles = $RSql->FetchObjects('SELECT c.ID,c.Name, cp.UserID,cp.Status FROM CmpProfile c, CmpCandidateProfile cp WHERE cp.IsDeleted = \'0\' AND c.ID = cp.ProfileID AND cp.CandidateID = \''. ((int)$args->args->candidateid)  .'\' ORDER BY c.Name ASC');
	die('ok<!--separate-->'. json_encode($profiles));
}
die('fail<!--separate-->No candidate ID sent to server.');

?>
