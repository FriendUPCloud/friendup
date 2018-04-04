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

	$o = new DbIO( 'CmpCandidateProfile', $RSql );
	$o->Load( (int)$args->args->id );
	$o->IsDeleted = 1;
	$o->Save();
	
	die('ok<!--separate-->'. $o->ID );
}
die('fail<!--separate-->No connection ID sent to server.');

?>
