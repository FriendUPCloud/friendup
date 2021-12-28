
CREATE TABLE IF NOT EXISTS FUserStats ( 
 ID bigint(32) NOT NULL AUTO_INCREMENT, 
 UserID bigint(32) NOT NULL, 
 Logins int(32) DEFAULT 0, 
 Timespent bigint(32) DEFAULT 0, 
 Uploads bigint(32) DEFAULT 0, 
 Downloads bigint(32) DEFAULT 0, 
 Livecalls bigint(16) DEFAULT 0, 
 ChatroomCount bigint(16) DEFAULT 0, 
 MobileLogins bigint(16) DEFAULT 0, 
 Device varchar(512) DEFAULT 'empty', 
 Date datetime NOT NULL default now(), 
 PRIMARY KEY (ID) 
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ; 

DELIMITER $$ 

CREATE PROCEDURE GenerateStateForUser( IN loctime BigInt(32), IN userid BigInt(32), IN useruuid varchar(256), IN device varchar(256) ) 
BEGIN 
 DECLARE login DECIMAL(8,0) DEFAULT 0;
 DECLARE timeSpent bigint(32) DEFAULT 0;
 DECLARE mobileLogin DECIMAL(8,0) DEFAULT 0;
 DECLARE device varchar(256);

 SELECT count(*) INTO login FROM FUser WHERE ID=userid AND LoginTime > loctime;
 
 SELECT count(*) INTO mobileLogin FROM FUserLogin WHERE UserID=userid AND LoginTime > loctime AND (Device like '%Android%' OR Device like '%iOS%');

 IF login > 0 THEN
  SELECT (LastActionTime-LoginTime) as timespent
  INTO timeSpent
  FROM FUser where ID=userid AND LoginTime > loctime;
 END IF;

 INSERT INTO FUserStats (UserID, Logins, Timespent, Uploads, Downloads, Livecalls, ChatroomCount, MobileLogins, Device) 
 VALUES ( 
 userid, 
 login, 
 timeSpent, 
 (SELECT SUM(f.Filesize) AS FIRST_DRINK FROM FSFile f, Filesystem fl WHERE fl.UserID=userid AND fl.Name='Home' AND f.FilesystemID=fl.ID), 
 0, 
 (SELECT count(*) FROM presence.user_relation AS ur LEFT JOIN presence.account AS a ON a.clientId=ur.userId
     WHERE a.fUserId=useruuid AND ur.roomId IN ( SELECT m.roomId FROM presence.message AS m WHERE m.fromId=a.clientId
     AND m.timestamp > loctime
     )), 
 0,
 mobileLogin, 
 device
 ); 

END$$ 

-- go through all users 

CREATE PROCEDURE CreateUserStatistic( ) 
BEGIN 
 DECLARE finished INTEGER DEFAULT 0; 
 DECLARE localID BigInt(32) DEFAULT 0; 
 DECLARE localUUID varchar(256) DEFAULT '';
 DECLARE device varchar(256) DEFAULT '';
 DECLARE loctime BigInt(32) DEFAULT 0;

 -- declare cursor for ID 
 DEClARE locIDCursor 
 CURSOR FOR 
 SELECT ID,UniqueID FROM FUser; 

 -- declare NOT FOUND handler 
 DECLARE CONTINUE HANDLER 
 FOR NOT FOUND SET finished = 1; 
 
 SELECT (UNIX_TIMESTAMP()-(86400)) INTO loctime;

 OPEN locIDCursor; 

 getID: LOOP 
 FETCH locIDCursor INTO localID, localUUID;
 IF finished = 1 THEN 
 LEAVE getID; 
 END IF; 
 -- call function on all users
 SET device = (SELECT ul.Device FROM FUser u LEFT OUTER JOIN FUserLogin ul on u.ID=ul.UserID WHERE ul.UserID=localID AND ul.LoginTime > loctime ORDER BY ul.LoginTime DESC LIMIT 1);
 IF device IS NULL THEN
  SET device = 'none';
 END IF;
 call GenerateStateForUser( loctime, localID, localUUID, device ); 
 END LOOP getID; 
 CLOSE locIDCursor; 
END$$ 

DELIMITER ; 


SET GLOBAL event_scheduler = ON; 

CREATE 
EVENT create_user_statistic 
ON SCHEDULE EVERY 1 DAY 
STARTS str_to_date( date_format(now(), '%Y%m%d 0200'), '%Y%m%d %H%i' ) + INTERVAL 1 DAY
DO CALL CreateUserStatistic();
