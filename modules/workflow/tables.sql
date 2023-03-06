CREATE TABLE ProcessWorkflow (
  `ID` bigint(20) NOT NULL auto_increment,
  `Name` varchar(255) NOT NULL default "Unnamed",
  `Workgroup` varchar(255) NOT NULL,
  `DateFrom` datetime,
  `DateTo` datetime,
  PRIMARY KEY(ID)
);
CREATE TABLE ProcessNode (
  `ID` bigint(20) NOT NULL auto_increment,
  `UniqueID` varchar(255) default "",
  `WorkflowID` bigint(20) NOT NULL,
  `Title` varchar(255) default "Unnamed",
  `Label` varchar(255) default "Unnamed",
  `DataDriver` varchar(255),
  `Data` text,
  `ProcessNodeTrue` bigint(20) NOT NULL,
  `ProcessNodeFalse` bigint(20) NOT NULL,
  `ProcessNodeOnLabel` tinyint(4),
  `Tail` tinyint(4),
  PRIMARY KEY(ID)
);
CREATE TABLE ProcessPipeline (
  `ID` bigint(20) NOT NULL auto_increment,
  `ProcessID` bigint(20) NOT NULL,
  `PreviousProcessID` bigint(20) NOT NULL,
  `Date` datetime,
  `Workgroup` varchar(255) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `End` tinyint(4) NOT NULL,
  PRIMARY KEY(ID)
);
