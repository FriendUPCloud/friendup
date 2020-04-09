<?php

$server = $source->Server;

function getByPost( $url, $post )
{
	$ch = curl_init();
	curl_setopt( $ch, CURLOPT_URL, $url );
	curl_setopt( $ch, CURLOPT_USERAGENT, 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322)' );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT, 5 );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, $post ); 
	curl_setopt( $ch, CURLOPT_TIMEOUT, 5 );
	$data = curl_exec( $ch );
	$httpcode = curl_getinfo( $ch, CURLINFO_HTTP_CODE );
	curl_close( $ch );
	return ( $httpcode >= 200 && $httpcode < 300) ? $data : false;
}

$firstDate = $date;

$p = getByPost( 
	$server . '/api-xml/v1/components/events/', 
	array( 
		'SessionID' => $source->ApiSession,
		'Date' => $date . '-01 00:00:00',
		'Mode' => 'month'
	)
);

// Add the events
if( $xml = simplexml_load_string( $p ) )
{
	if( isset( $xml->items ) && isset( $xml->items->object ) )
	{
		foreach( $xml->items->object->weeks as $weeks )
		{
			foreach( $weeks->array as $week )
			{
				foreach( $week->days->array as $day )
				{
					//$Logger->log( 'Daya: ' . print_r( $day, 1 ) );
					if( isset( $day->events ) && isset( $day->events->array ) )
					{
						foreach( $day->events->array as $evt )
						{
							$ob = new stdClass();
							$ob->ID = $evt->EventID . '_treeroot';
							$ob->Title = $evt->EventName .'';
							$ob->Description = '<strong>Location:</strong> '. $evt->EventPlace . '<br>' . $evt->EventDetails;
							$ob->TimeTo = date( 'H:i:s', strtotime( $evt->EventDateEnd ) );
							$ob->TimeFrom = date( 'H:i:s', strtotime( $evt->EventDateStart ) );
							$ob->Date = date( 'Y-m-d', strtotime( $evt->EventDateEnd ) );
							$ob->Type = 'treeroot';
							$os[] = $ob;
						}
					}
				}
			}
		}
	}
}

?>
