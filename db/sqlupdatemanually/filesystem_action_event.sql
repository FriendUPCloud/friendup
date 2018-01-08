DELIMITER |

CREATE EVENT `FilesystemActivity_Update` ON SCHEDULE EVERY 1 DAY STARTS '2017-01-01'
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
