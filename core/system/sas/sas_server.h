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
 *  Shared Application Session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_SAS_SAS_SESSION_H__
#define __SYSTEM_SAS_SAS_SESSION_H__

#include <time.h>
#include <core/types.h>
#include <db/sqllib.h>
#include <system/user/user.h>
#include <system/user/user_session.h>
#include <system/invar/invar.h>

enum {
	SASS_NEW = 0,
	SASS_DISABLED
};

//
// SAS Server
//

typedef struct SASServer
{
	FULONG				sass_ID;

	char				*sass_IP;
	char				*sass_UID;
	FQUAD				sass_Sessions;
	int					sass_Status;
	
	MinNode				node;
}SASServer;

static const FULONG FSASServerDesc[] = { 
    SQLT_TABNAME, (FULONG)"FSASServer",       SQLT_STRUCTSIZE, sizeof( struct SASServer ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct SASServer, sass_ID ), 
	SQLT_STR,     (FULONG)"IP",          offsetof( struct SASServer, sass_IP ), 
	SQLT_STR,     (FULONG)"UID",         offsetof( struct SASServer, sass_UID ), 
	SQLT_INT,     (FULONG)"Sessions",    offsetof( struct SASServer, sass_Sessions ),
	SQLT_INT,     (FULONG)"Status",      offsetof( struct SASServer, sass_Status ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct SASServer, node ),
	SQLT_END 
};

/*
CREATE TABLE IF NOT EXISTS `FSASServer` (
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`IP` varchar(64) NOT NULL,
	`UID` varchar(256) NOT NULL,
	`Status` smallint(2) DEFAULT NULL,
	`Sessions` bigint(20) NOT NULL,
	PRIMARY KEY (`ID`) , UNIQUE( `UID` )
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1";
*/

//
//
//

SASServer *SASServerNew();

//
//
//

void SASServerDelete( SASServer *serv );

//
// SASSession
//

typedef struct SASSession
{
	FULONG			ss_ID;
	FULONG			ss_ServerID;
	// maybe we should add names of users
	time_t			ss_CreationTime;
	MinNode			node;
}SASSession;

/*
CREATE TABLE IF NOT EXISTS `FSASSession` (
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`ServerID` bigint(20) NOT NULL,
	`CreationTime` bigint(32) NOT NULL,
	PRIMARY KEY (`ID`) 
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1";

*/

static const FULONG FSASSessionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FSASSession",       SQLT_STRUCTSIZE, sizeof( struct SASSession ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct SASSession, ss_ID ), 
	SQLT_INT,     (FULONG)"ServerID",    offsetof( struct SASSession, ss_ServerID ),
	SQLT_INT,     (FULONG)"CreationTime",    offsetof( struct SASSession, ss_CreationTime ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct SASSession, node ),
	SQLT_END 
};

//
//
//

SASSession *SASSessionNew();

//
//
//

void SASSessionDelete( SASSession *serv );

#endif // __APP_SESSION_H__
