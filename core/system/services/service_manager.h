/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              * 
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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
