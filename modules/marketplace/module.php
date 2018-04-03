<?php

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
	}
}

// It fails
die( 'fail<!--separate-->{"response":-1,"message":"Could not find marketplace command"}' );

?>
