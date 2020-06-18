CREATE TABLE IF NOT EXISTS `FFileInfo` (
  `ID` bigint(20) NOT NULL,
  `Name` varchar(255) NOT NULL DEFAULT '0',
  `Path` varchar(1024) DEFAULT NULL,
  `FilesystemID` bigint(20) NOT NULL DEFAULT '0',
  `DateCreated` datetime NOT NULL,
  `DateModified` datetime NOT NULL,
  `Data` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `FFileInfo`
  ADD PRIMARY KEY (`ID`);
  
ALTER TABLE `FFileInfo`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;