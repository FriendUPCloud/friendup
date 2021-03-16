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

/*
    This module call gets announcements which are relevant for the user, be it
    directly or by workgroup.
    
    This module call will be deprecated in the future by Friend Core using a 
    websocket call once an announcement has been designated.
*/

// 1. Remove announcements older than one day?

global $SqlDatabase, $User;

$groupList = '0';

// 2. Get own workgroups
if( $groups = $SqlDatabase->fetchObjects( '
    SELECT ug.* FROM FUserGroup ug, FUserToGroup ugg
    WHERE
        ugg.UserID = \'' . $User->ID . '\' AND
        ugg.GroupID = ug.ID
' ) )
{
    $groupList = [];
    foreach( $groups as $g )
    {
        $groupList[] = $g->ID;
    }
    $groupList = implode( ', ', $groupList );
}


// 3. Get new relevant announcements with no status
if( $rows = $SqlDatabase->fetchObjects( '
    SELECT 
        st.ID AS AnnouncementStatus, fa.* FROM 
        `FAnnouncement` fa RIGHT JOIN `FAnnouncementStatus` st ON ( st.AnnouncementID = fa.ID )
    WHERE
        AnnouncementStatus IS NULL AND
        ( fa.UserID = \'' . $User->ID . '\' OR fa.GroupID IN ( ' . $groupList . ' ) )
    ORDER BY fa.ID DESC
' ) )
{
    die( 'ok<!--separate-->' . json_encode( $rows ) );
}

die( 'fail' );

?>
