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

#define _POSIX_SOURCE

#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <sys/epoll.h>
#include <arpa/inet.h>
#include "util/string.h"
#include "core/friend_core.h"
#include "network/socket.h"
#include "network/protocol_http.h"
#include <util/log/log.h>
#include <service/service_manager.h>
#include <util/buffered_string.h>

#include <hardware/network.h>
/*#include <util/sha256.h>*/

#include <system/systembase.h>
#include <core/friendcore_manager.h>
#include <openssl/crypto.h>

//
//
//

extern SystemBase *SLIB;

char RSA_SERVER_CERT[ CERT_PATH_SIZE ];
char RSA_SERVER_KEY[ CERT_PATH_SIZE ];
char RSA_SERVER_CA_CERT[ CERT_PATH_SIZE ];
char RSA_SERVER_CA_PATH[ CERT_PATH_SIZE ];

int fdPool[ 1024 ];

//
//
//

// From main.c

extern pthread_mutex_t sslmut;

//
// Mutex buffer for ssl locking
//

static pthread_mutex_t *ssl_mutex_buf = NULL;

//
// Static locking function
//

static void ssl_locking_function( int mode, int n, const char *file, int line )
{ 
    if( mode & CRYPTO_LOCK )
    {
        pthread_mutex_lock( &ssl_mutex_buf[ n ] );
    }
    else
    {
        pthread_mutex_unlock( &ssl_mutex_buf[ n ] );
    }
}

//
// Static ID function
//

static unsigned long ssl_id_function( void ) 
{
    return ( ( unsigned long )pthread_self() );
}

//
//
//

FriendCoreInstance *FriendCoreNew( int port, int maxp, int bufsiz )
{
	DEBUG( "[FriendCoreNew] Starting friend core\n" );
	// this probably can be done globally for every SSL socket
	
	// Our pool
	memset( fdPool, 0, 1024 );
			
	// Static locks callbacks
	SSL_library_init();
	
	// Static locks buffer
	ssl_mutex_buf = malloc( CRYPTO_num_locks() * sizeof( pthread_mutex_t ) );
	if( ssl_mutex_buf == NULL)
	{ 
		DEBUG( "[FriendCoreNew] Failed to allocate ssl mutex buffer.\n" );
		return NULL; 
	} 
	{
		int i; for( i = 0; i < CRYPTO_num_locks(); i++ )
		{ 
			pthread_mutex_init( &ssl_mutex_buf[ i ], NULL );
		}
	} 
	// Setup static locking.
	CRYPTO_set_locking_callback( ssl_locking_function );
	CRYPTO_set_id_callback( ssl_id_function );
	
	/*// Dynamic locking
	CRYPTO_set_dynlock_create_callback( ssl_dyn_create_function );
	CRYPTO_set_dynlock_lock_callback( ssl_dyn_lock_function );
	CRYPTO_set_dynlock_destroy_callback( ssl_dyn_destroy_function );*/
	
	OpenSSL_add_all_algorithms();
	
	// Load the error strings for SSL & CRYPTO APIs 
	SSL_load_error_strings();
	
	RAND_load_file( "/dev/urandom", 1024 );
	
	// FOR DEBUG PURPOSES! -ht
	_reads = 0;
	_writes = 0;
	_sockets = 0;
	
	FriendCoreInstance *fc = FCalloc( sizeof(FriendCoreInstance) , 1 );

	if( fc != NULL )
	{
		fc->fci_Port = port;
		fc->fci_MaxPoll = maxp;
		fc->fci_BufferSize = bufsiz;
	}
	
	// Init listen mutex
	pthread_mutex_init( &fc->listenMutex, NULL );
	
	return fc;
}

//
//
//

