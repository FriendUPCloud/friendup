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
 *  User Session
 *
 * file contain definitions related to user sessions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __SYSTEM_USER_USERSESSION_H__
#define __SYSTEM_USER_USERSESSION_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <network/user_session_websocket.h>
#include <system/user/user.h>
#include <websockets/websocket_req_manager.h>
#include <util/friendqueue.h>
#include "user_mobile_app.h"

enum 
{
	USER_SESSION_STATUS_NONE = 0,
	USER_SESSION_STATUS_AUTHORIZING,
	USER_SESSION_STATUS_AUTHORIZED,
	USER_SESSION_STATUS_TO_REMOVE,
	USER_SESSION_STATUS_DELETE_IN_PROGRESS
};

/*
CREATE TABLE IF NOT EXISTS `FUserSession` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `DeviceIdentity` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LastActionTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

//
// user session structure
//

typedef struct UserSession
{
	MinNode					node;
	
	FULONG					us_ID;						// User session ID
	pthread_mutex_t			us_Mutex;					// User mutex
	
	FULONG					us_UserID;					// ID of user to which session is attached
	char					*us_DeviceIdentity;			// device identity
	char					*us_SessionID;				// session id
	time_t					us_LastActionTime;			// last update from user
	time_t					us_CreationTime;			// last login
	int						us_Status;					// session status
	int						us_ChangeState;				// if is in change state
	
	File					*us_OpenedFiles;			// opened files in user session
	
	User					*us_User;					// pointer to user structure
	
	void					*us_SB;						// pointer to systembase
	
	char					us_UserActionInfo[ 512 ];	// last action called
	//char					us_Name[ 256 ];				// session name
	int						us_InUseCounter;			// is session used counter
	WebsocketReqManager		*us_WSReqManager;			// 
	void					*us_DOSToken;				// 
	FULONG					us_MobileAppID;				//
	
	// WEBSOCKETS
	int						us_WebSocketStatus;	// status of websocket
	struct lws				*us_Wsi;				// pointer to WSI
	time_t					us_LastPingTime;		// ping timestamp
	void					*us_WSD;				// pointer to WebsocketData
	FQueue					us_MsgQueue;			// message queue
	
	char					*us_FCID;					// FriendCore ID (ID of session where user session is handled)
}UserSession;

//
//
//

UserSession *UserSessionNew( char *sessid, char *devid, char *fcid );

//
//
//

void UserSessionDelete( UserSession *us );

//
//
//

void UserSessionInit( UserSession *us );

//
//
//

int UserSessionWebsocketWrite( UserSession *us, unsigned char *msgptr, int msglen, int type );

//
//
//

#ifndef IS_SESSION_ADMIN
#define IS_SESSION_ADMIN( us ) ( us->us_User != NULL && us->us_User->u_IsAdmin == TRUE )
#endif

#ifndef USERSESSION_LOCK
#define USERSESSION_LOCK( US ) \
while( US->us_ChangeState != FALSE ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(US->us_Mutex) ) == 0 ){ \
	US->us_InUseCounter++; \
	FRIEND_MUTEX_UNLOCK( &(US->us_Mutex) ); \
}
#endif

#ifndef USERSESSION_UNLOCK
#define USERSESSION_UNLOCK( US ) \
if( FRIEND_MUTEX_LOCK( &(US->us_Mutex) ) == 0 ){ \
	US->us_InUseCounter--; \
	FRIEND_MUTEX_UNLOCK( &(US->us_Mutex) ); \
}
#endif

static FULONG UserSessionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserSession",       
    SQLT_STRUCTSIZE, sizeof( struct UserSession ), 
	SQLT_IDINT,			(FULONG)"ID",				offsetof( struct UserSession, us_ID ), 
	SQLT_INT,			(FULONG)"UserID",			offsetof( struct UserSession, us_UserID ),
	SQLT_STR,			(FULONG)"DeviceIdentity",	offsetof( struct UserSession, us_DeviceIdentity ),
	SQLT_STR,			(FULONG)"SessionID",		offsetof( struct UserSession, us_SessionID ),
	SQLT_INT,			(FULONG)"LastActionTime", 	offsetof( struct UserSession, us_LastActionTime ),
	SQLT_INT,			(FULONG)"CreationTime", 	offsetof( struct UserSession, us_CreationTime ),
	SQLT_INT,			(FULONG)"UMA_ID",			offsetof( struct UserSession, us_MobileAppID ),
	SQLT_STR,			(FULONG)"FCID",				offsetof( struct UserSession, us_FCID ),
	SQLT_INIT_FUNCTION,	(FULONG)"init",				(FULONG)&UserSessionInit,
	SQLT_NODE,			(FULONG)"node",				offsetof( struct UserSession, node ),
	SQLT_END 
};

#endif // __SYSTEM_USER_USERSESSION_H__
