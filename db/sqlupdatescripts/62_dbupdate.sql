CREATE TABLE IF NOT EXISTS `FDBUpdate` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Filename` varchar(255) NOT NULL,
  `Created` bigint(20) NOT NULL,
  `Updated` bigint(20) NOT NULL,
  `Script` varchar(1024) NOT NULL DEFAULT '',
  `Error` varchar(1024) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;


