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

/**
 * @file
 * Core manager structure definition
 *
 * @author HT (Hogne Tildstad)
 * @date 16 Nov 2016
 */

#ifndef __CORE_FRIENDCORE_MANAGER_H__
#define __CORE_FRIENDCORE_MANAGER_H__

#include <core/types.h>
#include <core/event.h>
#include <util/list.h>
#include <core/library.h>
#include <core/friend_core.h>
#include <service/comm_service.h>
#include <service/comm_service_remote.h>
#include <ssh/ssh_server.h>
#include <service/service_manager.h>
#include <network/websocket.h>
#include <core/friendcore_info.h>
#include <core/event_manager.h>

#ifndef FRIEND_CORE_PORT
#define FRIEND_CORE_PORT	6502
#endif
#ifndef WEBSOCKET_PORT
#define WEBSOCKET_PORT	6500
#endif
#ifndef FRIEND_COMMUNICATION_PORT
#define FRIEND_COMMUNICATION_PORT 6503
#endif

#ifndef FRIEND_COMMUNICATION_REMOTE_PORT
#define FRIEND_COMMUNICATION_REMOTE_PORT 6504
#endif


//
// FriendCoreManager structure
//

/**
 * Contains the definition of each instance of the core Friend server
 *
 * Note: Preferably, the contents of this structure should
 * never be modified after the server has been started.
 */

typedef struct FriendCoreManager
{
	char                               fcm_ID[ FRIEND_CORE_MANAGER_ID_SIZE+1 ];		///< ID of machine
	// first 6 - mac address
	// 32 and above hostname
	
	FriendCoreInstance       *fcm_FriendCores;								///< Friend Cores
	int                                  fcm_FriendCoresRunning;                         ///< ID of the current core

	#ifndef DOXIGNORE
	CommService                 *fcm_CommService;						    ///< FC send server
	CommServiceRemote     *fcm_CommServiceRemote;			///< FCservice for non persitent calls
	#endif

	struct SSHServer           *fcm_SSHServer;									///< TelnetServer
	
	FBOOL                           fcm_Shutdown;									///< Shutdown FCM
	
	ServiceManager             *fcm_ServiceManager;							///< Service Manager
	WebSocket                     *fcm_WebSocket;                                 ///< WebSocket Manager
	
	FriendcoreInfo               *fcm_FCI;										///< Friend Core Information
	void                                *fcm_SB;  ///<Pointer to SystemBase
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

FULONG FriendCoreManagerRun( FriendCoreManager *fcm );

//
// FriendCore shutdown
//

void FriendCoreManagerShutdown( FriendCoreManager *fcm );



#endif //__CORE_FRIENDCORE_MANAGER_H__
