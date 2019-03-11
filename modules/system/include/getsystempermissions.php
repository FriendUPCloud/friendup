<?php

if( $level != 'Admin' ) die( '404' );

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
