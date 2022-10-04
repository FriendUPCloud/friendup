-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 12, 2015 at 11:25 PM
-- Server version: 5.5.41-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `FriendCore`
--

-- --------------------------------------------------------

--
-- Table structure for table `DockItem`
--

CREATE TABLE IF NOT EXISTS `DockItem` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Parent` bigint(20) DEFAULT '0',
  `DockID` bigint(20) NOT NULL,
  `UserID` bigint(20) DEFAULT '0',
  `Type` varchar(255) DEFAULT 'executable',
  `Application` varchar(255) DEFAULT NULL,
  `ShortDescription` varchar(255) DEFAULT NULL,
  `SortOrder` int(11) DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FApplication`
--

CREATE TABLE IF NOT EXISTS `FApplication` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL DEFAULT '0',
  `Name` varchar(255) NOT NULL,
  `InstallPath` varchar(255) NOT NULL,
  `Permissions` varchar(8) NOT NULL DEFAULT 'UGO',
  `DateInstalled` datetime NOT NULL,
  `DateModified` datetime NOT NULL,
  `Config` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FDocumentation`
--

CREATE TABLE IF NOT EXISTS `FDocumentation` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ParentID` bigint(20) NOT NULL DEFAULT '0',
  `Type` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Return` varchar(255) NOT NULL,
  `Arguments` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `Examples` text NOT NULL,
  `DateUpdated` datetime NOT NULL,
  `DateCreated` datetime NOT NULL,
  `Status` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `FTinyUrl`
--

CREATE TABLE `FTinyUrl` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `UserID` bigint(20) NOT NULL,
 `Source` text NOT NULL,
 `Hash` varchar(16) NOT NULL,
 `Expire` tinyint(1) NOT NULL,
 `DateCreated` int(11) NOT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FFileShared`
--

CREATE TABLE IF NOT EXISTS `FFileShared` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL default '0',
  `Devname` varchar(255) DEFAULT NULL,
  `Path` varchar(1024) DEFAULT NULL,
  `UserID` bigint(20) NOT NULL default '0',
  `DstUserSID` varchar(1024) DEFAULT NULL,
  `DateCreated` datetime NOT NULL,
  `Hash` varchar(255) DEFAULT NULL,
  `AppID` bigint(20) DEFAULT NULL,
  `FileData` MEDIUMBLOB,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `Filesystem`
--

CREATE TABLE IF NOT EXISTS `Filesystem` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL DEFAULT '0',
  `GroupID` bigint(20) DEFAULT NULL,
  `DeviceID` bigint(20) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Type` varchar(255) NOT NULL,
  `ShortDescription` varchar(255) NOT NULL,
  `Server` varchar(255) DEFAULT NULL,
  `Port` varchar(8) DEFAULT NULL,
  `Path` varchar(255) DEFAULT NULL,
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Config` text NOT NULL,
  `Mounted` tinyint(4) NOT NULL DEFAULT '0',
  `Authorized` tinyint(4) NOT NULL default '0',
  `Owner` bigint(20) DEFAULT NULL,
  `AuthID` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FIOTDevice`
--

CREATE TABLE IF NOT EXISTS `FIOTDevice` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `DeviceID` varchar(255) NOT NULL,
  `Key` varchar(255) NOT NULL,
  `Value` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FMail`
--

CREATE TABLE IF NOT EXISTS `FMail` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Address` varchar(255) NOT NULL,
  `Server` varchar(255) NOT NULL,
  `Port` int(11) NOT NULL,
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Folder` varchar(255) NOT NULL,
  `OutServer` varchar(255) NOT NULL,
  `OutPort` varchar(255) NOT NULL,
  `OutUser` varchar(255) NOT NULL,
  `OutPass` varchar(255) NOT NULL,
  `SortOrder` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FMailHeader`
--

CREATE TABLE IF NOT EXISTS `FMailHeader` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `ExternalMessageID` bigint(20) NOT NULL,
  `Address` varchar(255) NOT NULL,
  `Date` datetime DEFAULT NULL,
  `Subject` varchar(255) NOT NULL,
  `From` varchar(255) NOT NULL,
  `ReplyTo` varchar(255) NOT NULL,
  `To` varchar(255) NOT NULL,
  `IsRead` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FMailOutgoing`
