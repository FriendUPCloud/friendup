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
*  Friend Core
*
*  Friend Core is the root of the system
*  in C and a message dispatch mechanism.
*
*  @author PS (Pawel Stefanski)
*  @date pushed 19/10/2015
* 
* \defgroup FriendCore Friend Core
* @{
*/

/* epoll events use data.ptr to store pointer to a Socket struct.
* Previously the data.fd union field was used. Now it is unified,
* except for the pipe that is used to trigger shutdown.
*/

#define _POSIX_SOURCE

//#define USE_SELECT

#include <core/types.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#ifdef USE_SELECT

#else
#include <sys/epoll.h>
#endif
#include <arpa/inet.h>
#include "util/string.h"
#include "core/friend_core.h"
#include "network/socket.h"
#include "network/protocol_http.h"
#include <util/log/log.h>
#include <system/services/service_manager.h>
#include <util/buffered_string.h>
#include <util/http_string.h>
#include <openssl/rand.h>

#include <hardware/network.h>

#include <system/systembase.h>
#include <core/friendcore_manager.h>
#include <openssl/crypto.h>

//#undef DEBUG
//#define DEBUG( ...)
//#undef DEBUG1
//#define DEBUG1( ...)

//#define USE_PTHREAD
#define USE_WORKERS
//#define USE_PTHREAD_ACCEPT

extern void *FCM;			// FriendCoreManager
pthread_mutex_t maxthreadmut;

struct AcceptPair *DoAccept( Socket *sock );
void FriendCoreProcess( void *fcv );

int accept4(int sockfd, struct sockaddr *addr,            socklen_t *addrlen, int flags);

int nothreads = 0;					/// threads coutner @todo to rewrite
#define MAX_CALLHANDLER_THREADS 256			///< maximum number of simulatenous handlers

/* HTTP requests above this thresholds are saved to temporary files
* and mmap'ed for later use. This conserves RAM during large
* file uploads. (TK-628)
*/
#define TUNABLE_LARGE_HTTP_REQUEST_SIZE (10*1024*1024) //10MB

/**
* Mutex buffer for ssl locking
*/

static pthread_mutex_t *ssl_mutex_buf = NULL;

/**
* Static locking function.
*
* @param mode identifier of the mutex mode to use
* @param n number of the mutex to use
* @param file not used
* @param line not used
*/

static void ssl_locking_function( int mode, int n, const char *file __attribute__((unused)), int line __attribute__((unused)))
{ 
	if( mode & CRYPTO_LOCK )
	{
		FRIEND_MUTEX_LOCK( &ssl_mutex_buf[ n ] );
	}
	else
	{
		FRIEND_MUTEX_UNLOCK( &ssl_mutex_buf[ n ] );
	}
}

/**
* Static ID function.
*
* @return function return thread ID as unsigned long
*/

static unsigned long ssl_id_function( void ) 
{
	return ( ( unsigned long )pthread_self() );
}

/**
* Creates a new instance of Friend Core.
*
* @param sb pointer to SystemBase
* @param ssl flag to indicate the use of ssl protocol
* @param port communication port number
* @param maxp maximum number of polls at the same time FL>PS ?
* @param bufsiz buffer size
* @param hostname FC host name
* @return pointer to the new instance of FriendCore
* @return NULL in case of error
*/

FriendCoreInstance *FriendCoreNew( void *sb, int id, FBOOL ssl, int port, int maxp, int bufsiz, char *hostname )
{
	LOG( FLOG_INFO, "[FriendCoreNew] Starting friend core\n" );
	
	// Static locks callbacks
	SSL_library_init();
	
	// Watch our threads
	// TODO: make an array and use one for each friend core! (if multiple)
	pthread_mutex_init( &maxthreadmut, NULL );
	
	// Static locks buffer
	ssl_mutex_buf = FCalloc( CRYPTO_num_locks(), sizeof( pthread_mutex_t ) );
	if( ssl_mutex_buf == NULL)
	{ 
		LOG( FLOG_PANIC, "[FriendCoreNew] Failed to allocate ssl mutex buffer.\n" );
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
		char buffer[ 256 ];
		fc->fci_Port = port;
		fc->fci_MaxPoll = maxp;
		fc->fci_BufferSize = bufsiz;
		fc->fci_SSLEnabled = ssl;
		fc->fci_SB = sb;
		snprintf( buffer, 256, "%032d", id );
		memcpy( fc->fci_CoreID, buffer, 32 );
		//snprintf( fc->fci_CoreID, 32, "%032d", id );
		strncpy( fc->fci_IP, hostname, 256 );
	}
	else
	{
		LOG( FLOG_PANIC, "Cannot allocate memory for FriendCore instance\n");
		return NULL;
	}
	
	// Init listen mutex
	pthread_mutex_init( &fc->fci_ListenMutex, NULL );
	
	LOG( FLOG_INFO,"[FriendCore] WorkerManager started\n");
	
	return fc;
}

/**
* Stops and destroys an instance of Friend Core.
*
* @param fc pointer to Friend Core instance to destroy
*/

void FriendCoreShutdown( FriendCoreInstance* fc )
{	
	// Clear watchdog
	pthread_mutex_destroy( &maxthreadmut );

	DEBUG("[FriendCoreShutdown] On exit, we have %d idle threads.\n", nothreads );

	while( fc->fci_Closed != TRUE )
	{
		LOG( FLOG_INFO, "[FriendCoreShutdown] Waiting for close\n" );
		sleep( 1 );
	}
	
	if( ssl_mutex_buf != NULL )
	{
		FFree( ssl_mutex_buf );
		ssl_mutex_buf = NULL;
	}
	
	// Destroy listen mutex
	//DEBUG("[FriendCoreShutdown] Waiting for listen mutex\n" );
	if( FRIEND_MUTEX_LOCK( &fc->fci_ListenMutex ) == 0 )
	{
		FRIEND_MUTEX_UNLOCK( &fc->fci_ListenMutex );
		pthread_mutex_destroy( &fc->fci_ListenMutex );
	}
	
	FFree( fc );
	
	LOG( FLOG_INFO,"FriendCore shutdown!\n");
}

//
// Handy string divider macro
//

static char *dividerStr = "\r\n\r\n";

//
//
//

#define NO_WORKERS

//
// Decrease number of threads
//

static void DecreaseThreads()
{
	if( FRIEND_MUTEX_LOCK( &maxthreadmut ) == 0 )
	{
		nothreads--;
#ifdef __DEBUG
		//LOG( FLOG_DEBUG,"DecreaseThreadsDecreaseThreadsDecreaseThreads %d %d\n", pthread_self(), nothreads );
#endif
		FRIEND_MUTEX_UNLOCK( &maxthreadmut );
	}
}

static void IncreaseThreads()
{
	if( FRIEND_MUTEX_LOCK( &maxthreadmut ) == 0 )
	{
		nothreads++;
#ifdef __DEBUG
		//LOG( FLOG_DEBUG,"IncreaseThreadsIncreaseThreadsIncreaseThreads %d %d\n", pthread_self(), nothreads );
#endif
		FRIEND_MUTEX_UNLOCK( &maxthreadmut );
	}
}

//
// Current Friend Core instance
//

struct FriendCoreInstance *fci;

/**
* Sends a quit message
*
* @param signal signal id
*/
void SignalHandler( int signal __attribute__((unused)) )
{
	DEBUG("[FriendCoreShutdown] Quit signal sent\n");
#ifdef USE_SELECT
	
#endif

	FriendCoreManagerShutdown( FCM );
}

// Removes from doc as it appears in list of modules for Friend Core group (should be in .h! :)
#ifndef DOXYGEN
/**
* Thread to handle incoming connections!!!
*/
struct fcThreadInstance 
{ 
	FriendCoreInstance *fc;
	pthread_t thread;
	struct epoll_event *event;
	Socket *sock;
	
	// Incoming from accept
	struct AcceptPair *acceptPair;
};

#endif

//
// internal
//

static inline void moveToHttp( int fd )
{
	char redirectURL[ 1024 ];
	Http *response;
	
	char buf[ 1024 ];
	int re = 0;
	
	while( TRUE )
	{
		int r = recv( fd, buf, 1024, 0 );
		if( r  <= 0 )
		{
			break;
		}
		re += r;
		//DEBUG("Received from socket '%s' size %d\n", buf, re );
		sleep( 1 );
	}

	strcpy( redirectURL, "https://" );
	
	// get Host
	char *f = strstr( buf, "Host:" );
	char *tmp = NULL;
	if( f != NULL )
	{
		f += 6; // + "Host: "
		tmp = f;
		while( *f != '\r' )
		{
			f++;
		}
		*f = 0;
		strcat( redirectURL, tmp );
	}

	strcat( redirectURL, "/webclient/index.html" );
	
	Log( FLOG_DEBUG, "[ProtocolHttp] Redirect : '%s'\n", redirectURL );
	struct TagItem tags[] = {
		{ HTTP_HEADER_LOCATION, (FULONG)StringDuplicateN( redirectURL, strlen( redirectURL ) ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE }
	};
	response = HttpNewSimple( HTTP_307_TEMPORARY_REDIRECT, tags );

	/*
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "Upgrade" ) },
		{ HTTP_HEADER_UPGRADE, (FULONG)StringDuplicate("TLS/1.1" ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE }
	};
	response = HttpNewSimple( HTTP_426_UPGRADE_REQUIRED, tags );
	*/
	
	if( response != NULL )
	{
		HttpAddTextContent( response, StringDuplicate("<html>please change to https!</html>") );
		
		if( HttpBuild( response ) != NULL )
		{
			int s;
			s = send( fd, response->response, response->responseLength, 0 );
			//close( fd );
		}
		HttpFree( response );
	}
}

static inline void moveToHttps( Socket *sock )
{
	Http *response;
	
	char buf[ 1024 ];
	int re = 0;
	
	/*
	while( TRUE )
	{
		int r = recv( fd, buf, 1024, 0 );
		if( r  <= 0 )
		{
			break;
		}
		re += r;
		DEBUG("Received from socket '%s' size %d\n", buf, re );
		sleep( 1 );
	}
	*/
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE }
	};
	response = HttpNewSimple( HTTP_400_BAD_REQUEST, tags );
	
	if( response != NULL )
	{
		HttpAddTextContent( response, StringDuplicate("<html>please change to https!</html>") );
		
		if( HttpBuild( response ) != NULL )
		{
			int s;
			//s = SSL_write( sock->s_Ssl, response->response, response->responseLength );
			s = send( sock->fd, response->response, response->responseLength, 0 );
			//DEBUG("Response send!!!\n\n\n %s\n\n\n%d\n\n\n", response->response, response->responseLength );
			//close( fd );
		}
		HttpFree( response );
	}
}

