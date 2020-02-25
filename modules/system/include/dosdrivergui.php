<?php

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_STORAGE_GLOBAL', 'PERM_STORAGE_WORKGROUP' ], 'user', ( isset( $args->args->userid ) ? $args->args->userid : $User->ID ) ) )
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
		
			if( $perm->response == 1 && isset( $perm->data->users ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( $perm->data->users == '*' )
				{
					$level = 'Admin';
				}
			
			}
		
		}
	}
}



if( !isset( $args->args->type ) ) die( 'fail<!--separate-->{"response":"dos driver gui failed"}'  );
if( isset( $args->args->component ) && isset( $args->args->language ) )
{
	if( $args->args->component == 'locale' )
	{
		$f = 'devices/DOSDrivers/' . $args->args->type . '/Locale/' . $args->args->language . '.lang';
		if( file_exists( $f ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( $f ) );
		}
		die( 'fail<!--separate-->' . $f );
	}
}




if( $level == 'Admin' && file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui_admin.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
else if( file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
die( 'fail<!--separate-->{"response":"dosdrivergui failed"}'  );

?>