void FriendCoreShutdown( FriendCoreInstance* fc )
{	
	while( fc->fci_Closed != TRUE )
	{
		INFO( "[FriendCoreShutdown] Waiting for close\n" );
		sleep( 1 );
	}
	
	free( ssl_mutex_buf );
	
	// Destroy listen mutex
	DEBUG( "[FriendCoreShutdown] Waiting for listen mutex\n" );
	if( pthread_mutex_lock( &fc->listenMutex ) == 0 )
	{
		pthread_mutex_unlock( &fc->listenMutex );
		pthread_mutex_destroy( &fc->listenMutex );
	}
	
	FFree( fc );
	
	DEBUG("Closed!\n");
}

//
//
//

#define BUFFER_READ_SIZE 16384
#define BUFFER_READ_SIZE_ALLOC 16385


struct stringPart 
{ 
	char *string; 
	int length; 
	void *next;
};

//
//
//

#define NO_WORKERS

static int nothreads = 0;
#define MAX_CALLHANDLER_THREADS 256

void *SocketCallHandler( void *data )
{	
	if( pthread_mutex_lock( &sslmut ) == 0 )
	{
		nothreads++;
		pthread_mutex_unlock( &sslmut );
		DEBUG( "[SocketCallHandler] %p Starting to execute, threads %d!\n", data, nothreads );
	}
	struct SocketThreadData *t = ( struct SocketThreadData *)data;
#ifdef NO_WORKERS
	pthread_detach( t->thread ); // Detach only when using pthreads directly
#endif
	if( !t->sock )
	{
		if( t->doFree )
		{
			FFree( t );
		}
		DEBUG( "[SocketCallHandler] %p Premature abortion no socket!!\n", data );
#ifdef NO_WORKERS
		pthread_exit( NULL ); // Only on pthread_create
#endif
		return NULL;
	}
	
	Socket *sock = t->sock;
	
	// First pass header, second, data
	int pass = 0; 
	int bodyLength = 0;
	char *finalBuffer = NULL; 
	int prevBufSize = 0;
	int preroll = 0; 
	int stopReading = 0;

	// Often used
	char *dividerStr = "\r\n\r\n";
	int partialDivider = 0;
	int foundDivider = 0;
	int y = 0;
	int x = 0;
	int yc = 0; int yy = 0;

	// Used to read stuff
	char *buffer = NULL;

	for( ; pass < 2; pass++ )
	{
		//DEBUG( "Pass %d ------------------------------------------------------\n", pass );
		// No bodylength? Fuck it
		if( pass == 1 && ( !bodyLength || stopReading ) )
		{
			break;
		}
	
		// Set up a linked list
		struct stringPart *head = NULL;
		struct stringPart *curr = NULL;
	
		int count = preroll, res = 0, joints = 0;
		int methodGet = 0, run = 0;
		struct stat statbuf;
	
		// We must find divider!
		char *findDivider[5];
		partialDivider = 0; foundDivider = 0; y = res - 1; x = 0; yc = 0; yy = 0;
	
		for( joints = 0; ; run++ )
		{
			buffer = FCalloc( BUFFER_READ_SIZE_ALLOC, sizeof( char ) );
			
			DEBUG( "[SocketCallHandler] Starting to read socket.\n" );
			
			if( ( res = SocketRead( sock, buffer, BUFFER_READ_SIZE, pass ) ) > 0 )
			{
				DEBUG( "[SocketCallHandler] We read:\n---\n%.*s\n---\n", res, buffer );
				if( pass == 0 && partialDivider != 0 )
				{
					for( yy = 0; yy < res; yy++ )
					{
						if( buffer[yy] == '\r' || buffer[yy] == '\n' )
						{
							//DEBUG( "Trying to find partial divider!\n" );
							findDivider[ partialDivider++] = buffer[yy];
							if( partialDivider > 3 )
							{
								//DEBUG( "We found a partial divider!\n" );
								findDivider[4] = '\0';
								break;
							}
						}
						else
						{
							//DEBUG( "No partial divider. Reset\n" );
							partialDivider = 0;
							break;
						}
					}
				}
			
				// Create a list joint
				struct stringPart *prt = calloc( 1, sizeof( struct stringPart ) );
				prt->string = buffer;
				prt->length = res;
				prt->next = NULL;
		
				// Add first joint
				if( head == NULL )
				{
					head = prt;
					curr = head;
				}
				// Link in the joint
				else 
				{
					curr->next = ( void *)prt;
					curr = curr->next;
				}
		
				count += res;
			
				//DEBUG( "[SocketCallHandler] Read %d (bodyLength %d) Joint: %d\n", res, bodyLength, joints );
			
				joints++;
		
				// Break get posts after header
				if( pass == 0 )
				{
					// If we found a divider!
					//DEBUG( "Partial divider is %d\n", partialDivider );
					if( partialDivider >= 4 || strstr( buffer, dividerStr ) )
					{
						//DEBUG( "We have a divider! Great!\n" );
						break;
					}
					// Does it end with this? Perhaps it's a partial divider
					else if( buffer[res-1] == '\r' || buffer[res-1] == '\n' )
					{
						//DEBUG( "We found a partial divider!\n" );
						for( y = 0; y > 0; y-- )
						{
							if( buffer[y] != '\r' && buffer[y] != '\n' )
								break;
						}
						for( ; y < res; y++, x++ )
						{
							findDivider[x] = buffer[y];
						}
						partialDivider = x;
						//DEBUG( "Ok, partial divider now at x: %d\n", x );
					}
				}
				// Or in second pass, body length
				else if( pass == 1 && count >= bodyLength )
				{
					// remove preroll to get correct read bytes
					count -= preroll;
					//DEBUG( "Fixing preroll %d\n", preroll );
					break;
				}
			}
			else 
			{
				// KILL KILL
				free( buffer );
				break;
			}
		}

		// Ok we have the joints
		//DEBUG("Read %d in %d joints\n", count, joints );

		if( count > 0 && head )
		{
			//DEBUG( "Ok, in we go!\n" );
		
			// Join pass 0 finalBuffer later
			char *tmp = NULL; 
			if( finalBuffer ) tmp = finalBuffer;
		
			// Join in one string
			finalBuffer = calloc( count + 1, sizeof( char ) );
			//DEBUG( "HOGNE - allocated %d\n", count + 1 );
			ULONG offset = 0; curr = head;
			do
			{
				if( curr->string )
				{
					memcpy( finalBuffer + offset, curr->string, curr->length );
					free( curr->string );
					//DEBUG( "HOGNE - Freeing %d (%d) %d left (joint %d).\n", curr->length + 1, offset+curr->length+1, (count+1)-(offset+curr->length+1), joints-- );
					offset += curr->length;
				}
				struct stringPart *tm = ( struct stringPart *)curr->next;
				free( curr );
				curr = tm;
			}
			while( curr != NULL );
		
			// Already now parse header to receive other data
			if( pass == 0 )
			{
				Http* request = (Http*)sock->data;
				if( !request )
				{
					request = HttpNew( sock );
					request->timestamp = time( NULL );
					sock->data = (void*)request;
				}
		
				int result = HttpParseHeader( request, finalBuffer, count );
				request->gotHeader = true;
		
				// If we have content, then parse it
				char* content = HttpGetHeader( request, "content-length", 0 );
				if( content )
				{
					char *divider = strstr( finalBuffer, dividerStr );
					if( !divider )
					{
						//DEBUG( "No divider!\n" );
						prevBufSize += count;
						break;
					}
					bodyLength = atoi( content );
				
					// We have enough data and are ready for reading the body
					int headerLength = divider - finalBuffer + 4;
					//DEBUG( "We have a header data length of %d.\n", headerLength );
					//DEBUG( "The body length is: %d\n", bodyLength );
					if( count > headerLength )
					{
						//DEBUG( "That's more than we need for a header. %d > %d\nGoto phase 2.\n", count, headerLength );
						prevBufSize += count;
						preroll = count - headerLength;
						stopReading = count >= (headerLength + bodyLength);
						continue;
					}
				}
				// Need only one pass
				else
				{
					//DEBUG( "No content length\n" );
					prevBufSize += count;
					break;
				}
				// Determine if we need pass 2
			}
			// Second pass
			else if( tmp && pass == 1 && prevBufSize > 0 )
			{
				//DEBUG( "Second pass (adding %d to %d = %d)\n", count, prevBufSize, count + prevBufSize );
				char *theFin = calloc( prevBufSize + count + 1, sizeof( char ) );
				memcpy( theFin, tmp, prevBufSize );
				memcpy( theFin + prevBufSize, finalBuffer, count );
				FFree( tmp );
				FFree( finalBuffer );
				finalBuffer = theFin;
			}
		
			// For next pass
			prevBufSize += count;
		}
		else if( !finalBuffer ) break;
	}

	// Free up
	if( finalBuffer )
	{
		// Process data
		if( sock->protocolCallback )
		{
			Http *resp = sock->protocolCallback( sock, finalBuffer, prevBufSize );
			DEBUG("HTTP callback called\n");
			if( resp != NULL )
			{
				DEBUG("Send response %d\n", resp->h_WriteType  );
				if( resp->h_WriteType == FREE_ONLY )
				{
					HttpFree( resp );
				}
				else
				{
					HttpWriteAndFree( resp, sock );
				}
			}
			DEBUG("Send response end\n");
		}
		FFree( finalBuffer );	
		DEBUG("FCore data sent to client\n");
	}
	else
	{
		DEBUG( "[SocketCallHandler] No buffer to write!\n" );
	}
	
	if( t->doFree )
	{
		t->sock = NULL;
		SocketClose( sock );
		FFree( t );
	}
	DEBUG( "[SocketCallHandler] %p End of call handler.\n", data );
	if( pthread_mutex_lock( &sslmut ) == 0 )
	{
		nothreads--;
		pthread_mutex_unlock( &sslmut );
	}
	
#ifdef NO_WORKERS
	pthread_exit( NULL ); // Only on pthread_create
#endif
	DEBUG("Sockhandler end\n");
	
	return NULL;
}