--

CREATE TABLE IF NOT EXISTS `FMailOutgoing` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Date` datetime DEFAULT NULL,
  `Subject` varchar(255) NOT NULL,
  `Content` text NOT NULL,
  `Attachments` text NOT NULL,
  `From` varchar(255) NOT NULL,
  `To` varchar(255) NOT NULL,
  `IsSent` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FScreen`
--

CREATE TABLE IF NOT EXISTS `FScreen` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Data` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FSetting`
--

CREATE TABLE IF NOT EXISTS `FSetting` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Type` varchar(255) NOT NULL,
  `Key` varchar(255) NOT NULL,
  `Data` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FSBlob`
--

CREATE TABLE IF NOT EXISTS `FSBlob` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FileID` bigint(20) NOT NULL,
  `Data` blob NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `FSFile`
--

CREATE TABLE IF NOT EXISTS `FSFile` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `FolderID` bigint(20) NOT NULL,
  `Filename` varchar(255) NOT NULL,
  `DiskFilename` varchar(255) NOT NULL,
  `Filesize` int(11) NOT NULL DEFAULT '0',
  `Permissions` varchar(255) NOT NULL,
  `DateModified` datetime NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Table structure for table `FSFileLog`
--

CREATE TABLE IF NOT EXISTS `FSFileLog` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL,
  `FileID` bigint(20) NOT NULL,
  `Path` varchar(512) DEFAULT NULL,
  `UserID` bigint(20) NOT NULL,
  `AccessMode` int DEFAULT '0',
  `Accessed` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FSSearchData`
--

CREATE TABLE IF NOT EXISTS `FSSearchData` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL,
  `FileID` bigint(20) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `Data` text NOT NULL,
  `DateModified` datetime NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

-- --------------------------------------------------------

--
-- Table structure for table `FSFolder`
--

CREATE TABLE IF NOT EXISTS `FSFolder` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL,
  `FolderID` bigint(20) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Permissions` varchar(255) NOT NULL,
  `DateModified` datetime NOT NULL,
  `DateCreated` datetime NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUser`
--

CREATE TABLE IF NOT EXISTS `FUser` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `FullName` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LoggedTime` bigint(32) NOT NULL,
  `CreatedTime` bigint(32) NOT NULL,
  `Image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUserApplication`
--

CREATE TABLE IF NOT EXISTS `FUserApplication` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `ApplicationID` bigint(20) NOT NULL,
  `Permissions` text NOT NULL,
  `AuthID` varchar(255) NOT NULL,
  `Data` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUserGroup`
--

CREATE TABLE IF NOT EXISTS `FUserGroup` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Type` varchar(255) DEFAULT 'Level',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUserToGroup`
--

CREATE TABLE IF NOT EXISTS `FUserToGroup` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `UserGroupID` bigint(20) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- 19/12/2015 Added column Owner to Filesystem table


-- 29/01/2016 add standard admin user


/*-- INSERT INTO `FUser` (`Name`,`Password`) VALUES ("fadmin","securefassword" ); */

INSERT INTO `FUser` (`ID`,`Name`,`FullName`,`Password`) VALUES (1,"fadmin","Friend Administrator",CONCAT("{S6}",SHA2(CONCAT("HASHED",SHA2("securefassword",256)),256)));

/*-- INSERT INTO `FUser` (`Name`,`Password`) VALUES ("guest","guest" ); */
INSERT INTO `FUser` (`ID`,`Name`,`Password`) VALUES (2,"guest",CONCAT("{S6}",SHA2(CONCAT("HASHED",SHA2("guest",256)),256)));

INSERT INTO `FUserGroup` (`ID`,`Name`) VALUES (1,"Admin");

INSERT INTO `FUserGroup` (`ID`,`Name`) VALUES (2,"User");

INSERT INTO `FUserToGroup` (`UserID`,`UserGroupID`) VALUES ( 1,1 );
INSERT INTO `FUserToGroup` (`UserID`,`UserGroupID`) VALUES ( 2,2 );

