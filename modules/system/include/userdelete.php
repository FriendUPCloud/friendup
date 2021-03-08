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
	
	if( $perm = Permissions( 'delete', 'application', ( 'AUTHID' . $args->authid ), [ 
		'PERM_USER_DELETE_GLOBAL', 'PERM_USER_DELETE_IN_WORKGROUP', 
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
	
	if( $args->args->id )
	{
		
		if( $fields = $SqlDatabase->FetchObjects( '
			SELECT 
				fm.* 
			FROM 
				FMetaData fm 
			WHERE 
					fm.Key       IN ("' . implode( '","', [ 'Mobile' ] ) . '") 
				AND fm.DataID    = \'' . $args->args->id . '\' 
				AND fm.DataTable = "FUser" 
			ORDER BY 
				fm.ID ASC 
		' ) )
		{
			
			foreach( $fields as $field )
			{
				
				if( $field->ID > 0 )
				{
					$fm = new dbIO( 'FMetaData' );
					if( $fm->Load( $field->ID ) )
					{
						$fm->Delete();
					}
				}
				
			}
			
			die( 'ok<!--separate-->{"response":"user deleted: ' . $args->args->id . '"}' );
			
		}
		
	}
	
}

die( 'fail<!--separate-->{"response":"user delete failed"}' );

?>
