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
	$privateKey = openssl_pkey_new( [
		'private_key_bits' => 2048,
		'private_key_type' => OPENSSL_KEYTYPE_EC,
		'curve_name' => 'prime256v1', // Specifying "elliptic curve"
	] );

	if( !$privateKey )
	{
		throw new Exception( 'Failed to generate private key.' );
	}

	// Extract the private key
	openssl_pkey_export( $privateKey, $privateKeyPEM );

	// Get the public key from the private key
	$publicKeyData = openssl_pkey_get_details( $privateKey );
	$publicKeyPEM = $publicKeyData[ 'key' ];

	$obj = new stdClass();
	$obj->privateKey = base64_encode( $privateKeyPEM );
	$obj->publicKey  = base64_encode( $publicKeyPEM );
	return $obj;
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