/**
* Accept FriendCore http connections
*
* @param d pointer to fcThreadInstance
*/
void *FriendCoreAcceptPhase2( void *d )
{
	//DEBUG("[FriendCoreAcceptPhase2] detached\n");
	pthread_detach( pthread_self() );

	IncreaseThreads();
	
	struct fcThreadInstance *pre = (struct fcThreadInstance *)d;
	FriendCoreInstance *fc = (FriendCoreInstance *)pre->fc;

	// Accept
	struct sockaddr_in6 client;
	socklen_t clientLen = sizeof( client );
	int fd = 0;
	
	//DEBUG("[FriendCoreAcceptPhase2] before accept4\n");
	
	while( ( fd = accept4( fc->fci_Sockets->fd, ( struct sockaddr* )&client, &clientLen, SOCK_NONBLOCK ) ) > 0 )
	{
		if( fd == -1 )
		{
			// Get some info about failure..
			switch( errno )
			{
				case EAGAIN:
					break;
				case EBADF:
					DEBUG( "[AcceptPair] The socket argument is not a valid file descriptor.\n" );
					goto accerror;
				case ECONNABORTED:
					DEBUG( "[AcceptPair] A connection has been aborted.\n" );
					goto accerror;
				case EINTR:
					DEBUG( "[AcceptPair] The accept() function was interrupted by a signal that was caught before a valid connection arrived.\n" );
					goto accerror;
				case EINVAL:
					DEBUG( "[AcceptPair] The socket is not accepting connections.\n" );
					goto accerror;
				case ENFILE:
					DEBUG( "[AcceptPair] The maximum number of file descriptors in the system are already open.\n" );
					goto accerror;
				case ENOTSOCK:
					DEBUG( "[AcceptPair] The socket argument does not refer to a socket.\n" );
					goto accerror;
				case EOPNOTSUPP:
					DEBUG( "[AcceptPair] The socket type of the specified socket does not support accepting connections.\n" );
					goto accerror;
				default: 
					DEBUG("[AcceptPair] Accept return bad fd\n");
					goto accerror;
			}
			goto accerror;
		}
		
		//DEBUG("[FriendCoreAcceptPhase2] before get peer name, fd: %d\n", fd );
		// Create socket object
		int prerr = getpeername( fd, (struct sockaddr *) &client, &clientLen );
		if( prerr == -1 )
		{
			shutdown( fd, SHUT_RDWR );
			close( fd );
			goto accerror;
		}
		
		// Get incoming
		Socket *incoming = NULL;
		int error = 0;
	
		incoming = ( Socket *)FCalloc( 1, sizeof( Socket ) );
		if( incoming != NULL )
		{
			incoming->fd = fd;
			incoming->port = ntohs( client.sin6_port );
			incoming->ip = client.sin6_addr;
			incoming->s_SSLEnabled = fc->fci_Sockets->s_SSLEnabled;
			incoming->s_SB = fc->fci_Sockets->s_SB;

			pthread_mutex_init( &incoming->mutex, NULL );
		}
		else
		{
			FERROR("Cannot allocate memory for socket!\n");
			shutdown( fd, SHUT_RDWR );
			close( fd );
			goto accerror;
		}
		//DEBUG("[FriendCoreAcceptPhase2] socket initialized\n");
		
		int lbreak = 0;
		
		if( fc->fci_Sockets->s_SSLEnabled == TRUE )
		{
			int srl;
			
			SSL_CTX_set_session_cache_mode( fc->fci_Sockets->s_Ctx, SSL_SESS_CACHE_CLIENT | SSL_SESS_CACHE_NO_INTERNAL_STORE);
			
			incoming->s_Ssl = SSL_new( fc->fci_Sockets->s_Ctx );

			if( incoming->s_Ssl == NULL )
			{
				FERROR("[SocketAcceptPair] Cannot accept SSL connection\n");
				shutdown( fd, SHUT_RDWR );
				close( fd );
				pthread_mutex_destroy( &incoming->mutex );
				FFree( incoming );
				goto accerror;
			}

			//DEBUG("[FriendCoreAcceptPhase2] set fd\n");
			srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
			SSL_set_accept_state( incoming->s_Ssl );
			
			//DEBUG("[FriendCoreAcceptPhase2] state accepted\n");

			if( srl != 1 )
			{
				int error = SSL_get_error( incoming->s_Ssl, srl );

				FERROR( "[SocketAcceptPair] Could not set fd, error: %d fd: %d\n", error, incoming->fd );
				shutdown( fd, SHUT_RDWR );
				close( fd );
				pthread_mutex_destroy( &incoming->mutex );
				SSL_free( incoming->s_Ssl );
				FFree( incoming );
				goto accerror;
			}
			//DEBUG("[FriendCoreAcceptPhase2] before while\n");
			
			// setup SSL session
			int err = 0;

			while( 1 )
			{
				DEBUG("before accept\n");
				if( ( err = SSL_accept( incoming->s_Ssl ) ) == 1 )
				{
					break;
				}

				if( err <= 0 || err == 2 )
				{
					int error = SSL_get_error( incoming->s_Ssl, err );
					switch( error )
					{
						case SSL_ERROR_NONE:
							// NO error..
							FERROR( "[SocketAcceptPair] No error\n" );
							lbreak = 1;
						break;
						case SSL_ERROR_ZERO_RETURN:
							FERROR("[SocketAcceptPair] SSL_ACCEPT error: Socket closed.\n" );
							SocketDelete( incoming );
							goto accerror;
						case SSL_ERROR_WANT_READ:
							lbreak = 2;
						break;
						case SSL_ERROR_WANT_WRITE:
							lbreak = 2;
						break;
						case SSL_ERROR_WANT_ACCEPT:
							FERROR( "[SocketAcceptPair] Want accept\n" );
							SocketDelete( incoming );
							goto accerror;
						case SSL_ERROR_WANT_X509_LOOKUP:
							FERROR( "[SocketAcceptPair] Want 509 lookup\n" );
							SocketDelete( incoming );
							goto accerror;
						case SSL_ERROR_SYSCALL:
							FERROR( "[SocketAcceptPair] Error syscall. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
							SocketDelete( incoming );
							goto accerror;
						case SSL_ERROR_SSL:
						{
							int enume = ERR_get_error();
							FERROR( "[SocketAcceptPair] SSL_ERROR_SSL: %s.\n", ERR_error_string( enume, NULL ) );
							lbreak = 2;
							
							// HTTP to HTTPS redirection code
							if( enume == 336027804 ) // http redirect
							{
								moveToHttp( fd );
							}
							else
							{
								SocketDelete( incoming );
								goto accerror;
							}
							break;
						}
					}
				}
				if( lbreak >= 1 )
				{
					break;
				}
				usleep( 0 );
				
				if( fc->fci_Shutdown == TRUE )
				{
					FINFO("Accept socket process will be stopped, becaouse Shutdown is in progress\n");
					break;
				}
			}
		}
		else
		{
			//DEBUG("No SSL\n");
		}
		//DEBUG("[FriendCoreAcceptPhase2] before getting incoming\n");
		
		// We got incoming!
		if( incoming != NULL )
		{
			// Add instance reference
			incoming->s_Data = fc;
		#ifdef USE_SELECT
			struct fcThreadInstance *pre = FCalloc( 1, sizeof( struct fcThreadInstance ) );
			if( pre != NULL )
			{
				pre->fc = fc; pre->sock = incoming;

				size_t stacksize = 16777216; //16 * 1024 * 1024;
				pthread_attr_t attr;
				pthread_attr_init( &attr );
				pthread_attr_setstacksize( &attr, stacksize );
			
				SystemBase *locsb = (SystemBase *)fc->fci_SB;
				if( WorkerManagerRun( locsb->sl_WorkerManager,  FriendCoreProcess, pre, NULL, "Incoming") != 0 )
				{
					SocketClose( incoming );
				}
			/*
			// Make sure we keep the number of threads under the limit
			if( pthread_create( &pre->thread, &attr, &FriendCoreProcess, ( void *)pre ) != 0 )
			{
				FFree( pre );
			}
			*/
		}
		#else

			/// Add to epoll
			// TODO: Check return of epoll ctl
			struct epoll_event event;
			event.data.ptr = incoming;
			event.events = EPOLLIN| EPOLLET;
			//event.events = EPOLLIN| EPOLLET| EPOLLHUP | EPOLLERR;
			//DEBUG("[FriendCoreAcceptPhase2] epoll_add\n");

			error = epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_ADD, incoming->fd, &event );
	
			//DEBUG("[FriendCoreAcceptPhase2] before yield\n");
			pthread_yield();
			//DEBUG("[FriendCoreAcceptPhase2] after yield\n");
			
			if( error )
			{
				FERROR("\n************************************** epoll_ctl failure **************************************\n\n");
				SocketDelete(incoming);
				goto accerror;
			}

		#endif // USE_SELECT
		}
		// Miss?
		else
		{
			DEBUG( "[FriendCoreAccept] Could not get an incoming..\n" );
		}
		
		if( fc->fci_Shutdown == TRUE )
		{
			if( fd > 0 )
			{
				close( fd );
			}
			break;
		}
		//DEBUG("[FriendCoreAcceptPhase2] in accept loop\n");
	}	// while accept
	
	FFree( pre );
	DecreaseThreads();
	//pthread_exit( 0 );
	return NULL;
accerror:
	DEBUG("ERROR\n");
	FFree( pre );
	DecreaseThreads();
	//pthread_exit( 0 );

	return NULL;
}

