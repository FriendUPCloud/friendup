<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/**

	FrienDVersion class.... keeps track of Friends database an neccessary changes...
	
	Introduced with version 0.9 Jan 2016

  */

global $args, $SqlDatabase, $User, $Config;


include_once('php/constants.php');

class FriendVersion
{

	var $_versions;
	
	/*
		Construct...
	*/	
	function FriendVersion()
	{
		global $SqlDatabase, $Logger;
		
		global $FRIENDVERSIONS;
		$this->_versions = array_merge( $FRIENDVERSIONS );
		
		$Logger->log('FriendVersion instantiated.');
		
		/* check the we have the info table available */
		if( !($SqlDatabase->FetchObject('SELECT ID,Version FROM FriendInfo')) )
		{
			$SqlDatabase->Query( '
				CREATE TABLE `FriendInfo`
				( 
					`ID` int(11) NOT NULL auto_increment, 
					`Version` varchar(255) NOT NULL, 
					`Information` text NOT NULL, 
					`DateUpdated` datetime,
					PRIMARY KEY(ID)
				)
			' );
		}
		
		//check that all users have hashed passwords....
		$rows = $SqlDatabase->FetchObjects( "SELECT * FROM FUser WHERE Password NOT LIKE '{S6}%'");
        if( $rows )
        {
			for($i = 0; $i < count($rows); $i++)
			{
				$h0 = $rows[$i]->Password . '';
				$h1 = hash('sha256', $h0 );
				$h2 = hash('sha256','HASHED'.$h1);
				$SqlDatabase->Query( "UPDATE FUser SET Password = '{S6}" . $h2 ."' WHERE ID = " . $rows[$i]->ID);
			}
        }		
	} 
	
	/** ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### 
		List installed versions in desc order
	 ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### */	
	function listInstalledVersions()
	{
		global $SqlDatabase;
		if( $rows = $SqlDatabase->FetchObjects('SELECT * FROM FriendInfo ORDER BY DateUpdated DESC') )
		{
			return $rows;
		}
		return false;
	}
	
	function getLatestInstalledVersion()
	{
		global $SqlDatabase;
		if( $row = $SqlDatabase->FetchObject('SELECT * FROM FriendInfo ORDER BY DateUpdated DESC') )
		{
			return $row;
		}
		return false;
	}
	
	/** ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### 
		List all versions in desc order
	 ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### */	
	function listAllVersions()
	{
		return $this->_versions;
	}

	/** ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### 
		check if given version actually isdefined, if not set to oldest we have
	 ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### */	
	function sanitizeVersion( $number )
	{
		$ret = '';
		foreach( $this->_versions as $version )
		{
			if( $version['number'] == $number ) return $number;
			
			$ret = $version['number'];
		}
		return $ret;
	}
	
	/** ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### 
		Update to given version
	 ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### */
	function updateToVersion( $number )
	{
		global $SqlDatabase, $Logger;
		
		
		$Logger->log( 'We shall update to  version ' . $number );
		
		$number = $this->sanitizeVersion($number);
		
		
		$tmp = array_reverse( $this->_versions );
		
		$installed = $this->getLatestInstalledVersion();
		
		$abortUpdate = false;
		foreach( $this->_versions as $version )
		{
			if( $version['number'] == $number )
			{
				break;
			}
			if( $version['number'] == $installed->Version )
			{
				$Logger->log('We will  not update to ' . $number . ' as we already have ' . $installed->Version . ' installed');
				$abortUpdate = true;
				break;	
			}
		}
		
		if( $abortUpdate ) return false;
		
		reset($tmp);
		foreach ( $tmp as $version )
		{

			if( !( $SqlDatabase->FetchObject('SELECT * FROM FriendInfo WHERE Version = "'. $version['number'] .'"') ) )
			{
				if( $version['queries'] && is_array($version['queries']) )
				{
					for( $i = 0; $i < count( $version['queries'] ); $i++ )
					{
						$rs = $SqlDatabase->Query( $version['queries'][$i]  );
						if( $rs === false )
						{
							$Logger->log( 'Error during FriendVersion upgrade. Failed query and result: '. $version['queries'][$i] .' ######################## RESULT :' . $rs . ':' . $SqlDatabase->_lastError . '__' );
							//return false;
						}
					}
				}
				if( $version['info'])
				{
					$SqlDatabase->Query('INSERT INTO FriendInfo (Version,Information,DateUpdated) VALUES ("'. $version['number'] .'","'. addslashes( $version['info'] ) .'",NOW())');
				}
				
			} // end of if NOT version exists 
			if( $number == $version['number'] ) return true;		

		} // end of for each version loop
		return false;

	}
	
	/** ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### 
		Update to latest
	 ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### ### */	
	function updateAllVersions()
	{
		return $this->updateToVersion( $this->_versions[0]['number']);
	}

} // end of class


?>
