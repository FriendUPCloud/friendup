<?php
/*******************************************************************************
*                                                                              *
* © 2020 Friend Software Labs AS                                               *
* ------------------------------                                               *
*                                                                              *
* Show images related to registration.                                         *
*                                                                              *
*******************************************************************************/

if( isset( $argv[1] ) && $argv[1] && strstr( $argv[1], 'images/' ) )
{
	if( $url = explode( 'images/', $argv[1] ) )
	{
		if( isset( $url[1] ) && $url[1] )
		{
			$filePath = '';
			
			if( file_exists( "php/templates/mail/images/$url[1]" ) )
			{
				$filePath = "php/templates/mail/images/$url[1]";
			}
			else if( file_exists( "php/scripts/registration/images/$url[1]" ) )
			{
				$filePath = "php/scripts/registration/images/$url[1]";
			}
			
			if( $filePath )
			{
				error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_WARNING );
				ini_set( 'display_errors', '1' );
								
				ob_clean();
				
				print( "---http-headers-begin---\n" );
				
				switch ( array_pop( explode( '.', strtolower( $img ) ) ) )
				{
					case 'gif':
						print( "Content-Type: image/gif\n" );
						break;
					case 'png':
						print( "Content-Type: image/png\n" );
						break;
					default:
						print( "Content-Type: image/jpeg\n" );
						break;
				}
				
				print( "Expires: " . gmdate( 'D, d M Y H:i:s \G\M\T', time() + 86400 ) . "\n" );
				
				// Generate some useful time vars based on file date
				$last_modified_time = filemtime( $filePath ); 
				$etag = md5_file( $filePath );
				
				// Always send headers
				print( "Last-Modified: " . gmdate( 'D, d M Y H:i:s', $last_modified_time ) . " GMT\n" );
				print( "Etag: " . $etag . "\n" );
				
				// Exit if not modified
				if ( ( @strtotime( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) == $last_modified_time ) || ( @trim( $_SERVER['HTTP_IF_NONE_MATCH'] ) == $etag ) )
				{
					print( "HTTP/1.1 304 Not Modified\n" );
					print( "---http-headers-end---\n" );
					
					die();
				}
				
				print( "Cache-Control: max-age=86400\n" );
				print( "Pragma: public\n" );
				print( "---http-headers-end---\n" );
				
				die( readfile( $filePath ) );
			}				
		}
	}
}

die();

?>
