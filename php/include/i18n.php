<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
