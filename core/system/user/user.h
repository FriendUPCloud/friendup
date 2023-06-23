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
 *  User definitions
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __SYSTEM_USER_USER_H__
#define __SYSTEM_USER_USER_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <system/usergroup/user_group.h>
#include <system/fsys/file.h>
#include <libwebsockets.h>
#include <network/websocket_client.h>
#include <system/services/service.h>
#include <hardware/printer/printer.h>
#include <time.h>
#include "remote_user.h"
#include <network/locfile.h>
#include <system/cache/cache_user_files.h>

/*
 CREATE TABLE IF NOT EXISTS `FUserLogin` ( 
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`UserID` bigint(32) NOT NULL,
	`Login` varchar(255) NOT NULL,
	`Failed` varchar(255) DEFAULT NULL,
	`Information` TEXT DEFAULT NULL,
	`LoginTime` bigint(32) NOT NULL,
	`Device` varchar(255) DEFAULT NULL,
	`Password' varchar(255) DEFAULT NULL,
	PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
	 */

//
// user structure
//

typedef struct UserLogin
{
	MinNode						node;
	FULONG						ul_ID;
	FULONG						ul_UserID;
	char						*ul_Login;
	char						*ul_Failed;
	char						*ul_Information;
	char						*ul_Device;
	char						*ul_Password;
	time_t						ul_LoginTime;
}UserLogin;

//
//
//

static FULONG UserLoginDesc[] = {
	SQLT_TABNAME, (FULONG)"FUserLogin",
	SQLT_STRUCTSIZE, sizeof( struct UserLogin ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserLogin, ul_ID ),
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserLogin, ul_UserID ),
	SQLT_STR,     (FULONG)"Login",        offsetof( struct UserLogin, ul_Login ),
	SQLT_STR,     (FULONG)"Failed",    offsetof( struct UserLogin, ul_Failed ),
	SQLT_STR,     (FULONG)"Information",    offsetof( struct UserLogin, ul_Information ),
	SQLT_INT,     (FULONG)"LoginTime", offsetof( struct UserLogin, ul_LoginTime ),
	SQLT_STR,     (FULONG)"Device",    offsetof( struct UserLogin, ul_Device ),
	SQLT_STR,     (FULONG)"Password",    offsetof( struct UserLogin, ul_Password ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserLogin, node ),
	SQLT_END 
};

//
// Link user to group
//

typedef struct UserGroupLink
{
	MinNode				node;
	UserGroup 			*ugl_Group;
	FULONG				ugl_GroupID;
}UserGroupLink;

