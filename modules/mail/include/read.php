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

$sumReplace = '<!-- FRIEND MAIL REPLACE -->';

if( $account = $SqlDatabase->FetchObject( '
	SELECT * FROM FMail WHERE UserID=\'' . $User->ID . '\' AND `Address`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->account ) . '\'
' ) )
{
	if( $row = $SqlDatabase->FetchObject( $q = ( '
		SELECT * FROM FMailHeader WHERE UserID=\'' . $User->ID . '\' AND ExternalMessageID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->id ) . '\' AND `Folder`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->folder ) . '\' AND `Address`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->account ) . '\'
	' ) ) )
	{
		if( $imap = imap_open( '{' . $account->Server . ':' . $account->Port . '/imap/ssl}INBOX', $account->Username, $account->Password ) )
		{
			$info = imap_headerinfo( $imap, $args->args->id );
		
			$output = new stdClass();
			$output->subject = $info->subject;
			$output->to = $info->toaddress;
			$output->date = $info->date;
			$output->from = $info->fromaddress;
			$output->replyto = $info->reply_toaddress;
			$output->messageId = $args->args->id;
			$output->account = $args->args->account;
			$output->body = '';
		
			// Fetch email structure
			$structure = imap_fetchstructure( $imap, $args->args->id );
		
			$body = imap_body( $imap, $args->args->id, FT_PEEK );
			if( $bod = explode( "\r\n", $body ) )
			{
				$out = $htmlout = $plain = '';
				$encoding = 'utf-8';
				
				// Check if we have html email
				$html = $begin = false;
				$limiter = false;
				$i = 0;
				
				foreach( $bod as $b )
				{
					// check limiter
					if( $i++ == 0 && !$limiter )
					{
						$limiter = trim( $b );
					}
					
					// Check if we've got HTML
					if( preg_match( '/content\-type\:[\s]+text\/htm/i', $b, $m ) )
					{
						$html = true;
						if( preg_match( '/charset\=(.*)/i', $b, $encoding ) )
						{
							$encoding = $encoding[1];	
						}
					}
					// Check if we're ready to begin
					if( $html == true && !$begin )
					{
						if( strlen( $b ) == 0 )
						{
							$begin = true;
						}
					}
					// Scoop up HTML!
					else if( $html == true && $begin )
					{
						if( $limiter && preg_match( '/' . $limiter . '/', $b ) )
						{
							break;
						}
						$b = str_replace( '=3D', $sumReplace, $b );
						if( substr( $b, -1, 1 ) == '=' )
							$b = substr( $b, 0, strlen( $b ) - 1 );
						$b = str_replace( $sumReplace, '=', $b );
						$htmlout .= $b;
					}
				}
				
				if( $htmlout )
				{
					$output->body = mb_convert_encoding( $htmlout, 'utf-8', $encoding );
				}
			}
			
			// Remove some tags
			$output->body = preg_replace( '/\<[\/]{0,1}html[^>]*?\>/i', '', $output->body );
			$output->body = preg_replace( '/\<[\/]{0,1}body[^>]*?\>/i', '', $output->body );
			$output->body = preg_replace( '/\<[\/]{0,1}meta[^>]*?\>/i', '', $output->body );
			
			// TODO: Don't know what to do with parts - find out
			//if( !isset( $structure->parts ) ) 
			//{
			//	$output->body = imap_body( $imap, $args->args->id, FT_PEEK );
			//} 
			// Else no message?
			/*else 
			{
				$output->body = imap_body( $imap, $args->args->id, FT_PEEK );
				//$output->body = print_r( $structure->parts, 1 );
			}*/
			
			imap_close( $imap );
			
			die( 'ok<!--separate-->' . json_encode( $output ) );
		}
		die( 'fail<!--separate-->Can not open imap account.' );
	}
	die( 'fail<!--separate-->No mail header.<!--separate-->' . $q );
}

die( 'fail' );


?>
