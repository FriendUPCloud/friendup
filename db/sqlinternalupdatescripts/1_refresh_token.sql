CREATE TABLE IF NOT EXISTS `FRefreshToken` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Token` varchar(512) NOT NULL,
  `DeviceID` varchar(512) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `CreatedTime` bigint(20) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

