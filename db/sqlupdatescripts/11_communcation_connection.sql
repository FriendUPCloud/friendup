
CREATE TABLE IF NOT EXISTS `FCommunicationConnection` (
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`UserID` bigint(20) NOT NULL DEFAULT '0',
	`Access` tinyint NOT NULL DEFAULT '0',
	`FCID` varchar(128),
	`Address` varchar(32),
	`SSLInfo` varchar(255),
	`DateCreated` datetime NOT NULL,
	`PEM` text,
	PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

