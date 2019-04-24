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
if( isset($args->args->id) )
	$uid = $args->args->id;
else $uid = $User->ID;

if( $level == 'Admin' || $uid == $User->ID )
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
		
		switch( $args->args->mode )
		{
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
							LEFT JOIN `FUserToGroup` ug ON 
							(
									ug.UserID = \'' . $uid . '\'
								AND g.ID = ug.UserGroupID
							)
					WHERE g.Type = "Workgroup" 
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
