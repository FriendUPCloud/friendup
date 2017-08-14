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

// Create FSFile table for managing doors
$t = new DbTable( 'Filesystem' );
if( !$t->load() )
{
	$SqlDatabase->query( '
	CREATE TABLE `Filesystem` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `UserID` bigint(20) NOT NULL DEFAULT \'0\',
	 `Name` varchar(255) DEFAULT NULL,
	 `Type` varchar(255) NOT NULL,
	 `ShortDescription` varchar(255) NOT NULL,
	 `Server` varchar(255) DEFAULT NULL,
	 `Port` varchar(8) DEFAULT NULL,
	 `Path` varchar(255) DEFAULT NULL,
	 `Username` varchar(255) NOT NULL,
	 `Password` varchar(255) NOT NULL,
	 `Mounted` tinyint(4) NOT NULL DEFAULT \'0\',
	 PRIMARY KEY (`ID`)
	)
	' );
}

// Create FSFolder table for MySQL doors
$t = new DbTable( 'FSFolder' );
if( !$t->load() )
{
	$SqlDatabase->Query( '
	CREATE TABLE `FSFolder` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `FilesystemID` bigint(20) NOT NULL,
	 `FolderID` bigint(20) NOT NULL,
	 `UserID` bigint(20) NOT NULL,
	 `Name` varchar(255) NOT NULL,
	 `Permissions` varchar(255) NOT NULL,
	 `DateModified` datetime NOT NULL,
	 `DateCreated` datetime NOT NULL,
	 PRIMARY KEY (`ID`)
	)
	' );
}

// Create FSFile table for MySQL doors
$t = new dbTable( 'FSFile' );
if( !$t->load() )
{
	$SqlDatabase->Query( '
	CREATE TABLE `FSFile` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `FilesystemID` bigint(20) NOT NULL,
	 `UserID` bigint(20) NOT NULL,
	 `FolderID` bigint(20) NOT NULL,
	 `Filename` varchar(255) NOT NULL,
	 `Filesize` int(11) NOT NULL DEFAULT \'0\',
	 `Permissions` varchar(255) NOT NULL,
	 `DateModified` datetime NOT NULL,
	 `DateCreated` datetime NOT NULL,
	 PRIMARY KEY (`ID`)
	) 
	' );
}

// Create FSFile table for MySQL doors
/*$t = new dbTable( 'FRelation' );
if( !$t->load() )
{
	$SqlDatabase->Query( '
	CREATE TABLE `FRelation` (
	 `RowID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `RowType` varchar(255) NOT NULL,
	 `RelationID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `RelationType` varchar(255) NOT NULL,
	 PRIMARY KEY (`ID`)
	) 
	' );
}*/

// Create FSKeys table for MySQL doors
$t = new dbTable( 'FKeys' );
if( !$t->load() )
{
	$SqlDatabase->Query( '
	CREATE TABLE `FKeys` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `UserID` bigint(20) NOT NULL,
	 `UniqueID` varchar(255) NOT NULL,
	 `RowID` bigint(20) NOT NULL,
	 `RowType` varchar(255) NOT NULL,
	 `Type` varchar(255) NOT NULL,
	 `Data` longblob,
	 `PublicKey` blob,
	 `DateModified` datetime NOT NULL,
	 `DateCreated` datetime NOT NULL,
	 `IsDeleted` tinyint(4) NOT NULL,
	 PRIMARY KEY (`ID`)
	) 
	' );
}

?>
