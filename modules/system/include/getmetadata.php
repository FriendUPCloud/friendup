<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
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
