CREATE TABLE IF NOT EXISTS `FCalendar` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `CalendarID` bigint(20) NOT NULL DEFAULT '0',
  `UserID` bigint(20) NOT NULL DEFAULT '0',
  `Title` varchar(255) DEFAULT NULL,
  `Type` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `TimeFrom` varchar(255) DEFAULT NULL,
  `TimeTo` varchar(8) DEFAULT NULL,
  `Date` varchar(255) DEFAULT NULL,
  `Source` varchar(255) NOT NULL,
  `RemoteID` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

ALTER TABLE `FCalendar` ADD COLUMN `MetaData` text NOT NULL;
