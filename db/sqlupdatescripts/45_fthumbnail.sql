CREATE TABLE IF NOT EXISTS `FThumbnail` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `Path` varchar(255) NOT NULL,
  `Filepath` varchar(255) NOT NULL,
  `DateCreated` datetime,
  `DateTouched` datetime,
  `Encryption` varchar(255),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
