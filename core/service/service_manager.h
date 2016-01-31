/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __SERVICE_SERVICE_MANAGER_H__
#define __SERVICE_SERVICE_MANAGER_H__

#include <service/service.h>
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