//
// Handle all input/output events
//

struct FriendCoreInstance *fci;

void SignalHandler( int signal )
{
	write( fci->fci_WriteCorePipe, "q", 1 );
}

//
// Thread to handle incoming connections!!!
//

struct fcThreadInstance 
{ 
	FriendCoreInstance *fc;
	pthread_t thread;
	
	// Incoming from accept
	struct AcceptPair *acceptPair;
};

//
//
//

void *FriendCoreAccept( void *fcv )
{
	struct fcThreadInstance *th = ( struct fcThreadInstance *)fcv;
	pthread_detach( th->thread ); // Detach
	
	FriendCoreInstance *fc = ( FriendCoreInstance * )th->fc;
	
	// Get the accept pair
	struct AcceptPair *p = th->acceptPair;
	
	//DEBUG( "[FriendCoreAccept] Trying to lock listenmutex\n" );
	struct epoll_event event = {}; // Element to pass args

	Socket *incoming = NULL;
	int incomingC = 0;
	
	if( pthread_mutex_lock( &fc->listenMutex ) == 0 )
	{
		incoming = SocketAcceptPair( fc->listenSocket, p );
		pthread_mutex_unlock( &fc->listenMutex );
	}
	
	// No incoming, clean the accept pair and return
	if( incoming == NULL )
	{
		close( p->fd );
		free( p );
		return NULL;
	}
	
	// If we can't set this blocking. Go to next..
	if( SocketSetBlocking( incoming, FALSE ) == 0 )
	{
		//ERROR("SocketSetBlocking\n");
		SocketClose( incoming );
		
		// Clear the pair (incoming is closed above)
		free( p );
		
		// Clear the cfThreadInstance
		free( th );
		return NULL;
	}

	// Set the default protocol callback
	incoming->protocolCallback = ( SocketProtocolCallback_t )&ProtocolHttp;

	// Add instance reference
	incoming->s_Data = fc;

	// TODO: Here we have an example of adding a new event. This event will
	//       again be handled on the same place (adding to the queue incrementally)
	// Register for read events, disconnection events and enable edge triggered behavior
	event.data.ptr = incoming; // Add incoming socket
	event.events = EPOLLIN | EPOLLET;
	int retval = epoll_ctl( fc->epollfd, EPOLL_CTL_ADD, incoming->fd, &event );
	if( retval == -1 )
	{
		ERROR("epoll_ctl ERROR: %s\n", strerror( errno ) );
		//abort();
	}
	DEBUG( "Go to next event %p\n", incoming );

	// Go to next event. Perhaps it's a incoming or we need to respone
	
	// Free the pair
	free( p );
	
	//INFO( "[FriendCoreAccept] Closing thread\n" );
	free( th );
	
	//INFO( "[FriendCoreAccept] Safely returned\n" );
	
	pthread_exit( NULL );
	return NULL;
}

