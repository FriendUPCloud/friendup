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
 *  User Session App
 *
 * file contain definitions related to user sessions app web management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 25/07/2016
 */

#ifndef __SYSTEM_USA_USER_SESSION_APP_MANAGER_WEB_H__
#define __SYSTEM_USA_USER_SESSION_APP_MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>

#include <system/user/user_session.h>
#include "user_session_app.h"

//
//
//

Http *USAWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_USA_USER_SESSION_APP_MANAGER_WEB_H__
