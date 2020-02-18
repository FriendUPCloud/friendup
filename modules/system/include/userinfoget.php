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



// Get user by ID
if( isset( $args->args->id ) )
	$uid = $args->args->id;
else $uid = $User->ID;

$workgroups = false;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	if( $level != 'Admin' && $uid != $User->ID )
	{
		die( 'fail<!--separate-->{"response":"user info get failed"}'  );
	}

}
else
{
	require_once( 'php/include/permissions.php' );
	
	//$rolePermission = CheckPermission( 'user', $uid, 'edit' );

	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ], 'user', $uid ) )
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
		
			if( $perm->response == 1 && isset( $perm->data->workgroups ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to these workgroups
			
				if( $perm->data->workgroups && $perm->data->workgroups != '*' )
				{
					// TODO: Look at this, It's commented out because of FriendChat / Presence.
					//$workgroups = $perm->data->workgroups;
				}
			
			}
		}
	}
}



if( 1==1/* || $rolePermission || $level == 'Admin' || $uid == $User->ID*/ )
{
	// Create FKeys table for storing encrypted keys connected to user
	$t = new dbTable( 'FKeys' );
	if( !$t->LoadTable() )
	{
		$SqlDatabase->Query( '
		CREATE TABLE IF NOT EXISTS `FKeys` (
		 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
		 `UserID` bigint(20) NOT NULL,
		 `ApplicationID` bigint(20) NOT NULL,
		 `UniqueID` varchar(255) NOT NULL,
		 `RowID` bigint(20) NOT NULL,
		 `RowType` varchar(255) NOT NULL,
		 `Name` varchar(255) NOT NULL,
		 `Type` varchar(255) NOT NULL,
		 `Blob` longblob,
		 `Data` text,
		 `PublicKey` text,
		 `Signature` text,
		 `DateModified` datetime NOT NULL,
		 `DateCreated` datetime NOT NULL,
		 `IsDeleted` tinyint(4) NOT NULL,
		 PRIMARY KEY (`ID`)
		)
		' );
	}
	else
	{
		$name = false;
		$signature = false;
		$applicationid = false;
		if ( isset ( $t->_fieldnames ) )
		{
			foreach ( $t->_fieldnames as $f )
			{
				if ( $f == 'Name' )
				{
					$name = true;
				}
				if ( $f == 'Signature' )
				{
					$signature = true;
				}
				if ( $f == 'ApplicationID' )
				{
					$applicationid = true;
				}
			}
			if ( !$name )
			{
				$t->AddField ( 'Name', 'varchar', array ( 'after'=>'RowType' ) );
			}
			if ( !$signature )
			{
				$t->AddField ( 'Signature', 'text', array ( 'after'=>'PublicKey' ) );
			}
			if ( !$applicationid )
			{
				$t->AddField ( 'ApplicationID', 'bigint', array ( 'after'=>'UserID' ) );
			}
		}
	}

	if( $userinfo = $SqlDatabase->FetchObject( '
		SELECT
			u.*,
			g.Name AS `Level`,
			wg.Name AS `Workgroup`
		FROM
			`FUser` u,
			`FUserGroup` g,
			`FUserToGroup` ug
				LEFT JOIN `FUserGroup` wg ON
				(
						ug.UserID = \'' . $uid . '\'
					AND wg.ID = ug.UserGroupID
					AND wg.Type = "Workgroup"
				)
		WHERE
				u.ID = ug.UserID
			AND g.ID = ug.UserGroupID
			AND u.ID = \'' . $uid . '\'
			AND g.Type = \'Level\'
	' ) )
	{
		$gds = '';
		
		$amode = isset( $args->args->mode ) ? $args->args->mode : false;
		switch( $amode )
		{
			// All data
			case 'all':
				
				$userinfo->Workgroup = '';
				
				if( $wgs = $SqlDatabase->FetchObjects( '
					SELECT 
						g.ID, 
						g.ParentID, 
						g.Name, 
						ug.UserID 
					FROM 
						`FUserGroup` g 
						RIGHT JOIN `FUserToGroup` ug ON 
						(
								ug.UserID = \'' . $uid . '\'
							AND g.ID = ug.UserGroupID
						)
					WHERE g.Type = "Workgroup"' . ( $workgroups ? 'AND ( g.ParentID IN (' . $workgroups . ') OR g.ID IN (' . $workgroups . ') ) ' : '' ) . ' 
					ORDER BY g.Name ASC 
				' ) )
				{
					$ugs = array();

					foreach( $wgs as $wg )
					{
						if( $wg->UserID > 0 )
						{
							$gds = ( $gds ? ( $gds . ',' . $wg->ID ) : $wg->ID );
						}
					}
					
					$userinfo->Workgroup = $wgs;
				}
				
				break;
			
			// Strings
			default:
				
				// TODO: Fix this sql code to work with workgroup, code under is temporary
				if( !$userinfo->Workgroup && ( $wgs = $SqlDatabase->FetchObjects( '
					SELECT
						g.ID, 
						g.ParentID, 
						g.Name AS `Workgroup`
					FROM
						`FUserGroup` g,
						`FUserToGroup` ug
					WHERE
							ug.UserID = \'' . $uid . '\'
						AND g.ID = ug.UserGroupID
						AND g.Type = "Workgroup"
				' ) ) )
				{
					$ugs = array();

					foreach( $wgs as $wg )
					{
						$gds = ( $gds ? ( $gds . ',' . $wg->ID ) : $wg->ID );
						$ugs[] = $wg->Workgroup;
					}
			
					$userinfo->Workgroup = $wgs;
					
					if( $ugs )
					{
						$userinfo->Workgroup = implode( ', ', $ugs );
					}
				}
				
				break;
		}
		
		// If User Status is Disabled the user cannot be in any workgroups ...
		if( $userinfo->Status == 1 )
		{
			$userinfo->Workgroup = '';
		}
		
		$gds = false;

		if( $sts = $SqlDatabase->FetchObjects( '
			SELECT g.ID, g.Name, ug.UserID' . ( $gds ? ', wg.UserID AS SetupGroup' : '' ) . '
			FROM
				`FUserGroup` g
					' . ( $gds ? '
					LEFT JOIN `FUserGroup` wg ON
					(
							wg.Name = g.ID
						AND wg.Type = \'SetupGroup\'
						AND wg.UserID IN (' . $gds . ')
					)
					' : '' ) . '
					LEFT JOIN `FUserToGroup` ug ON
					(
							g.ID = ug.UserGroupID
						AND g.Type = \'Setup\'
						AND ug.UserID = \'' . $uid . '\'
					)
			WHERE g.Type = \'Setup\'
			ORDER BY g.Name ASC
		' ) )
		{
			$userinfo->Setup = $sts;
		}

		if( $uid > 0 && ( $keys = $SqlDatabase->FetchObjects( '
			SELECT k.*, a.Name AS Application, u.AuthID AS ApplicationAuthID 
			FROM 
				`FKeys` k 
					LEFT JOIN `FApplication` a ON 
					( 
						a.ID = k.ApplicationID 
					) 
					LEFT JOIN `FUserApplication` u ON 
					( 
							u.ApplicationID = k.ApplicationID 
						AND u.UserID = \'' . $uid . '\' 
					)
			WHERE 
					k.UserID = \'' . $uid . '\' 
				AND k.IsDeleted = "0" 
			ORDER 
				BY k.ID ASC 
		' ) ) )
		{
			$userinfo->Keys = $keys;
		}

		die( 'ok<!--separate-->' . json_encode( $userinfo ) );
	}
}

die( 'fail<!--separate-->{"response":"user info get failed"}'  );

?>
