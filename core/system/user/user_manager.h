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
#include "user_group.h"
#include "user.h"
#include "remote_user.h"

//
// User Session Manager structure
//

typedef struct UserManager
{
	void										*um_SB;
	
	User										*um_Users; 						// logged users with mounted devices
	UserGroup							*um_UserGroups;			// all user groups
	void 										*um_USM;
	RemoteUser							*um_RemoteUsers;		// remote users and their connections
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

User *UMGetUserByName( UserManager *um, char *name );

//
//
//

User *UMGetUserByNameDB( UserManager *um, const char *name );

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

int  UMRemoveUser( UserManager *um,  User *usr );

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

int UMAddRemoteUser( UserManager *um, const char *name, const char *sessid, const char *hostname );

//
//
//

int UMRemoveRemoteUser( UserManager *um, const char *name, const char *hostname );

//
//
//

int UMAddRemoteDrive( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName );

//
//
//

int UMRemoveRemoteDrive( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName );

//
//
//

int UMAddRemoteDriveToUser( UserManager *um, CommFCConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName );

//Http *UMWebRequest( void *m, char **urlpath, Http* request, UserSession *session, int *result );


// get user by auth id
//UserSession *UserGetByAuthID( UserDBManager *usm, const char *authId );
// get users by timeout
//User *UDBMUserGetByTimeout( UserDBManager *smgr, const FULONG timeout );

// get by user id
//User 							*(*UserGetByID)( UserDBManager *usm, FULONG id );
// get user by his name
//void								*(*UserGetByName)( UserDBManager *usm, const char *name );


#endif //__SYSTEM_USER_USER_MANAGER_H__