//
// Return an accept pair from accept
//

struct AcceptPair *DoAccept( Socket *sock )
{
	// Accept
	struct sockaddr_in6 client;
	socklen_t clientLen = sizeof( client );
		
	//DEBUG( "[AcceptPair] Accepting on socket\n" );
	int fd = accept( sock->fd, ( struct sockaddr* )&client, &clientLen );
	
	if( fd == -1 ) 
	{
		// Get some info about failure..
		switch( errno )
		{
			case EAGAIN:
				DEBUG( "[AcceptPair] We have processed all incoming connections OR O_NONBLOCK is set for the socket file descriptor and no connections are present to be accepted.\n" );
				break;
			case EBADF:
				DEBUG( "[AcceptPair] The socket argument is not a valid file descriptor.\n" );
				break;
			case ECONNABORTED:
				DEBUG( "[AcceptPair] A connection has been aborted.\n" );
				break;
			case EINTR:
				DEBUG( "[AcceptPair] The accept() function was interrupted by a signal that was caught before a valid connection arrived.\n" );
				break;
			case EINVAL:
				DEBUG( "[AcceptPair] The socket is not accepting connections.\n" );
				break;
			case ENFILE:
				DEBUG( "[AcceptPair] The maximum number of file descriptors in the system are already open.\n" );
				break;
			case ENOTSOCK:
				DEBUG( "[AcceptPair] The socket argument does not refer to a socket.\n" );
				break;
			case EOPNOTSUPP:
				DEBUG( "[AcceptPair] The socket type of the specified socket does not support accepting connections.\n" );
				break;
			default: 
				DEBUG("[AcceptPair] Accept return bad fd\n");
				break;
		}
		return NULL;
	}
	
