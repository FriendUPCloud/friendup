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
 *  UserSessionManager structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_USER_USER_SESSIONMANAGER_H__
#define __SYSTEM_USER_USER_SESSIONMANAGER_H__

#include <core/types.h>
#include "user_session.h"
#include "user_group.h"
#include "user.h"

//
// User Session Manager structure
//

typedef struct UserSessionManager
{
	void							*usm_SB;
	UserSession						*usm_Sessions;							// user sessions
	int								usm_SessionCounter;
	void 							*usm_UM;
	
	pthread_mutex_t					usm_Mutex;		// mutex
} UserSessionManager;


//
// Create new UserSessionManager
//

UserSessionManager *USMNew( void *sb );

//
// delete ServiceManager
//

void USMDelete( UserSessionManager *smgr );

//
//
//

User *USMGetUserBySessionID( UserSessionManager *usm, char *sessionid );

//
//
//

UserSession *USMGetSessionBySessionID( UserSessionManager *usm, char *id );

//
//
//

UserSession *USMGetSessionBySessionIDFromDB( UserSessionManager *usm, char *id );

//
//
//

UserSession *USMGetSessionByDeviceIDandUser( UserSessionManager *usm, char *devid, FULONG uid );

//
//
//

UserSession *USMGetSessionByDeviceIDandUserDB( UserSessionManager *usm, char *devid, FULONG uid );

//
//
//

void USMLogUsersAndDevices( UserSessionManager *usm );

//
//
//

UserSession *USMGetSessionByUserID( UserSessionManager *usm, FULONG id );

//
//
//

UserSession *USMGetSessionsByTimeout( UserSessionManager *smgr, const FULONG timeout );

//
//
//

int USMAddFile( UserSessionManager *smgr, UserSession *ses, File *f );

//
//
//

int USMRemFile( UserSessionManager *smgr, UserSession *ses, FULONG id );

//
//
//

File *USMGetFile( UserSessionManager *smgr, UserSession *ses, FULONG id );

//
//
//

UserSession *USMUserSessionAddToList( UserSessionManager *smgr, UserSession *s );

//
//
//

UserSession *USMUserSessionAdd( UserSessionManager *smgr, UserSession *s );

//
//
//

int USMUserSessionRemove( UserSessionManager *smgr, UserSession *s );

//
//
//

int USMSessionSaveDB( UserSessionManager *smgr, UserSession *ses );

//
//
//

char *USMUserGetFirstActiveSessionID( UserSessionManager *smgr, User *usr );

//
//
//

void USMDebugSessions( UserSessionManager *smgr );

//
//
//

int USMRemoveOldSessions( void *lsb );

//
//
//

int USMRemoveOldSessionsinDB( void *lsb );

//
//
//

FBOOL USMSendDoorNotification( UserSessionManager *usm, void *notification, File *device, char *path );

//
// get user by auth id
//

UserSession *UserGetByAuthID( UserSessionManager *usm, const char *authId );

//
// get users by timeout
//

User *UserGetByTimeout( UserSessionManager *usm, const FULONG timeout );

//
// get by user id
//

User *UserGetByID( UserSessionManager *usm, FULONG id );

//
// Close unused Websocket connection
//

void USMCloseUnusedWebSockets( UserSessionManager *usm );

#endif //__SYSTEM_USER_USER_SESSIONMANAGER_H__