/**
* Processes Friend Core messages
*
* @param fcv pointer to thread instance of Friend Core
* @return NULL
*/
void *FriendCoreProcess__httponthefly( void *fcv )
{
#ifdef USE_PTHREAD
	pthread_detach( pthread_self() );
#endif
	
	IncreaseThreads();
	
	DEBUG("[FriendCoreProcess] Before while\n");
	
	struct fcThreadInstance *th = ( struct fcThreadInstance *)fcv;
	
	// Get socket
	if( th->sock == NULL )
	{
		DecreaseThreads();
		FFree( th );
#ifdef USE_PTHREAD
		pthread_exit( 0 );
#endif
		return NULL;
	}
	
	// First pass header, second, data
	int pass = 0, bodyLength = 0, prevBufSize = 0, preroll = 0, stopReading = 0;
	
	// Often used
	int partialDivider = 0, foundDivider = 0, y = 0, x = 0, yc = 0, yy = 0;
	char findDivider[ 5 ];
	char *std_Buffer = FCalloc( HTTP_READ_BUFFER_DATA_SIZE_ALLOC, sizeof( char ) );
	if( std_Buffer != NULL )
	{
		HttpString *resultString = HttpStringNew( HTTP_READ_BUFFER_DATA_SIZE );
		
		int res = 0;
		int requestSize = 0;
		int timesRead = 0;
		FBOOL everythingRead = FALSE;
		FBOOL parseOnlyHeader = FALSE;
		
		DEBUG("[FriendCoreProcess] before process ptr %p fd %d\n", th->sock, th->sock->fd );

		Http *request = NULL;
		
		while( TRUE )
		{
			if( ( res = SocketRead( th->sock, std_Buffer, HTTP_READ_BUFFER_DATA_SIZE, pass ) ) > 0 )
			{
				char stdBufChr = std_Buffer[ res - 1 ];
				requestSize += res;
				timesRead++;
				
				HttpStringAdd( resultString, std_Buffer, res );

				if( ( stdBufChr == '\r' ||  stdBufChr == '\n' ) )
				{
					if( res < HTTP_READ_BUFFER_DATA_SIZE )
					{
						everythingRead = TRUE;

						// we have whole message, no need to read more
						//break;
					}
				}
				// enough to parse header
				else if( strstr( std_Buffer, dividerStr ) != NULL )
				{
					parseOnlyHeader = TRUE;
				}
				
				if( everythingRead == TRUE || parseOnlyHeader == TRUE )
				{
					request = ( Http *)th->sock->data;
					if( request == NULL )
					{
						request = HttpNew( );
						request->timestamp = time( NULL );
						th->sock->data = ( void* )request;
						resultString->ht_Reqest = request;
					}
					
					if( request != NULL && request->gotHeader == FALSE )
					{
						int result = HttpParseHeader( request, resultString->ht_Buffer, resultString->ht_Size + 1 );
						if( result == 1 )
						{
							if( request->h_ContentLength > 0 )
							{
								//char *divider = strstr( content, dividerStr );
								char *divider = strstr( resultString->ht_Buffer, dividerStr );

								// No divider?
								if( !divider )
								{
									break;
								}

								bodyLength = request->h_ContentLength;//atoi( content );
								
								int headerLength = divider - resultString->ht_Buffer + 4;

								// We have enough data and are ready for reading the body
								if( requestSize >= ( headerLength + bodyLength ) )
								{
									everythingRead = TRUE;
								}
								
							}
							else
							{
								FERROR("content = NULL\n");
							}
						}
						else
						{
							FERROR("Error during parsing header %d\n", result );
						}
						
						if( bodyLength == 0 )
						{
							break;
						}
						request->gotHeader = TRUE;
					}
					
					if( everythingRead == TRUE )
					{
						
						break;
					}
				}
				
				//TEST
				if( timesRead > 2 )
				{
					break;
				}
			}
			else
			{
				break;
			}
		}
		
		
		if( everythingRead == TRUE )
		{
			// Free up
			if( resultString->ht_Buffer != NULL )
			{
				if( resultString->ht_Size > 0 )
				{
					// Process data
					//LOG( FLOG_DEBUG, "We received this (%d bytes): >>%s<<\n", resultString->bs_Size, resultString->bs_Buffer);
					Http *resp = ProtocolHttp( th->sock, resultString->ht_Buffer, resultString->ht_Size );
					
					// -1 is special case, the response already was sent and cleaned up
					if( resp != NULL )//&& resp != -1 )
					{
						if( resp->h_WriteType == FREE_ONLY )
						{
							HttpFree( resp );
						}
						else
						{
							HttpWriteAndFree( resp, th->sock );
						}
					}
				}
				// No data, just free
				else
				{
					// Ask for more info
					DEBUG( "[FriendCoreProcess] No buffer to write, so just free!\n" );
				}
				HttpStringDelete( resultString );
			}
			else
			{
				// Ask for more info
				DEBUG( "[FriendCoreProcess] No buffer to write!\n" );
			}
		}
		else
		{
			HttpStringDelete( resultString );
			if( request != NULL )
			{
				HttpFree( request );
			}
		}
		
		// Free the pair
		if( th != NULL )
		{
			FFree( th );
		}
		
		// Free up buffers
		FFree( std_Buffer );
	}
	
	SocketDelete( th->sock );
	th->sock = NULL;
	
	// No more threads
	DecreaseThreads();
#ifdef USE_PTHREAD
	//pthread_exit( 0 );
#endif
	return NULL;
}



