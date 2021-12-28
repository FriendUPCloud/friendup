<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

function getServerKeys()
{
	$pem = new stdClass();
	$pem->privatekey = null;
	$pem->publickey = null;
	
	if( file_exists( __DIR__ . '/../../../../cfg/crt/server_encryption_key.pem' ) )
	{
		if( $keys = file_get_contents( __DIR__ . '/../../../../cfg/crt/server_encryption_key.pem' ) )
		{
			$data = explode( '-----END CERTIFICATE-----', $keys );
			$pem->privatekey = trim( str_replace( '-----BEGIN CERTIFICATE-----', '', $data[0] ) );
			$pem->publickey = trim( str_replace( '-----BEGIN CERTIFICATE-----', '', $data[1] ) );
		}
	}
	return $pem;
}

?>
