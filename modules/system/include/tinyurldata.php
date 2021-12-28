<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

$f = new dbIO( 'FTinyUrl' );
$f->Hash = $args->args->hash;
if( $f->Load() && $f->Source )
{
	if( $data = decodeUrl( $f->Source ) )
	{
		die( 'ok<!--separate-->{"source":' . $data . '}' );
	}
	die( 'fail<!--separate-->{"response":"couldn\'t decode source, contact admin ..."}' );
}

die( 'fail<!--separate-->{"response":"invalid or expired hash"}' );

function decodeURL( $source = false )
{
	
	if( $source )
	{
		if( !( ( strstr( $source, 'http://' ) || strstr( $source, 'https://' ) ) && strstr( $source, '?' ) ) )
		{
			$source = urldecode( $source );
		}
		if( ( strstr( $source, 'http://' ) || strstr( $source, 'https://' ) ) && strstr( $source, '?' ) )
		{
			if( $parts = explode( '?', $source ) )
			{
				$data->url = $parts[0];
				
				if( $parts[1] )
				{
					foreach( explode( '&', $parts[1] ) as $part )
					{
						if( strstr( $part, '=' ) )
						{
							if( $var = explode( '=', $part ) )
							{
								if( $var[1] && ( $json = json_decode( urldecode( $var[1] ) ) ) )
								{
									$data->{$var[0]} = $json;
								}
								else
								{
									$data->{$var[0]} = ( $var[1] ? urldecode( $var[1] ) : '' );
								}
							}
						}
					}
				}
				
				return json_encode( $data );
			}
		}
		else
		{
			return urldecode( $source );
		}
	}
	
	return false;
}

?>
