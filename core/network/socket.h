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

#ifndef __NETWORK_SOCKET_H__
#define __NETWORK_SOCKET_H__

#include <stdbool.h>
#include <netinet/in.h>
#include <core/types.h>
#include <core/nodes.h>

#include <pthread.h>
#include <openssl/crypto.h>
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <sys/ioctl.h>
#include <libwebsockets.h>

#include <sys/select.h>
#include <fcntl.h>

#include "util/list.h"
#include "util/string.h"

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

extern BOOL SSLEnabled;

enum {
	SOCKET_TYPE_SERVER = 0,
	SOCKET_TYPE_CLIENT
};

//
//
//

// For accept
struct AcceptPair
{
	struct sockaddr_in6 client;
	int fd;
	int *fds;
	int fdcount;
};

typedef struct SocketBuffer
{
	void                *sb_Data;           // Actual data
	unsigned int        sb_DataSize;       // Total amount data
	unsigned int        sb_DataWritten;    // Amounts of bytes written
	BOOL                sb_FreeOnComplete; // If true, data will be free()'d on completion
} SocketBuffer;

//
//
//

typedef struct Socket
{
	int fd;              // Unix file descriptor for the socket. TODO: Use HANDLE on Windows.
	//BOOL open;           // A socket object may persist for a short while before being destroyed. This field tells you wether or not it's scheduled for destruction.
	pthread_mutex_t mutex; // Mutex for locking
	BOOL listen;         // Is this a listening socket? SocketAccept can only be used on these kinds of sockets.
	in_port_t port;      // Yup. The port. What else?
	struct in6_addr ip;  // IPv6 address, or an IPv4-converted IPv6 address (http://tools.ietf.org/html/rfc6052)
	                     // For compatibility, /ALWAYS/ use 16 bytes (IPv6 length) when dealing with IP addresses internally!
	                     // If needed, SocketGetIPv4 can be used to convert an IPv4-converted IPv6 address back into an IPv4 address, but use this only when absolutely needed.
	void* data;          // Session-spesific data
	SocketProtocolCallback_t protocolCallback; // Socket protocol callback (Defaults to HTTP, use Upgrade: header to change protocol)
	SocketShutdownCallback_t shutdownCallback; // This is called when the socket is shut down, so that the protocol can free their memory

	BOOL nonBlocking;    // If true, writes to this socket won't block

	void* s_Data;


	BOOL doShutdown;
	BOOL doClose;

// SSL
	BOOL                s_VerifyClient;
	SSL_CTX             *s_Ctx;
	SSL                 *s_Ssl;
	SSL_METHOD          *s_Meth;
	X509                *s_Client_cert;
	BIO                 *s_BIO;

	struct MinNode node;
} Socket;

// Open a new socket
Socket* SocketOpen( unsigned short port, int type );  // TODO: Bind address

//Socket *SocketWSOpen( struct libwebsocket *wSock );

// Set socket for listening
int       SocketListen( Socket* s );

// Open a connection to a remote host
int       SocketConnect( Socket* sock, const char *host );

// Enable or disable blocking for socket write functions
int       SocketSetBlocking( Socket* s, BOOL block );

// Accept incomming connections if listening
Socket* SocketAcceptPair( Socket* sock, struct AcceptPair *p );

Socket* SocketAccept( Socket* s );

// Read from the socket
int       SocketRead( Socket* sock, char* data, unsigned int length, unsigned int pass );

// Write to the socket, or queue data for writing if non-blocking socket
int       SocketWrite( Socket* s, char* data, unsigned int length );

// Request the socket to be closed (Acceptable if the other end also has closed the socket)

void      SocketClose( Socket* s );

void SocketWSClose( Socket* sock );

void      SocketFree( Socket *s );

// Determine what kind of IP we're connected to
BOOL      SocketIsIPv6( Socket* s );

BOOL      SocketIsIPv4( Socket* s );

#endif
