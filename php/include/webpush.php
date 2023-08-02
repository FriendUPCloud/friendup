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
		'urgency' => 'normal',
		'topic' => 'message',
		'batchSize' => 200
	];
	
	$webPush = new WebPush( $auth, $defOpts );
	$webPush->setReuseVAPIDHeaders( true );
	
	$subscription = Subscription::create( [
        'endpoint' => $setting->Data,
        'contentEncoding' => 'aes128gcm'
    ] );
	
	$msg = new stdClass();
	$msg->message = new stdClass();
	$msg->message->notification = new stdClass();
	$msg->message->notification->title = 'Hello from Friend OS';
	$msg->message->notification->body = 'This is just a text to test the notifications...';
	$payload = json_encode( $msg );
	
	if( $result = $webPush->sendOneNotification( $subscription, $payload ) )
	{
		if( $request = $result->getRequest() )
		{
			//$uri = $request->getUri();
			if( $result->isSuccess() )
			{
				$Logger->log( 'The message was sent successfully: ' . $payload );
				return true;
			}
		}
	}
}
return false;

?>
