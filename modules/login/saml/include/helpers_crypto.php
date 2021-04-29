<?php


function getServerKeys()
{
	$pem = new stdClass();
	$pem->privatekey = null;
	$pem->publickey = null;
	
	if( file_exists( __DIR__ . '../../../../cfg/crt/server_encryption_key.pem' ) )
	{
		if( $keys = file_get_contents( __DIR__ . '../../../../cfg/crt/server_encryption_key.pem' ) )
		{
			if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
			{
				if( isset( $keys[0] ) )
				{
					$pem->privatekey = ( $keys[0] . '-----' );
				}
				if( isset( $keys[1] ) )
				{
					$pem->publickey = ( '-----' . $keys[1] );
				}
			}
		}
	}
	else
	{
		die( 'fail<!--separate-->' . print_r( $pem, 1 ) . '----' . __DIR__ );
	}
	return $pem;
}

?>
