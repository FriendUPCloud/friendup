CREATE TABLE IF NOT EXISTS `FSFileLog` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL,
  `FileID` bigint(20) NOT NULL,
  `Path` varchar(512) DEFAULT NULL,
  `UserID` bigint(20) NOT NULL,
  `AccessMode` int DEFAULT '0',
  `Accessed` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
