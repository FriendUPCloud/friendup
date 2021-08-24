<?php

$hash = false; $command = false;

if( isset( $argv[1] ) && $argv[1] && strstr( $argv[1], 'public/' ) )
{
	if( $url = explode( '/', $argv[1] ) )
	{
		if( isset( $url[1] ) && $url[1] && $url[1] != '/' )
		{
			$hash = $url[1];		
		}
		if( isset( $url[2] ) && $url[2] && $url[2] != '/' )
		{
			$command = $url[2];		
		}
	}
}

// Fetch the user
if( count( $argv ) < 2 || !$hash || !$command )
{
	die( '404' );
}
else
{
	
	include_once( 'php/classes/dbio.php' );
	
	$Config = parse_ini_file( 'cfg/cfg.ini', true );
	
	$SqlDatabase = new SqlDatabase();
	$SqlDatabase->open( 
		$Config[ 'DatabaseUser' ][ 'host' ], 
		$Config[ 'DatabaseUser' ][ 'login' ], 
		$Config[ 'DatabaseUser' ][ 'password' ] 
	) or die( 'FAILED TO CONNECT TO DATABASE' );
	
	$SqlDatabase->SelectDatabase( $Config[ 'DatabaseUser' ][ 'dbname' ] );
	register_shutdown_function( function(){
		global $SqlDatabase;
		$SqlDatabase->Close();
	} );
	
	if( $f = $SqlDatabase->FetchObject( '
		SELECT * FROM FTinyUrl 
		WHERE Hash = "' . $hash . '" AND Source LIKE "%/system.library/user/addrelationship%" 
		ORDER BY ID ASC LIMIT 1
	' ) )
	{
		if( $f->Source && $f->Hash )
		{
			if( $json = json_decode( decodeUrl( $f->Source ) ) )
			{
				$data = new stdClass();
				
				// TODO: Also find groups ...
				
				if( isset( $json->data->workgroups ) )
				{
					
					// TODO: Find out members num and online / offline count.
					
				}
				
				if( isset( $json->data->userid ) )
				{
					if( $usr = $SqlDatabase->FetchObject( '
						SELECT f.ID, f.Name, f.FullName, f.Email, f.UniqueID, f.Status, s.Data AS Avatar 
						FROM FUser f 
							LEFT JOIN FSetting s ON 
							(
								 	 s.Type = "system" 
								 AND s.Key = "avatar" 
								 AND s.UserID = ' . $json->data->userid . '
							)
						WHERE f.ID = ' . $json->data->userid . ' 
					' ) )
					{
						
						
						
					}
				}
				
				switch( $command )
				{
					
					case 'user':
						
						// TODO: expand for public use / meta data / social media, search engine robots etc.
						
						break;
					
					case 'avatar':
						
						//
						
						// TODO: Cache control on blobs ...
						
						if( isset( $usr->Avatar ) && $usr->Avatar )
						{
							$parts = explode( ';base64,', $usr->Avatar );
							
							$img = new stdClass();
							$img->mime = str_replace( 'data:', '', $parts[0] );
							$img->base64 = $parts[1];
							
							unset( $parts );
							
							ob_clean();
							
							print( "---http-headers-begin---\n" );
							print( "Content-Type: ".$img->mime."\n" );
							print( "---http-headers-end---\n" );
							
							die( base64_decode( $img->base64 ) );
						}
						
						break;
					
					case 'group':
						
						// TODO: expand for public use / meta data / social media, search engine robots etc.
						
						break;
					
					case 'online':
						
						// TODO: expand for public use / meta data / social media, search engine robots etc.
						
						break;
					
					case 'members':
						
						// TODO: expand for public use / meta data / social media, search engine robots etc.
						
						break;
					
				}
				
			}
		}
	}
	
	
	
}

die( '404' );

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
				if( $parts[0] )
				{
					$data = new stdClass();
					
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
		}
		else
		{
			return urldecode( $source );
		}
	}
	
	return false;
}

?>
