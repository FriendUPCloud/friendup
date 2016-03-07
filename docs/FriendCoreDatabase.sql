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
  `UserID` bigint(20) DEFAULT '0',
  `Application` varchar(255) DEFAULT NULL,
  `ShortDescription` varchar(255) DEFAULT NULL,
  `SortOrder` int(11) DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=12 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=50 ;

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
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=110 ;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=211 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=30 ;

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
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=40 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUserGroup`
--

CREATE TABLE IF NOT EXISTS `FUserGroup` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

-- --------------------------------------------------------

--
-- Table structure for table `FUserToGroup`
--

CREATE TABLE IF NOT EXISTS `FUserToGroup` (
  `UserID` bigint(20) NOT NULL,
  `UserGroupID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- 19/12/2015 Added column Owner to Filesystem table


ALTER TABLE `Filesystem` ADD `Owner` bigint(20);

-- 29/01/2016 add standard admin user


INSERT INTO `FUser` (`Name`,`Password`) VALUES ("friendadmin","FriendlyBetaAdministrator" );

INSERT INTO `FUserGroup` (`Name`) VALUES ("Admin");

INSERT INTO `FUserGroup` (`Name`) VALUES ("User");

INSERT INTO `FUserToGroup` (`UserId`,`UserGroupId`) VALUES ( ( SELECT `ID` FROM `FUser` LIMIT 1 ) , ( SELECT `ID` FROM `FUserGroup` WHERE `Name`="Admin" ) );
