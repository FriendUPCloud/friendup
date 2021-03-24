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

// TODO: Fix this in C instead of here ...

if( is_string( $args->args ) )
{
	if( strstr( $args->args, '%' ) || strstr( $args->args, '&' ) ) 
	{
		if( strstr( $args->args, '%2B' ) )
		{
			$value = explode( '%2B', $args->args );
			foreach( $value as $k=>$v )
			{
				$value[ $k ] = rawurldecode( $v );
			}
			if( $urldecode = rawurldecode( implode( '%2B', $value ) ) )
			{
				$args->args = $urldecode;
			}
		}
		else
		{
			if( $urldecode = rawurldecode( $value ) )
			{
				$args->args = $urldecode;
			}
		}
	}
	
	if( $args->args && ( $args->args[0] == '{' || $args->args[0] == '[' ) )
	{
		if( strstr( $args->args, '\"' ) )
		{
			if( $args->args = stripslashes( $args->args ) )
			{
				if( $jsondecode = json_decode( $args->args ) )
				{
					$args->args = $jsondecode;
				}
			}
		}
		else
		{
			if( $jsondecode = json_decode( $args->args ) )
			{
				$args->args = $jsondecode;
			}
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
