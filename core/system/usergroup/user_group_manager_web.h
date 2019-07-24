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
 *  User Group Manager Web header
 *
 * All functions related to User Group Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2019
 */

#ifndef __SYSTEM_USER_USER_GROUP_MANAGER_WEB_H__
#define __SYSTEM_USER_USER_GROUP__MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>

#include <system/user/user_session.h>
#include "user_group.h"
#include <system/user/user.h>
#include <system/user/remote_user.h>

//
//
//

Http *UMGWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_USER_USER_GROUP_MANAGER_WEB_H__
