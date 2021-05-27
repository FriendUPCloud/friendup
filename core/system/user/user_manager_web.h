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
 *  User Manager Web header
 *
 * All functions related to User Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#ifndef __SYSTEM_USER_USER_MANAGER_WEB_H__
#define __SYSTEM_USER_USER_MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>

#include "user_session.h"
#include <system/usergroup/user_group.h>
#include "user.h"
#include "remote_user.h"

//
//
//

Http *UMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result, int *sessionRemoved );

#endif // __SYSTEM_USER_USER_MANAGER_WEB_H__
