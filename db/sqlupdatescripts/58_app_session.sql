CREATE TABLE IF NOT EXISTS `FAppSession` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `UserApplicationID` bigint(32) NOT NULL,
  `AuthID` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

