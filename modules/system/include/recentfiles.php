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

global $SqlDatabase, $User;

$maxToList = 10;

// Get files from workgroup drives
if( isset( $args->args->workgroup ) )
{
    $extra = $extrasql = '';
	if( isset( $args->args->mode ) && $args->args->mode == 'sql-only' )
	{
		$extra = ', FSFile fl';
		$extrasql = 'AND fl.ID = g.FileID';
	}

	if( $distinct = $SqlDatabase->fetchObjects( '
		SELECT DISTINCT(g.FileID) DCT FROM `FSFileLog` g, Filesystem f, FUserGroup fug, FUserToGroup ffug' . $extra . '
        WHERE
            g.FilesystemID = f.ID AND
            f.GroupID = fug.ID AND
            g.UserID = ffug.UserID AND
            ffug.UserGroupID = fug.ID AND
            fug.ID = \'' . intval( $args->args->workgroup, 10 ) . '\' AND
            `Accessed` < ( NOW() + INTERVAL 30 DAY )
            ' . $extrasql . '
        LIMIT 10
    ' ) )
    {
    	$list = [];
    	foreach( $distinct as $dis )
    	{
    		$list[] = $dis->DCT;
    	}
    	
    	if( $rows = $SqlDatabase->fetchObjects( $q = ( '
		    SELECT g.*, u.FullName AS UserFullname FROM 
		        FSFileLog g, 
		        FUserGroup ug, 
		        Filesystem f, 
		        FUser u, 
		        FUserToGroup fileman, 
		        FUserToGroup ddug' . $extra . '
		    WHERE
		        f.ID = g.FilesystemID AND 
		        f.GroupID = ug.ID AND 
		        ug.ID = \'' . intval( $args->args->workgroup, 10 ) . '\' AND
		        u.ID = fileman.UserID AND
		        ug.ID = fileman.UserGroupID AND
		        g.FileID IN ( ' . implode( ', ', $list ) . ' )
		        AND 
		        	ddug.UserID = \'' . $User->ID . '\' AND 
		        	ddug.UserGroupID = ug.ID 
		       	' . $extrasql . '
			ORDER BY g.Accessed DESC
		' ) ) )
		{
		    $test = [];
		    $out = [];
		    $count = 0;
		    foreach( $rows as $row )
		    {
		        if( !isset( $test[ $row->FileID ] ) )
		        {
					// Skip hidden files
					$path = explode( ':', $row->Path );
					$path = array_pop( $path );
					if( strstr( $path, '/' ) )
						$path = array_pop( explode( '/', $row->Path ) );
					if( substr( $path, 0, 1 ) == '.' ) continue;
					if( $count++ >= $maxToList ) continue;
					// Here we go
		            $test[ $row->FileID ] = true;
		            $out[] = $row;
		        }
		    }
		    die( 'ok<!--separate-->' . json_encode( $out ) );
		}
    }
}
// Get files from personal drives
else
{
    if( $rows = $SqlDatabase->fetchObjects( '
        SELECT g.* FROM 
            FSFileLog g, Filesystem f
        WHERE 
            g.FilesystemID = f.ID AND
            g.FileID IN ( 
                SELECT DISTINCT(FileID) FROM `FSFileLog`
                WHERE
                    UserID = \'' . $User->ID . '\'
                AND `Accessed` < ( NOW() + INTERVAL 30 DAY )
        ) AND g.UserID = \'' . $User->ID . '\' ORDER BY g.Accessed DESC
    ' ) )
    {
        $test = [];
        $out = [];
        $count = 0;
        foreach( $rows as $row )
        {
            if( !isset( $test[ $row->FileID ] ) )
            {
                // Skip hidden files
                $path = explode( ':', $row->Path );
		    	$path = array_pop( $path );
		    	if( strstr( $path, '/' ) )
		    	{
		    	    $path = explode( '/', $row->Path );
		    		$path = array_pop( $path );
		        }
		    	if( substr( $path, 0, 1 ) == '.' ) continue;
		    	if( $count++ >= $maxToList ) continue;
		    	// Here we go
                $test[ $row->FileID ] = true;
                $out[] = $row;
            }
        }
        die( 'ok<!--separate-->' . json_encode( $out ) );
    }
}

die( 'fail<!--separate-->{"message":"Could not find recent files.","response":-1}' );

?>
