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
 *  User Session App
 *
 * file contain definitions related to user sessions app
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 25/07/2016
 */

#ifndef __SYSTEM_USER_USERSESSION_APP_H__
#define __SYSTEM_USER_USERSESSION_APP_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <network/websocket_client.h>
#include <system/user/user_session.h>
#include <system/user/user.h>
#include <websockets/websocket_req_manager.h>
#include <util/friendqueue.h>
#include <system/application/application.h>

/*
CREATE TABLE IF NOT EXISTS `FUserSessionApp` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `UserSessionID` bigint(32) NOT NULL,
  `ApplicationID` bigint(32) NOT NULL,
  `DeviceIdentity` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT AUTO_INCREMENT=1 ;

*/

//
// user session app structure
//

typedef struct UserSessionApp
{
	MinNode					node;
	
	FULONG					usa_ID;
	FULONG					usa_UserID;
	User					*usa_User;
	FULONG					usa_UserSessionID;
	UserSession				*usa_UserSession;
	FULONG					usa_ApplicationID;
	Application				*usa_Application;
	WebsocketServerClient	*us_WSClients;
	pthread_mutex_t			us_Mutex;
	
	char					*usa_DeviceIdentity;
	time_t					usa_CreateTime;		// create time
}UserSessionApp;

//
//
//

UserSessionApp *UserSessionAppNew( UserSession *us, FULONG appID );

//
//
//

void UserSessionAppDelete( UserSessionApp *us );

//
//
//

void UserSessionAppInit( UserSessionApp *us );

//
//
//

static FULONG UserSessionAppDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserSessionApp",       
    SQLT_STRUCTSIZE, sizeof( struct UserSessionApp ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserSessionApp, usa_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserSessionApp, usa_UserID ),
	SQLT_INT,     (FULONG)"UserSessionID", offsetof( struct UserSessionApp, usa_UserSessionID ),
	SQLT_INT,     (FULONG)"ApplicationID", offsetof( struct UserSessionApp, usa_ApplicationID ),
	SQLT_STR,     (FULONG)"DeviceIdentity",       offsetof( struct UserSessionApp, usa_DeviceIdentity ),
	SQLT_INT,     (FULONG)"CreateTime", offsetof( struct UserSessionApp, usa_CreateTime ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&UserSessionAppInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserSessionApp, node ),
	SQLT_END 
};

#endif // __SYSTEM_USER_USERSESSION_APP_H__
