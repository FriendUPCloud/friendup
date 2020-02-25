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

// Settings object
$s = new stdClass();

// The first login test!
// NB: This is run on every user login
include( 'modules/system/include/firstlogin.php' );

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID );
}
else
{
	require_once( 'php/include/permissions.php' );
	
	$userid = $User->ID;	
		
	// Only check permissions if userid is defined ...
	if( isset( $args->args->userid ) )
	{
		if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_WORKGROUP_GLOBAL', 'PERM_WORKGROUP_WORKGROUP' ], 'user', $userid ) )
		{
			if( is_object( $perm ) )
			{
				// Permission denied.
		
				if( $perm->response == -1 )
				{
					//
			
					//die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
				}
		
				// Permission granted. GLOBAL or WORKGROUP specific ...
		
				if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
				{
			
					// If user has GLOBAL or WORKGROUP access to this user
			
					if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
					{
						$userid = intval( $args->args->userid );
					}
			
				}
		
			}
		}
	}
}



// Theme information
$o = new dbIO( 'FSetting' );
$o->UserID = $userid/*$level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID*/;
$o->Type = 'system';
$o->Key = 'theme';
$o->Load();

// Check if theme exists before setting it ...
if( $o->ID > 0 && !file_exists( 'resources/themes/' . strtolower( $o->Data ) . '/theme.css' ) )
{
	$s->Theme = 'friendup';
}
else
{
	$s->Theme = $o->ID > 0 ? $o->Data : 'friendup'; // default theme set to friendup
}

// Get all mimetypes!
$types = [];
if( $rows = $SqlDatabase->FetchObjects( '
	SELECT * FROM FSetting s
	WHERE
		s.UserID = \'' . $o->UserID . '\'
		AND
		s.Type = \'mimetypes\'
	ORDER BY s.Data ASC
' ) )
{
	foreach( $rows as $row )
	{
		$found = false;
		if( count( $types ) )
		{
			foreach( $types as $type )
			{
				if( $type->executable == $row->Data )
				{
					$type->types[] = $row->Key;
					$found = true;
				}
			}
		}
		if( !$found )
		{
			$o = new stdClass();
			$o->executable = $row->Data;
			$o->types = array( $row->Key );
			$types[] = $o;
		}
	}
}
$s->Mimetypes = $types;

die( 'ok<!--separate-->' . json_encode( $s ) );

?>
