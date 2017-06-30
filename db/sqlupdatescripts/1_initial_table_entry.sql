

 -- 12/04/2017 multi-purpose table
 
 CREATE TABLE IF NOT EXISTS  `FGlobalVariables` (
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Key` varchar(255) DEFAULT NULL,
   `Value` varchar(255) DEFAULT NULL,
   `Comment` Text DEFAULT NULL,
   `Date` bigint(32) NOT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
