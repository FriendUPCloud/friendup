 CREATE TABLE IF NOT EXISTS `FNotificationSent` ( 
	   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	   `NotificationID` bigint(20) NOT NULL,
	   `RequestID` bigint(20) NOT NULL,
	   `UserMobileAppID` bigint(20) NOT NULL,
       `Target` bigint(6) NOT NULL,
	   PRIMARY KEY (`ID`)
	 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

 CREATE TABLE IF NOT EXISTS `FNotification` ( 
	   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	   `Channel` varchar(255),
	   `Content` varchar(255),
	   `Title` varchar(255),
	   `Extra` varchar(255),
	   `Application` varchar(255),
	   `UserName` varchar(255),
	   `Created` bigint(20) NOT NULL,
	   `Type` bigint(6) NOT NULL,
       `Status` bigint(6) NOT NULL,
	   PRIMARY KEY (`ID`)
	 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

