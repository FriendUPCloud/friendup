CREATE TABLE IF NOT EXISTS `FGroupToGroup` (
  `FromGroupID` bigint(20) NOT NULL,
  `ToGroupID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `FGroupToGroup` ADD KEY `FromGroupID` (`FromGroupID`,`ToGroupID`) USING HASH;
