<?php

global $Logger, $Config;

$o = new dbIO( 'FSetting' );
$o->Type = 'WebPush';
$o->Key = $row->SessionID;
$o->UserID = $targetUser->ID;
if( $o->Load() )
{
	$Logger->log( '[dbIO] Found user session for push!' );
	
	$vapid = new dbIO( 'FSetting' );
	$vapid->UserID = '0';
	$vapid->Type = 'System';
	$vapid->Key = 'VAPID-Keys';
	if( $vapid->Load() )
	{
		/*
		 * If you get any part of this process wrong, Google gives the really helpful error message "invalid JWT provided".
		 * 
		 * Mozilla (Firefox) gives a slightly just-as-useful error:
		 * {
		 *   "code": 401, "errno": 109, "error": "Unauthorized",
		 *   "more_info": "http://autopush.readthedocs.io/en/latest/http.html#error-codes",
		 *   "message": "Request did not validate Invalid Authorization Header"
		 * }
		 */

		// Generate the keys like this, although you can probably do it in PHP.
		// `openssl ecparam -genkey -name prime256v1 -noout -out server-push-ecdh-p256.pem &>/dev/null`;
		// `openssl ec -in server-push-ecdh-p256.pem -pubout -out server-push-ecdh-p256.pub &>/dev/null`;

		$endpoint = $o->Data;
		$cryptoKeys = json_decode( $vapid->Data );
		$contact = 'mailto:info@friendos.com';		
		$privk = base64_decode( $cryptoKeys->private_key );
		//$privk = str_replace( [ '-----BEGIN EC PRIVATE KEY-----', '-----END EC PRIVATE KEY-----', "\n" ], '', base64_decode( $cryptoKeys->private_key ) );
		
		//$Logger->log( 'Private: ' . base64_decode( $cryptoKeys->private_key ) );
		//$Logger->log( '--' );
		//$Logger->log( 'First private: ' . $privk );
		
		$pubk = $cryptoKeys->public_key;

		$Logger->log( '[dbIO] Check. 1' );

		function base64web_encode( $a )
		{
			return str_replace( [ '+', '/', '=' ], [ '-', '_', '' ], base64_encode( $a ) );
		}
		function base64web_decode( $a )
		{
			return base64_decode( str_replace( [ '-', '_', '' ], [ '+', '/', '=' ], $a ) );
		}
		function decodeBER( $data )
		{
			global $Logger;
			$Logger->log( '[dbIO] Check. 2: ' . $data );
			
			$typeByte = ord( $data[ 0 ] );
			$lengthByte = ord( $data[ 1 ] );
			$valueOffset = 2;

			// Determine the length of the value based on the lengthByte
			if( $lengthByte & 0x80 )
			{
				$lengthBytes = $lengthByte & 0x7F;
				$valueLengthHex = substr( $data, $valueOffset, $lengthBytes * 2 );
				$valueOffset += $lengthBytes * 2;
				$valueLength = hexdec( $valueLengthHex );
			} 
			else
			{
				$valueLength = $lengthByte;
			}

			$valueData = substr( $data, $valueOffset, $valueLength * 2 );
			$value = 0;

			// Convert the raw binary data back to an integer
			for( $i = 0; $i < $valueLength; $i++ )
			{
				$value = ( $value << 8 ) | hexdec( $valueData[ $i * 2 ] . $valueData[ $i * 2 + 1 ] );
			}
			//$Logger->log( '[dbIO] Value: ' . $value );
			
			return $value;
		}

		$header = [
			"typ" => "JWT",
			"alg" => "ES256"
		];
		
		$claims = [
			// just the https://hostname part
			"aud" => substr( $endpoint, 0, strpos( $endpoint, '/', 10 ) ),
			// this push message will be discarded after 24 hours of non-delivery
			"exp" => time() + 86400,
			// who the server can talk to if our push script is causing problems
			"sub" => $contact
		];

		$strHeader = base64web_encode( json_encode( $header ) );
		$strPayload = base64web_encode( json_encode( $claims ) );

		$toSign = $strHeader . '.' . $strPayload;

		$signature = '';
		if( !openssl_sign( $toSign, $signature, $privk, OPENSSL_ALGO_SHA256 ) )
		{
			$Logger->log( 'sign failed: '. openssl_error_string() );
		}

		//$Logger->log( '[dbIO] Check. 3: ' . $signature );

		$xx = decodeBER( $signature );
		
		$Logger->log( '[dbIO] Check. 3.5; ' . print_r( $xx, 1 ) );
		
		/** @var \phpseclib\Math\BigInteger $a */
		/** @var \phpseclib\Math\BigInteger $b */
		$a = $xx[ 0 ][ 'content' ][ 0 ][ 'content' ]; // 128-bits
		$b = $xx[ 0 ][ 'content' ][ 1 ][ 'content' ]; // 128-bits
		$signature = $a->toBytes() . $b->toBytes();
		$strSignature = base64web_encode( $signature );

		$Logger->log( '[dbIO] Check. 4' );

		/*
		 * This is now a complete JWT object.
		 */
		$jwt = $strHeader . '.' . $strPayload . '.' . $strSignature;

		/*
		 * Our PEM formatted public key is wrapped in an ASN.1 structure, so just 
		 * like our signature above, lets extract
		 * the raw public key part, which is the bit we need.
		 */
		$xx = $pubk;
		$xx = str_replace( ['-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----', "\n" ], '', $xx );
		$xx = base64_decode( $xx );
		$xx = $asn->decodeBER( $xx );
		$xx = $xx[ 0 ][ 'content' ][ 1 ][ 'content' ];
		$xx = substr( $xx, 1 ); // need to strip the first char, which is not part of the key
		$xx = base64web_encode( $xx );
		$pubkey = $xx;

		$Logger->log( '[dbIO] Check. 5' );

		/*
		 * We need to append the public key used for signing this JWT object, so 
		 * the server can validate the JWT and compare the public key against the 
		 * push-registration by the client, where we said which public key we would 
		 * accept pushes from.
		 */
		$headers = [
			"Authorization: vapid t=$jwt,k=$pubkey",
			"Content-length: 0",
			"Ttl: 86400",
		];

		/**
		 * Push!
		 */
		$ch = curl_init( $endpoint );
		curl_setopt( $ch, CURLOPT_HTTPHEADER, $headers );
		curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
		curl_setopt( $ch, CURLOPT_FAILONERROR, true );
		curl_setopt( $ch, CURLOPT_POST, 1 );
		curl_exec( $ch );
		$ct = curl_multi_getcontent( $ch );
		$Logger->log( curl_error( $ch ) );
		curl_close( $ch );
		$Logger->log( $ct );
		
		
		/*$Logger->log( '[dbIO] VAPID loaded!' );
		
		$endpoint = $o->Data;
		
		$cryptoKeys = json_decode( $vapid->Data );
		
		$vapidPublicKey = $cryptoKeys->public_key; // your vapid public key
		$vapidPrivateKey = $cryptoKeys->private_key; // your vapid private key
		
		// TODO: Support groups, not only DM's
		// TODO: Decode message if possible, or say it's "encrypted"
		$payload = new stdClass();
		$payload->title = $message->Title;
		$payload->body = $message->Message;
		$payload->icon = 'https://intranet.friendup.cloud/graphics/system/friendos144.png';
		$payload->data = new stdClass();
		$payload->data->userid = $targetUser->UniqueID;
		$payload = json_encode( $payload );
		
		$audience = parse_url( $endpoint)[ 'scheme' ] . '://' . parse_url( $endpoint )[ 'host' ];
		
		$jwtHeader = [
			'typ' => 'JWT',
			'alg' => 'ES256',
		];

		// TODO: Allow config registered email to pop in here!
		$jwtClaim = [
			'aud' => $audience,
			'exp' => time() + 3600, // 1 hour expiration time
			'sub' => 'mailto:info@friendos.com', // Email of the sender
		];

		$jwtHeaderEncoded = base64_encode( json_encode( $jwtHeader ) );
		$jwtClaimEncoded = base64_encode( json_encode( $jwtClaim ) );
		
		$tokenToSign = $jwtHeaderEncoded . '.' . $jwtClaimEncoded;

		$signature = '';
		openssl_sign( $tokenToSign, $signature, $cryptoKeys->private_key, OPENSSL_ALGO_SHA256 );
		$jwtSignatureEncoded = base64_encode( $signature );

		// Replace 'your_base64_encoded_vapid_public_key' with your actual base64-encoded VAPID public key
		$vapidPublicKey = strtr( $vapidPublicKey, '-_', '+/' );
		$vapidPublicKey = str_pad( $cryptoKeys->public_string, 65, '=', STR_PAD_RIGHT );
		$vapidPublicKey = $vapidPublicKey;

		$authorization = sprintf(
			'Authorization: vapid t=%s, k=%s, v=%s',
			$tokenToSign,
			$vapidPublicKey,
			$jwtSignatureEncoded
		);
		
		$ch = curl_init( $o->Data );
		curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
		curl_setopt( $ch, CURLOPT_POST, true );
		curl_setopt( $ch, CURLOPT_HTTPHEADER, [
			'Content-Type: application/json',
			$authorization,
		] );
		curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
		$response = curl_exec( $ch );
		curl_close( $ch );
		$Logger->log( '[dbIO] From end point, ' . $response );
		return;*/
	}
}

?>
