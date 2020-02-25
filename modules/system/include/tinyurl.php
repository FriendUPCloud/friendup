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

$f = new dbIO( 'FTinyUrl' );
$f->Source = $args->args->source;
if( $f->Load() )
{
	$url = buildUrl( $f->Hash, $Config );
	die( 'ok<!--separate-->{"response":"source is already in database","hash":"' . 
		$f->Hash . '","url":"' . $url . '"}' );
}

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
	$url = buildUrl( $f->Hash, $Config );
	die( 'ok<!--separate-->{"response":"url successfully created","hash":"' . 
		$f->Hash . '","url":"' . $url . '"}' );
}
die( 'fail<!--separate-->{"response":"could not generate url"}' );

function buildURL( $hash, $conf )
{
	$proto = $conf->SSLEnable ? 'https://' : 'http://';
	$host = $conf->FCHost;
	$port = $conf->FCPort ? ( ':' . $conf->FCPort ) : '';
	if( $conf->ProxyEnable == 1 )
		$port = '';
	$url = $proto . $host . $port . '/' . $hash;
	return $url;
}

?>
