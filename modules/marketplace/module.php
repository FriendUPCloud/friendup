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

require_once( 'php/friend.php' );
require_once( 'php/classes/dbio.php' );

$t = new dbTable( 'FMerchant' );
if( !$t->load() )
{
	$SqlDatabase->query( '
		CREATE TABLE `FMerchant`
		(
			ID bigint(20) NOT NULL auto_increment,
			MerchantID bigint(20) default 0,
			UserID bigint(20) NOT NULL,
			`DateCreated` datetime,
			`DateModified` datetime,
			`Name` varchar(255),
			`Country` varchar(255),
			`Categories` text,
			`Description` text,
			`Rating` int(11) default 0,
			`CommunityData` varchar(255),
			PRIMARY_KEY(ID)
		);
	' );
}

// What is asked
if( isset( $args->command ) )
{
	switch( $args->command )
	{
		// Fetch your own merchant info
		// TODO: Support parent merchant
		case 'merchantinfo':
			$l = new dbIO( 'FMerchant' );
			$l->UserID = $User->ID;
			if( $l->Load() )
			{
				$o = new stdClass();
				$o->Name = $l->Name;
				$o->Country = $l->Country;
				$o->Categories = $l->Categories;
				$o->Description = $l->Description;
				die( 'ok<!--separate-->' . json_encode( $o ) );
			}
			break;
		// Get a merchant by name
		case 'merchantbyname':
			$l = new dbIO( 'FMerchant' );
			$l->Name = $args->args->Name;
			if( $l->Load() )
			{
				$o = new stdClass();
				$o->Name = $l->Name;
				$o->Country = $l->Country;
				$o->Categories = $l->Categories;
				$o->Description = $l->Description;
				die( 'ok<!--separate-->' . json_encode( $o ) );
			}
			break;
		// Connect a new merchant to a user
		case 'registermerchant':
			$required = array( 'Name', 'Country', 'Categories', 'Description' );
			$userTest = new dbIO( 'FMerchant' );
			$userTest->UserID = $User->ID;
			if( $userTest->load() )
			{
				die( 'fail<!--separate-->{"response":-1,"message":"Your user is already registered"}' );
			}
			$t = new dbIO( 'FMerchant' );
			foreach( $required as $req )
			{
				if( !isset( $args->args->$req ) )
				{
					die( 'fail<!--separate-->{"response":-1,"message":"You missed a field","field":"' . $req . '"}' );
				}
				$t->$req = $args->args->$req;
			}
			$t->UserID = $User->ID;
			if( $t->Save() )
			{
				die( 'ok<!--separate-->{"response":1,"message":"Merchant saved"}' );
			}
			die( 'fail<!--separate-->{"response":-1,"message":"Could not save merchant"}' );
			break;
		case 'getapplicationworkgroups':
		$application = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application );
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT w.* FROM 
					FMetaData d, FUserGroup w 
				WHERE 
					w.ID = d.DataID AND 
					d.DataTable = "FUserGroup" AND 
					d.ValueString = "' . $application . '" AND 
					d.ValueNumber = \'' . $User->ID . '\'
				ORDER BY w.Name
			' ) )
			{
				$out = array();
				foreach( $rows as $row )
				{
					$o = new stdClass();
					$o->ID = $row->ID;
					$o->Name = $row->Name;
					$out[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail' );
			break;
		case 'getapplicationusers':
			die( 'ok<!--separate-->[]' );
			break;
		case 'setapplicationworkgroups':
			$application = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application );
			$inserts = 0;
			foreach( $args->args->workgroups as $id )
			{
				$d = new dbIO( 'FMetaData' );
				$d->Key = 'ApplicationUserRelation';
				$d->DataID = $id;
				$d->DataTable = 'FUserGroup';
				$d->ValueNumber = $User->ID;
				$d->ValueString = $application;
				$d->Load();
				$d->Save();
				$inserts++;
			}
			if( $inserts > 0 )
			{
				die( 'ok<!--separate-->{"response":1,"message":"' . $inserts . ' workgroups related to application.","query":"' . $query . '"}' );
			}
			die( 'fail' );
			break;
		case 'removeapplicationworkgroups':
			foreach( $args->args->workgroups as $id )
			{
				$d = new dbIO( 'FMetaData' );
				$d->Key = 'ApplicationUserRelation';
				$d->DataID = $id;
				$d->DataTable = 'FUserGroup';
				$d->ValueNumber = $User->ID;
				$d->ValueString = $application;
				$d->Load();
				$d->Delete();
			}
			die( 'ok<!--separate-->' );
			break;
	}
}

// It fails
die( 'fail<!--separate-->{"response":-1,"message":"Could not find marketplace command"}' );

?>
