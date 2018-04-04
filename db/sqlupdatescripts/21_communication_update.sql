
CREATE TABLE IF NOT EXISTS `FConnection` (  `ID` bigint(20) NOT NULL AUTO_INCREMENT,  `FCID` varchar(255) NOT NULL,  `DestinationFCID` varchar(128),  `Type` bigint(3) NOT NULL,  `ServerType` bigint(3) NOT NULL,  `Name` varchar(1024) NOT NULL,  `Address` varchar(64) NOT NULL,  `Approved` bigint(3) NOT NULL,  `SSLInfo` varchar(255),  `DateCreated` datetime DEFAULT CURRENT_TIMESTAMP,  `PEM` text,  `ClusterID` smallint(2),  `Status` smallint(2),  PRIMARY KEY (`ID`)) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

