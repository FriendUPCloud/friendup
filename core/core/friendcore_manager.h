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
/** @file
 * Core manager structure definition
 *
 * @author HT (Hogne Tildstad)
 * @date 16 Nov 2016
 * 
 * \ingroup FriendCoreManager
 * @{
 */

#ifndef __CORE_FRIENDCORE_MANAGER_H__
#define __CORE_FRIENDCORE_MANAGER_H__

#include <core/types.h>
#include <core/event.h>
#include <util/list.h>
#include <core/library.h>
#include <core/friend_core.h>
#include <communication/comm_service.h>
#include <communication/comm_service_remote.h>
#include <ssh/ssh_server.h>
#include <system/services/service_manager.h>
#include <network/websocket.h>
#include <core/friendcore_info.h>
#include <core/event_manager.h>
#include <communication/cluster_node.h>


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
#ifndef WORKERS_MAX
#define WORKERS_MAX 64
#endif
#ifndef WORKERS_MIN
#define WORKERS_MIN 8
#endif
#ifndef EPOLL_MAX_EVENTS
#define EPOLL_MAX_EVENTS 512
#endif
#ifndef BUFFER_READ_SIZE
#define BUFFER_READ_SIZE 1024 * 8
#endif
#ifndef EPOLL_MAX_EVENTS_COMM
#define EPOLL_MAX_EVENTS_COMM 1024
#endif
#ifndef BUFFER_READ_SIZE_COMM
#define BUFFER_READ_SIZE_COMM 1024 * 8
#endif
#ifndef EPOLL_MAX_EVENTS_COMM_REM
#define EPOLL_MAX_EVENTS_COMM_REM 1024
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
	char						fcm_ID[ FRIEND_CORE_MANAGER_ID_SIZE+1 ];		///< ID of machine
	// first 6 - mac address
	// 32 and above hostname
	char						padding[ 3 ];
	
	FriendCoreInstance			*fcm_FriendCores;								///< Friend Cores
	int							fcm_FriendCoresRunning;                         ///< ID of the current core

	#ifndef DOXIGNORE
	CommService					*fcm_CommService;						    ///< FC send server
	CommServiceRemote			*fcm_CommServiceRemote;			///< FCservice for non persitent calls
	#endif

	struct SSHServer			*fcm_SSHServer;									///< TelnetServer
	
	ServiceManager				*fcm_ServiceManager;							///< Service Manager
	WebSocket					*fcm_WebSocket;                                 ///< WebSocket Manager
	
	FriendcoreInfo				*fcm_FCI;										///< Friend Core Information
	void						*fcm_SB;  ///<Pointer to SystemBase
	
	int							fcm_FCPort; // http port
	int							fcm_ComPort; // communication port
	int							fcm_ComRemotePort; // remote communication port
	int							fcm_WSPort; // websockets internet port
	int							fcm_Maxp; // number of connections in epoll for http
	int							fcm_Bufsize;  // FC buffer size
	int							fcm_MaxpCom; // number of connections in epoll for communication
	int							fcm_MaxpComRemote; // number of connections in epoll for remote connections
	int							fcm_BufsizeCom; // communication buffer size
	int							fcm_CoreIDGenerator;	// one core (thread) ID
	int							fcm_NodeIDGenerator; // node ID, used to attach numbers to new nodes
	FBOOL						fcm_SSLEnabled; // SSL enabled for http
	FBOOL						fcm_WSSSLEnabled; // SSL enabled for WS
	FBOOL						fcm_DisableWS;	// Disable websockets
	FBOOL						fcm_SSLEnabledCommuncation; // SSL enabled for communication
	FBOOL						fcm_Shutdown;									///< Shutdown FCM
	FBOOL						fcm_ClusterMaster;		// if server is cluster master
	char						*fcm_SSHRSAKey; // path to RSH ssh key
	char						*fcm_SSHDSAKey;	// path to DSA ssh key
	
	int							fcm_ClusterID;			// cluster ID (1 if its master)
	//ConnectionInfo				*fcm_ConnectionsInformation;					// connection information
	ClusterNode					*fcm_ClusterNodes;								// cluster node information
																				// first Node is always current FC node
}FriendCoreManager;

//
// functions
//

FriendCoreManager *FriendCoreManagerNew();

//
// Init function
//

int FriendCoreManagerInit( FriendCoreManager *fcm );

//
// FriendCoreManager destructor
//

void FriendCoreManagerDelete( FriendCoreManager *fcm );

//
// run Fcores
//

FULONG FriendCoreManagerRun( FriendCoreManager *fcm );

//
// run services
//

int FriendCoreManagerServicesRun( FriendCoreManager *fcm );

//
// FriendCore shutdown
//

void FriendCoreManagerShutdown( FriendCoreManager *fcm );



#endif //__CORE_FRIENDCORE_MANAGER_H__

/**@}*/
// End of FriendCoreManager Doxygen group
