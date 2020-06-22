CREATE TABLE IF NOT EXISTS `FShared` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `OwnerUserID` bigint(20) NOT NULL,
  `SharedType` varchar(255) default "User",
  `SharedID` bigint(20) NOT NULL,
  `Data` varchar(1024) NOT NULL,
  `Mode` varchar(255) NOT NULL,
  `DateCreated` datetime,
  `DateTouched` datetime,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

ALTER TABLE `FUser` ADD COLUMN `LoginCounter` int(11) DEFAULT -1;

