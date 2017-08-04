/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

#ifndef __SERVICE_SERVICE_MANAGER_H__
#define __SERVICE_SERVICE_MANAGER_H__

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

//
// Web calls handler, void *FriendCoreManager
//

Http *ServiceManagerWebRequest( void *fcm, char **urlpath, Http *request  );



#endif //__SERVICE_SERVICE_MANAGER_H__
