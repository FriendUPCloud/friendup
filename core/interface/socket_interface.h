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
	Socket*					(*SocketConnectHost)( void *sb, FBOOL ssl, char *host, unsigned short port, FBOOL blocked );
	int						(*SocketSetBlocking)( Socket* s, FBOOL block );
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

	si->SocketConnectHost = SocketConnectHost;
	si->SocketSetBlocking = SocketSetBlocking;
}

#endif
