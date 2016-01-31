<?php

/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

if( $row = $SqlDatabase->FetchObject( $q = ( '
	SELECT * FROM 
		FMail 
	WHERE UserID=\'' . $User->ID . '\' AND `Address`=\'' . mysql_real_escape_string( $args->args->account ) . '\'
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
