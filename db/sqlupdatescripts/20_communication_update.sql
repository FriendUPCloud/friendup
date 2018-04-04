
ALTER TABLE `FCommunicationConnection` ADD COLUMN `DestinationFCID` varchar(128);

DROP TABLE IF EXISTS `FCommunicationConnection`;

CREATE TABLE IF NOT EXISTS `FClusterNode` (`ID` bigint(20) NOT NULL AUTO_INCREMENT,`FCID` varchar(128),`Address` varchar(32),`DateCreated` datetime NOT NULL,`NodeID` smallint(2),`Status` smallint(2), PRIMARY KEY (`ID`)) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `FConnectionInfo` (`ID` bigint(20) NOT NULL AUTO_INCREMENT, `UserID` bigint(20) NOT NULL DEFAULT '0', `Access` tinyint NOT NULL DEFAULT '0', `FCID` varchar(128), `DestinationFCID` varchar(128), `Address` varchar(32), `SSLInfo` varchar(255), `DateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `PEM` text, `ClusterID` smallint(2), `Status` smallint(2), PRIMARY KEY (`ID`)) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

