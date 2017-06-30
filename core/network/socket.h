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


#ifndef __NETWORK_SOCKET_H__
#define __NETWORK_SOCKET_H__

#include <core/types.h>

#include <core/types.h>
#include <core/nodes.h>
#include <pthread.h>
#include <openssl/crypto.h>
#include <openssl/ssl.h>
#include <openssl/err.h>
#ifdef _WIN32
#include <winsock2.h>
#else
#include <sys/ioctl.h>
#include <netinet/in.h>
#include <sys/select.h>
#endif
#include <libwebsockets.h>
#ifdef USE_SELECT

#else
#include <sys/epoll.h>
#include <poll.h>
#endif

#ifdef NO_VALGRIND_STUFF

#else
#include <valgrind/memcheck.h>
#endif

#include <fcntl.h>

#include "util/list.h"
#include "util/string.h"
#include "util/buffered_string.h"
#include "websocket.h"

#define SOCKET_CLOSED_STATE -2

// For debug
int _writes;
int _reads;
int _sockets;

// Forward declarations

typedef struct Socket Socket_t;
typedef struct FriendCoreInstance FriendCoreInstance_t;

// Callbacks

typedef void* (*SocketProtocolCallback_t)( Socket_t* sock, char* bytes, unsigned int size );
typedef void* (*SocketShutdownCallback_t)( Socket_t* sock );

//
//
//

enum {
	SOCKET_TYPE_SERVER = 0,
	SOCKET_TYPE_CLIENT,
	SOCKET_TYPE_CLIENT_WS
};

//
//
//

// For accept
struct AcceptPair
{
	struct sockaddr_in6 client;
	int                fd;
	int                 *fds;
	int                 fdcount;
};

typedef struct SocketBuffer
{
	void                     *sb_Data;           // Actual data
	unsigned int        sb_DataSize;       // Total amount data
	unsigned int        sb_DataWritten;    // Amounts of bytes written
	FBOOL                sb_FreeOnComplete; // If true, data will be free()'d on completion
} SocketBuffer;

//
//
//

typedef struct Socket
{
	int                                         fd;              // Unix file descriptor for the socket. TODO: Use HANDLE on Windows.
	pthread_mutex_t                   mutex; // Mutex for locking
	FBOOL                                  listen;         // Is this a listening socket? SocketAccept can only be used on these kinds of sockets.
	int		                                  port;// Yup. The port. What else?
	struct in6_addr                     ip;  // IPv6 address, or an IPv4-converted IPv6 address (http://tools.ietf.org/html/rfc6052)
	                                        // For compatibility, /ALWAYS/ use 16 bytes (IPv6 length) when dealing with IP addresses internally!
	                                        // If needed, SocketGetIPv4 can be used to convert an IPv4-converted IPv6 address back into an IPv4 address, but use this only when absolutely needed.
	void                                        *data;          // Session-spesific data
	SocketProtocolCallback_t       protocolCallback; // Socket protocol callback (Defaults to HTTP, use Upgrade: header to change protocol)
	SocketShutdownCallback_t     shutdownCallback; // This is called when the socket is shut down, so that the protocol can free their memory

	FBOOL                                    s_SSLEnabled;
	FBOOL                                    nonBlocking;    // If true, writes to this socket won't block

	void                                         *s_Data;             // user data
	void                                         *s_SB;                // pointer to SystemBase

	FBOOL                                    doShutdown;
	FBOOL                                    doClose;

// SSL
	FBOOL                                    s_VerifyClient;
	SSL_CTX                                 *s_Ctx;
	SSL                                         *s_Ssl;
	const SSL_METHOD                *s_Meth;
	X509                                       *s_Client_cert;
	BIO                                         *s_BIO;
	
	int                                           s_Timeouts;
	int                                           s_Timeoutu;
	int                                           s_Users;        // How many use it right now?

	MinNode                                 node;
} Socket;

//
// Open a new socket
//

Socket* SocketOpen( void *sb, FBOOL ssl, unsigned short port, int type );  // TODO: Bind address

//
// Set socket for listening
//

int       SocketListen( Socket* s );

//
// Open a connection to a remote host
//

int       SocketConnect( Socket* sock, const char *host );

//
// Open new connection to host + create socket
//

Socket* SocketConnectHost( void *systembase, FBOOL ssl, char *host, unsigned short port );

//
// Enable or disable blocking for socket write functions
//

int       SocketSetBlocking( Socket* s, FBOOL block );

//
// Accept incomming connections if listening
//

Socket* SocketAcceptPair( Socket* sock, struct AcceptPair *p );

//
//
//

Socket* SocketAccept( Socket* s );

//
// Read from the socket
//

int       SocketRead( Socket* sock, char* data, unsigned int length, unsigned int pass );

//
// Wait and Read from the socket
//

int       SocketWaitRead( Socket* sock, char* data, unsigned int length, unsigned int pass, int sec );

//
// Read till end of stream
//

BufString *SocketReadTillEnd( Socket* sock, unsigned int pass, int sec );

//
// Write to the socket, or queue data for writing if non-blocking socket
//

int       SocketWrite( Socket* s, char* data, unsigned int length );

//
// Request the socket to be closed (Acceptable if the other end also has closed the socket)
//

void      SocketClose( Socket* s );

//
//
//

void      SocketFree( Socket *s );

//
//
//

BufString *SocketReadPackage( Socket *sock );

#endif