	// Create socket object
	int prerr = getpeername( fd, (struct sockaddr *) &client, &clientLen );
	if( prerr == -1 )
	{
		close( fd );
		return NULL;
	}

	// Return copy
	struct AcceptPair *p = calloc( 1, sizeof( struct AcceptPair ) );
	p->fd = fd;
	memcpy( &p->client, &client, sizeof( struct sockaddr_in6 ) );
	//DEBUG( "[AcceptPair] Done accepting file descriptor %d\n", fd );
	return p;
}

//
//
//

void *FriendCoreAcceptPhase1( void *d )
{
	struct fcThreadInstance *pre = ( struct fcThreadInstance *)d;
	pthread_detach( pre->thread );
	
	// Ready our accept pair
	struct AcceptPair *p = NULL;
	
	// Run accept() and return an accept pair
	int acceptIng = 0;
	for( ; ; acceptIng++ )
	{
		p = NULL;
		if( pthread_mutex_lock( &pre->fc->listenMutex ) == 0 )
		{
			p = DoAccept( pre->fc->listenSocket );
			pthread_mutex_unlock( &pre->fc->listenMutex );
		}
		if( !p ) break;
		
		// Add the new SSL accept thread:
		// We have a notification on the listening socket, which means one or more incoming connections.
		struct fcThreadInstance *idata = calloc( 1, sizeof( struct fcThreadInstance ) );
		idata->fc = pre->fc;
		idata->acceptPair = p;
		memset( &idata->thread, 0, sizeof( pthread_t ) );
		
		// Multithread mode
		if( pthread_create( &idata->thread, NULL, &FriendCoreAccept, ( void *)idata ) != 0 )
		{
			free( idata );
			// Clean up accept pair
			shutdown( p->fd, SHUT_RDWR );
			close( p->fd );
			free( p );
		}
	}
	
	free( pre ); // <- remove thread instance
	pthread_exit( NULL );
}


