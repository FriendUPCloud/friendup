ALTER TABLE `FUser` ADD COLUMN `UniqueID` varchar(256) default NULL;
UPDATE `FUser` SET `UniqueID` = MD5(UUID()) WHERE `UniqueID` IS NULL;

