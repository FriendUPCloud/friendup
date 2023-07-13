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
#ifndef __INTERFACE_USER_MANAGER_INTERFACE_H__
#define __INTERFACE_USER_MANAGER_INTERFACE_H__

#include <system/user/user_manager.h>
#include <system/user/user_manager_remote.h>
#include <system/user/user_manager_web.h>
#include <system/usergroup/user_group_manager.h>

typedef struct UserManagerInterface
{
	UserManager			*(*UMNew)( void *sb );
	void				(*UMDelete)( UserManager *smgr );
	int					(*UMAssignGroupToUser)( UserGroupManager *smgr, User *usr );
	int					(*UMAssignGroupToUserByStringDB)( UserGroupManager *smgr, User *usr, char *level, char *workgroups );
	int					(*UMUserUpdateDB)( UserManager *um, User *usr );
	int					(*UMAssignApplicationsToUser)( UserManager *smgr, User *usr );
	User				*(*UMUserGetByNameDB)( UserManager *smgr, const char *name );
	User				*(*UMUserGetByIDDB)( UserManager *um, FULONG id );
	User 				*(*UMGetUserByNameDB)( UserManager *smgr, const char *name );
	int					(*UMUserCreate)( UserManager *smgr, Http *r, User *usr );
	FBOOL				(*UMUserIsAdmin)( UserManager *smgr, Http *r, User *usr );
	FBOOL				(*UMUserIsAdminByAuthID)( UserManager *smgr, Http *r, char *auth );
	User				*(*UMUserCheckExistsInMemory)( UserManager *smgr, User *u );
	FBOOL				(*UMUserExistByNameDB)( UserManager *smgr, const char *name );
	User				*(*UMGetUserByName)( UserManager *um, const char *name );
	FULONG				(*UMGetUserIDByNameDB)( UserManager *um, const char *name );
	User				*(*UMGetUserByID)( UserManager *um, FULONG id );
	void				*(*UMUserGetByAuthIDDB)( UserManager *um, const char *authId );
	User				*(*UMGetAllUsersDB)( UserManager *um );
	int					(*UMAddUser)( UserManager *um,  User *usr );
	int					(*UMRemoveAndDeleteUser)( UserManager *um,  User *usr, UserSessionManager *usm, UserSession *ses );
	FULONG				(*UMGetAllowedLoginTime)( UserManager *um, const char *name );
	FBOOL				(*UMGetLoginPossibilityLastLogins)( UserManager *um, const char *name, char *password, int numberOfFail, time_t *lastLoginTime );
	int					(*UMStoreLoginAttempt)( UserManager *um, const char *name, char *password, const char *info, const char *failReason, char *devicename );
	Http				*(*UMWebRequest)( void *m, char **urlpath, Http* request, UserSession *session, int *result, int *logoutCalled );
	int					(*UMAddGlobalRemoteUser)( UserManager *um, const char *name, const char *sessid, const char *hostname );
	int					(*UMRemoveGlobalRemoteUser)( UserManager *um, const char *name, const char *hostname );
	int					(*UMAddGlobalRemoteDrive)( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteid  );
	int					(*UMRemoveGlobalRemoteDrive)( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName);
}UserManagerInterface;

//
// init function
//

static inline void UserManagerInterfaceInit( UserManagerInterface *si )
{
	si->UMNew = UMNew;
	si->UMDelete = UMDelete;
	si->UMAssignGroupToUser = UGMAssignGroupToUser;	//TODO we should provide other interface
	si->UMAssignGroupToUserByStringDB = UGMAssignGroupToUserByStringDB;	//TODO we should provide other interface
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
	si->UMRemoveAndDeleteUser = UMRemoveAndDeleteUser;
	si->UMWebRequest = UMWebRequest;
	si->UMGetUserByNameDB = UMGetUserByNameDB;
	si->UMGetUserIDByNameDB = UMGetUserIDByNameDB;
	si->UMGetAllowedLoginTime = UMGetAllowedLoginTime;
	si->UMGetLoginPossibilityLastLogins = UMGetLoginPossibilityLastLogins;
	si->UMStoreLoginAttempt = UMStoreLoginAttempt;
	si->UMAddGlobalRemoteUser = UMAddGlobalRemoteUser;
	si->UMRemoveGlobalRemoteUser = UMRemoveGlobalRemoteUser;
	si->UMAddGlobalRemoteDrive = UMAddGlobalRemoteDrive;
	si->UMRemoveGlobalRemoteDrive = UMRemoveGlobalRemoteDrive;
}

#endif