//
//
//

inline void FriendCoreEpoll( FriendCoreInstance* fc )
{
	int eventCount = 0;
	int retval;
	int i, ii;
	struct epoll_event *currentEvent;
	struct epoll_event *events = FCalloc( fc->fci_MaxPoll, sizeof( struct epoll_event ) );
	ssize_t count;
	Socket *sock = NULL;
	
	// Read buffer
	char buffer[ fc->fci_BufferSize ];
	
	// add communication ReadCommPipe		
	int pipefds[2] = {}; struct epoll_event piev = { 0 };	
	pipe( pipefds );	
	fc->fci_ReadCorePipe = pipefds[ 0 ]; fc->fci_WriteCorePipe = pipefds[ 1 ];
	// add the read end to the epoll
	piev.events = EPOLLIN | EPOLLET; piev.data.fd = fc->fci_ReadCorePipe;
	int err = epoll_ctl( fc->epollfd, EPOLL_CTL_ADD, fc->fci_ReadCorePipe, &piev );
	if( err != 0 )
	{
		ERROR("Cannot custom event, error %d\n", err );
	}
	
	// Handle signals and block while going on!
	struct sigaction setup_action;
	sigset_t block_mask, curmask; 
	sigemptyset( &block_mask );
	// Block other terminal-generated signals while handler runs.
	sigaddset( &block_mask, SIGINT );
	setup_action.sa_handler = SignalHandler;
	setup_action.sa_restorer = NULL;
	setup_action.sa_mask = block_mask;
	setup_action.sa_flags = 0;
	sigaction( SIGINT, &setup_action, NULL );
	sigprocmask( SIG_SETMASK, NULL, &curmask );
	fci = fc;

	// All incoming network events go through here
	while( !fc->fci_Shutdown )
	{
		DEBUG("Before Epoll wait FC\n");
		// Wait for something to happen on any of the sockets we're listening on
		
		eventCount = epoll_pwait( fc->epollfd, events, fc->fci_MaxPoll, -1, &curmask );
		
		DEBUG("After Epoll wait FC\n");

		for( i = 0; i < eventCount; i++ )
		{	
			currentEvent = &events[i];
			
			// Incoming socket!
			sock = (Socket *)currentEvent->data.ptr;
			
			// Ok, we have a problem with our connection
			if( 
				( currentEvent->events & ( EPOLLERR | EPOLLRDHUP | EPOLLHUP ) ) 
				|| !( currentEvent->events & EPOLLIN ) 
			)
			{
				if( currentEvent->data.fd == fc->listenSocket->fd )
				{
					// Oups! We have gone away!
					DEBUG( "[FriendCoreEpoll] Socket went away!\n" );
					break;
				}
				ERROR( "[FriendCoreEpoll] Socket had errors.\n" );
				// Remove it
				if( sock )
				{
					epoll_ctl( fc->epollfd, EPOLL_CTL_DEL, sock->fd, currentEvent );
					SocketClose( sock );
					ERROR("Close socket, remove from epoll\n");
				}
				continue;
			}
			else if( currentEvent->events & EPOLLWAKEUP )
			{
				DEBUG( "[FriendCoreEpoll] Wake up!\n" );
				continue;
			}
			// First handle pipe messages
			else if( currentEvent->data.fd == fc->fci_ReadCorePipe )
			{
				// read all bytes from read end of pipe
				char ch;
				int result = 1;
					
				DEBUG("[FriendCoreEpoll] FC Read from pipe!\n");
				
				while( result > 0 )
				{
					result = read( fc->fci_ReadCorePipe, &ch, 1 );
					DEBUG("[FriendCoreEpoll] FC Read from pipe %c\n", ch );
					if( ch == 'q' )
					{
						fc->fci_Shutdown = TRUE;
						DEBUG("[FriendCoreEpoll] FC Closing. Current reads: %d, writes: %d!\n", _reads, _writes );
						break;
					}
				}
				
				if( fc->fci_Shutdown == TRUE )
				{
					INFO("[FriendCoreEpoll] Core shutdown in porgress\n");
					break;
				}
			}
			// Accept incoming connections
			else if( currentEvent->data.fd == fc->listenSocket->fd )
			{	
				struct fcThreadInstance *pre = calloc( 1, sizeof( struct fcThreadInstance ) );
				pre->fc = fc;
				if( pthread_create( &pre->thread, NULL, &FriendCoreAcceptPhase1, ( void *)pre ) != 0 )
				{
					free( pre );
				}
			}
			// We are responding to an established connection
			// We must read whatever data is available completely
			else if( currentEvent->events & EPOLLIN )
			{
				int rem = epoll_ctl( fc->epollfd, EPOLL_CTL_DEL, sock->fd, currentEvent );
				
				if( rem == 0 )
				{
					// Put everything in a struct that can be totally accessed by handler
					struct SocketThreadData *t = FCalloc( 1, sizeof( struct SocketThreadData ) );
		
					// Seemingly not enough memory
					if( !t )
					{
						abort();
					}
		
					t->sock = sock; // Add incoming socket here
					t->ce = currentEvent;
					t->doFree = TRUE;

#ifndef NO_WORKERS
					//if( pthread_mutex_lock( &fc->listenMutex ) == 0 )
					{
						WorkerManagerRun( fc->fci_WorkerManager, SocketCallHandler, ( void *)t );
						//pthread_mutex_unlock( &fc->listenMutex );
					}
#else
					memset( &t->thread, 0, sizeof( pthread_t ) );
					if( pthread_create( &t->thread, NULL, &SocketCallHandler, ( void *)t ) != 0 )
					{
						SocketClose( t->sock ); free( t );
					}
#endif
				}
				else
				{
					//DEBUG( "Deleting socket %d (memory: %p). ------------------------- STOP ---- ---------\n", sock->fd, &sock->fd );
					ERROR("Epollin closing socket\n");
					SocketClose( sock );
				}
			}
		}
		DEBUG("End of events loop\n");
	}
	
	// Free epoll events
	FFree( events );
	
	DEBUG( "[CORE] Done freeing events" );
	events = NULL;
	
	// Free pipes!
	close( fc->fci_ReadCorePipe );
	close( fc->fci_WriteCorePipe );
	
	fc->fci_Closed = TRUE;
}

