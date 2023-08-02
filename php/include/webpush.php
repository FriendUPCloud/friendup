<?php

require __DIR__ . '/../vendor/autoload.php';
use Minishlink\WebPush\WebPush;

if( isset( $setting ) )
{		
	$puKey = $prKey = '';
	if( !file_exists( 'cfg/crt/web_private_key.txt' ) )
	{
		die( 'fail<!--separate-->{"message":"Keys not installed.","response":-1}' );
	}
	else
	{
		$prKey = file_get_contents( 'cfg/crt/web_private_key.txt' );
	}
	if( !file_exists( 'cfg/crt/web_public_key.txt' ) )
	{
		die( 'fail<!--separate-->{"message":"Keys not installed.","response":-1}' );
	}
	else
	{
		$puKey = file_get_contents( 'cfg/crt/web_public_key.txt' );
	}
	
	$auth = [
		'VAPID' => [
			'subject' => 'https://friendos.com/',
			'publicKey' => $puKey,
			'privateKey' => $prKey
		]
	];
	
	$webPush = new WebPush( $auth );
	$webPush->setReuseVAPIDHeaders( true );
	$subscription = Subscription::create( [
	        'endpoint' => $setting->Data
    ] );
	
	$Logger->log( '[dbIO] Sending the notification.' );
	$result = $webPush->sendOneNotification( $subscription, json_encode( $message ) );
	$Logger->log( '[dbIO] Result: ' . print_r( $result, 1 ) );
	return true;
}
return false;

?>
