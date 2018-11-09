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

if( $row = $SqlDatabase->FetchObject( $q = ( '
	SELECT * FROM 
		FMail 
	WHERE UserID=\'' . $User->ID . '\' AND `Address`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->account ) . '\'
' ) ) )
{
	$fld = end( explode( '}', $args->args->folder ) );
	if( $imap = imap_open( '{' . $row->Server . ':' . $row->Port . '/imap/ssl}' . $fld, $row->Username, $row->Password ) )
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
		
		// Put in store
		$f = new dbIO( 'FMailHeader' );
		$f->UserID = $User->ID;
		$f->ExternalMessageID = $args->args->id;
		$f->Folder = $args->args->folder;
		$f->Address = $args->args->account;
		if( !$f->Load() )
		{
			$f->To = $info->toaddress;
			$f->From = $info->fromaddress;
			$f->Subject = iconv_mime_decode( utf8_encode( $info->subject ) );
			$f->Date = date( 'Y-m-d H:i:s', strtotime( $info->date ) );
			$f->ReplyTo = $info->reply_toaddress;
			$f->Save();
		}
		
		imap_close( $imap );
		
		die( 'ok<!--separate-->' . json_encode( $output ) );
	}
	die( 'fail<!--separate-->Mailbox could not be opened.' );
}

die( 'fail<!--separate-->' . $q );

?>
