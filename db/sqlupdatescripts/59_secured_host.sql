CREATE TABLE IF NOT EXISTS `FSecuredHost` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `Host` varchar(255) DEFAULT NULL,
  `Status` bigint(8) NOT NULL,
  `UserID` bigint(32) NOT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

