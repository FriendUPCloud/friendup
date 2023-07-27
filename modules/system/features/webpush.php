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


	// Convert the DER private key to raw binary format
    $privateKeyRaw = openssl_pkey_get_private( $privateKey );

    // Extract the raw binary EC key
    $ecKey = openssl_pkey_get_details( $privateKeyRaw )[ 'ec' ];

    // Get the private key as a 32-byte binary string
    $vapidPrivateKey = str_pad( $ecKey[ 'd' ], 32, "\x00", STR_PAD_LEFT );

    // Base64 encode the VAPID private key
    $vapidPrivateKey = base64_encode( $vapidPrivateKey );

    // Extract the public key from the key pair
    $keyDetails = openssl_pkey_get_details( $keyPair );
    $publicKey = $keyDetails[ 'key' ];
    $publicString = "\x04" . $keyDetails[ 'ec' ][ 'x' ] . $keyDetails[ 'ec' ][ 'y' ];

    // Free the key pair from memory
    openssl_pkey_free( $keyPair );

    return [
        'private_key' => base64_encode( $privateKey ),
        'public_key' => base64_encode( $publicKey ),
        'private_string' => $vapidPrivateKey,
        'public_string' => rtrim( strtr( base64_encode( $publicString ), '+/', '-_' ), '=' ),
    ];
}

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
