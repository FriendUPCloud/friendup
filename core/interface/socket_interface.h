/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Socket Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */
#ifndef __INTERFACE_SOCKET_INTERFACE_H__
#define __INTERFACE_SOCKET_INTERFACE_H__

#include <network/socket.h>

typedef struct SocketInterface
{
	Socket*					(*SocketNew)( void *sb, FBOOL ssl, unsigned short port, int type );
	int						(*SocketListen)( Socket* s );
	int						(*SocketConnect)( Socket* sock, const char *host );
	Socket*					(*SocketConnectHost)( void *sb, FBOOL ssl, char *host, unsigned short port );
	int						(*SocketSetBlocking)( Socket* s, FBOOL block );
	Socket*					(*SocketAcceptPair)( Socket* sock, struct AcceptPair *p );
	Socket*					(*SocketAccept)( Socket* s );
	int						(*SocketRead)( Socket* sock, char* data, unsigned int length, unsigned int pass );
	int						(*SocketWaitRead)( Socket* sock, char* data, unsigned int length, unsigned int pass, int sec );
	BufString*				(*SocketReadTillEnd)( Socket* sock, unsigned int pass, int sec );
	FLONG					(*SocketWrite)( Socket* s, char* data, FLONG length );
	void					(*SocketDelete)( Socket* s );
}SocketInterface;

//
//
//

#ifndef CERT_PATH_SIZE
#define CERT_PATH_SIZE 2048
#endif

//
// init function
//

static inline void SocketInterfaceInit( SocketInterface *si )
{
	si->SocketNew = SocketNew;
	si->SocketListen = SocketListen;
	si->SocketConnect = SocketConnect;
	si->SocketConnectHost = SocketConnectHost;
	si->SocketSetBlocking = SocketSetBlocking;
	si->SocketAcceptPair = SocketAcceptPair;
	si->SocketAccept = SocketAccept;
	si->SocketRead = SocketRead;
	si->SocketWaitRead = SocketWaitRead;
	si->SocketReadTillEnd = SocketReadTillEnd;
	si->SocketWrite = SocketWrite;
	si->SocketDelete = SocketDelete;
}

#endif
