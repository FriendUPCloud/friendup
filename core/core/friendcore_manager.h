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

#ifndef __CORE_FRIENDCORE_MANAGER_H__
#define __CORE_FRIENDCORE_MANAGER_H__

#include <core/types.h>
#include <core/event.h>
#include <util/list.h>
#include <core/library.h>
#include <core/friend_core.h>
#include <service/comm_service.h>
#include <ssh/ssh_server.h>
#include <service/service_manager.h>
#include <network/websocket.h>
#include <core/friendcore_info.h>
#include <core/event_manager.h>

//
// FriendCoreManager structure
//

#define FRIEND_CORE_MANAGER_ID_SIZE	64

typedef struct FriendCoreManager
{
	char 									fcm_ID[ FRIEND_CORE_MANAGER_ID_SIZE ];			// ID of machine
	// first 6 - mac address
	// 32 and above hostname
	
	FriendCoreInstance 			*fcm_FriendCores;										// Friend Cores
	int 										fcm_FriendCoresRunning;
	
	CommService 						*fcm_CommServiceServer;						// FC receive server
	CommService						*fcm_CommServiceClient;						// FC send server
	
	struct SSHServer					*fcm_SSHServer;										// TelnetServer
	
	BOOL 									fcm_Shutdown;											// Shutdown FCM
	
	ServiceManager					*fcm_ServiceManager;								// Service Manager
	#ifdef ENABLE_WEBSOCKETS
	WebSocket 							*fcm_WebSocket;
	#endif
	
	FriendcoreInfo						*fcm_FCI;													// Friend Core Information
	EventManager						*fcm_EventManager;									// Manager of events
	
}FriendCoreManager;

//
// functions
//

FriendCoreManager *FriendCoreManagerNew();

//
// FriendCoreManager destructor
//

void FriendCoreManagerDelete( FriendCoreManager *fcm );

//
// run system
//

ULONG FriendCoreManagerRun( FriendCoreManager *fcm );



#endif //__CORE_FRIENDCORE_MANAGER_H__
