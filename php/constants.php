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
	File to hold global Friend Constants
	
	Like for examples our version history
	
	Always add to the END OF TABLES !!!! 
*/

/* Newest version on top... */
$FRIENDVERSIONS = Array (

		[
			'number' => '0.9.3',	
			'queries' => [
				'ALTER TABLE FUserGroup ADD UserID bigint(20) NOT NULL DEFAULT \'0\' AFTER ID',
				'ALTER TABLE FUserGroup ADD Type varchar(255) DEFAULT \'Built-in\' AFTER Name'
			],
			'info' => 'Version upgraded. UserGroup table updateed to allow shared drives'
		],
		[
			'number' => '0.9.2',	
			'queries' => [
				'ALTER TABLE Filesystem ADD GroupID bigint(20) DEFAULT NULL AFTER UserID',
				'ALTER TABLE Filesystem ADD DeviceID bigint(20) DEFAULT NULL AFTER GroupID',
				'ALTER TABLE Filesystem ADD Authorized tinyint(4) NOT NULL default \'0\' AFTER Mounted'
			],
			'info' => 'Version upgraded. Filesystem columns added.'			
		],
		[
			'number' => '0.9.1',	
			'queries' => [
				'ALTER TABLE FUser ADD Image varchar(255) NULL AFTER CreatedTime'
			],
			'info' => 'Version upgraded. User image enabled.'
		],
		[
			'number' => '0.9',
			'info' => 'Version upgraded. FriendVersion initialized.'
		],
		[
			'number' => '0.8',
			'info' => '...'
		]

);
	
?>
