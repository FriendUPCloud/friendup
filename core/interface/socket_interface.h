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
	Socket*					(*SocketOpen)( void *sb, FBOOL ssl, unsigned short port, int type );
	
	int						(*SocketListen)( Socket* s );
	
	int						(*SocketConnect)( Socket* sock, const char *host );

	Socket*					(*SocketConnectHost)( void *sb, FBOOL ssl, char *host, unsigned short port );

	int						(*SocketSetBlocking)( Socket* s, FBOOL block );
	
	Socket*					(*SocketAcceptPair)( Socket* sock, struct AcceptPair *p );
	
	Socket*					(*SocketAccept)( Socket* s );

	int						(*SocketRead)( Socket* sock, char* data, unsigned int length, unsigned int pass );

	int						(*SocketWaitRead)( Socket* sock, char* data, unsigned int length, unsigned int pass, int sec );

	BufString*			(*SocketReadTillEnd)( Socket* sock, unsigned int pass, int sec );
	
	int						(*SocketWrite)( Socket* s, char* data, unsigned int length );
	
	void						(*SocketClose)( Socket* s );

	void						(*SocketFree)( Socket *s );
	
	//char						*RSA_SERVER_CERT;
	//char						*RSA_SERVER_KEY;
	//char						*RSA_SERVER_CA_CERT;
	//char						*RSA_SERVER_CA_PATH;
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

inline void SocketInterfaceInit( SocketInterface *si )
{
	si->SocketOpen = SocketOpen;
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
	si->SocketClose = SocketClose;
	si->SocketFree = SocketFree;
}

#endif