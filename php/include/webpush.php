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
		
		if( !file_exists( 'cfg/cty/web-push.pem' ) )
		{
			if( $f = fopen( 'cfg/cty/web-push.pem', 'w+' ) )
			{
				fwrite( $f, base64_decode( $data->public_key ) . "\n" . base64_decode( $data->private_key ) );
				fclose( $f );
			}
		}
		
		$auth = [
			'VAPID' => [
				'subject' => 'https://friendos.com/',
				'pemFile' => 'cfg/cty/web-push.pem'
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
