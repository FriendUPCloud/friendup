<?php

require __DIR__ . '/../vendor/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

if( isset( $setting ) )
{		
	$path = __DIR__ . '/../../cfg/crt/';

	$puKey = $prKey = '';
	
	if( !file_exists( $path . 'webpush_private_key.txt' ) )
	{
		die( 'fail<!--separate-->{"message":"Keys not installed.","response":-1}' );
	}
	else
	{
		$prKey = file_get_contents( $path . 'webpush_private_key.txt' );
	}
	if( !file_exists( $path . 'webpush_public_key.txt' ) )
	{
		die( 'fail<!--separate-->{"message":"Keys not installed.","response":-1}' );
	}
	else
	{
		$puKey = file_get_contents( $path . 'webpush_public_key.txt' );
	}
	
	$auth = [
		'VAPID' => [
			'subject' => 'https://friendos.com/',
			'publicKey' => $puKey,
			'privateKey' => $prKey
		]
	];
	
	$defOpts = [
		'TTL' => 300,
		'urgency' => 'high',
		'topic' => 'message',
		'batchSize' => 200
	];
	
	$webPush = new WebPush( $auth, $defOpts );
	$webPush->setReuseVAPIDHeaders( true );
	
	$dataObject = json_decode( $setting->Data );
	
	$subscription = Subscription::create( [
        'endpoint' => $dataObject->endpoint,
        'contentEncoding' => 'aes128gcm',
        'keys' => [
        	'p256dh' => $dataObject->keys->p256dh,
		    'auth' => $dataObject->keys->auth
	    ]
    ] );
	
	$cf = isset( $GLOBALS[ 'configfilesettings' ] ) ? $GLOBALS[ 'configfilesettings' ] : false;
	if( !$cf ) die( 'fail<!--separate-->major failure' );
	$ssl = isset( $cf[ 'Core' ][ 'SSLEnable' ] ) && $cf[ 'Core' ][ 'SSLEnable' ] ? true : false;
	$host = ( $ssl ? 'https://' : 'http://' ) . $cf[ 'FriendCore' ][ 'fchost' ];
	
	$messagePayload = new stdClass();
	$messagePayload->application = $message->Application;
	$messagePayload->applicationdata = $message->ApplicationData;
	
	$msg = new stdClass();
	$msg->url = $host . '/webclient/index.html?webpush=' . urlencode( json_encode( $messagePayload ) );
	$msg->title = $message->Title;
	$msg->body = $message->Body;
	$msg->icon = $host . '/graphics/system/friendos192.png';
	$payload = json_encode( $msg );
	
	if( $result = $webPush->sendOneNotification( $subscription, $payload ) )
	{
		if( $request = $result->getRequest() )
		{
			//$uri = $request->getUri();
			if( $result->isSuccess() )
			{
				//$Logger->log( '[webpush] The message was sent successfully' );
				return true;
			}
			else
			{
				//$Logger->log( '[webpush] Failed to send message' );
				$resultString = $result->getReason();
				if( strpos( $resultString, '410 Gone' ) > 0 )
				{
					// Subscription was expired, just remove the push record!
					//$Logger->log( '[webpush] Subscription expired, cleaning up DB.' );
					$SqlDatabase->query( 'DELETE FROM FSetting WHERE ID=\'' . $setting->ID . '\' LIMIT 1' );
				}
			}
		}
	}
}
return false;

?>
