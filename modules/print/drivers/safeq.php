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

// TODO: Support file conversions
$file = new File( $args->args->file );
if( $file->Load() )
{
	// IP Printer - simple mode
	if( $conf->ip && $conf->port )
	{
		$ch = curl_init();
		curl_setopt( $ch, CURLOPT_URL, $conf->ip );
		curl_setopt( $ch, CURLOPT_PORT, $conf->port );
		$result = curl_execute( $ch );
	}
	// TODO: Support hostnames
	else if( $conf->host )
	{
	}

	die( 'fail<!--separate-->{"response":-1,"message":"Missing parameters."}' );
}

die( 'fail<!--separate-->{"response":-1,"message":"Could not load print file."}' );

?>
