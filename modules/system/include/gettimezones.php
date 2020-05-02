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

if( !file_exists( 'modules/system/assets/timezones' ) )
{
	die( 'fail<!--separate-->{"message":"Timezones do not exist.","response":"-1"}' );
}

// Load all timezones
$timezones = file_get_contents( 'modules/system/assets/timezones' );
$timezones = explode( "\n", $timezones );

$out = new stdClass();
$out->Other = [];

foreach( $timezones as $zone )
{
	if( strstr( $zone, '/' ) )
	{
		$zone = explode( '/', $zone );
		if( !isset( $out->{$zone[0]} ) )
		{
			$out->{$zone[0]} = [];
		}
		$out->{$zone[0]}[] = $zone[1];
	}
	else
	{
		$out->Other[] = $zone;
	}
}

die( 'ok<!--separate-->' . json_encode( $out ) );

?>
