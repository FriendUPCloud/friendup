<?php

/*©lpgl*************************************************************************
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


$f = new dbIO( 'FTinyUrl' );
$f->Source = $args->args->source;
if( $f->Load() )
	die( 'fail<!--separate-->{"response":"source is already in database"}' );
$f->UserID = $User->ID;

do
{
	$hash = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) );
	$f->Hash = substr( $hash, 0, 8 );
}
while( $f->Load() );

if( $args->args->expire )
{
	$f->Expire = '1';
}

$f->DateCreated = strtotime( date( 'Y-m-d H:i:s' ) );

$f->Save();

if( $f->ID > 0 )
{
	die( 'ok<!--separate-->{"response":"url successfully created","hash":"' . $f->Hash . '"}' );
}
die( 'fail<!--separate-->{"response":"could not generate url"}' );

?>
