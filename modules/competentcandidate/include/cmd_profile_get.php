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

if ( (int)$args->args->id > 0 )
{
	$o = new DbIO( 'CmpProfile', $RSql );
	if( $o->Load( (int)$args->args->id ) )
	{
		$ob = new stdClass();
		$ob->ID = $o->ID;
		$ob->UserID = $o->UserID;
		$ob->GroupID = $o->GroupID;
		$ob->ScaleID = $o->ScaleID;
		$ob->Name = $o->Name;
		$ob->Data = $o->Data;
		$ob->DateModified = $o->DateModified;
		$ob->Description = $o->Description;
		
		die( 'ok<!--separate-->' . json_encode( $ob ) );
	}
	else
	{
		die('fail<!--separate-->Invalid ID for profile: ' . $args->args->id );
	}
}

die( 'fail<!--separate-->' );

?>
