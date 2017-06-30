<?php
/*©lpgl*************************************************************************
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
