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

function generateVAPIDKeys()
{
    $keyPair = openssl_pkey_new( [
		//'private_key_bits' => 2048,
		'private_key_type' => OPENSSL_KEYTYPE_EC,
		'curve_name' => 'prime256v1', // Specifying "elliptic curve"
	] );

	if( !$keyPair )
	{
		throw new Exception( 'Failed to generate private key.' );
	}

    // Extract the private key from the key pair
    openssl_pkey_export( $keyPair, $privateKey );

    // Extract the public key from the key pair
    $keyDetails = openssl_pkey_get_details( $keyPair );
    $publicKey = $keyDetails[ 'key' ];
    $publicString = $keyDetails[ 'ec' ][ 'x' ] . $keyDetails[ 'ec' ][ 'y' ];

    // Free the key pair from memory
    openssl_pkey_free( $keyPair );

    return [
        'private_key' => base64_encode( $privateKey ),
        'public_key' => base64_encode( $publicKey ),
        'public_string' => base64_encode( $publicString )
    ];
}

die( print_r( generateVAPIDKeys(), 1 ) );

// TODO: Store in a better and more secure way
$s = new dbIO( 'FSetting' );
$s->UserID = 0;
$s->Type = 'System';
$s->Key = 'VAPID-Keys';
if( !$s->Load() )
{	
	// Generate VAPID keys
	$s->Data = json_encode( generateVAPIDKeys() );
	$s->Save();
}

?>
