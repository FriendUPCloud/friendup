

Mysql ```
CREATE TABLE IF NOT EXISTS `Message` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `RoomID` bigint NOT NULL,
  `RoomType` varchar(255) DEFAULT NULL,
  `ParentID` bigint NOT NULL,
  `UniqueUserID` varchar(255) NOT NULL,
  `Message` varchar(4096) NOT NULL,
  `Date` datetime DEFAULT NULL,
  `DateUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
)
```


