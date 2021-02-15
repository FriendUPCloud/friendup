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
 *  Application session
 *
 * file contain definitions related to application session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/2021
 */

#ifndef __SYSTEM_APPLICATION_APPSESSION_H__
#define __SYSTEM_APPLICATION_APPSESSION_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <network/user_session_websocket.h>
#include <system/user/user.h>
#include <websockets/websocket_req_manager.h>
#include <util/friendqueue.h>

/*
CREATE TABLE IF NOT EXISTS `FAppSession` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `UserApplicationID` bigint(32) NOT NULL,
  `AuthID` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

//
// application session structure
//

typedef struct AppSession
{
	MinNode					node;
	
	FULONG					as_ID;						// User session ID
	pthread_mutex_t			as_Mutex;					// User mutex
	
	FQUAD					as_UserID;					// ID of user to which session is attached
	FQUAD					as_UserApplicationID;		// ID of application to which session is attached
	User					*as_User;					// pointer to User structure
	char					*as_AuthID;					// authentication ID
	char					*as_HashedAuthID;			// hashed authentication id
	int						as_InUse;					// in use
	time_t					as_CreateTime;				// last update from user
}AppSession;

//
//
//

AppSession *AppSessionNew( void *sb, FQUAD applicationID, FQUAD userID, char *authid );

//
//
//

void AppSessionDelete( AppSession *as );

//
//
//

void AppSessionInit( AppSession *as, void *sb );

//
//
//

void AppSessionRegenerateAuthID( AppSession *as, void *sb );

//
//
//

static FULONG AppSessionDesc[] = { 
	SQLT_TABNAME, (FULONG)"FAppSession",       
	SQLT_STRUCTSIZE, sizeof( struct AppSession ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct AppSession, as_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct AppSession, as_UserID ),
	SQLT_INT,     (FULONG)"UserApplicationID", offsetof( struct AppSession, as_UserApplicationID ),
#ifdef DB_SESSIONID_HASH
	SQLT_STR_HASH,(FULONG)"AuthID",   offsetof( struct AppSession, as_AuthID ),
#else
	SQLT_STR,     (FULONG)"AuthID",   offsetof( struct AppSession, as_AuthID ),
#endif
	SQLT_INT,     (FULONG)"LoggedTime", offsetof( struct AppSession, as_CreateTime ),

	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&AppSessionInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct AppSession, node ),
	SQLT_END 
};

#endif // __SYSTEM_APPLICATION_APPSESSION_H__

