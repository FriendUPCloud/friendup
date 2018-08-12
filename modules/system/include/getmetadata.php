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

// Search for keys starting with search parameter
if( isset( $args->args->search ) )
{
	$entry = new dbIO( 'FMetaData' );
	$search = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->search );
	$extra = '';
	if( isset( $args->args->valueString ) )
	{
		$str = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->valueString );
		$extra .= ' AND `ValueString` = "' . $str . '"';
	}
	$Logger->log( print_r( $args, 1 ) );
	if( isset( $args->args->valueStrings ) )
	{
		$ar = $args->args->valueStrings;
		$extra .= ' AND (';
		foreach( $ar as $k=>$a )
		{
			if( $k > 0 ) $extra .= ' OR ';
			$str = mysqli_real_escape_string( $SqlDatabase->_link, $a );
			$extra .= '`ValueString` = "' . $str . '"';
		}
		$extra .= ')';
		$Logger->log( $extra );
	}
	if( $entries = $entry->find( 'SELECT * FROM `FMetaData` WHERE `Key` LIKE "' . $search . '%"' . $extra ) )
	{
		$out = [];
		foreach( $entries as $entr )
		{
			$o = new stdClass();
			$o->Key = $entr->Key;
			$o->ValueString = $entr->ValueString;
			$o->ValueNumber = $entr->ValueNumber;
			$out[] = $o;
		}
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
	die( 'fail' );
}

$entry = new dbIO( 'FMetaData' );
$entry->Key = $args->args->key;
if( $entry->load() )
{
	$o = new stdClass();
	$o->ValueNumber = $entry->ValueNumber;
	$o->ValueString = $entry->ValueString;
	die( 'ok<!--separate-->' . json_encode( $o ) );
}

die( 'fail' );

?>
