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
 *  User Group Manager
 *
 * file contain definitions related to UserGroupManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2019
 */

#ifndef __SYSTEM_USER_USER_GROUP_MANAGER_H__
#define __SYSTEM_USER_USER_GROUP_MANAGER_H__

#include <core/types.h>
#include "user_group.h"
#include <system/user/user.h>
#include <system/user/remote_user.h>

//
// User Group Manager structure
//

typedef struct UserGroupManager
{
	void								*ugm_SB;

	UserGroup							*ugm_UserGroups;			// all user groups
	pthread_mutex_t						ugm_Mutex;
} UserGroupManager;


//
// Create new UserGroupManager
//

UserGroupManager *UGMNew( void *sb );

//
// delete UserGroupManager
//

void UGMDelete( UserGroupManager *smgr );

//
// add group to UserGroupManager
//

int UGMAddGroup( UserGroupManager *smgr, UserGroup *ug );

//
// remove(disable) group from UserGroupManager
//

int UGMRemoveGroup( UserGroupManager *smgr, UserGroup *ug );

//
// Get UserGroup by ID
//

UserGroup *UGMGetGroupByID( UserGroupManager *smgr, FULONG id );

//
// Get UserGroup by Name
//

UserGroup *UGMGetGroupByName( UserGroupManager *smgr, const char *name );

//
// Remove drive from UserGroup
//

File *UGMRemoveDrive( UserGroupManager *sm, const char *name );

//
// Mount UserGroup drives
//

int UGMMountDrives( UserGroupManager *sm );

//
// Assign group to User
//

int UGMAssignGroupToUser( UserGroupManager *smgr, User *usr );

//
// Assign groups to User
//

int UGMAssignGroupToUserByStringDB( UserGroupManager *um, User *usr, char *level, char *workgroups );

//
//
//

int UGMAddUserToGroupDB( UserGroupManager *um, FULONG groupID, FULONG userID );

//
//
//

int UGMRemoveUserFromGroupDB( UserGroupManager *um, FULONG groupID, FULONG userID );

//
//
//

FBOOL UGMUserToGroupISConnectedDB( UserGroupManager *um, FULONG ugroupid, FULONG uid );

//
//
//

FBOOL UGMUserToGroupISConnectedByUNameDB( UserGroupManager *um, FULONG ugroupid, const char *uname );

//
//
//

FBOOL UGMUserToGroupISConnectedByUIDDB( UserGroupManager *um, FULONG ugroupid, FULONG uid );

//
//
//

int UGMReturnAllAndMembers( UserGroupManager *um, BufString *bs, char *type );

//
//
//

FBOOL UGMGetGroupsDB( UserGroupManager *um, FULONG uid, BufString *bs, const char *type, FULONG parentID, int status );

//
//
//

void UGMGetGroups( UserGroupManager *um, FULONG uid, BufString *bs, const char *type, FULONG parentID, int status, FBOOL fParentID );

//
//
//

int UGMGetUserGroupsDB( UserGroupManager *um, FULONG userID, BufString *bs );


#endif //__SYSTEM_USER_USER_GROUP_MANAGER_H__
