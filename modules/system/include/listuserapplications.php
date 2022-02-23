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
	$userid = ( $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID );
}
else
{
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_APPLICATION_READ_GLOBAL', 'PERM_APPLICATION_READ_IN_WORKGROUP', 
		'PERM_APPLICATION_GLOBAL',      'PERM_APPLICATION_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//
			
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
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


if( $rows = $SqlDatabase->FetchObjects( '
	SELECT
		ua.ID,
		ua.ApplicationID,
		n.Name,
		n.Config,
		ua.Permissions,
		ua.Data,
		f.ID AS "DockStatus"
	FROM 
		FUserApplication ua,
		FApplication n
		LEFT JOIN DockItem f ON ( f.Application = n.Name AND f.UserID = \'' . $userid . '\' )
	WHERE
		n.ID = ua.ApplicationID AND
		ua.UserID=\'' . $userid . '\'
	ORDER BY
		n.Name ASC
' ) )
{
	$basepaths = array(
		'resources/webclient/apps/',
		'repository/'
	);
	if( isset( $args->onlyrepo ) )
    {
            $basepaths = array( 'repository/' );
    }
    $out = [];
    foreach( $rows as $k=>$v )
    {
        // Include image preview
        $fnd = false;
        $exists = false;
        foreach( $basepaths as $path )
        {
            if( !file_exists( $path . $v->Name ) )
            {
            	continue;
            }
            else
            {
            	$exists = true;
		        if( file_exists( $path . $v->Name . '/preview.png' ) )
		        {
		            $fnd = $path . $v->Name . '/preview.png';
		            break;
		        }
		    }
        }
        
        if( $exists )
        {
		    if( $fnd )
		    {
		        $rows[ $k ]->Preview = true;
		    }
		    $rows[ $k ]->Config = json_decode( $rows[ $k ]->Config );
		    $out[] = $rows[ $k ];
		}
    }
    die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail<!--separate-->{"response":"fatal error in listuserapplications"}' );


?>
