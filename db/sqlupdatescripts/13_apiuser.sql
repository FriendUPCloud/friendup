ALTER TABLE `FUser` ADD COLUMN `PublicKey` text AFTER `Password`;

INSERT INTO `FUserGroup` (`UserID`,`Name`,`Type`) VALUES (0,'API','Level');

INSERT INTO `FUser` ( `Name`, `Password`, `PublicKey`, `FullName`, `Email`, `SessionID`, `LoggedTime`, `CreatedTime`, `Image`, `LoginTime`, `MaxStoredBytes`, `MaxReadedBytes`) VALUES
('apiuser', '{S6}3a294fec6996cdea157ed88839469eb29c597494d1132ea154528c131263c6f0', '', 'API', NULL, '', 0, 0, '', 0, 0, 0);

INSERT INTO `FUserToGroup` (`UserID`,`UserGroupID`) VALUES (( SELECT `ID` FROM `FUser` WHERE `Name` = 'apiuser' LIMIT 1),(SELECT `ID` FROM `FUserGroup` WHERE `Name` = 'API' AND `Type` = 'Level' LIMIT 1));

