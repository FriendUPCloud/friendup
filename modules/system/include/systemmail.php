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

if( isset( $args->args->to ) )
{
	$template = "{subject}\n{body}";

	if( isset( $Config->MailTemplate ) && file_exists( $Config->MailTemplate ) )
	{
		$template = file_get_contents( $Config->MailTemplate );
	}

	$template = str_replace( '{subject}', $args->args->subject, $template );
	$template = str_replace( '{body}', $args->args->body, $template );

	$result = @mail( $args->args->to, $args->args->subject, $template, 'Content-type: text/html; charset=utf-8' );

	die( $result ? 'ok' : 'fail' );
}
die( 'fail' );

?>
