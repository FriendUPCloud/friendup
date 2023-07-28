<?php

global $Logger;

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
		
		$Logger->log( '[dbIO] VAPID loaded!' );
		
		$endpoint = $o->Data;
		
		$vapidPublicKey = 'your_vapid_public_key';
		
		$vapidPrivateKey = 'your_vapid_private_key';
		
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
		
		$cryptoKeys = json_decode( $vapid->Data );
		
		$jwtHeaderEncoded = base64_encode( json_encode( $jwtHeader ) );
		$jwtClaimEncoded = base64_encode( json_encode( $jwtClaim ) );
		
		$jwtSignature = '';
		
		openssl_sign( $jwtHeaderEncoded . '.' . $jwtClaimEncoded, $jwtSignature, $cryptoKeys->private_key, 'SHA256' );
		$jwtSignatureEncoded = base64_encode( $jwtSignature );
		
		$authorization = sprintf(
			'Authorization: vapid t=%s, k=%s, v=%s',
			$jwtHeaderEncoded,
			$jwtClaimEncoded,
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
		return;
	}
}

?>
