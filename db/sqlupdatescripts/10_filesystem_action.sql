
ALTER TABLE `FUser` ADD COLUMN `MaxStoredBytes` bigint(32) NOT NULL DEFAULT '0';
ALTER TABLE `FUser` ADD COLUMN `MaxReadedBytes` bigint(32) NOT NULL DEFAULT '0';

CREATE TABLE IF NOT EXISTS `FilesystemActivity` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FilesystemID` bigint(20) NOT NULL DEFAULT '0',
  `ToDate` date DEFAULT NULL,
  `StoredBytesLeft` bigint(32) NOT NULL DEFAULT '0',
  `ReadedBytesLeft` bigint(32) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;


use `FriendMaster`;
DELIMITER |

CREATE 
	EVENT `FilesystemActivity_Update` 
	ON SCHEDULE EVERY 1 DAY STARTS '2017-01-01'
	DO 
    BEGIN
		DELETE FROM `FilesystemActivity` WHERE ToDate <= CURDATE();

		INSERT INTO `FilesystemActivity` (`FilesystemID`, `ToDate`, `StoredBytesLeft`, `ReadedBytesLeft`)
			SELECT fs.ID, CURRENT_DATE + INTERVAL 30 DAY, u.MaxStoredBytes, u.MaxReadedBytes FROM `Filesystem` fs 
				left join `FUser` u on fs.UserID = u.ID
				left outer join `FilesystemActivity` fsa on fs.ID = fsa.FilesystemID and fsa.ToDate <= CURDATE()
				WHERE fsa.ID is NULL;
	    
	END |

DELIMITER ;
SET GLOBAL event_scheduler = ON;

