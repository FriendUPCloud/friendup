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
 * file contain definitions related to RoleManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2019
 */

#ifndef __SYSTEM_ROLES_ROLE_MANAGER_H__
#define __SYSTEM_ROLES_ROLE_MANAGER_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/usergroup/user_group.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>

//
// Role Manager structure
//

typedef struct RoleManager
{
	void								*rm_SB;
} RoleManager;


//
// Create new RoleManager
//

RoleManager *RMNew( void *sb );

//
// delete RoleManager
//

void RMDelete( RoleManager *smgr );

//
//
//

FBOOL RMCheckPermission( RoleManager *rmgr, User *u, const char *authid );

//
//
//

#endif //__SYSTEM_ROLES_ROLE_MANAGER_H__

