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

/* SEARCH LIMIT ######  */
$searchLimit = 100;

/* small helper here to make things easier later */
if( $args->args->getcount )
{
	die('ok<!--separate-->'.$searchLimit);
}


/* small helper function form user comments opn php.net ;) */
function mysql_escape_mimic($inp) { 
    if(is_array($inp)) 
        return array_map(__METHOD__, $inp); 

    if(!empty($inp) && is_string($inp)) { 
        return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp); 
    } 

    return $inp; 
} 

global $CompCandSettings, $Logger;

/* conenct to DB */
$CSql = new SqlDatabase();
$CSql->Open( $CompCandSettings->cand_host, $CompCandSettings->cand_username, $CompCandSettings->cand_password ) or die( 'fail<!--separate-->Failed to open Randstad Candidate database! ' .print_r($CompCandSettings,1) );
$CSql->SelectDatabase( $CompCandSettings->cand_database );



if( !$rows = $CSql->FetchObject('SELECT COUNT(ID) AS Candidates FROM Users') )
{
	die('fail<!--separate-->Candidate table in DB could not be found.' );
}

if( $args->args->term && strlen( $args->args->term ) > 2 )
{
	$searchterm = utf8_decode( mysql_escape_mimic( $args->args->term ) ); 
	$sql = "SELECT ID,Name,Email,Mobile FROM Users WHERE Name LIKE '%{$searchterm}%' OR Email LIKE '%{$searchterm}%' OR Mobile LIKE '%{$searchterm}%' ORDER BY Name ASC LIMIT {$searchLimit}";
	if( $rows = $CSql->FetchObjects( $sql ) )
	{
		//die( count($rows ) . ' :: ' . $sql . '::' . print_r( $rows,1  ) );
		
		if( count($rows > 0 ) )
		{
			$r = json_encode( $rows );
			if( json_last_error() ) die( 'fail<!--separate-->JSON ERROR ' . json_last_error() . ' : ' .json_last_error_msg() );
			die( 'ok<!--separate-->' . $r );
		}
	}
	die('ok<!--separate-->No results');
		
}
die( 'fail<!--separate-->Could not search.' );

?>
