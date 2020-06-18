CREATE TABLE IF NOT EXISTS `FFileInfo` (
  `ID` bigint(20) NOT NULL,
  `Name` varchar(255) NOT NULL DEFAULT '0',
  `Path` varchar(1024) DEFAULT NULL,
  `FilesystemID` bigint(20) NOT NULL DEFAULT '0',
  `DateCreated` datetime NOT NULL,
  `DateModified` datetime NOT NULL,
  `Data` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;