//
// Run FriendCoreInstance
//

int FriendCoreRun( FriendCoreInstance* fc )
{
	// TODO:
	//     Launch ports and services from config file.
	//     Something like this, maybe:
	//     service{
	//         name     web
	//         host     somedomain.com
	//         protocol http
	//         port     6502
	//         handler  stdweb
	//     }
	//     service{
	//         name     web-load-balancer
	//         protocol http
	//         port     6503
	//         library  loadbalancer
	//     }
	//     service{
	//         name     friend-mesh
	//         protocol friendlish
	//         port     6503
	//     }

	DEBUG("=========================================\n");
	DEBUG("==========Starting FriendCore.===========\n");
	DEBUG("=========================================\n");

	fc->fci_WorkerManager = WorkerManagerNew( MAX_WORKERS );
	DEBUG("[FriendCore] WorkerManager started\n");
	
	// Open new socket for lisenting
	fc->listenSocket = SocketOpen( fc->fci_Port, SOCKET_TYPE_SERVER );
	
	if( fc->listenSocket == NULL )
	{
		return -1;
	}
	
	// Non blocking listening!
	if( SocketSetBlocking( fc->listenSocket, FALSE ) == -1 )
	{
		SocketClose( fc->listenSocket );
		return -1;
	}
	
	if( SocketListen( fc->listenSocket ) == 0 )
	{
		SocketClose( fc->listenSocket );
		return -1;
	}
	
	pipe2( fc->fci_SendPipe, 0 );
	pipe2( fc->fci_RecvPipe, 0 );

	// Create epoll
	fc->epollfd = epoll_create1( 0 );
	if( fc->epollfd == -1 )
	{
		ERROR( "[FriendCore] epoll_create\n" );
		SocketClose( fc->listenSocket );
		return -1;
	}

	// Register for events
	struct epoll_event event;
	memset( &event, 0, sizeof( event ) );
	event.data.fd = fc->listenSocket->fd;
	event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
	
	if( epoll_ctl( fc->epollfd, EPOLL_CTL_ADD, fc->listenSocket->fd, &event ) == -1 )
	{
		ERROR( "[FriendCore] epoll_ctl\n" );
		SocketClose( fc->listenSocket );
		return -1;
	}

	DEBUG("[FriendCore] Listening.\n");
	FriendCoreEpoll( fc );

	if( epoll_ctl( fc->epollfd, EPOLL_CTL_DEL, fc->listenSocket->fd, &event ) == -1 )
	{
		ERROR( "[FriendCore] epoll_ctl can not del!\n" );
	}
	
	// Server is shutting down
	DEBUG("[FriendCore] Shutting down.\n");
	if( fc->listenSocket )
	{
		SocketClose( fc->listenSocket );
		fc->listenSocket = NULL;
	}

	// Close libraries
	if( fc->libraries )
	{
		unsigned int iterator = 0;
		HashmapElement* e = NULL;
		while( ( e = HashmapIterate( fc->libraries, &iterator ) ) != NULL )
		{
			DEBUG( "[FriendCore] Closing library at address %lld\n", ( long long int )e->data );
			LibraryClose( (Library*)e->data );
			if( e->data != NULL )
			{
				FFree( e->data );
			}
			e->data = NULL;
			FFree( e->key );
			e->key = NULL;
		}
		HashmapFree( fc->libraries );
		fc->libraries = NULL;
	}
	
	if( fc->fci_WorkerManager != NULL )
	{
		DEBUG( "[FriendCore] Shutting down worker manager.\n" );
		WorkerManagerDelete( fc->fci_WorkerManager );
	}
	
	// Close this
	if( fc->epollfd )
	{
		INFO("Closing Epoll file descriptor\n");
		close( fc->epollfd );
	}
	
	close( fc->fci_SendPipe[0] );
	close( fc->fci_SendPipe[1] );
	close( fc->fci_RecvPipe[0] );
	close( fc->fci_RecvPipe[1] );
	
	INFO("[FriendCore] Goodbye.\n");
	return 0;
}

