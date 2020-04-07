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
 *  Service Manager Web header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_SERVICES_SERVICE_MANAGER_WEB_H__
#define __SYSTEM_SERVICES_SERVICE_MANAGER_WEB_H__

#include <system/services/service.h>
#include <network/socket.h>
#include <network/http.h>
#include <network/path.h>
#include "service_manager.h"

//
// Web calls handler, void *SystemBase
//

Http *ServicesManagerWebRequest( void *lsb, char **urlpath, Http* request, UserSession *loggedSession );

#endif //__SYSTEM_SERVICES_SERVICE_MANAGER_WEB_H__
