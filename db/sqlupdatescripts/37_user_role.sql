CREATE TABLE IF NOT EXISTS `FUserRolePermission` ( 
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`Permission` varchar(32) NOT NULL,
	`RoleID` bigint(20) NOT NULL,
	`Data` varchar(255) NOT NULL,
	PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

