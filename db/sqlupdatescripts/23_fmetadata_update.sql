CREATE TABLE IF NOT EXISTS `FMetaData` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Key` varchar(255) NOT NULL,
  `DataID` bigint(20) DEFAULT NULL,
  `DataTable` varchar(255) DEFAULT NULL,
  `ValueNumber` int(11) NOT NULL DEFAULT '0',
  `ValueString` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

