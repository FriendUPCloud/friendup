ALTER TABLE `FUser` CHANGE `LoggedTime` `LastActionTime` BIGINT(32) DEFAULT 0;

ALTER TABLE `FUser` CHANGE `CreatedTime` `CreationTime` BIGINT(32) DEFAULT 0;

ALTER TABLE `FUserSession` CHANGE `LoggedTime` `LastActionTime` BIGINT(32) DEFAULT 0;

ALTER TABLE `FUserSession` ADD COLUMN `CreationTime` BIGINT(32) DEFAULT 0;

