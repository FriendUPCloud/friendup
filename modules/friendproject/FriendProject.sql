-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 20, 2017 at 11:14 PM
-- Server version: 5.7.18-0ubuntu0.16.04.1
-- PHP Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `FriendProject`
--

-- --------------------------------------------------------

--
-- Table structure for table `ProjectProject`
--

CREATE TABLE `ProjectProject` (
  `ID` bigint(20) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `Name` varchar(255) DEFAULT '',
  `Status` varchar(32) NOT NULL,
  `Description` text,
  `DateCreated` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ProjectProject`
--

INSERT INTO `ProjectProject` (`ID`, `UserID`, `Name`, `Status`, `Description`, `DateCreated`) VALUES
(5, 1, 'Friend Project', 'Running', 'A project registry for Friend. Allows teams to register their projects with Friend and allows Friend Software Corporation to track their progress and offer support.', '2017-08-20 21:16:22'),
(6, 1, 'FUI - Friend User Interface', 'Running', 'Friend\'s user interface engine that finally brings full object oriented capabilities.', '2017-08-20 23:04:58'),
(7, 1, 'Friend Network', 'Running', '', '2017-08-20 23:05:39'),
(8, 1, 'Sauron', 'Paused', 'Project to manage Friend servers and customers.', '2017-08-20 23:06:29'),
(9, 1, 'Friend Helper - AI', 'New', '', '2017-08-20 23:10:41');

-- --------------------------------------------------------

--
-- Table structure for table `ProjectUser`
--

CREATE TABLE `ProjectUser` (
  `ID` bigint(20) NOT NULL,
  `Username` varchar(255) DEFAULT '',
  `Password` varchar(255) DEFAULT '',
  `DateCreated` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ProjectUser`
--

INSERT INTO `ProjectUser` (`ID`, `Username`, `Password`, `DateCreated`) VALUES
(1, 'm0ns00n', 'konglubo', '2017-08-20 14:08:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ProjectProject`
--
ALTER TABLE `ProjectProject`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `ProjectUser`
--
ALTER TABLE `ProjectUser`
  ADD PRIMARY KEY (`ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ProjectProject`
--
ALTER TABLE `ProjectProject`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT for table `ProjectUser`
--
ALTER TABLE `ProjectUser`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
