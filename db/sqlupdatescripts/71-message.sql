CREATE TABLE IF NOT EXISTS `Message` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `RoomID` bigint NOT NULL,
  `RoomType` varchar(255) DEFAULT NULL,
  `ParentID` bigint NOT NULL,
  `UniqueUserID` varchar(255) NOT NULL,
  `TargetID` varchar(255) DEFAULT NULL,
  `Message` varchar(4096) NOT NULL,
  `Seen` tinyint(4) NOT NULL default 0,
  `Date` datetime DEFAULT NULL,
  `DateUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

CREATE TABLE IF NOT EXISTS `MessageSession` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `UniqueUserID` varchar(255) NOT NULL,
  `SessionID` varchar(255) NOT NULL,
  `ActivityDate` datetime DEFAULT NULL,
  `PrevDate` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

