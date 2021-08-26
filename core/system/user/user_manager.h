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
#include "usersession.h"
#include <system/usergroup/user_group.h>
#include "usersession_manager.h"
#include "user.h"
#include "remote_user.h"
#include <util/hashmap_kint.h>

//
// User Session Manager structure
//

typedef struct UserManager
{
	void								*um_SB;
	
	User								*um_Users; 						// logged users with mounted devices
	
	HMapKInt							um_UsersMapByID;
	
	//UserGroup							*um_UserGroups;			// all user groups
	void 								*um_USM;
	RemoteUser							*um_RemoteUsers;		// remote users and their connections
	User								*um_APIUser;	// API user
	pthread_mutex_t						um_Mutex;
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

User *UMGetUserByUUIDDB( UserManager *um, const char *uuid, FBOOL loadAndAssign );

//
//
//

User *UMGetOnlyUserByUUIDDB( UserManager *um, const char *uuid );

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

void UMRemoveUserFromList( UserManager *um,  User *usr );

//
//
//

int UMRemoveAndDeleteUser(UserManager *um, User *usr, UserSessionManager *user_session_manager);

//
//
//

FULONG UMGetAllowedLoginTime( UserManager *um, const char *name );

//
//
//

FBOOL UMGetLoginPossibilityLastLogins( UserManager *um, const char *name, char *password, int numberOfFail, time_t *lastLoginTime );

//
//
//

int UMStoreLoginAttempt( UserManager *um, const char *name, char *password, const char *info, const char *failReason, char *devicename );

//
//
//

int UMCheckAndLoadAPIUser( UserManager *um );

//
//
//

int UMFindUserByNameAndAddToSas( UserManager *um, char *uname, void *las, char *appName, char *msg, BufString *usersAdded, FBOOL listNotEmpty );

//
//
//

int UMReturnAllUsers( UserManager *um, BufString *bs, char *grname );

//
//
//

int UMGetUserStatistic( UserManager *um, BufString *bs, FBOOL details );

//
//
//

int UMInitUsers( UserManager *um );

//
//
//

FBOOL UMUserExistInDBByID( UserManager *um, FQUAD id );

//
//
//

int UMGetActiveUsersWSList( UserManager *um, BufString *bs, FULONG userid, FBOOL usersOnly );

//
//
//

int UMGetAllActiveUsers( UserManager *um, BufString *bs, FBOOL usersOnly );

//
//
//

int UMSendMessageToUserOrSession( UserManager *um, BufString *bs, UserSession *ses, FULONG userid, char *message );

#endif //__SYSTEM_USER_USER_MANAGER_H__
