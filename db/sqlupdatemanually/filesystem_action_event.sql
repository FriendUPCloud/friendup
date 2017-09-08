
ALTER TABLE `FUser` ADD COLUMN `MaxStoredBytes` bigint(32) NOT NULL DEFAULT '0';
ALTER TABLE `FUser` ADD COLUMN `MaxReadedBytes` bigint(32) NOT NULL DEFAULT '0';

CREATE TABLE IF NOT EXISTS `FilesystemActivity` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL DEFAULT '0',
  `ToDate` date DEFAULT NULL,
  `StoredBytesLeft` bigint(32) NOT NULL DEFAULT '0',
  `ReadedBytesLeft` bigint(32) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

