<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// Groups of competencies..
$RSql->query( '
	CREATE TABLE IF NOT EXISTS `CmpCompetencyGroup`
	(
		`ID` bigint(20) NOT NULL auto_increment,
		`GroupID` bigint(20) NOT NULL default \'0\',
		`ScaleID` bigint(20) NOT NULL default \'0\',
		`Name` varchar(255),
		`Description` text,
		`DateCreated` datetime,
		`DateModified` datetime,
		`IsDeleted` tinyint(4) NOT NULL default \'0\',
		PRIMARY KEY(ID)
	)
' );


// For showing competencies
$RSql->query( '
	CREATE TABLE IF NOT EXISTS `CmpCompetency`
	(
		`ID` bigint(20) NOT NULL auto_increment,
		`Name` varchar(255),
		`Description` text,
		`Question` text,
		`Answer` text,
		`DateCreated` datetime,
		`DateModified` datetime,
		`IsDeleted` tinyint(4) NOT NULL default \'0\',
		PRIMARY KEY(ID)
	)
' );

// For showing competencies
$RSql->query( '
	CREATE TABLE IF NOT EXISTS `CmpScale`
	(
		`ID` bigint(20) NOT NULL auto_increment,
		`Name` varchar(255),
		`Rate1` varchar(255),
		`Rate2` varchar(255),
		`Rate3` varchar(255),
		`Rate4` varchar(255),
		`Rate5` varchar(255),		
		`DateCreated` datetime,
		`DateModified` datetime,
		`IsDeleted` tinyint(4) NOT NULL default \'0\',
		PRIMARY KEY(ID)
	)
' );

// For translating content...
$RSql->query( '		
	CREATE TABLE IF NOT EXISTS `CmpTranslation` 
	(
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `ContentType` varchar(255) NOT NULL,
	 `ContentID` bigint(20) NOT NULL,
	 `Language` varchar(255) NOT NULL,
	 `Content` text NOT NULL,
	 PRIMARY KEY (`ID`)
	) 
' );

// For various types of groups
$RSql->query( '		
	CREATE TABLE IF NOT EXISTS `CmpGroup` 
	(
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`GroupID` bigint(20) NOT NULL DEFAULT \'0\',
	`Type` varchar(255),
	`Name` varchar(255) DEFAULT NULL,
	`Description` text,
	`DateCreated` datetime DEFAULT NULL,
	`DateModified` datetime DEFAULT NULL,
	`IsDeleted` tinyint(4) NOT NULL DEFAULT \'0\',
	PRIMARY KEY (`ID`)
	) 
' );

// For profiles..
$RSql->query( '
	CREATE TABLE IF NOT EXISTS `CmpProfile`
	(
		`ID` bigint(20) NOT NULL auto_increment,
		`UserID` bigint(20) NOT NULL default \'0\',
		`GroupID` varchar(255),
		`ScaleID` bigint(20) NOT NULL default \'0\',
		`Name` varchar(255),
		`Description` text,
		`Data` text,
		`DateCreated` datetime,
		`DateModified` datetime,
		`IsDeleted` tinyint(4) NOT NULL default \'0\',
		PRIMARY KEY(ID)
	)
' );

$RSql->query( '
CREATE TABLE IF NOT EXISTS `CmpCandidateProfile` (
  `ID` bigint(20) NOT NULL,
  `UserID` bigint(20) NOT NULL, 
  `CandidateID` bigint(20) NOT NULL,
  `ProfileID` bigint(20) NOT NULL,
  `DateModified` datetime NOT NULL,
  `Status` varchar(255) NOT NULL DEFAULT \'pending\',
  `IsDeleted` tinyint(4) NOT NULL default \'0\',
  PRIMARY KEY (`ID`)
)
' );

$RSql->query( '
CREATE TABLE IF NOT EXISTS `CmpCandidateCompetency` (
  `ID` bigint(20) NOT NULL,
  `CandidateID` bigint(20) NOT NULL,
  `CompetencyID` bigint(20) NOT NULL,
  `ProfileID` bigint(20) NOT NULL,
  `GroupID` bigint(20) NOT NULL, 
  `Rating` tinyint(4) NOT NULL default \'0\',
  `ReviewerRating` tinyint(4) NOT NULL default \'0\',  
  `ReviewerComment` text,  
  `DateCreated` datetime NOT NULL,
  `DateModified` datetime NOT NULL,
  PRIMARY KEY (`ID`)
)
' );

$RSql->query( '
CREATE TABLE IF NOT EXISTS `CmpRelation` (
  `ID` bigint(20) NOT NULL,
  `Type` varchar(255) NOT NULL,
  `RowID` bigint(20) NOT NULL,
  `ConnectionType` varchar(255) NOT NULL,
  `ConnectionID` bigint(20) NOT NULL,
  `SortOrder` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=latin1;
' );

//ALTER TABLE `CmpProfile` ADD `ScaleID` bigint(20) NOT NULL default '0' AFTER `Group`
//clean up early misnaming...
$RSql->query( '
	DROP TABLE IF EXISTS `CmpVacancy`;
' );

?>
