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
 *  Http Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 02/01/2017
 */
#ifndef __INTERFACE_USERSESSION_MANAGER_INTERFACE_H__
#define __INTERFACE_USERSESSION_MANAGER_INTERFACE_H__

#include <system/user/user_sessionmanager.h>

typedef struct UserSessionManagerInterface
{
	UserSessionManager			*(*USMNew)( void *sb );
	void						(*USMDelete)( UserSessionManager *smgr );
	User						*(*USMGetUserBySessionID)( UserSessionManager *usm, char *sessionid );
	UserSession					*(*USMGetSessionBySessionID)( UserSessionManager *usm, char *id );
	UserSession					*(*USMGetSessionByDeviceIDandUser)( UserSessionManager *usm, char *devid, FULONG uid );
	void						(*USMLogUsersAndDevices)( UserSessionManager *usm );
	UserSession					*(*USMGetSessionByUserID)( UserSessionManager *usm, FULONG id );
	UserSession					*(*USMGetSessionsByTimeout)( UserSessionManager *smgr, const FULONG timeout );
	int							(*USMAddFile)( UserSessionManager *smgr, UserSession *ses, File *f );
	int							(*USMRemFile)( UserSessionManager *smgr, UserSession *ses, FULONG id );
	File							*(*USMGetFile)( UserSessionManager *smgr, UserSession *ses, FULONG id );
	UserSession				*(*USMUserSessionAdd)( UserSessionManager *smgr, UserSession *s );
	int							(*USMUserSessionRemove)( UserSessionManager *smgr, UserSession *s );
	int							(*USMSessionSaveDB)( UserSessionManager *smgr, UserSession *ses );
	char						*(*USMUserGetFirstActiveSessionID)( UserSessionManager *smgr, User *usr );
	void						(*USMDebugSessions)( UserSessionManager *smgr );
	//UserSession					*(*UserGetByAuthID)( UserSessionManager *usm, const char *authId );
}UserSessionManagerInterface;

//
// init function
//

inline void UserSessionManagerInterfaceInit( UserSessionManagerInterface *si )
{
	si->USMNew = USMNew;
	si->USMDelete = USMDelete;
	si->USMGetUserBySessionID = USMGetUserBySessionID;
	si->USMGetSessionBySessionID = USMGetSessionBySessionID;
	si->USMGetSessionByDeviceIDandUser = USMGetSessionByDeviceIDandUser;
	si->USMLogUsersAndDevices = USMLogUsersAndDevices;
	si->USMGetSessionByUserID = USMGetSessionByUserID;
	si->USMGetSessionsByTimeout = USMGetSessionsByTimeout;
	si->USMAddFile = USMAddFile;
	si->USMRemFile = USMRemFile;
	si->USMGetFile = USMGetFile;
	si->USMUserSessionAdd = USMUserSessionAdd;
	si->USMUserSessionRemove = USMUserSessionRemove;
	si->USMSessionSaveDB = USMSessionSaveDB;
	si->USMUserGetFirstActiveSessionID = USMUserGetFirstActiveSessionID;
	si->USMDebugSessions = USMDebugSessions;
	//si->UserGetByAuthID = UserGetByAuthID;
}

#endif
