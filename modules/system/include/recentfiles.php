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

// Get files from workgroup drives
if( isset( $args->args->workgroup ) )
{
    if( $rows = $SqlDatabase->fetchObjects( '
        SELECT g.* FROM 
            FSFileLog g, FUserGroup ug, Filesystem f
        WHERE
            g.FilesystemID = f.ID AND f.GroupID = ug.ID AND 
            ug.ID = \'' . intval( $args->args->workgroup, 10 ) . '\'
            g.FileID IN ( 
                SELECT DISTINCT(FileID) FROM `FSFileLog`
                WHERE
                    UserID = \'' . $User->ID . '\'
                AND `Accessed` < ( NOW() + INTERVAL 30 DAY )
            ) AND g.UserID = \'' . $User->ID . '\' ORDER BY g.Accessed DESC
    ' ) )
    {
        $out = [];
        die( 'ok<!--separate-->' . json_encode( $out ) );
    }
}
// Get files from personal drives
else
{
    if( $rows = $SqlDatabase->fetchObjects( '
        SELECT g.* FROM 
            FSFileLog g, Filesystem f
        WHERE 
            g.FilesystemID = f.ID AND f.GroupID <= 0 AND
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
        foreach( $rows as $row )
        {
            if( !isset( $test[ $row->FileID ] ) )
            {
                $test[ $row->FileID ] = true;
                $out[] = $row;
            }
        }
        die( 'ok<!--separate-->' . json_encode( $out ) );
    }
}

die( 'fail<!--separate-->{"message":"Could not find recent files.","response":-1}' );

?>
