<?php

require __DIR__ . '/../vendor/autoload.php';
use Minishlink\WebPush\WebPush;

if( isset( $setting ) )
{
	$vapid = new dbIO( 'FSetting' );
	$vapid->UserID = '0';
	$vapid->Type = 'System';
	$vapid->Key = 'VAPID-Keys';
	if( $vapid->Load() )
	{
		$data = json_decode( $vapid->Data );
		
		/*if( !file_exists( 'cfg/crt/web-push.pem' ) )
		{
			if( $f = fopen( 'cfg/crt/web-push.pem', 'w+' ) )
			{
				fwrite( $f, base64_decode( $data->public_key ) . base64_decode( $data->private_key ) );
				fclose( $f );
			}
		}*/
		
		$auth = [
			'VAPID' => [
				'subject' => 'https://friendos.com/',
				'pem' => base64_decode( $data->public_key ) . base64_decode( $data->private_key )
			]
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
return false;

?>
