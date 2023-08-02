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
	
	$Logger->log( '[dbIO] Sending the notification.' );
	if( $result = $webPush->sendOneNotification( $subscription, "Hello there" ) )
	{
		$Logger->log( '[dbIO] Got a result.' );
		if( $request = $result->getRequest() )
		{
			$uri = $request->getUri();
			$Logger->log( '[dbIO] URI: ' . print_r( $uri, 1 ) );
			$Logger->log( '[dbIO] Success? ' . $result->isSuccess() ? 'Yes' : 'No' ); 
			if( !$result->isSuccess() )
			{
				$Logger->log( '[dbIO] Reason: ' . print_r( $result->getReason(),1 ) );
			}
		}
	}
	$Logger->log( '[dbIO] Result: ' . print_r( $result, 1 ) );
	return true;
}
return false;

?>
