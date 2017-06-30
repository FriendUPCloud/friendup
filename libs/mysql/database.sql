

use FriendMaster;

CREATE TABLE `FUserToGroup` (
 `UserID` bigint(20) NOT NULL,
 `UserGroupID` bigint(20) NOT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;


CREATE TABLE `FUserGroup` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `Name` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;


CREATE TABLE IF NOT EXISTS `FUser` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `FullName` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LoggedTime` bigint(32) NOT NULL,
  `CreatedTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
