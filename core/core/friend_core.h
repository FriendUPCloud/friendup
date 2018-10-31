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
 *
 *  Friend Core definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @author HT (Hogne Tildstad)
 *  @date pushed 29/01/2016
 * 
 * \ingroup FriendCore
 * @{
 */

#ifndef _FRIENDCORE_H_
#define _FRIENDCORE_H_

#include <stdio.h>
#include <util/hashmap.h>
#include <network/socket.h>
#include <sys/stat.h>
#include <core/nodes.h>
#include <system/services/service_manager.h>
#include <core/thread.h>
#include "worker_manager.h"
#include <core/library.h>
#include <network/http.h>
#include <signal.h>
#ifdef USE_SELECT

#else
#include <sys/epoll.h>
#endif
#include <poll.h>


/**
 * FriendCore instance data
 *
 * Preferably, the contents of this struct should
 * never be modified after the server has been started
 */
typedef struct FriendCoreInstance
{
	MinNode					node;				///< list of cores
	
	char 					fci_CoreID[ 64 ];	///< id of the core, it has 32 bytes, but we are extending it to hold more chars like \n \r etc.
	char					fci_IP[ 256 ]; // ip or hostname of FriendCoreInstance
	
	int 					fci_Epollfd;            ///< File descriptor for epoll
	Socket	 				*fci_Sockets; 	///< Socket for incomming connections (TODO: Make this "socketS": We must be able to listen on multiple interfaces!)

	// "Private"
	//char                  *fci_Shutdown;      ///< Ends all event loops
	FBOOL					 fci_Shutdown;       ///< Ends all event loops
	FBOOL 					fci_Closed;			///< if FC quits, then its set to TRUE
	FBOOL 					fci_SSLEnabled;		///< if ssl is enabled

	Hashmap* 				fci_Libraries;   		///< Contains all loaded libraries. Key: library name.
	
	int 					fci_Port;			/// port on which FC will be launched
	int 					fci_MaxPoll;		/// number of maximum sockets connections
	int 					fci_BufferSize;		/// internal FC buffer to hold messages
	
	int 					fci_SendPipe[ 2 ];	/// pipes used to send messages to FC
	int 					fci_RecvPipe[ 2 ];	/// pipes used to received messages from FC
	int						fci_ReadCorePipe, fci_WriteCorePipe; // pointers to read/write pipes
	
	FThread					*fci_Thread;		/// FC instance internal thread
	pthread_mutex_t			fci_ListenMutex;
	
	void 					*fci_SB;							//pointer to systembase
	
} FriendCoreInstance;

/**
 * Create instance of FC
 */

FriendCoreInstance *FriendCoreNew( void *sb, int id, FBOOL ssl, int port, int maxp, int bufsiz, char *hostname );

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

Library* FriendCoreGetLibrary( FriendCoreInstance* instance, char* libname, FULONG version );

/**
 * The event loop pattern.
 * This waits for stuff to happen on sockets
 */

//void FriendCoreEpoll( FriendCoreInstance* instance );

/**
 * The event loop pattern.
 * This waits for stuff to happen on sockets
 */
//void FriendCoreSelect( FriendCoreInstance* fc );

#endif

/**@}*/
// End of FriendCore Doxygen group
