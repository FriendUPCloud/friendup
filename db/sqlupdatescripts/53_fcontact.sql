CREATE TABLE IF NOT EXISTS `FContact` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `OwnerUserID` bigint(20) NOT NULL,
  `OwnerGroupID` bigint(20) NOT NULL,
  `UserID` varchar(255) NOT NULL,
  `Firstname` varchar(255) NOT NULL,
  `Lastname` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Mobile` varchar(255) NOT NULL,
  `Address1` varchar(255) NOT NULL,
  `Address2` varchar(255) NOT NULL,
  `Postcode` varchar(255) NOT NULL,
  `County` varchar(255) NOT NULL,
  `City` varchar(255) NOT NULL,
  `State` varchar(255) NOT NULL,
  `Country` varchar(255) NOT NULL,
  `Sex` varchar(255) NOT NULL,
  `Company` varchar(255) NOT NULL,
  `Comment` text,
  `SOME` text,
  `DateCreated` datetime,
  `DateTouched` datetime,
  `Avatar` longtext NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `FContactAttribute` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ContactID` bigint(20) NOT NULL,
  `UserID` varchar(255) NOT NULL,
  `Attribute` varchar(255) NOT NULL,
  `ValueString` text,
  `ValueNumber` bigint(20) NOT NULL,
  `ValueFloat` float(7,4) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `FContactParticipation` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ContactID` bigint(20) NOT NULL,
  `EventID` bigint(20) NOT NULL,
  `Time` datetime,
  `Token` varchar(255) NOT NULL,
  `Message` text,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

ALTER TABLE `FUser` ADD `Timezone` varchar(255) NOT NULL default "Europe/Oslo" AFTER `Email`;
