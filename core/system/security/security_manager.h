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
 *  Security Manager
 *
 * file contain definitions related to RoleManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/03/2020
 */

#ifndef __SYSTEM_SECURITY_SECURITY_MANAGER_H__
#define __SYSTEM_SECURITY_SECURITY_MANAGER_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/usergroup/user_group.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>
#include <util/hashmap_long.h>

//
// Security Manager structure
//

typedef struct SecurityManager
{
	void						*sm_SB;
	pthread_mutex_t				sm_Mutex;
	HashmapLong					*sm_BadSessionLoginHM;
	int							sm_SessionTimeout;
} SecurityManager;


//
// Create new SecurityManager
//

SecurityManager *SecurityManagerNew( void *sb );

//
// delete SecurityManager
//

void SecurityManagerDelete( SecurityManager *sm );

//
// Security check for sessions
//

void SecurityManagerCheckSession( SecurityManager *sm, Http *request );

//
//
//

void SecurityManagerRemoteOldBadSessionCalls( SecurityManager *sm );

//
//
//

#endif //__SYSTEM_SECURITY_SECURITY_MANAGER_H__


