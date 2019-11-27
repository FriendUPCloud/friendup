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
 *  User Manager
 *
 * file contain definitions related to UserManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __SYSTEM_USER_USER_MANAGER_H__
#define __SYSTEM_USER_USER_MANAGER_H__

#include <core/types.h>
#include "user_session.h"
#include <system/usergroup/user_group.h>
#include "user_sessionmanager.h"
#include "user.h"
#include "remote_user.h"

//
// User Session Manager structure
//

typedef struct UserManager
{
	void								*um_SB;
	
	User								*um_Users; 						// logged users with mounted devices
	//UserGroup							*um_UserGroups;			// all user groups
	void 								*um_USM;
	RemoteUser							*um_RemoteUsers;		// remote users and their connections
	User								*um_APIUser;	// API user
} UserManager;


//
// Create new UserManager
//

UserManager *UMNew( void *sb );

//
// delete UserManager
//

void UMDelete( UserManager *smgr );

//
//
//

int UMAssignGroupToUser( UserManager *smgr, User *usr );

//
//
//

int UMAssignGroupToUserByStringDB( UserManager *smgr, User *usr, char *groups );

//
//
//

int UMUserUpdateDB( UserManager *um, User *usr );

//
// assign user to group
//


int UMAssignApplicationsToUser( UserManager *smgr, User *usr );

//
//
//

User * UMUserGetByName( UserManager *um, const char *name );

//
//
//

User *UMGetUserByNameDBCon( UserManager *um, SQLLibrary *sqlLib, const char *name );

//
//
//

User * UMUserGetByNameDB( UserManager *smgr, const char *name );

//
//
//

User * UMUserGetByIDDB( UserManager *um, FULONG id );


//
// Create user in database
//

int UMUserCreate( UserManager *smgr, Http *r, User *usr );

//
// is user in admin group
//

FBOOL UMUserIsAdmin( UserManager *smgr, Http *r, User *usr );

//
// is user in admin group
//

FBOOL UMUserIsAdminByAuthID( UserManager *smgr, Http *r, char *auth );

//
//
//

User *UMUserCheckExistsInMemory( UserManager *smgr, User *u );

//
//
//

FBOOL UMUserExistByNameDB( UserManager *smgr, const char *name );

//
//
//

User *UMGetUserByName( UserManager *um, const char *name );

//
//
//

FULONG UMGetUserIDByName( UserManager *um, const char *name );

//
//
//

User *UMGetUserByNameDB( UserManager *um, const char *name );

//
//
//

User *UMGetUserByUUIDDB( UserManager *um, const char *name );

//
//
//

User *UMGetUserByIDDB( UserManager *um, FULONG id );

//
//
//

User *UMGetUserByID( UserManager *um, FULONG id );

//
//
//

void *UMUserGetByAuthIDDB( UserManager *um, const char *authId );

//
//
//

User *UMGetAllUsersDB( UserManager *um );

//
//
//

int  UMAddUser( UserManager *um,  User *usr );

//
//
//

int UMRemoveUser(UserManager *um, User *usr, UserSessionManager *user_session_manager);

//
//
//

FULONG UMGetAllowedLoginTime( UserManager *um, const char *name );

//
//
//

FBOOL UMGetLoginPossibilityLastLogins( UserManager *um, const char *name, int numberOfFail, time_t *lastLoginTime );

//
//
//

int UMStoreLoginAttempt( UserManager *um, const char *name, const char *info, const char *failReason );

//
//
//

int UMCheckAndLoadAPIUser( UserManager *um );

//
//
//

int UMReturnAllUsers( UserManager *um, BufString *bs, char *grname );

#endif //__SYSTEM_USER_USER_MANAGER_H__
