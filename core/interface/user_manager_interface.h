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
#ifndef __INTERFACE_USER_MANAGER_INTERFACE_H__
#define __INTERFACE_USER_MANAGER_INTERFACE_H__

#include <system/user/user_manager.h>
#include <system/user/user_manager_remote.h>
#include <system/user/user_manager_web.h>

typedef struct UserManagerInterface
{
	UserManager				*(*UMNew)( void *sb );
	void					(*UMDelete)( UserManager *smgr );
	int						(*UMAssignGroupToUser)( UserManager *smgr, User *usr );
	int						(*UMAssignGroupToUserByStringDB)( UserManager *smgr, User *usr, char *groups );
	int					(*UMUserUpdateDB)( UserManager *um, User *usr );
	int						(*UMAssignApplicationsToUser)( UserManager *smgr, User *usr );
	User					*(*UMUserGetByNameDB)( UserManager *smgr, const char *name );
	User					*(*UMUserGetByIDDB)( UserManager *um, FULONG id );
	User 				*(*UMGetUserByNameDB)( UserManager *smgr, const char *name );
	int						(*UMUserCreate)( UserManager *smgr, Http *r, User *usr );
	FBOOL					(*UMUserIsAdmin)( UserManager *smgr, Http *r, User *usr );
	FBOOL					(*UMUserIsAdminByAuthID)( UserManager *smgr, Http *r, char *auth );
	User						*(*UMUserCheckExistsInMemory)( UserManager *smgr, User *u );
	FBOOL					(*UMUserExistByNameDB)( UserManager *smgr, const char *name );
	User					*(*UMGetUserByName)( UserManager *um, char *name );
	User					*(*UMGetUserByID)( UserManager *um, FULONG id );
	void					*(*UMUserGetByAuthIDDB)( UserManager *um, const char *authId );
	User					*(*UMGetAllUsersDB)( UserManager *um );
	int						(*UMAddUser)( UserManager *um,  User *usr );
	int						(*UMRemoveUser)( UserManager *um,  User *usr );
	FULONG				(*UMGetAllowedLoginTime)( UserManager *um, const char *name );
	FBOOL					(*UMGetLoginPossibilityLastLogins)( UserManager *um, const char *name, int numberOfFail, time_t *lastLoginTime );
	int						(*UMStoreLoginAttempt)( UserManager *um, const char *name, const char *info, const char *failReason );
	Http					*(*UMWebRequest)( void *m, char **urlpath, Http* request, UserSession *session, int *result );
	int					(*UMAddGlobalRemoteUser)( UserManager *um, const char *name, const char *sessid, const char *hostname );
	int					(*UMRemoveGlobalRemoteUser)( UserManager *um, const char *name, const char *hostname );
	int					(*UMAddGlobalRemoteDrive)( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteid  );
	int					(*UMRemoveGlobalRemoteDrive)( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName);
}UserManagerInterface;

//
// init function
//

inline void UserManagerInterfaceInit( UserManagerInterface *si )
{
	si->UMNew = UMNew;
	si->UMDelete = UMDelete;
	si->UMAssignGroupToUser = UMAssignGroupToUser;
	si->UMAssignGroupToUserByStringDB = UMAssignGroupToUserByStringDB;
	si->UMUserUpdateDB = UMUserUpdateDB;
	si->UMAssignApplicationsToUser = UMAssignApplicationsToUser;
	si->UMUserGetByNameDB = UMUserGetByNameDB;
	si->UMUserGetByIDDB = UMUserGetByIDDB;
	si->UMUserCreate = UMUserCreate;
	si->UMUserIsAdmin = UMUserIsAdmin;
	si->UMUserIsAdminByAuthID = UMUserIsAdminByAuthID;
	si->UMUserCheckExistsInMemory = UMUserCheckExistsInMemory;
	si->UMUserExistByNameDB = UMUserExistByNameDB;
	si->UMGetUserByName = UMGetUserByName;
	si->UMGetUserByID = UMGetUserByID;
	si->UMUserGetByAuthIDDB = UMUserGetByAuthIDDB;
	si->UMGetAllUsersDB = UMGetAllUsersDB;
	si->UMAddUser = UMAddUser;
	si->UMRemoveUser = UMRemoveUser;
	si->UMWebRequest = UMWebRequest;
	si->UMGetUserByNameDB = UMGetUserByNameDB;
	si->UMGetAllowedLoginTime = UMGetAllowedLoginTime;
	si->UMGetLoginPossibilityLastLogins = UMGetLoginPossibilityLastLogins;
	si->UMStoreLoginAttempt = UMStoreLoginAttempt;
	si->UMAddGlobalRemoteUser = UMAddGlobalRemoteUser;
	si->UMRemoveGlobalRemoteUser = UMRemoveGlobalRemoteUser;
	si->UMAddGlobalRemoteDrive = UMAddGlobalRemoteDrive;
	si->UMRemoveGlobalRemoteDrive = UMRemoveGlobalRemoteDrive;
}

#endif