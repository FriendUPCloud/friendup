CREATE TABLE IF NOT EXISTS `FAnnouncement` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `OwnerUserID` bigint(32) NOT NULL,
  `UserID` bigint(32) NOT NULL,
  `GroupID` bigint(20) NOT NULL,
  `Type` varchar(32) NOT NULL default "",
  `Payload` text,
  `CreateTime` datetime NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `FAnnouncementStatus` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `AnnouncementID` bigint(32) NOT NULL,
  `DeviceID` varchar(255) NOT NULL DEFAULT "",
  `Status` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;