-- 30/11/2016 file permission table

 CREATE TABLE IF NOT EXISTS `FFilePermission` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `DeviceID` bigint(32) NOT NULL,
  `Path` text DEFAULT NULL,
  PRIMARY KEY (`ID`),
  FULLTEXT idx (`Path`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- index creation moved to CREATE_TABLE sql script
-- ALTER TABLE `FFilePermission` ADD FULLTEXT(`Path`);

-- 30/11/2016 file permission link table

 CREATE TABLE IF NOT EXISTS `FPermLink` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `PermissionID` bigint(32) NOT NULL,
  `ObjectID` bigint(32) NOT NULL,
  `Type` int(3) NOT NULL,
  `Access` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- 30/11/2016 dictionary table

 CREATE TABLE IF NOT EXISTS `FDictionary` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `CategoryID` bigint(20),
   `Message` text DEFAULT NULL,
   `Language` varchar(10) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 
 -- 30/11/2016 category table
 
 CREATE TABLE IF NOT EXISTS  `FCategory` (
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Name` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 
 -- 05/12/2016 user session table
 
 CREATE TABLE IF NOT EXISTS `FUserSession` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `DeviceIdentity` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LoggedTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 

 -- 2017-02-05 -- DoorNotifications table
 CREATE TABLE IF NOT EXISTS `FDoorNotification` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `OwnerID` bigint(32) NOT NULL,
  `DeviceID` bigint(32) NOT NULL,
  `Path` text DEFAULT NULL,
  `Type` bigint(2) NOT NULL,
  `Time` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- 2017-03-06 -- on the end we will not use alter, but since we dont have version mechanism Im adding that here - stefkos
ALTER TABLE `Filesystem` ADD `Execute` VARCHAR( 512 );


 -- 2017-10-09 -- FKeys table
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
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

 -- 2018-04-17 -- FMetaData table
 CREATE TABLE `FMetaData` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Key` varchar(255) NOT NULL,
  `DataID` bigint(20) DEFAULT NULL,
  `DataTable` varchar(255) DEFAULT NULL,
  `ValueNumber` int(11) NOT NULL DEFAULT '0',
  `ValueString` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `FQueuedEvent` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) DEFAULT 0,
  `TargetGroupID` bigint(20) DEFAULT 0,
  `TargetUserID` bigint(20) DEFAULT 0,
  `InviteLinkID` bigint(20) DEFAULT 0,
  `Type` varchar(255) NOT NULL,
  `Date` datetime,
  `Status` varchar(255) NOT NULL DEFAULT '',
  `Title` varchar(32) NOT NULL DEFAULT '',
  `Message` varchar(255) NOT NULL DEFAULT '',
  `ActionSeen` varchar(255) NOT NULL DEFAULT '',
  `ActionAccepted` varchar(255) NOT NULL DEFAULT '',
  `ActionRejected` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

ALTER TABLE `FUser` ADD COLUMN `PublicKey` text AFTER `Password`;

ALTER TABLE `FUser` ADD COLUMN `LoginTime` bigint(32) NOT NULL;

ALTER TABLE `FUser` ADD COLUMN `MaxStoredBytes` bigint(32) NOT NULL DEFAULT '0';

ALTER TABLE `FUser` ADD COLUMN `MaxReadedBytes` bigint(32) NOT NULL DEFAULT '0';

INSERT INTO `FUserGroup` (`UserID`,`Name`,`Type`) VALUES (0,'API','Level');

INSERT INTO `FUser` ( `Name`, `Password`, `PublicKey`, `FullName`, `Email`, `SessionID`, `LoggedTime`, `CreatedTime`, `Image`, `LoginTime`, `MaxStoredBytes`, `MaxReadedBytes`) VALUES
('apiuser', '{S6}3a294fec6996cdea157ed88839469eb29c597494d1132ea154528c131263c6f0', '', 'API', NULL, '', 0, 0, '', 0, 0, 0);

INSERT INTO `FUserToGroup` (`UserID`,`UserGroupID`) VALUES (( SELECT `ID` FROM `FUser` WHERE `Name` = 'apiuser' LIMIT 1),(SELECT `ID` FROM `FUserGroup` WHERE `Name` = 'API' AND `Type` = 'Level' LIMIT 1));


