/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Cluster Node Defintions
 *
 * All functions related to Cluster Node
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 07/11/2017
 */

#ifndef __COMMUNICATION_CLUSTER_NODE_H__
#define __COMMUNICATION_CLUSTER_NODE_H__

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <communication/comm_service.h>
#include <time.h>

// status

#define COMM_STATUS_INIT				0
#define COMM_STATUS_WORKING				2
#define COMM_STATUS_NO_RESPONSE			4

/*
  CREATE TABLE IF NOT EXISTS `FClusterNode` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FCID` varchar(128),
  `Address` varchar(32),
  `DateCreated` datetime NOT NULL,
  `NodeID` smallint(2),
  `Status` smallint(2),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 */

//
// cluster communication structure
//

typedef struct ClusterNode
{
	MinNode						node;
	FULONG						cn_ID;
	char						*cn_FCID;
	char						*cn_Address;
	struct tm					cn_DateCreated;
	int							cn_NodeID;
	int							cn_Status;
	FConnection					*cn_Connection;
	
}ClusterNode;

static FULONG ClusterNodeDesc[] = {
	SQLT_TABNAME, (FULONG)"FClusterNode",
	SQLT_STRUCTSIZE, sizeof( struct ClusterNode ),
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct ClusterNode, cn_ID ),
	SQLT_STR,     (FULONG)"FCID",    offsetof( struct ClusterNode, cn_FCID ),
	SQLT_STR,     (FULONG)"Address",    offsetof( struct ClusterNode, cn_Address ),
	SQLT_DATETIME,(FULONG)"DateCreated", offsetof( struct ClusterNode, cn_DateCreated ),
	SQLT_INT,     (FULONG)"NodeID", offsetof( struct ClusterNode, cn_NodeID ),
	SQLT_INT,     (FULONG)"Status", offsetof( struct ClusterNode, cn_Status ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct ClusterNode, node ),
	SQLT_END
};

//
//
//

ClusterNode *ClusterNodeNew();

//
//
//

void ClusterNodeDelete( ClusterNode *cc );

//
//
//

void ClusterNodeDeleteAll( ClusterNode *cc );


#endif // __COMMUNICATION_CLUSTER_NODE_H__

