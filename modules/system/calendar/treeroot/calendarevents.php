<?php
/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

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

?>
