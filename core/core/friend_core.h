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

#ifndef _FRIENDCORE_H_
#define _FRIENDCORE_H_

#include <stdio.h>
#include <util/hashmap.h>
#include <network/socket.h>
#include <sys/stat.h>
#include <core/nodes.h>
#include <service/service_manager.h>
#include <core/thread.h>
#include "worker_manager.h"
#include <core/library.h>
#include <network/http.h>
#include <signal.h>
#include <poll.h>

#define CERT_PATH_SIZE 2048

extern char RSA_SERVER_CERT[  ];
extern char RSA_SERVER_KEY[  ];
extern char RSA_SERVER_CA_CERT[  ];
extern char RSA_SERVER_CA_PATH[  ];

//
// FriendCore instance data
// 
// Preferably, the contents of this struct should
// never be modified after the server has been started
//

typedef struct FriendCoreInstance
{
	MinNode					node;	// list of cores
	
	char 						fci_CoreID[ 32 ];
	
	int 							epollfd;            // File descriptor for epoll
	Socket	 					* listenSocket; // Socket for incomming connections (TODO: Make this "socketS": We must be able to listen on multiple interfaces!)

	// "Private"
	char                        *fci_Shutdown;        // Ends all event loops
	BOOL 						fci_Closed;				// if FC quits, then its set to TRUE

	Hashmap* 				libraries;   // Contains all loaded libraries. Key: library name.
	
	int 							fci_Port;
	int 							fci_MaxPoll;
	int 							fci_BufferSize;
	
	int 							fci_SendPipe[ 2 ];
	int 							fci_RecvPipe[ 2 ];
	int							fci_ReadCorePipe, fci_WriteCorePipe;
	
	FThread				*fci_Thread;
	pthread_mutex_t      listenMutex;
	
	WorkerManager		*fci_WorkerManager;								// Worker Manager
	
} FriendCoreInstance;

/**
 * Create instance of FC
 * 
 */

FriendCoreInstance *FriendCoreNew( int port, int maxp, int bufsiz );

/**
 * Closes all sockets, signals shutdown to all subsystems
 * FriendCoreRun will return shortly after this.
 */

void FriendCoreShutdown( FriendCoreInstance* instance );

/**
 * Opens socket, loads libraries and starts subsystems,
 * then enters the even loop pattern until shutdown.
 */

int  FriendCoreRun( FriendCoreInstance* instance );

/**
 * Opens socket, loads libraries and starts subsystems,
 * then enters the even loop pattern until shutdown.
 */

Library* FriendCoreGetLibrary( FriendCoreInstance* instance, char* libname, ULONG version );

/**
 * The event loop pattern.
 * This waits for stuff to happen on sockets
 */

void FriendCoreEpoll( FriendCoreInstance* instance );

#endif
