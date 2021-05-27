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

require_once( 'php/include/permissions.php' );

// If parameter sent from C isn't properly json decoded or urldecoded do it here ...

if( is_string( $args->args ) )
{
	if( $urldecode = urldecode( $args->args ) )
	{
		$args->args = $urldecode;
	}
	
	if( is_string( $args->args ) )
	{
		if( $jsondecode = json_decode( $args->args ) )
		{
			$args->args = $jsondecode;
		}
	}
	
}

if( isset( $args->args->authid ) && ( !isset( $args->authid ) || !$args->authid || $args->authid == '(null)' ) )
{
	$args->authid = $args->args->authid;
}

if( file_exists( 'modules/system/permissions/' . $args->args->type . '.php' ) )
{
	include( 'modules/system/permissions/' . $args->args->type . '.php' );
}

die( 'fail<!--separate-->{"message":"Permission denied.","reason":"No such type of permission","response":-1,"debug":'.json_encode($args).'}' );

?>
