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
 *  User Group
 *
 * file contain definitions related to user groups
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __USER_GROUP_H__
#define __USER_GROUP_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sql_defs.h>
#include <stddef.h>
#include <system/fsys/file.h>

/*

CREATE TABLE `FUserToGroup` (
 `UserID` bigint(20) NOT NULL,
 `UserGroupID` bigint(20) NOT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
*/

/*
CREATE TABLE `FUserGroup` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `Name` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

typedef struct GroupUserLink
{
	MinNode				node;
	void				*ugau_User;
	FULONG				ugau_UserID;
}GroupUserLink;

//
// User group status
//

enum 
{
	USER_GROUP_STATUS_ACTIVE = 0,
	USER_GROUP_STATUS_DISABLED,
	USER_GROUP_STATUS_LOCKED
};

//

typedef struct UserGroup
{
	MinNode 			node;
	FULONG 				ug_ID;
	char 				*ug_Name;
	char				*ug_UUID;
	FULONG 				ug_UserID;
	FULONG				ug_ParentID;
	char 				*ug_Type;
	char				*ug_Description;
	struct UserGroup	*ug_ParentGroup;
	
	GroupUserLink		*ug_UserList;		// users assigned to group 
	File				*ug_MountedDevs;	// root file
	int					ug_Status;
	FBOOL				ug_IsAdmin;
	FBOOL				ug_IsAPI;
	
	pthread_mutex_t		ug_Mutex;
	// this is list of UserGroupDevices, all devices are shared to users by group
	// if we want to share this device across another groups we must share it
}UserGroup;

//
//
//

UserGroup *UserGroupNew( FULONG id, char *name, FULONG uid, char *type, char *description );

//
//
//

void UserGroupInit( UserGroup *ug, void *sb );

//
//
//

int UserGroupDelete( void *sb, UserGroup *ug );

//
//
//

int UserGroupDeleteAll( void *sb, UserGroup* ug );

//
//
//

File *UserGroupRemDeviceByName( UserGroup *ugrlist, const char *name, int *error );

//
//
//

int UserGroupAddUser( UserGroup *ug, void *u );

//
//
//

int UserGroupRemoveUser( UserGroup *ug, void *u );

//
//
//

static FULONG UserGroupDesc[] = { SQLT_TABNAME, (FULONG)"FUserGroup", SQLT_STRUCTSIZE, sizeof( struct UserGroup ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( struct UserGroup, ug_ID ), 
	SQLT_INT, (FULONG)"UserID", offsetof( struct UserGroup, ug_UserID ),
	SQLT_STR, (FULONG)"Name", offsetof( struct UserGroup, ug_Name ),
	SQLT_STR, (FULONG)"Type", offsetof( struct UserGroup, ug_Type ),
	SQLT_STR, (FULONG)"Description", offsetof( struct UserGroup, ug_Description ),
	SQLT_INT, (FULONG)"Status", offsetof( struct UserGroup, ug_Status ),
	SQLT_INT, (FULONG)"ParentID", offsetof( struct UserGroup, ug_ParentID ),
	SQLT_STR, (FULONG)"UniqueID",    offsetof( struct UserGroup, ug_UUID ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&UserGroupInit,
	SQLT_NODE, (FULONG)"node", offsetof( struct UserGroup, node ),
	SQLT_END };


#endif // __USER_GROUP_H__
