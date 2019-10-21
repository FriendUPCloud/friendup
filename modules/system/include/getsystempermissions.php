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

if( !isset( $args->authid ) )
{
	if( $level != 'Admin' ) die( '404' );
}
else
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), 'PERM_ROLE_GLOBAL' ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
		}
	}
}


if( !file_exists( 'cfg/system_permissions.json' ) || !filesize( 'cfg/system_permissions.json' ) )
{
	if( $fp = fopen( 'cfg/system_permissions.json', 'w' ) )
	{
		// TODO: Find out how to get data from all the systems Configs, to create the first file or set a default standard and let the update code populate the file ...
		
		$json = '
{
	"System": [],
	"Modules": [],
	"Apps": [
		{ 
			"app": "Users", 
			"name": "Users", 
			"description": "", 
			"permissions": [
				{ 
					"permission": "USERS_READ", 
					"name": "Read", 
					"description": "" 
				},
				{ 
					"permission": "USERS_WRITE", 
					"name": "Write", 
					"description": "" 
				},
				{ 
					"permission": "USERS_DELETE", 
					"name": "Delete", 
					"description": "" 
				}
			] 
		},
		{ 
			"app": "Liberator", 
			"name": "Liberator", 
			"description": "", 
			"permissions": [
				{ 
					"permission": "USERS_READ", 
					"name": "Read", 
					"description": "" 
				},
				{ 
					"permission": "USERS_WRITE", 
					"name": "Write", 
					"description": "" 
				},
				{ 
					"permission": "USERS_DELETE", 
					"name": "Delete", 
					"description": "" 
				}
			] 
		},
		{ 
			"app": "Server", 
			"name": "Server", 
			"description": "", 
			"permissions": [
				{ 
					"permission": "USERS_READ", 
					"name": "Read", 
					"description": "" 
				},
				{ 
					"permission": "USERS_WRITE", 
					"name": "Write", 
					"description": "" 
				},
				{ 
					"permission": "USERS_DELETE", 
					"name": "Delete", 
					"description": "" 
				}
			] 
		},
		{ 
			"app": "Mimetypes", 
			"name": "Mimetypes", 
			"description": "", 
			"permissions" : [
				{ 
					"permission": "USERS_READ", 
					"name": "Read", 
					"description": "" 
				},
				{ 
					"permission": "USERS_WRITE", 
					"name": "Write", 
					"description": "" 
				},
				{ 
					"permission": "USERS_DELETE", 
					"name": "Delete", 
					"description": "" 
				}
			] 
		}
	]
}';
		
		fwrite( $fp, trim( /*$json*/ '{}' ) );
		fclose( $fp );
	}
	else
	{
		die( 'fail<!--separate-->couldn\'t create cfg/system_permissions.json ...' );
	}
}

$f = file_get_contents( 'cfg/system_permissions.json' );
die( 'ok<!--separate-->' . $f );

?>
