CREATE TABLE IF NOT EXISTS `FUserSessionApp` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL DEFAULT '0',
  `UserSessionID` bigint(32) NOT NULL DEFAULT '0',
  `ApplicationID` bigint(32) NOT NULL DEFAULT '0',
  `DeviceIdentity` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