void FriendCoreProcess( void *fcv )
{
#ifdef USE_PTHREAD
	pthread_detach( pthread_self() );
#endif 
	IncreaseThreads();

	if( fcv == NULL )
	{
		DecreaseThreads();
#ifdef USE_PTHREAD
		pthread_exit( 0 );
#endif
		return;
	}

	struct fcThreadInstance *th = ( struct fcThreadInstance *)fcv;

	if( th->sock == NULL )
	{
		DecreaseThreads();
		FFree( th );
#ifdef USE_PTHREAD
		pthread_exit( 0 );
#endif
		return;
	}

	// Let's go!

	// First pass header, second, data
	int pass = 0, bodyLength = 0, prevBufSize = 0, preroll = 0, 
		stopReading = 0, headerLength = 0;

	// Often used
	int partialDivider = 0, foundDivider = 0, y = 0;
	char findDivider[ 5 ]; memset( findDivider, 0, 5 );

	int bufferSize = HTTP_READ_BUFFER_DATA_SIZE;
	int bufferSizeAlloc = HTTP_READ_BUFFER_DATA_SIZE_ALLOC;

	int tmpFileHandle = -2;
	char *tmpFilename = NULL;
	char tmpFileNameTemplate[] = "/tmp/FriendHTTP_XXXXXX";

	char *incomingBufferPtr = 0;
	unsigned int incomingBufferLength = 0;

	BufString *resultString = BufStringNewSize( bufferSizeAlloc*2 );

	char *locBuffer = FMalloc( bufferSizeAlloc );
	char *firstLocBuffer = locBuffer;
	
	if( locBuffer != NULL )
	{
		incomingBufferPtr = resultString->bs_Buffer;

		for( ; pass < 2; pass++ )
		{
			// No bodylength? Fuck it
			if( pass == 1 && ( !bodyLength || stopReading ) )
			{
				//FERROR( "We have Bodylength: %s, Stopreading: %s\n", !bodyLength ? "no body" : "have body", stopReading ? "stop" : "continue" );
				break;
			}

			// int count = the amount of data read
			// int res = the amount of data read in one chunk
			int count = preroll, res = 0, joints = 0, methodGet = 0;

			// We must find divider!

			char *stdBufChr = NULL;
			partialDivider = 0, foundDivider = 0, y = res - 1;

			for( ; ; )
			{
				// Increase the buffer for files!
				if( count != 0 && locBuffer == firstLocBuffer )
				{
					bufferSize = 1048576; // Bit faster, bit greedier
					bufferSizeAlloc = 1048608; // buffersize + 32
					locBuffer = FRealloc( locBuffer, bufferSizeAlloc );
				}
			
				if( tmpFileHandle < 0 && resultString->bs_Bufsize > TUNABLE_LARGE_HTTP_REQUEST_SIZE )
				{
					//this is going to be a huge request, create a temporary file
					//copy already received data to it and continue writing to the file
					tmpFilename = mktemp( tmpFileNameTemplate );
					//DEBUG( "large upload will go to remporary file %s", tmp_filename );
					if( strlen( tmpFilename ) == 0 )
					{
						FERROR("mktemp failed!");
						break; //drop the connection, rest of this function will do the cleanup
					}
					else
					{
						//TODO: use open64 to support >4GB files on 32-bit machines...
						tmpFileHandle = open( tmpFilename, O_RDWR | O_CREAT | O_EXCL, 0600/*permissions*/);
						if( tmpFileHandle == -1 )
						{
							FERROR("temporary file open failed!");
							break; //drop the connection, rest of this function will do the cleanup
						}
						//write already received chunk
						int wrote = write( tmpFileHandle, resultString->bs_Buffer, resultString->bs_Size );
						BufStringDelete( resultString );
					}
				}

				unsigned int expected = headerLength > 0 && bodyLength > 0 ?
					headerLength + bodyLength - count :
					0;

				res = SocketRead( th->sock, locBuffer, bufferSize, expected );
				if( res > 0 )
				{
					if( tmpFileHandle >= 0 )
					{
						int wrote = write( tmpFileHandle, locBuffer, res );
					}
					else
					{
						int err = BufStringAddSize( resultString, locBuffer, res );
						incomingBufferPtr = resultString->bs_Buffer; //buffer can be in a different place after resize
						incomingBufferLength = resultString->bs_Size;
						//DEBUG( "Data added : %d res: %d count: %d received %d\n", err, res, count, count + res );
					}
				
					if( pass == 0 && partialDivider != 0 )
					{
						stdBufChr = strstr( "\r", locBuffer );
						if( stdBufChr == NULL ) stdBufChr = strstr( "\n", locBuffer );
						if( stdBufChr != NULL )
						{
							findDivider[ partialDivider++ ] = stdBufChr[0];
							if( partialDivider > 3 )
							{
								findDivider[ 4 ] = '\0';
							}
						}
						else partialDivider = 0;
					}

					// How much data did we read?
					count += res;
					joints++;

					// Break get posts after header
					if( pass == 0 )
					{
						stdBufChr = locBuffer + res - 1;

						// If we found a divider!
						if( partialDivider >= 4 || strstr( locBuffer, dividerStr ) )
						{
							// We have a divider! Great!
							break;
						}
						// Does it end with this? Perhaps it's a partial divider
						else if( stdBufChr[0] == '\r' ||  stdBufChr[0] == '\n' )
						{
							memcpy( findDivider, locBuffer + res - 5, 5 );
							partialDivider = 5;
						}
					}
					// Or in second pass, body length
					else if( pass == 1 && count >= bodyLength )
					{
						// remove preroll to get correct read bytes
						count -= preroll;
						//DEBUG( "[FriendCoreProcess] Fixing preroll %d\n", preroll );
						break;
					}
				}
				// Socket closed!
				else if( res == -1 )
				{
					DEBUG( "[FriendCoreProcess] The connection dropped!!\n" );
					if( locBuffer )
					{
						FFree( locBuffer );
						locBuffer = NULL;
					}
					goto close_fcp;
				}
				// No data?
				else
				{
					
					//
					//  if server is handling http and messages coming in "bad format"
					//  we must report to client that he must switch (or error)
					//
					
					//DEBUG("No data, res %d\n", res );
					if( th->sock->s_SSLEnabled == TRUE )
					{
						char buf[ 1024 ];
						int res;
						if( ( res = SSL_read( th->sock->s_Ssl, buf, sizeof(buf) ) ) > 0 )
						{
							
						}
						else
						{
							int error = SSL_get_error( th->sock->s_Ssl, res );
							
							int enume = ERR_get_error();
							if( error == 1 && enume == 336027804 )
							{
								moveToHttp( th->sock->fd );
							}
							FERROR( "[FriendCoreProcess] SSL_ERROR_SSL: %s enume %d.\n", ERR_error_string( enume, NULL ), enume );
						}
					}
					else
					{
						moveToHttps( th->sock );
					}
					break;
				}
				//DEBUG("Socket read: %d\n", res );
			} //end if inner socket reading loop

			if( count > 0 )
			{
				// Already now parse header to receive other data
				if( pass == 0 )
				{
					Http *request = ( Http *)th->sock->data;
					int result = 0;
					char *content = NULL;
					if( request == NULL )
					{
						request = HttpNew( );
						request->timestamp = time( NULL );
						th->sock->data = ( void* )request;
					}
					request->h_ShutdownPtr = &(th->fc->fci_Shutdown);
					request->h_Socket = th->sock;

					/* -------------- Support for large uploads -------------- */
					if( tmpFileHandle >= 0 )
					{
						if( incomingBufferPtr != NULL )
						{
							//DEBUG("incoming buffer already set? unmapping");
							munmap( incomingBufferPtr, incomingBufferLength );
							incomingBufferPtr = NULL;
						}
						//DEBUG( "mmaping" );
						incomingBufferLength = lseek( tmpFileHandle, 0, SEEK_END);
						incomingBufferPtr = mmap( 0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, tmpFileHandle, 0/*offset*/);
						
						if( incomingBufferPtr == MAP_FAILED )
						{
							Log( FLOG_ERROR, "Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
							goto close_fcp;
						}
						//DEBUG( "mmap status %p", incomingBufferPtr );
					}
					else 
					{
						DEBUG( "regular processing" );
					}
					/* ------------------------------------------------------- */
					result = HttpParseHeader( request, incomingBufferPtr, incomingBufferLength + 1 );
					request->gotHeader = TRUE;
					content = HttpGetHeaderFromTable( request, HTTP_HEADER_CONTENT_LENGTH );

#ifdef USE_SOCKET_REAPER
					socket_update_state(th->sock, socket_state_got_header);
#endif

					//DEBUG("CONT LENGTH %ld\n", request->h_ContentLength );

					// If we have content, then parse it
					if( request->h_ContentLength > 0 )
					{
						//DEBUG("Content found\n");
						
						if( content == NULL )
						{
							FERROR("Content is NULL!\n");
							break;
						}
						
						//rchar *divider = strstr( resultString->bs_Buffer, dividerStr );
						char *divider = strstr( content, dividerStr );
						
						// No divider?
						if( !divider )
						{
							prevBufSize += count;
							//DEBUG("\n\n 1prevBufSize %d count %d\n\n\n", prevBufSize, count );
							break;
						}

						bodyLength = request->h_ContentLength;//atoi( content );
						
						// We have enough data and are ready for reading the body
						headerLength = divider - resultString->bs_Buffer + 4;
						if( count > headerLength )
						{
							prevBufSize += count;
							preroll = count - headerLength;
							stopReading = count >= ( headerLength + bodyLength );
							
							//DEBUG("\n\n stopread %d count %d headerlen %d bodylen %d\n\n\n", stopReading, count, headerLength, bodyLength );
							continue;
						}
					}
					else if( request->h_ExpectedLength > 0 )
					{
						content = HttpGetHeaderFromTable( request, HTTP_HEADER_EXPECTED_CONTENT_LENGTH );
						if( content == NULL )
						{
							FERROR("Content is NULL!\n");
							break;
						}
						
						char* found = strstr( ( char* )locBuffer, "\r\n\r\n" );
						
						char *next = NULL;
						int chunkSize = 8192;
						
						if( found != NULL )
						{
							found += 4;
							//DEBUG("found\n");
							found[ 4 ] = 0;
							chunkSize = (int)strtol( found, &next, 16);
						}
						
						//FERROR("\n\n\n\nCHUNKSIZE %d\n\n\n", chunkSize );

						//rchar *divider = strstr( resultString->bs_Buffer, dividerStr );
						char *divider = strstr( content, dividerStr );
						
						// No divider?
						if( !divider )
						{
							prevBufSize += count;
							//DEBUG("\n\n 1prevBufSize %d count %d\n\n\n", prevBufSize, count );
							break;
						}

						if( chunkSize != 0 )
						{
							bodyLength = request->h_ExpectedLength + ( ( request->h_ExpectedLength / ( chunkSize ) << 3 ) );
						}
						
						//DEBUG("BODDDY %d\n", bodyLength );
						
						// We have enough data and are ready for reading the body
						int headerLength = divider - resultString->bs_Buffer + 4;
						
						request->h_ContentLength = bodyLength - headerLength;
						
						if( count > headerLength )
						{
							prevBufSize += count;
							preroll = count - headerLength;
							stopReading = count >= ( headerLength + bodyLength );
							
							//DEBUG("\n\n stopread %d count %d headerlen %d bodylen %d\n\n\n", stopReading, count, headerLength, bodyLength );
							continue;
						}
					}
					// Need only one pass
					else
					{
						// No content length
						prevBufSize += count;
						//DEBUG("\n\n prevBufSize %d count %d\n\n\n", prevBufSize, count );
						break;
					}
					// Determine if we need pass 2
				}
				// For next pass
				prevBufSize += count;
			}
		}   // for pass 0 < 2, end of outer socket reading loop

		//DEBUG( "[FriendCoreProcess] Exited headers loop. Now freeing up.\n" );

		// Free up
		if( incomingBufferPtr != NULL )
		{
			if( incomingBufferLength > 0 )
			{
				// Process data
				// -------------- Support for large uploads --------------------
				if( tmpFileHandle >= 0 )
				{
					if( incomingBufferPtr )
					{
						//DEBUG("incoming buffer already set? unmapping");
						munmap( incomingBufferPtr, incomingBufferLength );
						incomingBufferPtr = NULL;
					}
					//DEBUG("mmaping");
					incomingBufferLength = lseek( tmpFileHandle, 0, SEEK_END);
					incomingBufferPtr = mmap(0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, tmpFileHandle, 0 );// offset);
					//DEBUG("mmap status %p", incomingBufferPtr);
					
					if( incomingBufferPtr == MAP_FAILED )
					{
						Log( FLOG_ERROR, "Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
						goto close_fcp;
					}
				}
				else
				{
					DEBUG( "regular processing" );
				}

				// ------------------------------------------------------- 
				Http *resp = ProtocolHttp( th->sock, incomingBufferPtr, incomingBufferLength );

				if( resp != NULL )
				{
					if( resp->h_WriteType == FREE_ONLY )
					{
						HttpFree( resp );
					}
					else
					{
						HttpWriteAndFree( resp, th->sock );
					}
				}
				
			}
			// No data, just free
			else
			{
				// Ask for more info
				DEBUG( "[FriendCoreProcess] No buffer to write, so just free!\n" );
			}
		}

		//DEBUG("Removing string\n");

		// Free up buffers
		if( locBuffer )
		{
			FFree( locBuffer );
		}
	}

	// Shortcut!
	close_fcp:
	
	DEBUG( "Closing socket %d.\n", th->sock->fd );
	SocketDelete( th->sock );
	th->sock = NULL;

	// Free the pair
	if( th != NULL )
	{
		FFree( th );
		th = NULL;
	}

	if( tmpFileHandle >= 0 )
	{
		if( incomingBufferPtr )
		{
			munmap( incomingBufferPtr, incomingBufferLength );
			incomingBufferPtr = NULL;
		}
		close( tmpFileHandle );
		unlink( tmpFilename );
	}
	else 
	{
		BufStringDelete( resultString );
	}

	// No more threads
	DecreaseThreads();

#ifdef USE_PTHREAD
	pthread_exit( 0 );
#endif
	return;
}


/**
* Return an accept pair from accept
*
* @param sock pointer to associated socket
* @return accepted pair
* @return NULL in case of failure
*/
struct AcceptPair *DoAccept( Socket *sock )
{
	// Accept
	struct sockaddr_in6 client;
	socklen_t clientLen = sizeof( client );
	
	if( sock == NULL )
	{
		return NULL;
	}
	
	int fd = accept( sock->fd, ( struct sockaddr* )&client, &clientLen );
	
	if( fd == -1 ) 
	{
		// Get some info about failure..
		switch( errno )
		{
			case EAGAIN:
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
		shutdown( fd, SHUT_RDWR );
		close( fd );
		return NULL;
	}

	// Return copy
	struct AcceptPair *p = FCalloc( 1, sizeof( struct AcceptPair ) );
	if( p != NULL )
	{
		p->fd = fd;
		memcpy( &p->client, &client, sizeof( struct sockaddr_in6 ) );
	}

	return p;
}

pthread_t thread;

#ifdef USE_SELECT
/**
* Polls all Friend Core messages via Select().
*
* This is the main loop of the Friend Core system
*
* @param fc pointer to Friend Core instance to poll
*/
static inline void FriendCoreSelect( FriendCoreInstance* fc )
{
	// add communication ReadCommPipe		
	//signal(SIGINT, test);
	// Handle signals and block while going on!
	struct sigaction setup_action;
	sigset_t block_mask, curmask; 
	sigemptyset( &block_mask );
	// Block other terminal-generated signals while handler runs.
	sigaddset( &block_mask, SIGINT );
	setup_action.sa_handler = SignalHandler;
#ifndef CYGWIN_BUILD
	setup_action.sa_restorer = NULL;
#endif
	setup_action.sa_mask = block_mask;
	setup_action.sa_flags = 0;
	sigaction( SIGINT, &setup_action, NULL );
	sigprocmask( SIG_SETMASK, NULL, &curmask );
	fci = fc;
	
	int pipefds[2] = {};
	pipe( pipefds );	
	fc->fci_ReadCorePipe = pipefds[ 0 ]; fc->fci_WriteCorePipe = pipefds[ 1 ];
	
	// Read buffer
	char buffer[ fc->fci_BufferSize ];
	int maxd = fc->fci_Sockets->fd;
	if( fc->fci_ReadCorePipe > maxd )
	{
		maxd = fc->fci_ReadCorePipe;
	}
	
	fd_set readfds;
	
	SocketSetBlocking( fc->fci_Sockets, TRUE );
	
	// All incoming network events go through here
	while( !fc->fci_Shutdown )
	{
		FD_ZERO( &readfds );
		
		FD_SET( fc->fci_Sockets->fd, &readfds );
		FD_SET( fc->fci_ReadCorePipe, &readfds );
		
		DEBUG("[FriendCoreSelect] Before select, maxd %d  pipe %d socket %d\n", maxd, fc->fci_ReadCorePipe, fc->fci_Sockets->fd );
		
		int activity = select( maxd+1, &readfds, NULL, NULL, NULL );
		
		DEBUG("[FriendCoreSelect] After select\n");
		
		if( ( activity < 0 ) && ( errno != EINTR ) )
		{
			DEBUG("[FriendCoreSelect] Select error\n");
		}
		
		if( FD_ISSET( fc->fci_ReadCorePipe, &readfds ) )
		{
			DEBUG("[FriendCoreSelect] Received from PIPE\n");
			// read all bytes from read end of pipe
			char ch;
			int result = 1;
			
			DEBUG("[FriendCoreSelect] FC Read from pipe!\n");
			
			while( result > 0 )
			{
				result = read( fc->fci_ReadCorePipe, &ch, 1 );
				DEBUG("[FriendCoreSelect] FC Read from pipe %c\n", ch );
				if( ch == 'q' )
				{
					fc->fci_Shutdown = TRUE;
					DEBUG("[FriendCoreSelect] FC Closing. Current reads: %d, writes: %d!\n", _reads, _writes );
					break;
				}
			}
			
			if( fc->fci_Shutdown == TRUE )
			{
				LOG( FLOG_INFO, "[FriendCoreSelect] Core shutdown in porgress\n");
				break;
			}
		}
		
		if( FD_ISSET( fc->fci_Sockets->fd, &readfds ) )
		{
			DEBUG("[FriendCoreSelect] Sockets received\n");
			
			FD_CLR( fc->fci_Sockets->fd, &readfds );
			
			/*
			while( nothreads >= 32 )
			{
				usleep( 500 );
			}
			*/
			
			//FriendCoreAcceptPhase2( fc );
			//pthread_create( &thread, NULL, &FriendCoreAcceptPhase2, ( void *)fc );
			
			struct fcThreadInstance *pre = FCalloc( 1, sizeof( struct fcThreadInstance ) );
			if( pre != NULL )
			{
				pre->fc = fc;
				if( pthread_create( &pre->thread, NULL, &FriendCoreAcceptPhase2, ( void *)pre ) != 0 )
				{
					FFree( pre );
				}
			}
			
			/*
			int pid = fork();
					
					if( pid < 0 )
					{
						FERROR( "FORK fail\n" );
					}
					else if( pid == 0 )
					{
						FriendCoreAcceptPhase2( fc );
					}
					else
					{
						INFO( "Fork done\n" );
					}
			*/
			
			/*
			fc->fci_Sockets->s_AcceptFlags = SSL_VERIFY_PEER;
			// there is no need to reject non validated (by cert) connections
			Socket *sock = SocketAccept( fc->fci_Sockets );
			
			if( sock != NULL )
			{
				SocketSetBlocking( sock, TRUE );
			
				// go on and accept on the socket
				struct fcThreadInstance *pre = FCalloc( 1, sizeof( struct fcThreadInstance ) );
				if( pre != NULL )
				{
					pre->fc = fc;
					pre->sock = sock;
					if( pthread_create( &pre->thread, NULL, &FriendCoreProcess, ( void *)pre ) != 0 )
					{
						FFree( pre );
					}
				}
			}
			*/
		}
		
		
	}	// shutdown
}
#else
/**
* Polls all Friend Core messages.
*
* This is the main loop of the Friend Core system
*
* @param fc pointer to Friend Core instance to poll
*/
static inline void FriendCoreEpoll( FriendCoreInstance* fc )
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
	if (pipe( pipefds ) != 0)
	{
		FERROR("pipe call failed");
		exit(5);
	}
	fc->fci_ReadCorePipe = pipefds[ 0 ]; fc->fci_WriteCorePipe = pipefds[ 1 ];
	// add the read end to the epoll
	piev.events = EPOLLIN; piev.data.fd = fc->fci_ReadCorePipe;
	int err = epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_ADD, fc->fci_ReadCorePipe, &piev );
	if( err != 0 )
	{
		LOG( FLOG_PANIC,"Cannot add main event %d\n", err );
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

	events->events = EPOLLIN;

	// All incoming network events go through here
	while( !fc->fci_Shutdown )
	{
		// Wait for something to happen on any of the sockets we're listening on
		DEBUG("Before epollwait\n");
		eventCount = epoll_pwait( fc->fci_Epollfd, events, fc->fci_MaxPoll, -1, &curmask );
		DEBUG("Epollwait, eventcount: %d\n", eventCount );

		for( i = 0; i < eventCount; i++ )
		{
			currentEvent = &events[i];
			Socket *sock = ( Socket *)currentEvent->data.ptr;
			if( fc->fci_Sockets != NULL )
			{
				//FERROR("epoll event %d sock %p fd %d - listen %d\n", currentEvent->events, sock, sock->fd, fc->fci_Sockets->fd );
				
				FERROR("epoll event %d - listen %d\n", currentEvent->events, fc->fci_Sockets->fd );
			}
			
			// Ok, we have a problem with our connection
			if( 
				( ( currentEvent->events & EPOLLERR ) ||
				( currentEvent->events & EPOLLRDHUP ) ||
				( currentEvent->events & EPOLLHUP ) ) || 
				!( currentEvent->events & EPOLLIN ) 
			)
			{
				if( ((Socket*)currentEvent->data.ptr)->fd == fc->fci_Sockets->fd )
				{
					// Oups! We have gone away!
					DEBUG( "[FriendCoreEpoll] Socket went away!\n" );
					break;
				}
								
				// Remove it
				LOG( FLOG_ERROR, "[FriendCoreEpoll] Socket had errors.\n" );
				if( sock != NULL )
				{
					DEBUG("[FriendCoreEpoll] FD %d\n", sock->fd );
					epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
					SocketDelete( sock );
					sock = NULL;
				}
			}
			else if( currentEvent->events & EPOLLWAKEUP )
			{
				DEBUG( "[FriendCoreEpoll] Wake up!\n" );
			}
			// First handle pipe messages
			else if( currentEvent->data.fd == fc->fci_ReadCorePipe ) //FIXME! pipe must be wrapped in a Socket*
			{
				// read all bytes from read end of pipe
				char ch;
				int result = 1;
					
				//DEBUG("[FriendCoreEpoll] FC Reads from pipe!\n");
				
				while( result > 0 )
				{
					result = read( fc->fci_ReadCorePipe, &ch, 1 );
					if( ch == 'q' )
					{
						fc->fci_Shutdown = TRUE;
						DEBUG("[FriendCoreEpoll] FC Closing all socket connections. Current reads: %d, writes: %d!\n", _reads, _writes );
						break;
					}
				}
				
				if( fc->fci_Shutdown == TRUE )
				{
					LOG( FLOG_INFO, "[FriendCoreEpoll] Core shutdown in porgress\n");
					//break;
				}
			}
			// Accept incoming connections - if the socket fd is out listening socket fd
			else if( ((Socket*)currentEvent->data.ptr)->fd == fc->fci_Sockets->fd && !fc->fci_Shutdown )
			{
				DEBUG("=====================before calling FriendCoreAcceptPhase2\n");

				struct fcThreadInstance *pre = FCalloc( 1, sizeof( struct fcThreadInstance ) );
				if( pre != NULL )
				{
					pre->fc = fc;
					DEBUG("Thread create pointer: %p friendcore: %p\n", pre, fc );
					if( pthread_create( &pre->thread, NULL, &FriendCoreAcceptPhase2, ( void *)pre ) != 0 )
					{
						DEBUG("Pthread create fail\n");
						FFree( pre );
					}
				}
				DEBUG("Accept done\n");
			}
			// Get event that are incoming!
			else if( currentEvent->events & EPOLLIN )
			{
				// Stop listening here..
				epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
				
				// Process
				if( !fc->fci_Shutdown )
				{
					DEBUG("EPOLLIN\n");
					
					struct fcThreadInstance *pre = FCalloc( 1, sizeof( struct fcThreadInstance ) );
					if( pre != NULL )
					{
						pre->fc = fc; pre->sock = sock;
					
#ifdef USE_PTHREAD
						size_t stacksize = 16777216; //16 * 1024 * 1024;
						pthread_attr_t attr;
						pthread_attr_init( &attr );
						pthread_attr_setstacksize( &attr, stacksize );
						
						// Make sure we keep the number of threads under the limit
						if( pthread_create( &pre->thread, &attr, &FriendCoreProcess, ( void *)pre ) != 0 )
						{
							FFree( pre );
						}
#else
#ifdef USE_WORKERS
						DEBUG("Worker will be launched\n");
						SystemBase *locsb = (SystemBase *)fc->fci_SB;
						if( WorkerManagerRun( locsb->sl_WorkerManager,  FriendCoreProcess, pre, NULL, "FriendCoreProcess" ) != 0 )
						{
							SocketDelete( sock );
							sock = NULL;
						}
						DEBUG("Worker launched\n");
						//WorkerManagerRun( fc->fci_WorkerManager,  FriendCoreProcess, pre );
#else
						int pid = fork();
						if( pid == 0 )
						{
							FriendCoreProcess( pre );
						}
#endif
#endif
					}
					//DEBUG("EPOLLIN end\n");
				}
			}
		}
	}
	
	//DEBUG("End main loop\n");
	
	usleep( 1 );

	int counter = 15;
	// check number of working threads
	while( TRUE )
	{
		if( nothreads <= 0 )
		{
			DEBUG("[FriendCoreEpoll] Number of threads %d\n", nothreads );
			break;
		}
		sleep( 1 );
		if( counter-- < 0 )
		{
			break;
		}
		DEBUG("[FriendCoreEpoll] Number of threads %d, waiting .....\n", nothreads );
	}
	
#ifdef USE_SELECT

#else
	struct epoll_event event;
	
	if( epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_DEL, fc->fci_Sockets->fd, &event ) == -1 )
	{
		LOG( FLOG_ERROR, "[FriendCore] epoll_ctl can not remove connection!\n" );
	}
#endif
	
	// Server is shutting down
	DEBUG("[FriendCore] Shutting down.\n");
	if( fc->fci_Sockets )
	{
		SocketDelete( fc->fci_Sockets );
		fc->fci_Sockets = NULL;
	}
	
	// Free epoll events
	FFree( events );
	
	LOG( FLOG_INFO, "[FriendCoreEpoll] Done freeing events" );
	events = NULL;
	
	// Free pipes!
	close( fc->fci_ReadCorePipe );
	close( fc->fci_WriteCorePipe );
	
	fc->fci_Closed = TRUE;
}
#endif

/**
* Launches an instance of Friend Core.
*
* Only returns after interrupt signal
*
* @param fc pointer to Friend Core structure
* @return 0 no errors
* @return -1 in case of errors
*/
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

	LOG( FLOG_INFO,"=========================================\n");
	LOG( FLOG_INFO,"==========Starting FriendCore.===========\n");
	LOG( FLOG_INFO,"=========================================\n");
	
	SystemBase *lsb = (SystemBase *)fc->fci_SB;
	
	// Open new socket for lisenting

	fc->fci_Sockets = SocketNew( lsb, fc->fci_SSLEnabled, fc->fci_Port, SOCKET_TYPE_SERVER );
	
	if( fc->fci_Sockets == NULL )
	{
		FERROR("Cannot create socket on port: %d!\n", fc->fci_Port );
		fc->fci_Closed = TRUE;
		return -1;
	}
	
	// Non blocking listening!
	if( SocketSetBlocking( fc->fci_Sockets, FALSE ) == -1 )
	{
		FERROR("Cannot set socket to blocking state!\n");
		SocketDelete( fc->fci_Sockets );
		fc->fci_Closed = TRUE;
		return -1;
	}
	
	if( SocketListen( fc->fci_Sockets ) != 0 )
	{
		FERROR("Cannot setup socket!\nCheck if port: %d\n", fc->fci_Port );
		SocketDelete( fc->fci_Sockets );
		fc->fci_Closed= TRUE;
		return -1;
	}
	
	pipe2( fc->fci_SendPipe, 0 );
	pipe2( fc->fci_RecvPipe, 0 );

#ifdef USE_SELECT
	
	FriendCoreSelect( fc );
	
#else
	// Create epoll
	fc->fci_Epollfd = epoll_create1( EPOLL_CLOEXEC );
	if( fc->fci_Epollfd == -1 )
	{
		FERROR( "[FriendCore] epoll_create\n" );
		SocketDelete( fc->fci_Sockets );
		fc->fci_Closed = TRUE;
		return -1;
	}

	// Register for events
	struct epoll_event event;
	memset( &event, 0, sizeof( event ) );
	event.data.ptr = fc->fci_Sockets;
	event.events = EPOLLIN | EPOLLET | EPOLLRDHUP | EPOLLHUP | EPOLLERR; //all flags are necessary, otherwise epoll may not deliver disconnect events and socket descriptors will leak
	
	if( epoll_ctl( fc->fci_Epollfd, EPOLL_CTL_ADD, fc->fci_Sockets->fd, &event ) == -1 )
	{
		LOG( FLOG_ERROR, "[FriendCore] epoll_ctl\n" );
		SocketDelete( fc->fci_Sockets );
		fc->fci_Closed = TRUE;
		return -1;
	}

	DEBUG("[FriendCore] Listening.\n");
	FriendCoreEpoll( fc );
#endif
	
	fc->fci_Sockets = NULL;
	fc->fci_Closed = TRUE;

	// Close libraries
	if( fc->fci_Libraries )
	{
		unsigned int iterator = 0;
		HashmapElement* e = NULL;
		while( ( e = HashmapIterate( fc->fci_Libraries, &iterator ) ) != NULL )
		{
			DEBUG( "[FriendCore] Closing library at address %lld\n", ( long long int )e->data );
			LibraryClose( (Library*)e->data );
			e->data = NULL;
			FFree( e->key );
			e->key = NULL;
		}
		HashmapFree( fc->fci_Libraries );
		fc->fci_Libraries = NULL;
	}
	
#ifdef USE_SELECT

#else
	// Close this
	if( fc->fci_Epollfd )
	{
		LOG( FLOG_INFO, "Closing Epoll file descriptor\n");
		close( fc->fci_Epollfd );
	}
#endif
	
	close( fc->fci_SendPipe[0] );
	close( fc->fci_SendPipe[1] );
	close( fc->fci_RecvPipe[0] );
	close( fc->fci_RecvPipe[1] );
	
	LOG( FLOG_INFO, "[FriendCore] Goodbye.\n");
	return 0;
}

/**
* Opens a library into a Friend Code thread.
*
* @param fc pointer to Friend Core instance
* @param libname name of the library to open
* @param version version of the libray to open
* @return NULL library could not be open
*/
Library* FriendCoreGetLibrary( FriendCoreInstance* fc, char* libname, FULONG version )
{
	if( !fc )
	{
		return NULL;
	}

	if( !fc->fci_Libraries )
	{
		fc->fci_Libraries = HashmapNew();
	}

	HashmapElement* e = HashmapGet( fc->fci_Libraries, libname );
	Library* lib = NULL;
	if( e == NULL )
	{
		SystemBase *lsb = (SystemBase *)fc->fci_SB;
		lib = LibraryOpen( lsb, libname, version );
		if( !lib )
		{
			return NULL;
		}
		HashmapPut( fc->fci_Libraries, StringDuplicate( libname ), lib );
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

/**@}*/
// End of FriendCore Doxygen group
