<?php
	
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
