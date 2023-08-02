<?php

$Logger->log( '[dbIO] ' . __DIR__ );

/*require __DIR__ . '../../vendor/autoload.php';

$Logger->log( '[dbIO] Autoloaded!' );

use Minishlink\WebPush\WebPush;

if( isset( $setting ) )
{
	$Logger->log( '[dbIO] Found user session for push!' );
	
	$vapid = new dbIO( 'FSetting' );
	$vapid->UserID = '0';
	$vapid->Type = 'System';
	$vapid->Key = 'VAPID-Keys';
	if( $vapid->Load() )
	{
		$data = json_decode( $vapid->Data );
		$auth = [
			'VAPID' => [
				'subject' => 'https://friendos.com/',
				'publicKey' => base64_decode( $data->public_string ), 
				'privateKey' => $data->private_string
			],
		];
		
		$webPush = new WebPush( $auth );
		
		$subscription = Subscription::create( [
		        'endpoint' => $setting->Data
	    ] );
		
		$Logger->log( '[dbIO] Sending the notification.' );
		$result = $webPush->sendOneNotification( $subscription, json_encode( $message ) );
		$Logger->log( '[dbIO] Result: ' . print_r( $result, 1 ) );
		return true;
	}
}
return false;*/

?>
