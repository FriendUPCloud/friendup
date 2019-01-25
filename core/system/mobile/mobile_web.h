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
 *  Mobile Web header
 *
 * All functions related to Mobile web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/09/2018
 */

#ifndef __SYSTEM_MOBILE_MOBILE_MANAGER_WEB_H__
#define __SYSTEM_MOBILE_MOBILE_MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>

#include <system/user/user_session.h>
#include <system/usergroup/user_group.h>
#include <system/user/user.h>
#include "mobile_manager.h"

//
//
//

Http *MobileWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_MOBILE_MOBILE_MANAGER_WEB_H__
