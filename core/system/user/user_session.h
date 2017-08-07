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

#include <mysql/sql_defs.h>
#include <system/user/user_application.h>
#include <network/websocket_client.h>
#include <system/user/user.h>

enum 
{
	USER_SATATUS_NONE = 0,
	USER_STATUS_AUTHORIZING,
	USER_STATUS_AUTHORIZED
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
	MinNode                node;
	
	FULONG                 us_ID;
	WebsocketClient        *us_WSConnections;
	pthread_mutex_t        us_WSMutex;
	
	FULONG                 us_UserID;					//
	char                   *us_DeviceIdentity;	// device identity
	char                   *us_SessionID;			// session id
	time_t                 us_LoggedTime;		// last update from user
	int                    us_LoginStatus;			// login status
	
	File                   *us_OpenedFiles;		// opened files in user session
	
	User                   *us_User;					// pointer to user structure
	
	void                   *us_SB;   // pointer to systembase
	
	char                   us_UserActionInfo[ 512 ];
	FLONG                  us_NRConnections;
	
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

static FULONG UserSessionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserSession",       
    SQLT_STRUCTSIZE, sizeof( struct UserSession ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserSession, us_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserSession, us_UserID ),
	SQLT_STR,     (FULONG)"DeviceIdentity",       offsetof( struct UserSession, us_DeviceIdentity ),
	SQLT_STR,     (FULONG)"SessionID",   offsetof( struct UserSession, us_SessionID ),
	SQLT_INT,     (FULONG)"LoggedTime", offsetof( struct UserSession, us_LoggedTime ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&UserSessionInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserSession, node ),
	SQLT_END 
};

#endif // __SYSTEM_USER_USERSESSION_H__
