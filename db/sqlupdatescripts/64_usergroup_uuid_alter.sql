ALTER TABLE `FUserGroup` ADD COLUMN `UniqueID` varchar(256) default NULL;
UPDATE `FUserGroup` SET `UniqueID` = MD5(UUID()) WHERE `UniqueID` IS NULL;

