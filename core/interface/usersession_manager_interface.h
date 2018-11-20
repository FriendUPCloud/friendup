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
	File						*(*USMGetFile)( UserSessionManager *smgr, UserSession *ses, FULONG id );
	UserSession					*(*USMUserSessionAdd)( UserSessionManager *smgr, UserSession *s );
	int							(*USMUserSessionRemove)( UserSessionManager *smgr, UserSession *s );
	int							(*USMSessionSaveDB)( UserSessionManager *smgr, UserSession *ses );
	char						*(*USMUserGetFirstActiveSessionID)( UserSessionManager *smgr, User *usr );
	void						(*USMDebugSessions)( UserSessionManager *smgr );
}UserSessionManagerInterface;

//
// init function
//

static inline void UserSessionManagerInterfaceInit( UserSessionManagerInterface *si )
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
}

#endif