/*
CREATE TABLE IF NOT EXISTS `FriendMaster.FUser` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `FullName` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LastActionTime` bigint(32) NOT NULL,
  `CreatedTime` bigint(32) NOT NULL,
  `LoginTime` bigint(32) NOT NULL,
  `UUID` varchar(255) DEFAULT NULL,
  `Status` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

typedef struct UserSessListEntry
{
	void 			*us;
	MinNode			node;
}UserSessListEntry;

enum {
USER_STATUS_ENABLED = 0,
USER_STATUS_DISABLED,
USER_STATUS_BLOCKED,
USER_STATUS_TO_BE_REMOVED
};

//
// user structure
//

typedef struct User
{
	MinNode						node;
	FULONG						u_ID;
	char						*u_Name;
	char						*u_Password;
	char						*u_FullName;
	char						*u_Email;
	int							u_Error;						// if error
	UserSessListEntry			*u_SessionsList;
	FULONG						u_Status;						// user status

	//char						*u_MainSessionID;				// session id ,  generated only when user is taken from db
	time_t						u_LastActionTime;       		// last action time
	time_t						u_CreationTime;					// when user strcture was created
	time_t						u_LoginTime;					// last login time
	time_t						u_ModifyTime;					// when user structure was modifiede
	
	File						*u_MountedDevs;     			// root file
	int							u_MountedDevsNr;				// number of mounted devices
	File						*u_WebDAVDevs;					// shared webdav resources 
	int							u_WebDAVDevsNr;					// number of mounted webdav drives
	
	UserGroupLink				*u_UserGroupLinks;				// user groups which have drives
	//UserGroup					**u_Groups;						// pointer to groups to which user is assigned (table of pointers)
	//int							u_GroupsNr;					// number of assigned groups
	UserApplication				*u_Applications;				// pointer to application settings
	FPrinter					*u_Printers;					// user printers
	
	FBOOL						u_InitialDevMount;
	FBOOL						u_Anonymous;					// if user is anonymous
	
	int							u_SessionsNr;					// number of sessions
	int							u_NumberOfBadLogins;			// number of bad logins
	
	RemoteUser					*u_RemoteUsers;					// user which use this account to have access to resources
	FBOOL						u_IsAdmin;						// set to TRUE when user is in Admin group
	FBOOL						u_IsAPI;						// set to TRUE when user is in API group
	
	pthread_mutex_t				u_Mutex;						// User structure mutex
	CacheUserFiles				*u_FileCache;					// internal file cache
	
	FLONG						u_MaxBytesStorPerDevice;		// maximum bytes stored per device (0-unlimited)
	FLONG						u_MaxBytesReadPerDevice;		// maximum bytes read per device
	
	char						*u_UUID;						// unique ID
	char						*u_Timezone;					// timezone
	int							u_InUse;						// usage counter
	FBOOL						u_ChangeState;					// if user session list is in change state
	FBOOL						u_MountDriveInProgress;			// if something is trying to mount device on user
} User;

//
//
//

#ifndef USER_CHANGE_ON
#define USER_CHANGE_ON( USR ) \
while( ( USR->u_InUse > 0 && USR->u_ChangeState == TRUE ) ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(USR->u_Mutex) ) == 0 ){ \
	USR->u_ChangeState = TRUE; \
	FRIEND_MUTEX_UNLOCK( &(USR->u_Mutex) ); \
}
#endif

#ifndef USER_CHANGE_OFF
#define USER_CHANGE_OFF( USR ) \
if( FRIEND_MUTEX_LOCK( &(USR->u_Mutex) ) == 0 ){ \
	USR->u_ChangeState = FALSE; \
	FRIEND_MUTEX_UNLOCK( &(USR->u_Mutex) ); \
}
#endif

#ifndef USER_LOCK
#define USER_LOCK( USR ) \
while( USR->u_ChangeState != FALSE ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(USR->u_Mutex) ) == 0 ){ \
	USR->u_InUse++; \
	FRIEND_MUTEX_UNLOCK( &(USR->u_Mutex) ); \
}
#endif

#ifndef USER_UNLOCK
#define USER_UNLOCK( USR ) \
if( FRIEND_MUTEX_LOCK( &(USR->u_Mutex) ) == 0 ){ \
	USR->u_InUse--; \
	FRIEND_MUTEX_UNLOCK( &(USR->u_Mutex) ); \
}
#endif


//
//
//

User *UserNew( );

//
//
//

int UserCheckExists( User *u );

//
//
//

int UserInit( User *u );

//
//
//

void UserDelete( User *usr );

//
//
//

int UserDeleteAll( User *usr );

//
//
//

int UserRemoveSession( User *usr, void *ls );

//
//
//

int UserAddSession( User *usr, void *s );

//
//
//

int UserAddDevice( User *usr, File *file );

//
//
//

void UserReleaseDrives( User *usr, void *sb );

//
//
//

File *UserRemDeviceByName( User *usr, const char *name, int *error );

//
//
//

File *UserRemDeviceByGroupID( User *usr, FULONG grid, int *error );

//
//
//

File *UserGetDeviceByName( User *usr, const char *name );

//
//
//

File *UserGetDeviceByPath( User *usr, char **dstpath, const char *path );

//
//
//

int UserAddToGroup( User *usr, UserGroup *ug );

//
//
//

int UserRemoveFromGroup( User *usr, FUQUAD groupid );

//
//
//

void UserDeleteGroupLink( UserGroupLink *ugl );

//
//
//

void UserDeleteGroupLinkAll( UserGroupLink *ugl );

//
//
//

//void UserRemoveFromGroups( User *u );

//
//
//

void UserRemoveFromGroupsDB( void *sb, User *u );

//
//
//

FBOOL UserIsInGroupDB( void *sb, User *usr, FULONG gid );

//
//
//

void UserRemoveConnectedSessions( User *usr, FBOOL release );

//
// SQL structure
//

void UserListSessions( User* usr, BufString *bs, void *sb );

//
//
//

void UserNotifyFSEvent2( User *u, char *evt, char *path );

//
//
//

static FULONG UserDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUser",       
    SQLT_STRUCTSIZE, sizeof( struct User ), 
	SQLT_IDINT,			(FULONG)"ID",				offsetof( struct User, u_ID ), 
	SQLT_STR,			(FULONG)"Name",				offsetof( struct User, u_Name ),
	SQLT_STR,			(FULONG)"Password",			offsetof( struct User, u_Password ),
	SQLT_STR,			(FULONG)"Fullname",			offsetof( struct User, u_FullName ),
	SQLT_STR,			(FULONG)"Email",			offsetof( struct User, u_Email ),
	SQLT_STR,			(FULONG)"Timezone",			offsetof( struct User, u_Timezone ),
	//SQLT_STR,			(FULONG)"SessionID",		offsetof( struct User, u_MainSessionID ),
	SQLT_INT,			(FULONG)"LastActionTime",	offsetof( struct User, u_LastActionTime ),
	SQLT_INT,			(FULONG)"CreationTime",		offsetof( struct User, u_CreationTime ),
	SQLT_INT,			(FULONG)"ModifyTime",		offsetof( struct User, u_ModifyTime ),
	SQLT_INT,			(FULONG)"LoginTime",		offsetof( struct User, u_LoginTime ),
	SQLT_INT,			(FULONG)"MaxStoredBytes",	offsetof( struct User, u_MaxBytesStorPerDevice ),
	SQLT_INT,			(FULONG)"MaxReadedBytes",	offsetof( struct User, u_MaxBytesReadPerDevice ),
	SQLT_INT,			(FULONG)"Status",			offsetof( struct User, u_Status ),
	SQLT_STR,			(FULONG)"UniqueID",			offsetof( struct User, u_UUID ),
	SQLT_INIT_FUNCTION,	(FULONG)"init",				(FULONG)&UserInit,
	SQLT_NODE,			(FULONG)"node",				offsetof( struct User, node ),
	SQLT_END 
};

/*
CREATE TABLE IF NOT EXISTS `FUserToDelete` (
	`ID` bigint(32) NOT NULL AUTO_INCREMENT,
	`UserName` char(512) NOT NULL,
	`UserID` bigint(32) NOT NULL,
	PRIMARY KEY (`ID`) 
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
*/

//
// user structure
//

typedef struct UserToDelete
{
	MinNode						node;
	FULONG						utd_ID;
	char						*utd_UserName;
	FULONG						utd_UserID;
}UserToDelete;

//
//
//

UserToDelete *UserToDeleteNew( );

//
//
//

void UserToDeleteDelete( UserToDelete *del );

//
//
//

static FULONG FUserToDeleteDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUser",       
    SQLT_STRUCTSIZE, sizeof( struct User ), 
	SQLT_IDINT,			(FULONG)"ID",				offsetof( struct UserToDelete, utd_ID ), 
	SQLT_STR,			(FULONG)"UserName",			offsetof( struct UserToDelete, utd_UserName ),
	SQLT_INT,			(FULONG)"UserID",			offsetof( struct UserToDelete, utd_UserID ),
	SQLT_INIT_FUNCTION,	(FULONG)"init",				(FULONG)0,
	SQLT_NODE,			(FULONG)"node",				offsetof( struct User, node ),
	SQLT_END 
};
	

#endif // __SYSTEM_USER_USER_H__
