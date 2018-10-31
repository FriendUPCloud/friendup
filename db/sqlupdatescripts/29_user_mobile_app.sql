CREATE TABLE IF NOT EXISTS `FUserMobileApp` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `AppToken` varchar(255) DEFAULT NULL,
  `AppVersion` varchar(255) DEFAULT NULL,
  `Platform` varchar(255) DEFAULT NULL,
  `PlatformVersion` varchar(255) DEFAULT NULL,
  `Core` varchar(255) DEFAULT NULL,
  `CreateTS` bigint(32) NOT NULL,
  `LastStartTS` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

