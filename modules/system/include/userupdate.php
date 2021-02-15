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

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID' . $args->authid ), [ 
		'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
		'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
				
				//die( 'fail<!--separate-->' . json_encode( $perm ) );
			}
			
			// Permission granted.
			
			if( $perm->response == 1 )
			{
				
				$level = 'Admin';
				
			}
		}
	}
}

if( $level == 'Admin' )
{
	
	if( $args->args->id && $args->args->fields )
	{
		
		$us = new dbIO( 'FUser' );
		if( $us->Load( $args->args->id ) )
		{
			
			foreach( $args->args->fields as $key => $value )
			{
				
				if( trim( $key ) && $us->ID > 0 )
				{
					$fm = new dbIO( 'FMetaData' );
					$fm->DataTable = 'FUser';
					$fm->DataID = $us->ID;
					$fm->Key = trim( $key );
					$fm->Load();
					$fm->ValueString = trim( $value );
					$fm->Save();
				}
				
			}
			
			die( 'ok<!--separate-->{"response":"user updated: ' . $us->ID . '"}' );
			
		}
		
	}
	
}

die( 'fail<!--separate-->{"response":"user update failed"}' );

?>
