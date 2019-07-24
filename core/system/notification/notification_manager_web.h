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
 *  Notification Manager Web header
 *
 * All functions related to Notification Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/01/2019
 */

#ifndef __SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_WEB_H__
#define __SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>

#include <system/user/user_session.h>
#include <system/usergroup/user_group.h>
#include <system/user/user.h>

//
//
//

Http *NMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_WEB_H__
