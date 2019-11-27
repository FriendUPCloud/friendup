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
	USER_SESSION_STATUS_AUTHORIZED
};

/*
CREATE TABLE IF NOT EXISTS `FUserSession` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `DeviceIdentity` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LoggedTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

//
// user session structure
//

typedef struct UserSession
{
	MinNode					node;
	
	FULONG					us_ID;
	//WebsocketServerClient	*us_WSClients;
	UserSessionWebsocket	*us_WSConnections;
	pthread_mutex_t			us_Mutex;
	
	FULONG					us_UserID;					//
	char					*us_DeviceIdentity;	// device identity
	char					*us_SessionID;			// session id
	time_t					us_LoggedTime;		// last update from user
	int						us_LoginStatus;			// login status
	
	File					*us_OpenedFiles;		// opened files in user session
	
	User					*us_User;					// pointer to user structure
	
	void					*us_SB;   // pointer to systembase
	
	char					us_UserActionInfo[ 512 ];
	char					us_Name[ 256 ];		// session name
	int						us_InUseCounter;
	WebsocketReqManager		*us_WSReqManager;
	void					*us_DOSToken;
	FULONG					us_MobileAppID;
	UserMobileApp			*us_MobileApp;
	//int						us_WebSocketStatus;	// status of websocket
}UserSession;

//
//
//

UserSession *UserSessionNew( char *sessid, char *devid );

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

UserSessionWebsocket *UserSessionRemoveConnection( UserSession *us, UserSessionWebsocket *wscl );

//
//
//

static FULONG UserSessionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserSession",       
    SQLT_STRUCTSIZE, sizeof( struct UserSession ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserSession, us_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserSession, us_UserID ),
	SQLT_STR,     (FULONG)"DeviceIdentity",       offsetof( struct UserSession, us_DeviceIdentity ),
	SQLT_STR,     (FULONG)"SessionID",   offsetof( struct UserSession, us_SessionID ),
	SQLT_INT,     (FULONG)"LoggedTime", offsetof( struct UserSession, us_LoggedTime ),
	SQLT_INT,     (FULONG)"UMA_ID", offsetof( struct UserSession, us_MobileAppID ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&UserSessionInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserSession, node ),
	SQLT_END 
};

#endif // __SYSTEM_USER_USERSESSION_H__
