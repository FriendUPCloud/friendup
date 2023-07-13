CREATE TABLE IF NOT EXISTS `FQueuedEvent` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) DEFAULT 0,
  `TargetGroupID` bigint(20) DEFAULT 0,
  `TargetUserID` bigint(20) DEFAULT 0,
  `InviteLinkID` bigint(20) DEFAULT 0,
  `Type` varchar(255) NOT NULL,
  `Date` datetime,
  `Status` varchar(255) NOT NULL DEFAULT '',
  `Title` varchar(32) NOT NULL DEFAULT '',
  `Message` varchar(255) NOT NULL DEFAULT '',
  `ActionSeen` varchar(255) NOT NULL DEFAULT '',
  `ActionAccepted` varchar(255) NOT NULL DEFAULT '',
  `ActionRejected` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

ALTER TABLE FQueuedEvent ADD `InviteLinkID` bigint(20) DEFAULT 0 AFTER `TargetGroupID`;
