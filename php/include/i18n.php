<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

$i18n = array();

function i18nAddPath( $path, $language = 'en' )
{
	global $i18n;
	
	if( file_exists( $path ) )
	{
		if( strstr( '.lang', $path ) > 0 )
			$data = file_get_contents( $path );
		else $data = file_get_contents( $path . '/' . $language . '.lang' );
		$data = explode( "\n", $data );
		foreach( $data as $d )
		{
			if( !trim( $d ) ) continue;
			if( substr( trim( $d ), 0, 1 ) == '#' ) continue;
			list( $k, $v ) = explode( ':', trim( $d ) );
			$i18n[trim($k)] = trim( $v );
		}
	}
}

// Translations
function i18n( $string )
{
	global $i18n;
	
	if( isset( $i18n[$string] ) ) return $i18n[$string];
	return $string;
}

?>
