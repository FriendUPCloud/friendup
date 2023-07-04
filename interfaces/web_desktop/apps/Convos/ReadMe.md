

Mysql ```
CREATE TABLE `Messages` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `RoomID` bigint NOT NULL,
  `RoomType` varchar(255) DEFAULT NULL,
  `ParentID` bigint NOT NULL,
  `Message` text,
  `Date` datetime DEFAULT NULL,
  `DateUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
)
```


