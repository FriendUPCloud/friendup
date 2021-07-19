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
 *  External Service Manager Web header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2021/05/27
 */

#ifndef __SYSTEM_SERVICEEXT_SERVICE_MANAGER_WEB_H__
#define __SYSTEM_SERVICEEXT_SERVICE_MANAGER_WEB_H__

#include <system/services/service.h>
#include <network/socket.h>
#include <network/http.h>
#include <network/path.h>

//
// Web calls handler, void *SystemBase
//

Http *ExternalServiceManagerWebRequest( void *lsb, char **urlpath, Http* request, UserSession *loggedSession );

#endif //__SYSTEM_SERVICEEXT_SERVICE_MANAGER_WEB_H__
