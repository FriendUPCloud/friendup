/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Communcation Service Security Defintions
 *
 * All functions related to CommCERT structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/09/2016
 */

#ifndef __SECURITY_COMM_CERT_H__
#define __SECURITY_COMM_CERT_H__

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

/*
  CREATE TABLE IF NOT EXISTS `FConnectionInfo` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL DEFAULT '0',
  `Access` tinyint NOT NULL DEFAULT '0',
  `FCID` varchar(128),
  `DestinationFCID` varchar(128),
  `Address` varchar(32),
  `SSLInfo` varchar(255),
  `DateCreated` datetime NOT NULL,
  `PEM` text,
  `ClusterID` smallint(2),
  `Status` smallint(2),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 */

/*
// Access status

#define CONNECTION_ACCESS_NONE	0
#define CONNECTION_ACCESS_READ	2
#define CONNECTION_ACCESS_WRITE	4

// Connection status

#define CONNECTION_STATUS_NONE			0
#define CONNECTION_STATUS_CONNECTING	1
#define CONNECTION_STATUS_CONNECTED		2
#define CONNECTION_STATUS_DISCONNECTED	3
#define CONNECTION_STATUS_REJECTED		4

//TODO currently we are not checking access, because there is no GUI to manage that

//
// comm cert structure
//

typedef struct ConnectionInfo
{
	MinNode						node;
	FULONG						ci_ID;
	FULONG						ci_UserID;
	int							ci_Access;
	char						*ci_FCID;
	char						*ci_DestinationFCID;
	char						*ci_Address;
	char						*ci_SSLInfo;
	struct tm					ci_DateCreated;
	char						*ci_PEM;
	FULONG						ci_ClusterID;		// 0 - normal connection, 1 - cluster master, > 1 - cluster node
	int							ci_Status;			// connection status
	uint64_t					ci_PINGTime;
}ConnectionInfo;

//
//
//

static FULONG ConnectionInfoDesc[] = { 
	SQLT_TABNAME, (FULONG)"FConnectionInfo",       
	SQLT_STRUCTSIZE, sizeof( struct ConnectionInfo ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct ConnectionInfo, ci_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct ConnectionInfo, ci_UserID ),
	SQLT_STR,     (FULONG)"Access",        offsetof( struct ConnectionInfo, ci_Access ),
	SQLT_STR,     (FULONG)"FCID",    offsetof( struct ConnectionInfo, ci_FCID ),
	SQLT_STR,     (FULONG)"DestinationFCID",    offsetof( struct ConnectionInfo, ci_DestinationFCID ),
	SQLT_STR,     (FULONG)"Address",    offsetof( struct ConnectionInfo, ci_Address ),
	SQLT_STR,     (FULONG)"SSLInfo", offsetof( struct ConnectionInfo, ci_SSLInfo ),
	SQLT_DATETIME,(FULONG)"DateCreated", offsetof( struct ConnectionInfo, ci_DateCreated ),
	SQLT_STR,     (FULONG)"PEM", offsetof( struct ConnectionInfo, ci_PEM ),
	SQLT_INT,     (FULONG)"ClusterID", offsetof( struct ConnectionInfo, ci_ClusterID ),
	SQLT_INT,     (FULONG)"Status", offsetof( struct ConnectionInfo, ci_Status ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct ConnectionInfo, node ),
	SQLT_END 
};
*/

//
//
//
/*
ConnectionInfo *ConnectionInfoNew();

//
//
//

void ConnectionInfoDelete( ConnectionInfo *cc );

//
//
//

void ConnectionInfoDeleteAll( ConnectionInfo *cc );
*/


#endif // __SECURITY_COMM_CERT_H__
