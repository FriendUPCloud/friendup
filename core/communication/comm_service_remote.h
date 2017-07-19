/*©mit***************************************************************************
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
#include <mysql/mysqllibrary.h>
#include <core/thread.h>

//
// Communicaton Service
//

typedef struct CommServiceRemote
{
	Socket									*csr_Socket;			// soclet
	int										csr_Epollfd;			// EPOLL - file descriptor
	
	FThread								*csr_Thread;			// service thread
	
	FILE 									*csr_Pipe;			// sending message pipe
	FBYTE									*csr_Buffer;
	char 									*csr_Name;				// service name
	char 									*csr_Address;			// network address
	FBOOL 								csr_Quit;					// quit or not
	
	int 										csr_sendPipe[ 2 ];
	int 										csr_recvPipe[ 2 ];
	int 										csr_ReadCommPipe, csr_WriteCommPipe;
	
	void 										*csr_SB;
	
	int										csr_MaxEvents;
	int 										csr_BufferSize;
	int										csr_port;				// Friend Communication Port
	int										csr_secured;		// ssl secured
	
	int 										csr_IncomingInc;		// incomming connections incremental  value
	
	int 										csr_NumberConnections;
	pthread_mutex_t					csr_Mutex;
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
