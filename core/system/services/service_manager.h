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
 * ServiceManager header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SYSTEM_SERVICES_SERVICE_MANAGER_H__
#define __SYSTEM_SERVICES_SERVICE_MANAGER_H__

#include <system/services/service.h>
#include <network/socket.h>
#include <network/http.h>
#include <network/path.h>

//
// Service Manager structure
//

typedef struct ServiceManager
{
	Service                         *sm_Services;       // working services
	char                            *sm_ServicesPath;   // path to service
	void                            *sm_FCM;            // pointer to FriendCoreManager
} ServiceManager;


//
// Create new ServiceManager
//

ServiceManager *ServiceManagerNew( void *fcm );

//
// delete ServiceManager
//

void ServiceManagerDelete( ServiceManager *smgr );

//
// get service by name
//

Service *ServiceManagerGetByName( ServiceManager *smgr, char *name );

//
// change service state
//

int ServiceManagerChangeServiceState( ServiceManager *smgr, Service *srv, int state );

#endif //__SYSTEM_SERVICES_SERVICE_MANAGER_H__
