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
	
	User								*um_Users; 				// logged users with mounted devices
	//UserGroup							*um_UserGroups;			// all user groups
	void 								*um_USM;
	RemoteUser							*um_RemoteUsers;		// remote users and their connections
	User								*um_APIUser;			// API user
	pthread_mutex_t						um_Mutex;
	int									um_ChangeState;			// is in change state add/remove new entry
	int									um_InUse;				// is in use
} UserManager;

//
//
//

#ifndef USER_MANAGER_CHANGE_ON
#define USER_MANAGER_CHANGE_ON( MGR ) \
while( (MGR->um_InUse > 0 && MGR->um_ChangeState == TRUE ) ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(MGR->um_Mutex) ) == 0 ){ \
	MGR->um_ChangeState = TRUE; \
	FRIEND_MUTEX_UNLOCK( &(MGR->um_Mutex) ); \
}
#endif

#ifndef USER_MANAGER_CHANGE_OFF
#define USER_MANAGER_CHANGE_OFF( MGR ) \
if( FRIEND_MUTEX_LOCK( &(MGR->um_Mutex) ) == 0 ){ \
	MGR->um_ChangeState = FALSE; \
	FRIEND_MUTEX_UNLOCK( &(MGR->um_Mutex) ); \
}
#endif

#ifndef USER_MANAGER_USE
#define USER_MANAGER_USE( MGR ) \
while( MGR->um_ChangeState != FALSE ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(MGR->um_Mutex) ) == 0 ){ \
	MGR->um_InUse++; \
	FRIEND_MUTEX_UNLOCK( &(MGR->um_Mutex) ); \
}
#endif

#ifndef USER_MANAGER_RELEASE
#define USER_MANAGER_RELEASE( MGR ) \
if( FRIEND_MUTEX_LOCK( &(MGR->um_Mutex) ) == 0 ){ \
	MGR->um_InUse--; \
	FRIEND_MUTEX_UNLOCK( &(MGR->um_Mutex) ); \
}
#endif


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

User *UMUserGetByID( UserManager *um, FUQUAD id );

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

FULONG UMGetUserIDByNameDB( UserManager *um, const char *name );

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

int UMRemoveAndDeleteUser(UserManager *um, User *usr, UserSessionManager *user_session_manager, UserSession *us );

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

int UMReturnAllUsers( UserManager *um, BufString *bs, char *grname );

//
//
//

void UMRemoveOldUserLoginEntries( UserManager *um );

//
//
//

void UMRemoveRemovedUsersData( UserManager *um );

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

int UMGetActiveUsersWSList( UserManager *um, BufString *bs, FULONG userid, FBOOL usersOnly );

//
//
//

int UMGetAllActiveUsers( UserManager *um, BufString *bs, FBOOL usersOnly );

//
//
//

int UMSendMessageToUserOrSession( UserManager *um, BufString *bs, UserSession *ses, FULONG userid, char *message );

//
//
//

FBOOL UMSendDoorNotification( UserManager *usm, void *notif, UserSession *ses, File *device, char *path );

//
//
//

int UMSendUserChangesNotification( UserManager *um, UserSession *ses );

//
//
//

int UMRemoveOldSessions( void *lsb );

//
//
//

void UMRemoveUsersFromGroup( UserManager *um, FUQUAD groupid );

//
//
//

void UMNotifyAllUsersInGroup( UserManager *um, FQUAD groupid, int type );

//
//
//

void UMAddExistingUsersToGroup( UserManager *um, UserGroup *ug );

//
//
//

int killUserSession( void *l, UserSession *ses, FBOOL remove );

//
//
//

void UMPurgeUserData( UserManager *um, FQUAD id, char *userName );

#endif //__SYSTEM_USER_USER_MANAGER_H__
