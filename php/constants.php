<?php
	
/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/**
	File to hold global Friend Constants
	
	Like for examples our version history
	
	Always add to the END OF TABLES !!!! 
*/

/* Newest version on top... */
$FRIENDVERSIONS = Array (

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
