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
 *  CommunicationRemoteService header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/06/2017
 */
#ifndef __COMMUNICATION_COMM_SERVICE_REMOTE_H__
#define __COMMUNICATION_COMM_SERVICE_REMOTE_H__

#include <core/types.h>
#include <core/thread.h>
#include <stdio.h>
#include <core/nodes.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/ioctl.h>
#include <network/socket.h>
#include <mqueue.h>
#include <errno.h>
#include <sys/types.h>
#include "comm_msg.h"
#include <db/sqllib.h>
#include <core/thread.h>

//
// Communicaton Service
//

typedef struct CommServiceRemote
{
	Socket									*csr_Socket;			// soclet
	int										csr_Epollfd;			// EPOLL - file descriptor
	
	FThread									*csr_Thread;			// service thread
	
	FILE 									*csr_Pipe;			// sending message pipe
	FBYTE									*csr_Buffer;
	char 									*csr_Name;				// service name
	char 									*csr_Address;			// network address
	FBOOL 									csr_Quit;					// quit or not
	
	int 									csr_sendPipe[ 2 ];
	int 									csr_recvPipe[ 2 ];
	int 									csr_ReadCommPipe, csr_WriteCommPipe;
	
	void 									*csr_SB;
	
	int										csr_MaxEvents;
	int 									csr_BufferSize;
	int										csr_port;				// Friend Communication Port
	int										csr_secured;		// ssl secured
	
	int 									csr_IncomingInc;		// incomming connections incremental  value
	
	int 									csr_NumberConnections;
	pthread_mutex_t							csr_Mutex;
}CommServiceRemote;

//
// create new CommServiceRemote
//

CommServiceRemote *CommServiceRemoteNew( int port, int secured, void *sb, int maxev );

//
// delete CommServiceRemote
//

void CommServiceRemoteDelete( CommServiceRemote *s );

//
// start CommServiceRemote
//

int CommServiceRemoteStart( CommServiceRemote *s );

//
// stop CommServiceRemote
//

int CommServiceRemoteStop( CommServiceRemote *s );

//
// send message
//

DataForm *CommServiceRemoteSendMsg( CommServiceRemote *s, char *address, int port );

//
// CommService thread
//

int CommServiceRemoteThreadServer( FThread *this );

#endif // __COMMUNICATION_COMM_SERVICE_REMOTE_H__
