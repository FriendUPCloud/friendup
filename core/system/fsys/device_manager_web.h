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
 *  Device manager definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#ifndef __SYSTEM_FSYS_HANDLER_DEVICE_MANAGER_WEB_H__
#define __SYSTEM_FSYS_HANDLER_DEVICE_MANAGER_WEB_H__

#include <core/types.h>
#include "file.h"
#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_session.h>

Http *DeviceMWebRequest( void *m, char **urlpath, Http* request, UserSession *session, int *result );

#endif // __SYSTEM_HANDLER_DEVICE_MANAGER_WEB_H__
