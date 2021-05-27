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
 *  Filesystem manager header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02 Feb 2017
 */

#ifndef __SYSTEM_FSYS_FS_MANAGER_WEB_H__
#define __SYSTEM_FSYS_FS_MANAGER_WEB_H__

#include <core/types.h>
#include "file.h"
#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_session.h>
#include <util/json_core.h>

//
//
//

Http *FSMWebRequest( void *m, char **urlpath, Http* request, UserSession *session, int *result );

#endif // __SYSTEM_FSYS_FS_MANAGER_WEB_H__
