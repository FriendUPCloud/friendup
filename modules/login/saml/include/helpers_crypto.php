<?php


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
		die( print_r( $pem, 1 ) );
	}
	else
	{
		die( 'fail<!--separate-->' . print_r( $pem, 1 ) . '----' . __DIR__ );
	}
	return $pem;
}

?>
