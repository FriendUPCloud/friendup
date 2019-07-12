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

// /module/module=system&sessionid=378953:
// 	command  = permissions
// 	type     = read
// 	context  = application
// 	name     = Admin
// 	object   = user
// 	objectid = 37628



if( $data = Permissions( $args->args->type, $args->args->context, $args->args->name, $args->args->data, $args->args->object, $args->args->objectid ) )
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

die( 'fail<!--separate-->{"message":"Permission denied.","response":-1}' );

?>
