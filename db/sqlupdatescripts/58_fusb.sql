CREATE TABLE IF NOT EXISTS `FUSBDevice` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `USBID` bigint(32) NOT NULL,
  `State` bigint(16) NOT NULL,
  `Type` bigint(16) NOT NULL,
  `Name` varchar(512) DEFAULT NULL,
  `DeviceName` varchar(512) DEFAULT NULL,
  `UserName` varchar(512) DEFAULT NULL,
  `GuacUserName` varchar(512) DEFAULT NULL,
  `Serial` varchar(32) DEFAULT NULL,
  `IPPort` bigint(16) NOT NULL,
  `Login` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `NetworkAddress` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