//
//
//

/*void FriendCoreEpollout( FriendCoreInstance_t* instance, Socket_t* sock )
{
	struct epoll_event event;
	event.data.ptr = sock;
	event.events = EPOLLIN | EPOLLRDHUP |EPOLLET; //| EPOLLET;
	int retval = epoll_ctl( instance->epollfd, EPOLL_CTL_MOD, sock->fd, &event );
	ERROR("Friendcore Epollout retval %d\n", retval );
	if( retval == -1 )
	{
		ERROR("epoll_ctl\n");
		SocketClose( instance->listenSocket );
		instance->listenSocket = NULL;
	}
}*/

//
//
//

Library* FriendCoreGetLibrary( FriendCoreInstance* fc, char* libname, ULONG version )
{
	if( !fc )
	{
		return NULL;
	}

	if( !fc->libraries )
	{
		fc->libraries = HashmapNew();
	}

	DEBUG("Looking for %s\n", libname);
	HashmapElement* e = HashmapGet( fc->libraries, libname );
	Library* lib = NULL;
	if( e == NULL )
	{
		DEBUG("Library open\n");
		lib = LibraryOpen( SLIB, libname, version );
		if( !lib )
		{
			return NULL;
		}
		HashmapPut( fc->libraries, StringDuplicate( libname ), lib );
	}
	else
	{
		lib = (Library*)e->data;
		if( lib->l_Version < version )
		{
			lib = NULL;
		}
	}
	return lib;
}

