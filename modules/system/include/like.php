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

global $SqlDatabase;

// Database check
$dbTest = new dbTable( 'ApplicationLike' );
if( !$dbTest->load() )
{
	$SqlDatabase->query( '
		CREATE TABLE `ApplicationLike` ( 
			ID bigint(20) NOT NULL auto_increment,
			UserID bigint(20) NOT NULL,
			`Application` varchar(255) default "",
			`Liked` tinyint(4) NOT NULL default 0,
			PRIMARY KEY(ID)
		);
	' );
}

$l = new dbIO( 'ApplicationLike' );
$l->UserID = $User->ID;
$l->Application = $args->args->application;
$l->Load(); // Try load
$l->Liked = intval( $args->args->like, 10 );
if( $l->Save() )
{
	die( 'ok<!--separate-->{"response":"1","message":"You stored your like"}' );
}
else
{
	die( 'fail<!--separate-->{"response":"0","message":"Failed to store like"}' );
}

?>
