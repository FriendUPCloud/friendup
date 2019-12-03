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

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( $data = Permissions( $args->args->type, $args->args->context, ( isset( $args->authid ) ? 'AUTHID'.$args->authid : $args->args->name ), $args->args->data, $args->args->object, $args->args->objectid, $args->args->listdetails ) )
{
	if( is_object( $data ) )
	{
		if( $data->response == 1 )
		{
			die( 'ok<!--separate-->' . json_encode( $data ) );
		}
		
		if( $data->response == -1 )
		{
			die( 'fail<!--separate-->' . json_encode( $data ) );
		}
	}
	
	die( 'ok<!--separate-->{"message":"Permission granted.","response":1}' );
}

die( 'ok<!--separate-->{"message":"Permission granted.","reason":"Permission for this app isn\'t set ...","response":1}' );

?>
