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
 *  Sockets
 *
 * file contain all functitons related network sockets
 *
 *  @author HT
 *  @author Artur Langner <artur.langner@friendup.cloud> - reaper stuff
 *  @date created 11/2014
 */

#include <core/types.h>
#include <netdb.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <fcntl.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <util/log/log.h>
#include <strings.h>

#include "network/socket.h"
#include <system/systembase.h>
#include <sys/resource.h>
#include <pthread.h>

//#undef DEBUG
//#define DEBUG( ...)
//#undef DEBUG1
//#define DEBUG1( ...)

//#define USE_SOCKET_REAPER

#define SOCKET_STATE_MAX_ACCEPTED_TIME_s 5 //socket has N seconds to send the first byte

static int ssl_session_ctx_id = 1;
static int ssl_sockopt_on = 1;

static Socket* *_socket_array; //array of pointers to all active Socket objects
static pthread_mutex_t _socket_array_mutex;
static unsigned int _max_sockets;
static pthread_t _socket_reaper_thread_handle;

static void* _socket_reaper_thread(void *a);
static void _socket_add_to_reaper(Socket *sock);
static void _socket_remove_from_reaper(const Socket *sock);

/** Initializes internal socket management structs. Call once at startup
 */
void socket_init_once( void )
{
#ifdef USE_SOCKET_REAPER
	struct rlimit limit;
	int status = getrlimit(RLIMIT_NOFILE, &limit);
	if( status != 0 )
	{
		FERROR("Can not get maximum amount of sockets! Socket reaper will not start\n");
		return;
	}
	_max_sockets = limit.rlim_cur;
	_socket_array = FCalloc(_max_sockets, sizeof(Socket*) );
	if (_socket_array == NULL){
		FERROR("Can not alocate socket table! Socket reaper will not start\n");
		return;
	}
	DEBUG("Maximum number of sockets %d", _max_sockets);

	pthread_mutex_init(&_socket_array_mutex, NULL);

	pthread_create(&_socket_reaper_thread_handle, NULL/*default attributes*/, _socket_reaper_thread, NULL/*extra args*/);
#endif
}

static void* _socket_reaper_thread(void *a __attribute__((unused)))
{
	while( TRUE )
	{
		//DEBUG("reaper\n");
		for( unsigned int i = 0; i < _max_sockets; i++ )
		{
			if( _socket_array[i] != NULL )
			{ //there is probably a socket here...
				FRIEND_MUTEX_LOCK( &_socket_array_mutex );
				FBOOL unlock_mutex = TRUE;
				
				if( _socket_array[i] != NULL )
				{ //there is still a socket here, let's have a look!
					unsigned int state_persistance_time_s = time(NULL) - _socket_array[i]->state_update_timestamp;
					DEBUG("Socket [%d] is at %p, state %d, time %d\n",
							i,
							_socket_array[i],
							_socket_array[i]->state,
							state_persistance_time_s);

					if( ((int)_socket_array[i]->state) == SOCKET_STATE_MAX_ACCEPTED_TIME_s )
					{
					//switch (_socket_array[i]->state){
					//case socket_state_accepted:
						if (state_persistance_time_s > SOCKET_STATE_MAX_ACCEPTED_TIME_s){

							DEBUG("Socket [%d] is too long (%ds) in accept state. Closing.\n",
									i,
									state_persistance_time_s);
							Socket* tmp = _socket_array[i];
							_socket_array[i] = NULL;
							FRIEND_MUTEX_UNLOCK(&_socket_array_mutex); //release mutex, otherwise _socket_remove_from_reaper called from SocketFree will block
							unlock_mutex = false;
							close( tmp->fd ); //brutally the socket here, rest of error handling will happen in the epoll function
						}
						//break;
					} //end of switch / if
				}
				if (unlock_mutex){
					FRIEND_MUTEX_UNLOCK(&_socket_array_mutex);
				}
			}
		} //end of loop

		sleep(5);
	}
	return NULL;
}

static void _socket_add_to_reaper( Socket *sock )
{
	sock->state_update_timestamp = time(NULL);
	FRIEND_MUTEX_LOCK(&_socket_array_mutex);
	//find a place in the global table to hold pointer to new socket
	for( unsigned int i = 0; i < _max_sockets; i++ )
	{
		if( _socket_array[i] == NULL )
		{
			_socket_array[i] = sock;
			break;
		}
	}
	FRIEND_MUTEX_UNLOCK(&_socket_array_mutex);
}

static void _socket_remove_from_reaper(const Socket *sock)
{
	FRIEND_MUTEX_LOCK(&_socket_array_mutex);
	//find a place in the global table to hold pointer to new socket
	for (unsigned int i = 0; i < _max_sockets; i++){
		if (_socket_array[i] == sock){
			_socket_array[i] = NULL;
			break;
		}
	}
	FRIEND_MUTEX_UNLOCK(&_socket_array_mutex);
}

void socket_update_state( Socket *sock, socket_state_t state )
{
	FRIEND_MUTEX_LOCK(&sock->mutex);
	sock->state = state;
	sock->state_update_timestamp = time(NULL);
	FRIEND_MUTEX_UNLOCK(&sock->mutex);
}

/**
 * Open new socket on specified port
 *
 * @param sb pointer to SystemBase
 * @param ssl ctionset to TRUE if you want to setup secured conne
 * @param port number on which connection will be set
 * @param type of connection, for server :SOCKET_TYPE_SERVER, for client: SOCKET_TYPE_CLIENT
 * @return Socket structure when success, otherwise NULL
 */

Socket* SocketOpen( void *sb, FBOOL ssl, unsigned short port, int type )
{
	Socket *sock = NULL;
	int fd = socket( AF_INET6, SOCK_STREAM | SOCK_NONBLOCK, 0 );
	if( fd == -1 )
	{
		FERROR( "[SOCKET] ERROR socket failed\n" );
		return NULL;
	}

	if( type == SOCKET_TYPE_SERVER )
	{
		if( ( sock = (Socket *) FCalloc( 1, sizeof( Socket ) ) ) != NULL )
		{
			sock->port = port;
		}
		else
		{
			//close( fd );
			FERROR("Cannot allocate memory for socket!\n");
			return NULL;
		}

		sock->s_SB = sb;
		SystemBase *lsb = (SystemBase *)sb;
		sock->s_Timeouts = 0;
		sock->s_Timeoutu = lsb->sl_SocketTimeout;
		sock->s_Users = 0;
		sock->s_SSLEnabled = ssl;
		sock->s_AcceptFlags = lsb->l_SSLAcceptFlags;

		if( sock->s_SSLEnabled == TRUE )
		{
			sock->s_VerifyClient = TRUE;

			INFO("SSL Connection enabled\n");

			// Create a SSL_METHOD structure (choose a SSL/TLS protocol version)
			//sock->s_Meth = SSLv3_method();
			//sock->s_Meth =  TLSv1_2_method();
			sock->s_Meth = SSLv23_server_method();
			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );

			if ( sock->s_Ctx == NULL )
			{
				FERROR( "SSLContext error %s\n", (char *)stderr );
				close( fd );
				SocketFree( sock );
				return NULL;
			}

			if( sock->s_VerifyClient == TRUE )
			{
				// Load the RSA CA certificate into the SSL_CTX structure 
				if ( !SSL_CTX_load_verify_locations( sock->s_Ctx, lsb->RSA_SERVER_CA_CERT, lsb->RSA_SERVER_CA_PATH )) 
				{
					FERROR( "Could not verify cert CA: %s CA_PATH: %s", lsb->RSA_SERVER_CA_CERT, lsb->RSA_SERVER_CA_PATH );
					close( fd );
					SocketFree( sock );
					return NULL;
				}

				// Set to require peer (client) certificate verification 
				SSL_CTX_set_verify( sock->s_Ctx, SSL_VERIFY_NONE, NULL );
				//SSL_set_verify( sock->s_Ctx, SSL_VERIFY_PEER, 0 );

				// Set the verification depth to 1 
				SSL_CTX_set_verify_depth( sock->s_Ctx ,1 );
			}

			// Load the server certificate into the SSL_CTX structure 
			if( SSL_CTX_use_certificate_file( sock->s_Ctx, lsb->RSA_SERVER_CERT, SSL_FILETYPE_PEM ) <= 0 ) 
			{
				FERROR("UseCertyficate file fail : %s\n", lsb->RSA_SERVER_CERT );
				SocketFree( sock );
				close( fd );
				return NULL;
			}

			// Load the private-key corresponding to the server certificate 
			if( SSL_CTX_use_PrivateKey_file( sock->s_Ctx, lsb->RSA_SERVER_KEY, SSL_FILETYPE_PEM ) <= 0 ) 
			{
				FERROR( "SSLuseprivatekeyfile fail %s\n", (char *)stderr);
				close( fd );
				SocketFree( sock );
				return NULL;
			}


			// Check if the server certificate and private-key matches
			if( !SSL_CTX_check_private_key( sock->s_Ctx ) ) 
			{
				FERROR("Private key does not match the certificate public key\n");
				close( fd );
				SocketFree( sock );
				return NULL;
			}

			// Lets not block and lets allow retries!
			SocketSetBlocking( sock, FALSE );

			SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
			SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
			SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv3 | SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET | SSL_OP_ALL | SSL_OP_NO_COMPRESSION );
			SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
			SSL_CTX_set_cipher_list( sock->s_Ctx, "HIGH:!aNULL:!MD5:!RC4" );
		}

		if( setsockopt( fd, SOL_SOCKET, SO_REUSEADDR, (char*)&ssl_sockopt_on, sizeof(ssl_sockopt_on) ) < 0 )
		{
			FERROR( "[SOCKET] ERROR setsockopt(SO_REUSEADDR) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}

		/*
		struct timeval t = { 60, 0 };

		if( setsockopt( fd, SOL_SOCKET, SO_SNDTIMEO, ( void *)&t, sizeof( t ) ) < 0 )
		{
			FERROR( "[SOCKET] ERROR setsockopt(SO_SNDTIMEO) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}

		if( setsockopt( fd, SOL_SOCKET, SO_RCVTIMEO, ( void *)&t, sizeof( t ) ) < 0 )
		{
			FERROR( "[SOCKET] ERROR setsockopt(SO_RCVTIMEO) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}
		*/

		struct sockaddr_in6 server;
		memset( &server, 0, sizeof( server ) );
		//server.sin6_len = sizeof( server );
		server.sin6_family = AF_INET6;
		server.sin6_addr = in6addr_any;//inet_addr("0.0.0.0");//inet_pton("0.0.0.0");//in6addr_any;

		//server.sin6_addr = inet_addr("0.0.0.0");
		//inet_pton(AF_INET6, "0:0:0:0:0:0:0:0", (struct sockaddr_in6 *) &server.sin6_addr);
		//inet_pton(AF_INET6, "0:0:0:0:0:0:0:215.148.12.10", (struct sockaddr_in6 *) &server.sin6_addr);

		server.sin6_port = ntohs( port );

		if( bind( fd, (struct sockaddr*)&server, sizeof( server ) ) == -1 )
		{
			FERROR( "[SOCKET] ERROR bind failed on port %d\n", port );
			SocketClose( sock );
			return NULL;
		}

		sock->fd = fd;
		//SSL_set_fd( sock->s_Ssl, sock->fd );

	}
	// CLIENT
	else
	{	// connect to server socket
		if( ( sock = (Socket*) FCalloc( 1, sizeof( Socket ) ) ) != NULL )
		{
			sock->fd = fd;
			sock->port = port;
		}
		else
		{
			FERROR("Cannot allocate memory for socket!\n");
			SocketClose( sock );
			return NULL;
		}

		sock->s_SB = sb;
		SystemBase *lsb = (SystemBase *)sb;
		sock->s_Timeouts = 0;
		sock->s_Timeoutu = lsb->sl_SocketTimeout;
		sock->s_Users = 0;
		sock->s_SSLEnabled = ssl;

		if( sock->s_SSLEnabled == TRUE )
		{
			// TODO: DEPRECATED - remove
			//OpenSSL_add_all_ciphers();
			//OpenSSL_add_all_algorithms();

			//  ERR_load_BIO_strings();
			// ERR_load_crypto_strings();
			//  SSL_load_error_strings();

			sock->s_BIO = BIO_new(BIO_s_mem());

			//			SSL_library_init();

			sock->s_Meth = SSLv23_client_method();
			if( sock->s_Meth  == NULL )
			{
				FERROR("Cannot create SSL client method!\n");
				SocketClose( sock );
				return NULL;
			}

			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
			if( sock->s_Ctx  == NULL )
			{
				FERROR("Cannot create SSL context!\n");
				SocketClose( sock );
				return NULL;
			}

			SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
			SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
			SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv3 | SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET | SSL_OP_ALL | SSL_OP_NO_COMPRESSION );
			SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
			SSL_CTX_set_cipher_list( sock->s_Ctx, "HIGH:!aNULL:!MD5:!RC4" );

			// Lets use non blocking sockets
			SocketSetBlocking( sock, FALSE );

			sock->s_Ssl = SSL_new( sock->s_Ctx );
			if( sock->s_Ssl == NULL )
			{
				FERROR("Cannot create new SSL connection\n");
				SocketClose( sock );
				return NULL;
			}
			SSL_set_fd( sock->s_Ssl, sock->fd );

			//SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH );
			int cache = SSL_CTX_get_session_cache_mode( sock->s_Ctx );
			INFO("Cache mode set to: ");
			switch( cache )
			{
			case SSL_SESS_CACHE_OFF:
				INFO("off\n");
				break;
			case SSL_SESS_CACHE_CLIENT:
				INFO("client only\n");
				break;
			case SSL_SESS_CACHE_SERVER:
				INFO("server only\n" );
				break;
			case SSL_SESS_CACHE_BOTH:
				INFO("server and client\n");
				break;
			default:
				INFO("undefined\n");
			}
		}
	}

	pthread_mutex_init( &sock->mutex, NULL );

	return sock;
}

/**
 * Make the socket listen for incoming connections
 *
 * @param socket whitch will listen  incoming connections
 * @return 0 when success, otherwise error number
 */

int SocketListen( Socket *sock )
{
	if( sock == NULL )
	{
		return -1;
	}

	if( listen( sock->fd, SOMAXCONN ) < 0 )
	{
		FERROR( "[SOCKET] ERROR listen failed\n" );
		close( sock->fd );
		return -2;
	}
	sock->listen = TRUE;
	return 0;
}

/**
 * Function load SSL certyficates
 *
 * @param ctx ssl context
 * @param CertFile certyficate file name
 * @param KeyFile certyficate key file name
 * @return 0 when success, otherwise error number
 */

static inline int LoadCertificates( SSL_CTX* ctx, char* CertFile, char* KeyFile)
{
	/* set the local certificate from CertFile */
	if ( SSL_CTX_use_certificate_file(ctx, CertFile, SSL_FILETYPE_PEM) <= 0 )
	{
		ERR_print_errors_fp(stderr);
		return 1;
	}
	/* set the private key from KeyFile (may be the same as CertFile) */
	if ( SSL_CTX_use_PrivateKey_file(ctx, KeyFile, SSL_FILETYPE_PEM) <= 0 )
	{
		ERR_print_errors_fp(stderr);
		return 2;
	}
	/* verify private key */
	if ( !SSL_CTX_check_private_key(ctx) )
	{
		FERROR( "Private key does not match the public certificate\n");
		return 3;
	}
	return 0;
}


#define h_addr h_addr_list[0]

/**
 * Setup connection with another server
 *
 * @param hostname internet address
 * @param port socket port
 * @param family socket family descriptor
 * @param socktype SOCK_DGRAM or SOCK_STREAM
 * @return socket descriptor
 */

int SocketConnectClient(const char *hostname, int port, int family __attribute__((unused)), int socktype)
{
	struct sockaddr_in sin;
	struct hostent *phe;
	struct protoent *ppe;
	int sockfd;
	char *protocol;

	memset(&sin, 0, sizeof(sin));

	//DEBUG("[SocketConnectClient] Connect to %s on port %s\n", hostname, service );

	sin.sin_family = AF_INET;
	sin.sin_port = htons(port);
	
	DEBUG("[SocketConnectClient] host: %s\n", hostname );

	if (!hostname) 
	{
		FERROR("Connect_client: there should be a hostname!\n");
		return -1;
	}
	else
	{
		if ( (phe = (struct hostent *)gethostbyname( hostname ) ) != NULL ) 
		{
			DEBUG("[SocketConnectClient] Gethostbyname used\n");
			memcpy(&sin.sin_addr, phe->h_addr, phe->h_length);
		}
		else if( ( phe = gethostbyname2( hostname, AF_INET6 ) ) != NULL )
		{
			DEBUG("[SocketConnectClient] Gethostbyname2 used\n");
			memcpy(&sin.sin_addr, phe->h_addr, phe->h_length);
		}
		else if ( (sin.sin_addr.s_addr = inet_addr(hostname)) == INADDR_NONE) 
		{
			FERROR( "Connect_client: could not get host=[%s]\n", hostname);
			return -1;
		}
	}

	/*
	if ((ppe = getprotobyname(protocol)) == 0) 
	{
		FERROR( "Connect_client:: could not get protocol=[%s]\n", protocol);
		return -1;
	}
	 */

	if( (sockfd = socket(PF_INET, socktype, 0 ) ) < 0 )
	{  
		FERROR( "Connect_client:: could not open socket\n");
		return -1;
	}

	fd_set fdset;
	struct timeval tv;
	struct timespec tstart={0,0}, tend={0,0};
	int seconds = 3;
	socklen_t len;
	int so_error;

	clock_gettime( CLOCK_MONOTONIC, &tstart );

	fcntl( sockfd, F_SETFL, O_NONBLOCK ); // setup non blocking socket

	// make the connection
	int rc = connect( sockfd,(struct sockaddr *)&sin, sizeof(sin) );
	if( (rc == -1) && (errno != EINPROGRESS) ) 
	{
		printf("Error: %s\n", strerror(errno));
		close( sockfd );
		return -1;
	}

	if( rc == 0 )
	{
		// connection has succeeded immediately
		//clock_gettime(CLOCK_MONOTONIC, &tend);
		return sockfd;
	}

	FD_ZERO( &fdset );
	FD_SET( sockfd, &fdset);
	tv.tv_sec = seconds;
	tv.tv_usec = 0;

	rc = select( sockfd + 1, NULL, &fdset, NULL, &tv);

	switch( rc )
	{
	case 1: // data to read
		len = sizeof( so_error );

		getsockopt( sockfd, SOL_SOCKET, SO_ERROR, &so_error, &len);

		if( so_error == 0 )
		{
			clock_gettime(CLOCK_MONOTONIC, &tend);
			DEBUG("socket connected. It took %.5f seconds\n",
					(((double)tend.tv_sec + 1.0e-9*tend.tv_nsec) - ((double)tstart.tv_sec + 1.0e-9*tstart.tv_nsec)));
			return sockfd;
		}
		else
		{ // error
			DEBUG( "socket NOT connected: %s\n", strerror(so_error) );
			close( sockfd );
			return -1;
		}
		break;
	case 0: //timeout
		DEBUG( "connection timeout trying to connect\n");
		close( sockfd );
		return -1;
	}

	/*
	// BLOCKING socket solution
	if ( connect(sockfd,(struct sockaddr *)&sin, sizeof(sin)) < 0 ) 
	{
		close( sockfd );
		FERROR( "Connect_client:: could not connect to host=[%s]\n", hostname);
		return -1;
	}
	return sockfd;  
	 */

	DEBUG("[SocketConnectClient] Connection created with host: %s\n", hostname );
	close( sockfd );
	return -1;
}

#define h_addr h_addr_list[0] // for backward compatibility 

/**
 * Setup connection with another server
 *
 * @param sock pointer to socket which will setup connection with another server
 * @param host internet address
 * @return socket descriptor
 */

int SocketConnect( Socket* sock, const char *host )
{
	if( sock == NULL )
	{
		FERROR("[SocketConnect] Socket is NULL..\n");
		return 0;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		SystemBase *lsb = (SystemBase *)sock->s_SB;
		LoadCertificates( sock->s_Ctx, lsb->RSA_SERVER_CERT, lsb->RSA_SERVER_KEY );
	}
	struct addrinfo hints, *res, *p;
	int n;

	bzero( &hints, sizeof(struct addrinfo ) );
	hints.ai_family =AF_UNSPEC;//  AF_INET6;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;
	//hints.ai_flags  =  AI_NUMERICHOST;

	if( ( n = SocketConnectClient( host, sock->port, AF_UNSPEC, SOCK_STREAM ) ) < 0 )
	{
		FERROR("Cannot setup connection with : %s\n", host );
		return -1;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		X509                *cert = NULL;
		X509_NAME       *certname = NULL;

		SocketSetBlocking( sock, TRUE );

		while( TRUE )
		{
			if ( ( n = SSL_connect( sock->s_Ssl ) ) != 1 )
			{
				FERROR("Cannot create SSL connection %d!\n", SSL_get_error( sock->s_Ssl, n ));

				{
					int error = SSL_get_error( sock->s_Ssl, n );

					FERROR( "[SocketConnect] We experienced an error %d.\n", error );

					switch( error )
					{
					case SSL_ERROR_NONE:
						// NO error..
						FERROR( "[SocketConnect] No error\n" );
						break;
						//return incoming;
					case SSL_ERROR_ZERO_RETURN:
						FERROR("[SocketConnect] SSL_ACCEPT error: Socket closed.\n" );
					case SSL_ERROR_WANT_READ:
						FERROR( "[SocketConnect] Error want read, retrying\n" );
					case SSL_ERROR_WANT_WRITE:
						FERROR( "[SocketConnect] Error want write, retrying\n" );
						break;
					case SSL_ERROR_WANT_ACCEPT:
						FERROR( "[SocketConnect] Want accept\n" );
						break;
					case SSL_ERROR_WANT_X509_LOOKUP:
						FERROR( "[SocketConnect] Want 509 lookup\n" );
						break;
					case SSL_ERROR_SYSCALL:
						FERROR( "[SocketConnect] Error syscall!\n" );
						return -2;
					default:
						FERROR( "[SocketConnect] Other error.\n" );
						return -3;
					}
				}
				return -1;
			}
			else
			{
				break;
			}
		}

		cert = SSL_get_peer_certificate( sock->s_Ssl );
		if (cert == NULL)
		{
			FERROR( "Error: Could not get a certificate from: \n" );
		}
		else
		{
			DEBUG( "[SocketConnect] Retrieved the server's certificate from: .\n");
			char *line;
			line  = X509_NAME_oneline( X509_get_subject_name( cert ), 0, 0 );
			DEBUG("[SocketConnect] %s\n", line );
			free( line );
			line = X509_NAME_oneline( X509_get_issuer_name( cert ), 0, 0 );
			DEBUG("[SocketConnect] %s\n", line );
			free( line );
			X509_free( cert );
		}
		// ---------------------------------------------------------- *
		// extract various certificate information                    *
		// -----------------------------------------------------------
		//certname = X509_NAME_new( );
		//certname = X509_get_subject_name( cert );

		// ---------------------------------------------------------- *
		// display the cert subject here                              *
		// -----------------------------------------------------------
		//DEBUG( "Displaying certname: %s the certificate subject data:\n", certname );
		//X509_NAME_print_ex(outbio, certname, 0, 0);
	}

	return 0;
}

/**
 * Setup connection with another server
 *
 * @param sb pointer to SystemBase
 * @param ssl set to TRUE if you want to setup secured conne
 * @param host internet address
 * @param port internet port number
 * @return pointer to new Socket object or NULL when error appear
 */

Socket* SocketConnectHost( void *sb, FBOOL ssl, char *host, unsigned short port )
{
	Socket *sock = NULL;
	SystemBase *lsb = (SystemBase *)SLIB;

	int fd;

	if( ( fd = SocketConnectClient( host, port, AF_UNSPEC, SOCK_STREAM ) ) < 0 )
	{
		FERROR("Cannot setup connection with : %s\n", host );
		return NULL;
	}

	if( ( sock = (Socket*) FCalloc( 1, sizeof( Socket ) ) ) != NULL )
	{
		sock->fd = fd;
		sock->port = port;
	}
	else
	{
		FERROR("Cannot allocate memory for socket!\n");
		return NULL;
	}

	sock->s_Timeouts = 0;
	sock->s_Timeoutu = lsb->sl_SocketTimeout;
	sock->s_SSLEnabled = ssl;

	DEBUG("[SocketConnectHost] connect to host, secured: %d\n", ssl );

	if( sock->s_SSLEnabled == TRUE )
	{
		//SocketSetBlocking( sock, TRUE );
		//OpenSSL_add_all_algorithms();
		//OpenSSL_add_all_ciphers();

		DEBUG("All algo and ciphers added\n");
		//sock->s_BIO = BIO_new(BIO_s_mem());

		sock->s_Meth = SSLv23_client_method();
		if( sock->s_Meth  == NULL )
		{
			FERROR("Cannot create SSL client method!\n");
			SocketClose( sock );
			return NULL;
		}

		DEBUG("Before context is created\n");
		// Create a SSL_CTX structure 
		sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
		if( sock->s_Ctx  == NULL )
		{
			FERROR("Cannot create SSL context!\n");
			SocketClose( sock );
			return NULL;
		}

		//SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
		//SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
		SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv3 | SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET | SSL_OP_ALL | SSL_OP_NO_COMPRESSION | SSL_OP_CIPHER_SERVER_PREFERENCE );
		//SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
		//SSL_CTX_set_cipher_list( sock->s_Ctx, "HIGH:!aNULL:!MD5:!RC4" );

		SystemBase *lsb = (SystemBase *)sb;
		if( lsb->RSA_CLIENT_KEY_PEM[ 0 ] != 0 )
		{
			int retc = 0;
			retc = LoadCertificates( sock->s_Ctx, lsb->RSA_CLIENT_KEY_PEM, lsb->RSA_CLIENT_KEY_PEM );
			DEBUG("Certs loaded %d\n", retc );

			if( !SSL_CTX_load_verify_locations( sock->s_Ctx, lsb->RSA_CLIENT_KEY_PEM, NULL ) ) //
			{
				FERROR("Cannot verify certificate locations!\n");
			}
		}

		//SSL_set_verify( sock->s_Ctx, SSL_VERIFY_PEER, 0 );
		// Set the verification depth to 1 
		//SSL_CTX_set_verify_depth( sock->s_Ctx , 2 );

		sock->s_Ssl = SSL_new( sock->s_Ctx );
		if( sock->s_Ssl == NULL )
		{
			SocketClose( sock );
			FERROR("Cannot create new SSL connection\n");
			return NULL;
		}


		//SSL_set_mode( sock->s_Ssl, SSL_MODE_AUTO_RETRY);
		//SSL_set_mode( sock->s_Ssl, SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER );



		SSL_set_fd( sock->s_Ssl, sock->fd );
		//SSL_set_connect_state( sock->s_Ssl );

		//SSL_do_handshake( sock->s_Ssl );

		//int flags = fcntl( sock->fd, F_GETFL, 0 );

		/*
		//SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH );
		int cache = SSL_CTX_get_session_cache_mode( sock->s_Ctx );
		INFO("[SocketConnectHost] SSL Cache mode set to: ");
		switch( cache )
		{
			case SSL_SESS_CACHE_OFF:
				INFO("off\n");
				break;
			case SSL_SESS_CACHE_CLIENT:
				INFO("client only\n");
				break;
			case SSL_SESS_CACHE_SERVER:
				INFO("server only\n" );
				break;
			case SSL_SESS_CACHE_BOTH:
				INFO("server and client\n");
				break;
			default:
				INFO("undefined\n");
		}

		DEBUG("[SocketConnectHost] Loading certificates\n");
		 */

		X509                *cert = NULL;
		X509_NAME       *certname = NULL;

		FBOOL blocked = sock->s_Blocked;
		SocketSetBlocking( sock, FALSE );
		int n=0;

		//n = SSL_connect( sock->s_Ssl );
		DEBUG("[SocketConnectHost] SSLConnect SSL %d\n", sock->s_SSLEnabled );
		FBOOL quit = FALSE;
		int errTime = 0;

		while( quit != TRUE )
		{
			if ( ( n = SSL_connect( sock->s_Ssl ) ) != 1 )
			{
				ERR_print_errors_fp(stderr);
				//FERROR("Cannot create SSL connection %d  n: %d!\n", SSL_get_error( sock->s_Ssl, n ), n );

				char buf[ 256 ];
				int err;
				while ((err = ERR_get_error()) != 0) 
				{
					ERR_error_string_n(err, buf, sizeof(buf));
					FERROR("Error: %s\n", buf);
				}
				//if( err <= 0 )
				{
					int error = SSL_get_error( sock->s_Ssl, n );

					//FERROR( "[SocketConnect] We experienced an error %d.\n", error );

					switch( error )
					{
					case SSL_ERROR_NONE:
						// NO error..
						quit = TRUE;
						FERROR( "[SocketConnect] No error\n" );
						break;
					case SSL_ERROR_ZERO_RETURN:
						FERROR("[SocketConnect] SSL_ACCEPT error: Socket closed.\n" );
						quit = TRUE;
						break;
					case SSL_ERROR_WANT_READ:
					{
						char buf[ 256 ];
						recv( sock->fd, buf, 256, MSG_DONTWAIT );
						sleep( 1 );
						errTime++;
						if( errTime > 10 )
						{
							SocketClose( sock );
							return NULL;
						}
					}
					//FERROR( "[SocketConnect] Error want read, retrying\n" );
					case SSL_ERROR_WANT_WRITE:
						//FERROR( "[SocketConnect] Error want write, retrying\n" );
						break;
					case SSL_ERROR_WANT_ACCEPT:
						FERROR( "[SocketConnect] Want accept\n" );
						break;
					case SSL_ERROR_WANT_X509_LOOKUP:
						FERROR( "[SocketConnect] Want 509 lookup\n" );
						break;
					case SSL_ERROR_SYSCALL:
						FERROR( "[SocketConnect] Error syscall!\n" );
						SocketClose( sock );
						return NULL;
					default:
						FERROR( "[SocketConnect] Other error.\n" );
						SocketClose( sock );
						return NULL;
					}
				}
				//SocketClose( sock );
				//return NULL;
			}
			else
			{
				INFO("[SocketConnectHost] Socket connected to: %s\n", host );
				break;
			}
		}

		SocketSetBlocking( sock, blocked );

		cert = SSL_get_peer_certificate( sock->s_Ssl );
		if (cert == NULL)
		{
			FERROR( "Error: Could not get a certificate from: \n" );
		}
		else
		{
			DEBUG( "[SocketConnectHost] Retrieved the server's certificate from: .\n");
			char *line;
			line  = X509_NAME_oneline( X509_get_subject_name( cert ), 0, 0 );
			DEBUG("[SocketConnectHost] %s\n", line );
			free( line );
			line = X509_NAME_oneline( X509_get_issuer_name( cert ), 0, 0 );
			DEBUG("[SocketConnectHost] %s\n", line );
			free( line );
			X509_free( cert );
		}
		// ---------------------------------------------------------- *
		// extract various certificate information                    *
		// -----------------------------------------------------------
		//certname = X509_NAME_new( );
		//certname = X509_get_subject_name( cert );

		// ---------------------------------------------------------- *
		// display the cert subject here                              *
		// -----------------------------------------------------------
		//DEBUG( "Displaying certname: %s the certificate subject data:\n", certname );
		//X509_NAME_print_ex(outbio, certname, 0, 0);
		//DEBUG( "\n" );
	}

	return sock;
}

/**
 * Make a socket blocking/non-blocking
 *
 * @param sock pointer to Socket
 * @param block set to TRUE if you want to set provided Socket as blocked
 * @return Returns TRUE on success and FALSE on failure.
 */

int SocketSetBlocking( Socket* sock, FBOOL block )
{
	int flags, s = 0;

	if( sock == NULL )
	{
		FERROR("Cannot set socket as blocking, socket = NULL!!\n");
		return 0;
	}

	flags = fcntl( sock->fd, F_GETFL, 0 );
	if( flags < 0 )
	{
		char *errmsg = strerror( errno ); 
		FERROR( "[SOCKET] ERROR fcntl, problem: %s\n", errmsg );
		return 0;
	}

	if( !block )
	{
		flags |= O_NONBLOCK;
	}
	else
	{
		flags &= ~O_NONBLOCK;
	}

	if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
	{
		sock->s_Blocked = block;
		s = fcntl( sock->fd, F_SETFL, flags );
		FRIEND_MUTEX_UNLOCK( &sock->mutex );
	}

	if( s < 0 )
	{
		FERROR( "[SocketSetBlocking] ERROR fcntl\n" );
		return 0;
	}

	return 1;
}

static int serverAuthSessionIdContext;

/**
 * Accepts an incoming connection
 *
 * @param sock pointer to Socket
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

inline Socket* SocketAccept( Socket* sock )
{
	// Don't bother with non-listening sockets
	if( sock == NULL )
	{
		FERROR("[SocketAccept] Cannot accept socket set as NULL\n");
		return NULL;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		if( sock->s_Ctx == NULL )
		{
			FERROR( "[SocketAccept] SSL not properly setup on socket!\n" );
			return NULL;
		}
	}

	// Accept
	struct sockaddr_in6 client;
	socklen_t clientLen = sizeof( client );

	int fd = accept( sock->fd, ( struct sockaddr* )&(client), &clientLen );

	if( fd == -1 ) 
	{
		// Get some info about failure..
		switch( errno )
		{
		case EAGAIN:
			DEBUG( "[SocketAccept] We have processed all incoming connections OR O_NONBLOCK is set for the socket file descriptor and no connections are present to be accepted.\n" );
			break;
		case EBADF:
			DEBUG( "[SocketAccept] The socket argument is not a valid file descriptor.\n" );
			break;
		case ECONNABORTED:
			DEBUG( "[SocketAccept] A connection has been aborted.\n" );
			break;
		case EINTR:
			DEBUG( "[SocketAccept] The accept() function was interrupted by a signal that was caught before a valid connection arrived.\n" );
			break;
		case EINVAL:
			DEBUG( "[SocketAccept] The socket is not accepting connections.\n" );
			break;
		case ENFILE:
			DEBUG( "[SocketAccept] The maximum number of file descriptors in the system are already open.\n" );
			break;
		case ENOTSOCK:
			DEBUG( "[SocketAccept] The socket argument does not refer to a socket.\n" );
			break;
		case EOPNOTSUPP:
			DEBUG( "[SocketAccept] The socket type of the specified socket does not support accepting connections.\n" );
			break;
		default:
			DEBUG("[SocketAccept] Accept return bad fd\n");
			break;
		}
		return NULL;
	}

	Socket* incoming = (Socket*)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		//memcpy( &(incoming->s_ClientIP), &client, sizeof(struct sockaddr_in6) );
		incoming->fd = fd;
		incoming->port = ntohs( client.sin6_port );
		incoming->ip = client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
		incoming->s_SB = sock->s_SB;

		SocketSetBlocking( incoming, FALSE );
		pthread_mutex_init( &incoming->mutex, NULL );
	}
	else
	{
		FERROR("[SocketAccept] Cannot allocate memory for socket!\n");
		return NULL;
	}

	DEBUG("[SocketAccept] SSL: %d\n", sock->s_SSLEnabled );

	if( sock->s_SSLEnabled == TRUE )
	{
		incoming->s_Ssl = SSL_new( sock->s_Ctx ); 
		if( incoming->s_Ssl == NULL )
		{
			FERROR("[SocketAccept] Cannot accept SSL connection\n");
			shutdown( fd, SHUT_RDWR );
			close( fd );
			FFree( incoming );
			return NULL;
		}

		SSL_set_ex_data( incoming->s_Ssl, 0, sock->s_SB );
		SSL_set_verify( incoming->s_Ssl, sock->s_AcceptFlags, sock->VerifyPeer );
		//SSL_set_verify( incoming->s_Ssl, SSL_VERIFY_PEER, 0 );
		//SSL_CTX_set_verify( sock->s_Ctx, SSL_VERIFY_PEER, VerifyPeer);

		SSL_set_session_id_context( incoming->s_Ssl, (void *)&serverAuthSessionIdContext, sizeof(serverAuthSessionIdContext) );

		// Make a unique session id here
		/*const unsigned char *unique = FCalloc( 255, sizeof( const unsigned char ) );
		sprintf( unique, "friendcore_%p%d", incoming, rand()%999+rand()%999 );
		SSL_set_session_id_context( sock->s_Ssl, unique, strlen( unique ) );
		FFree( unique );*/

		SSL_set_accept_state( incoming->s_Ssl );

		int srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
		if( srl != 1 )
		{
			FERROR( "[SocketAccept] Could not set fd\n" );
			shutdown( fd, SHUT_RDWR );
			close( fd );
			SSL_free( incoming->s_Ssl );
			FFree( incoming );
			return NULL;
		}

		int err = 0;
		while( 1 )
		{
			if( ( err = SSL_accept( incoming->s_Ssl ) ) == 1 )
			{
				DEBUG("[SocketAccept] Connection accepted\n");
				break;
			}

			if( err <= 0 || err == 2 )
			{
				ERR_print_errors_fp( stderr );

				int error = SSL_get_error( incoming->s_Ssl, err );
				//DEBUG("[SocketAccept] SSL error %d\n", error );
				switch( error )
				{
				case SSL_ERROR_NONE:
					// NO error..
					FERROR( "[SocketAccept] No error\n" );
					return incoming;
				case SSL_ERROR_ZERO_RETURN:
					FERROR("[SocketAccept] SSL_ACCEPT error: Socket closed.\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_WANT_READ:
					//return incoming;
					break;
				case SSL_ERROR_WANT_WRITE:
					//return incoming;
					break;
				case SSL_ERROR_WANT_ACCEPT:
					FERROR( "[SocketAccept] Want accept\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_WANT_X509_LOOKUP:
					FERROR( "[SocketAccept] Want 509 lookup\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_SYSCALL:
					FERROR( "[SocketAccept] Error syscall.\n" ); //. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_SSL:
					FERROR( "[SocketAccept] SSL_ERROR_SSL: %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
					SocketClose( incoming );
					return NULL;
				}
			}
			usleep( 0 );
		}

		X509                *cert = NULL;
		X509_NAME       *certname = NULL;

		cert = SSL_get_peer_certificate( incoming->s_Ssl );
		if( cert == NULL )
		{
			INFO( "Error: Could not get a certificate from: \n" );
		}
	}

	socket_update_state(incoming, socket_state_accepted);
	//_socket_add_to_reaper(incoming);

	DEBUG( "[SocketAccept] Accepting incoming!\n" );
	return incoming;
}

/**
 * Accepts an incoming connection
 *
 * @param sock pointer to Socket
 * @param p AcceptPair structure
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

inline Socket* SocketAcceptPair( Socket* sock, struct AcceptPair *p )
{
	// Don't bother with non-listening sockets
	if( sock == NULL )
	{
		FERROR("[SocketAcceptPair] Cannot accept socket set as NULL\n");
		return NULL;
	}

	if (p == NULL){
		FERROR("[SocketAcceptPair] AcceptPair is NULL\n");
		return NULL;
	}

	if( sock->s_SSLEnabled )
	{
		if( !sock->s_Ctx )
		{
			FERROR( "[SocketAcceptPair] SSL not properly setup on socket!\n" );
			return NULL;
		}
	}

	// We need a valid file descriptor
	if( !p->fd ){
		FERROR( "[SocketAcceptPair] NULL fd\n" );
		return NULL;
	}

	int fd = p->fd;
	int retries = 0, srl = 0;

	Socket* incoming = ( Socket *)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		incoming->fd = fd;
		incoming->port = ntohs( p->client.sin6_port );
		incoming->ip = p->client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
		incoming->s_SB = sock->s_SB;
		DEBUG("[SocketAcceptPair] We managed to create an incoming socket. fd %d port %d\n", incoming->fd, incoming->port);

		// Not blocking
		SocketSetBlocking( incoming, FALSE );

		pthread_mutex_init( &incoming->mutex, NULL );
	}
	else
	{
		FERROR("[SocketAcceptPair] Cannot allocate memory for socket!\n");
		shutdown( fd, SHUT_RDWR );
		close( fd );
		return NULL;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		incoming->s_Ssl = SSL_new( sock->s_Ctx );

		if( incoming->s_Ssl == NULL )
		{
			FERROR("[SocketAcceptPair] Cannot accept SSL connection\n");
			shutdown( fd, SHUT_RDWR );
			close( fd );
			pthread_mutex_destroy( &incoming->mutex );
			FFree( incoming );
			return NULL;
		}

		srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
		SSL_set_accept_state( incoming->s_Ssl );

		if( srl != 1 )
		{
			int error = SSL_get_error( incoming->s_Ssl, srl );

			FERROR( "[SocketAcceptPair] Could not set fd, error: %d fd: %d\n", error, incoming->fd );
			shutdown( fd, SHUT_RDWR );
			close( fd );
			pthread_mutex_destroy( &incoming->mutex );
			SSL_free( incoming->s_Ssl );
			FFree( incoming );
			return NULL;
		}

		// setup SSL session
		int err = 0;
		int retries = 0;
		while( 1 )
		{
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
					return incoming;
				case SSL_ERROR_ZERO_RETURN:
					FERROR("[SocketAcceptPair] SSL_ACCEPT error: Socket closed.\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_WANT_READ:
					return incoming;
				case SSL_ERROR_WANT_WRITE:
					return incoming;
				case SSL_ERROR_WANT_ACCEPT:
					FERROR( "[SocketAcceptPair] Want accept\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_WANT_X509_LOOKUP:
					FERROR( "[SocketAcceptPair] Want 509 lookup\n" );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_SYSCALL:
					FERROR( "[SocketAcceptPair] Error syscall.\n" ); //. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
					SocketClose( incoming );
					return NULL;
				case SSL_ERROR_SSL:
					FERROR( "[SocketAcceptPair] SSL_ERROR_SSL: %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
					SocketClose( incoming );
					return NULL;
				}
			}
			usleep( 0 );
		}
	}

	socket_update_state(incoming, socket_state_accepted);
	_socket_add_to_reaper(incoming);

	// Return socket
	return incoming;
}

/**
 * Read data from socket
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param expectedLength tells us how much exactly we know we need until we can stop reading (0 if unknown)
 * @return number of bytes readed from socket
 */

inline int SocketRead( Socket* sock, char* data, unsigned int length, unsigned int expectedLength )
{
	if( sock == NULL )
	{
		FERROR("Cannot read from socket, socket = NULL!\n");
		return 0;
	}

	if( data == NULL )
	{
		FERROR( "Can not read into empty buffer.\n" );
		return 0;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		if( !sock->s_Ssl )
		{
			FERROR( "Problem with SSL!\n" );
			return 0;
		}
		unsigned int read = 0;
		int res = 0, err = 0, buf = length;
		fd_set rd_set, wr_set;
		int retries = 0;
		int read_retries = 0;
		struct timeval timeout;
		fd_set fds;
#define MINIMUMRETRY 30000
		int retryCount = expectedLength > 0 ? MINIMUMRETRY : 3000;
		if( expectedLength > 0 && length > expectedLength ) length = expectedLength;

		//DEBUG("SOCKREAD %p\n", sock );

		while( 1 )
		{
			//pthread_yield();
			//DEBUG("aa read %d length %d\n", read, length );

			if( read + buf > length ) buf = length - read;

			if( ( res = SSL_read( sock->s_Ssl, data + read, buf ) ) > 0 )
			{
#ifndef NO_VALGRIND_STUFF	
				VALGRIND_MAKE_MEM_DEFINED( data + read, res );
#endif
				read += res;
				read_retries = retries = 0;
				if( read >= length ) break;
			}
			else
			{
				err = SSL_get_error( sock->s_Ssl, res );

				switch( err )
				{
				// The TLS/SSL I/O operation completed.
				case SSL_ERROR_NONE:
					FERROR( "[SocketRead] Completed successfully.\n" );
					return read;
					// The TLS/SSL connection has been closed. Goodbye!
				case SSL_ERROR_ZERO_RETURN:
					FERROR( "[SocketRead] The connection was closed.\n" );
					//return SOCKET_CLOSED_STATE;
					return -1;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_READ:
					// NB: We used to retry 10000 times!
					if( read == 0 && read_retries++ < retryCount )
					{
						// We are downloading a big file

						usleep( read_retries < 100 ? 0 : ( retryCount << 1 ) );

						/*int blocked = sock->s_Blocked;
							FD_ZERO( &fds );
							FD_SET( sock->fd, &fds );

							timeout.tv_sec = 0;
							timeout.tv_usec = read_retries << 2;

							select( sock->fd+1, &fds, NULL, NULL, &timeout );

							int flags = fcntl( sock->fd, F_GETFL, 0 );
							if( !blocked )
							{
								flags |= O_NONBLOCK;
							}
							else
							{
								flags &= ~O_NONBLOCK;
							}

							sock->s_Blocked = blocked;
							fcntl( sock->fd, F_SETFL, flags );
						 */
						continue;
					}
					return read;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
					//if( pthread_mutex_lock( &sock->mutex ) == 0 )
				{
					FERROR( "[SocketRead] Want write.\n" );
					FD_ZERO( &fds );
					FD_SET( sock->fd, &fds );

					//pthread_mutex_unlock( &sock->mutex );
				}
				timeout.tv_sec = sock->s_Timeouts;
				timeout.tv_usec = sock->s_Timeoutu;

				err = select( sock->fd + 1, NULL, &fds, NULL, &timeout );

				if( err > 0 )
				{
					usleep( 50000 );
					FERROR("[SocketRead] want write\n");
					continue; // more data to read...
				}
				else if( err == 0 )
				{
					FERROR("[SocketRead] want write TIMEOUT....\n");
					return read;
				}
				FERROR("[SocketRead] want write everything read....\n");
				return read;
				case SSL_ERROR_SYSCALL:
					FERROR("[SocketRead] Error syscall, bufsize = %d.\n", buf );
					if( err > 0 )
					{
						if( errno == 0 )
						{
							FERROR(" [SocketRead] Connection reset by peer.\n" );
							return -1;
							//return SOCKET_CLOSED_STATE;
						}
						else FERROR( "[SocketRead] Error syscall error: %s\n", strerror( errno ) );
					}
					else if( err == 0 )
					{
						FERROR( "[SocketRead] Error syscall no error? return.\n" );
						return read;
					}
					FERROR( "[SocketRead] Error syscall other error. return.\n" );
					return read;
					// Don't retry, just return read
				default:
					return read;
				}
			}
		}

		return read;
	}
	// Read in a non-SSL way
	else
	{
		unsigned int bufLength = length, read = 0;
		int retries = 0, res = 0;

		while( 1 )
		{			
			res = recv( sock->fd, data + read, bufLength - read, 0 ); //, MSG_DONTWAIT );
			if( res > 0 )
			{ 
				read += res;
				retries = 0;
				//if( read >= length )
				{
					DEBUG( "[SocketRead] Done reading %d/%d\n", read, length );
					return read;
				}
			}
			else if( res == 0 ) return read;
			// Error
			else if( res < 0 )
			{
				// Resource temporarily unavailable...
				//if( errno == EAGAIN )
				if( read == 0 )
				{
					if( errno == EAGAIN && retries++ < 25 )
					{
						// Approx successful header
						usleep( 50000 );
						FERROR( "[SocketRead] Resource temporarily unavailable.. Read %d/%d (retries %d)\n", read, length, retries );
						continue;
					}
					else
					{
						break;
					}
				}
				else
				{
					return SOCKET_CLOSED_STATE;
				}
			}
		}
		return read;
	}
	return 0;
}


/**
 * Read data from socket (blocked)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @return number of bytes readed from socket
 */

int SocketReadBlocked( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)))
{
	if( sock == NULL )
	{
		FERROR("Cannot read from socket, socket = NULL!\n");
		return 0;
	}

	if( data == NULL )
	{
		FERROR( "Can not read into empty buffer.\n" );
		return 0;
	}

	/*
	char c[10];
    ssize_t x = recv( sock->fd, &c, 10, MSG_PEEK);
	if( x  < 1 )
	{
		return x;
	}*/
	int count;
	ioctl( sock->fd, FIONREAD, &count);
	DEBUG("recv %d\n", count );
	if( count == 0 )
	{
		return 0;
	}

	struct timeval timeout;
	fd_set fds;

	FD_ZERO( &fds );
	FD_SET( sock->fd, &fds );

	timeout.tv_sec = 5;//sock->s_Timeouts;
	timeout.tv_usec = 5000;//sock->s_Timeoutu;

	//DEBUG("\n\n\n\n\ntimeout.tv_sec %lu timeout.tv_usec %lu\n\n\n\n", timeout.tv_sec, timeout.tv_usec );

	int err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
	if( err <= 0 )
	{
		DEBUG("Timeout or there is no data in socket\n");
		return err;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		if( !sock->s_Ssl )
		{
			FERROR( "Problem with SSL!\n" );
			return 0;
		}
		unsigned int read = 0;
		int buf = length;

		DEBUG("SocketReadBlocked %p\n", sock );


		return SSL_read( sock->s_Ssl, data + read, buf );
	}
	// Read in a non-SSL way
	else
	{
		unsigned int bufLength = length, read = 0;

		return (int)recv( sock->fd, data + read, bufLength - read, 0 ); //, MSG_DONTWAIT );

	}
	return 0;
}

/**
 * Read data from socket with timeout option
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @param sec number of timeout seconds
 * @return number of bytes readed from socket
 */

int SocketWaitRead( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)), int sec __attribute__((unused)))
{
	if( sock == NULL )
	{
		FERROR("[SocketWaitRead] Cannot read from socket, socket = NULL!\n");
		return 0;
	}

	DEBUG2("[SocketWaitRead] Socket wait for message\n");

	int n;
	fd_set wset, rset;
	struct timeval tv;
	/*
	 FD_ZERO( &(app->readfd) );
			FD_ZERO( &(app->writefd) );
			FD_SET( app->infd[0] , &(app->readfd) );
			FD_SET( app->outfd[1] , &(app->writefd) );
	 */

	if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
	{
		FD_ZERO( &rset );
		//FD_SET( 0,  &rset );
		FD_SET( sock->fd,  &rset );
		//wset = rset;

		FRIEND_MUTEX_UNLOCK( &sock->mutex );
	}

	SocketSetBlocking( sock, TRUE );

	tv.tv_sec = sec;
	tv.tv_usec = 0;

	if( ( n = select( sock->fd+1, &rset, NULL, NULL, &tv ) ) == 0 )
	{
		FERROR("[SocketWaitRead] Connection timeout\n");
		SocketSetBlocking( sock, FALSE );
		return 0;

	}
	else if( n < 0 )
	{
		FERROR("[SocketWaitRead] Select error\n");
	}

	SocketSetBlocking( sock, FALSE );

	DEBUG2("[SocketWaitRead] Socket message appear %d\n", n);

	if( sock->s_SSLEnabled == TRUE )
	{
		unsigned int read = 0;
		int res = 0, err = 0, buf = length;
		fd_set rd_set, wr_set;
		int retries = 0;

		do
		{
			INFO( "[SocketWaitRead] Start of the voyage.. %p\n", sock );

			if( read + buf > length ) buf = length - read;

			if( ( res = SSL_read( sock->s_Ssl, data + read, buf ) ) >= 0 )
			{
				read += res;

				FULONG *rdat = (FULONG *)data;
				if( ID_FCRE == rdat[ 0 ] )
				{
					if( read >= rdat[ 1 ] )
					{
						return read;
					}
				}
				else
				{

					return res;
				}
			}

			struct timeval timeout;
			fd_set fds;

			if( res <= 0 )
			{
				err = SSL_get_error( sock->s_Ssl, res );
				switch( err )
				{
				// The TLS/SSL I/O operation completed.
				case SSL_ERROR_NONE:
					FERROR( "[SocketWaitRead] Completed successfully.\n" );
					return read;
					// The TLS/SSL connection has been closed. Goodbye!
				case SSL_ERROR_ZERO_RETURN:
					FERROR( "[SocketWaitRead] The connection was closed, return %d\n", read );
					return SOCKET_CLOSED_STATE;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_READ:
					// no data available right now, wait a few seconds in case new data arrives...
					//printf("SSL_ERROR_WANT_READ %i\n", count);

					if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
					{
						FD_ZERO( &fds );
						FD_SET( sock->fd, &fds );

						FRIEND_MUTEX_UNLOCK( &sock->mutex );
					}

					timeout.tv_sec = sock->s_Timeouts;
					timeout.tv_usec = sock->s_Timeoutu;

					err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
					if( err > 0 )
					{
						continue; // more data to read...
					}

					if( err == 0 )
					{
						FERROR("[SocketWaitRead] want read TIMEOUT....\n");
						return read;
					}
					else
					{
						FERROR("[SocketWaitRead] want read everything read....\n");
						return read;
					}

					//if( read > 0 ) return read;
					//usleep( 0 );
					FERROR("want read\n");
					continue;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
					FERROR( "[SocketWaitRead] Want write.\n" );

					if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
					{
						FD_ZERO( &fds );
						FD_SET( sock->fd, &fds );

						FRIEND_MUTEX_UNLOCK( &sock->mutex );
					}

					timeout.tv_sec = sock->s_Timeouts;
					timeout.tv_usec = sock->s_Timeoutu;

					err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
					if( err > 0 )
					{
						continue; // more data to read...
					}

					if( err == 0 )
					{
						FERROR("[SocketWaitRead] want read TIMEOUT....\n");
						return read;
					}
					else
					{
						FERROR("[SocketWaitRead] want read everything read....\n");
						return read;
					}
					//return read;
				case SSL_ERROR_SYSCALL:
					return read;
				default:
					//return read;
					usleep( 0 );
					if( retries++ > 500 )
					{
						return read;
					}
					continue;
				}
			}
		}
		while( read < length );

		//INFO( "[SocketRead] Done reading (%d bytes of %d ).\n", read, length );
		return read;
	}
	// Read in a non-SSL way
	else
	{
		unsigned int bufLength = length, read = 0;
		int retries = 0, res = 0;

		while( 1 )
		{
			res = recv( sock->fd, data + read, bufLength - read, MSG_DONTWAIT );

			if( res > 0 )
			{ 
				read += res;
				retries = 0;
				//if( read >= length )
				{
					DEBUG( "[SocketWaitRead] Done reading %d/%d\n", read, length );
					return read;
				}
			}
			else if( res == 0 ) return read;
			// Error
			else if( res < 0 )
			{
				// Resource temporarily unavailable...
				//if( errno == EAGAIN )
				if( errno == EAGAIN && retries++ < 25 )
				{
					// Approx successful header
					usleep( 0 );
					FERROR( "[SocketWaitRead] Resource temporarily unavailable.. Read %d/%d (retries %d)\n", read, length, retries );
					continue;
				}
				DEBUG( "[SocketWaitRead] Read %d/%d\n", read, length );
				return read;
			}
			DEBUG( "[SocketWaitRead] Read %d/%d\n", read, length );
		}
		DEBUG( "[SocketWaitRead] Done reading %d/%d (errno: %d)\n", read, length, errno );
		return read;

	}
}

/**
 * Read DataForm package from socket
 *
 * @param sock pointer to Socket on which read function will be called
 * @return BufString structure
 */

BufString *SocketReadPackage( Socket *sock )
{
	BufString *bs = BufStringNew();
	int locbuffersize = 8192;
	char locbuffer[ locbuffersize ];
	int fullPackageSize = 0;
	unsigned int read = 0;

	DEBUG2("[SocketReadPackage] Socket message appear , sock ptr %p\n", sock );

	if( sock->s_SSLEnabled == TRUE )
	{
		unsigned int read = 0;
		int res = 0, err = 0;//, buf = length;
		fd_set rd_set, wr_set;
		int retries = 0;

		do
		{
			INFO( "[SocketReadPackage] Start of the voyage.. %p\n", sock );
			if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
			{
				//if( read + buf > length ) buf = length - read;
				if( ( res = SSL_read( sock->s_Ssl, locbuffer, locbuffersize ) ) >= 0 )
				{
					read += (unsigned int)res;

					FULONG *rdat = (FULONG *)locbuffer;
					if( ID_FCRE == rdat[ 0 ] )
					{
						fullPackageSize = rdat[ 1 ];
					}

					BufStringAddSize( bs, locbuffer, res );

					if( fullPackageSize > 0 && read >= (unsigned int) fullPackageSize )
					{
						FRIEND_MUTEX_UNLOCK( &sock->mutex );	
						return bs;
					}
				}
				FRIEND_MUTEX_UNLOCK( &sock->mutex );	
			}

			struct timeval timeout;
			fd_set fds;

			if( res <= 0 )
			{
				err = SSL_get_error( sock->s_Ssl, res );
				switch( err )
				{
				// The TLS/SSL I/O operation completed.
				case SSL_ERROR_NONE:
					FERROR( "[SocketReadPackage] Completed successfully.\n" );
					return bs;
					// The TLS/SSL connection has been closed. Goodbye!
				case SSL_ERROR_ZERO_RETURN:
					FERROR( "[SocketReadPackage] The connection was closed, return %d\n", read );
					return bs;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_READ:
					// no data available right now, wait a few seconds in case new data arrives...
					//printf("SSL_ERROR_WANT_READ %i\n", count);

					FD_ZERO( &fds );
					FD_SET( sock->fd, &fds );

					timeout.tv_sec = sock->s_Timeouts;
					timeout.tv_usec = sock->s_Timeoutu;

					err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
					if( err > 0 )
					{
						return NULL; // more data to read...
					}

					if( err == 0 )
					{
						FERROR("[SocketReadPackage] want read TIMEOUT....\n");
						return bs;
					}
					else
					{
						FERROR("[SocketReadPackage] want read everything read....\n");
						return bs;
					}

					FERROR("want read\n");
					return NULL;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
					FERROR( "[SocketReadPackage] Want write.\n" );
					FD_ZERO( &fds );
					FD_SET( sock->fd, &fds );

					timeout.tv_sec = sock->s_Timeouts;
					timeout.tv_usec = sock->s_Timeoutu;

					err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
					if( err > 0 )
					{
						return NULL; // more data to read...
					}

					if( err == 0 )
					{
						FERROR("[SocketReadPackage] want read TIMEOUT....\n");
						return bs;
					}
					else
					{
						FERROR("[SocketReadPackage] want read everything read....\n");
						return bs;
					}
					//return read;
				case SSL_ERROR_SYSCALL:
					return bs;
				default:

					usleep( 0 );
					if( retries++ > 500 )
					{
						return bs;
					}
					return NULL;
				}
			}
		}
		while( TRUE );
		DEBUG("[SocketReadPackage]  readed\n");

		return bs;
	}

	//
	// Read in a non-SSL way
	//

	else
	{
		int retries = 0, res = 0;

		while( 1 )
		{
			res = recv( sock->fd, locbuffer, locbuffersize, MSG_DONTWAIT );

			if( res > 0 )
			{ 
				read += res;
				retries = 0;

				FULONG *rdat = (FULONG *)locbuffer;
				if( ID_FCRE == rdat[ 0 ] )
				{
					fullPackageSize = rdat[ 1 ];
					DEBUG("[SocketReadPackage] package size %d\n", fullPackageSize );
				}

				BufStringAddSize( bs, locbuffer, res );

				if( fullPackageSize > 0 && read >= (unsigned int)fullPackageSize )
				{
					DEBUG("[SocketReadPackage] got full package\n");

					return bs;
				}
			}
			else if( res == 0 )
			{
				return bs;
			}
			// Error
			else if( res < 0 )
			{
				if( errno == EAGAIN && retries++ < 25 )
				{
					FERROR( "[SocketReadPackage] Resource temporarily unavailable.. Read %d/ (retries %d)\n", read, retries );
					continue;
				}
				DEBUG( "[SocketReadPackage] Read %d  res < 0/\n", read );
				return bs;
			}
			DEBUG( "[SocketReadPackage] Read %d/\n", read );
		}

		DEBUG( "[SocketReadPackage] Done reading %d/ (errno: %d)\n", read, errno );

	}
	return bs;
}

/**
 * Read data from socket till end of stream
 *
 * @param sock pointer to Socket on which read function will be called
 * @param pass (obsolete?)
 * @param sec timeout value in seconds
 * @return BufString structure
 */

BufString *SocketReadTillEnd( Socket* sock, unsigned int pass __attribute__((unused)), int sec )
{
	if( sock == NULL )
	{
		FERROR("[SocketReadTillEnd] Cannot read from socket, socket = NULL!\n");
		return NULL;
	}

	DEBUG2("[SocketReadTillEnd] Socket wait for message, blocked %d\n", sock->s_Blocked );

	int n;
	fd_set wset, rset;
	struct timeval tv;
	/*
	 FD_ZERO( &(app->readfd) );
			FD_ZERO( &(app->writefd) );
			FD_SET( app->infd[0] , &(app->readfd) );
			FD_SET( app->outfd[1] , &(app->writefd) );
	 */

	//if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
	{
		FD_ZERO( &rset );
		//FD_SET( 0,  &rset );
		FD_SET( sock->fd,  &rset );
		//wset = rset;

		//FRIEND_MUTEX_UNLOCK( &sock->mutex );
	}

	tv.tv_sec = sec;
	tv.tv_usec = 0;
	FBOOL quit = FALSE;
	int locbuffersize = 8192;
	char locbuffer[ locbuffersize ];
	int fullPackageSize = 0;
	unsigned int read = 0;

	BufString *bs = BufStringNew();

	while( quit != TRUE )
	{
		if( sock->s_Blocked == TRUE )
		{
			DEBUG("Before select\n");
			if( ( n = select( sock->fd+1, &rset, NULL, NULL, &tv ) ) == 0 )
			{
				FERROR("[SocketReadTillEnd] Connection timeout\n");
				//SocketSetBlocking( sock, FALSE );
				//BufStringDelete( bs );
				return NULL;

			}
			else if( n < 0 )
			{
				FERROR("[SocketReadTillEnd] Select error\n");
			}
		}

		//SocketSetBlocking( sock, FALSE );

		if( sock->s_SSLEnabled == TRUE )
		{
			unsigned int read = 0;
			int res = 0, err = 0;//, buf = length;
			fd_set rd_set, wr_set;
			int retries = 0;

			while( TRUE )
			{
				//DEBUG("Before read\n");
				//if( read + buf > length ) buf = length - read;
				if( ( res = SSL_read( sock->s_Ssl, locbuffer, locbuffersize ) ) >= 0 )
				{
					read += (unsigned int)res;

					FULONG *rdat = (FULONG *)locbuffer;
					if( ID_FCRE == rdat[ 0 ] )
					{
						fullPackageSize = rdat[ 1 ];
					}
					BufStringAddSize( bs, locbuffer, res );

					if( fullPackageSize > 0 && read >= (unsigned int) fullPackageSize )
					{
						return bs;
					}
				}

				struct timeval timeout;
				fd_set fds;

				if( res < 0 )
				{
					err = SSL_get_error( sock->s_Ssl, res );
					switch( err )
					{
					err = SSL_get_error( sock->s_Ssl, res );

					switch( err )
					{
					// The TLS/SSL I/O operation completed.
					case SSL_ERROR_NONE:
						FERROR( "[SocketReadTillEnd] Completed successfully.\n" );
						return bs;
						// The TLS/SSL connection has been closed. Goodbye!
					case SSL_ERROR_ZERO_RETURN:
						FERROR( "[SocketReadTillEnd] The connection was closed, return %d\n", read );
						return bs;
						// The operation did not complete. Call again.
					case SSL_ERROR_WANT_READ:
						/*
						// no data available right now, wait a few seconds in case new data arrives...
						//printf("SSL_ERROR_WANT_READ %i\n", count);

						if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
						{
							FD_ZERO( &fds );
							FD_SET( sock->fd, &fds );

							FRIEND_MUTEX_UNLOCK( &sock->mutex );
						}

						timeout.tv_sec = sock->s_Timeouts;
						timeout.tv_usec = sock->s_Timeoutu;

						err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
						if( err > 0 )
						{
							return NULL; // more data to read...
						}

						if( err == 0 ) 
						{
							FERROR("[SocketReadTillEnd] want read TIMEOUT....\n");
							return bs;
						}
						else 
						{
							FERROR("[SocketReadTillEnd] want read everything read....\n");
							return bs;
						}
						 */
						FERROR("want read\n");
						//return NULL;
						// The operation did not complete. Call again.

					case SSL_ERROR_WANT_WRITE:
						/*
							FERROR( "[SocketReadTillEnd] Want write.\n" );

							if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
							{
								FD_ZERO( &fds );
								FD_SET( sock->fd, &fds );

								FRIEND_MUTEX_UNLOCK( &sock->mutex );
							}

							timeout.tv_sec = sock->s_Timeouts;
							timeout.tv_usec = sock->s_Timeoutu;

							err = select( sock->fd+1, &fds, NULL, NULL, &timeout );
							if( err > 0 )
							{
								return NULL; // more data to read...
							}

							if( err == 0 ) 
							{
								FERROR("[SocketReadTillEnd] want read TIMEOUT....\n");
								return bs;
							}
							else 
							{
								FERROR("[SocketReadTillEnd] want read everything read....\n");
								return bs;
							}
						 */
						//return read;
					case SSL_ERROR_SYSCALL:
						return bs;
					default:

						usleep( 0 );
						if( retries++ > 500 )
						{
							return bs;
						}
						//return NULL;
					}
					}
				}
				else if( res == 0 )
				{
					if( retries++ > 500 )
					{
						return bs;
					}
					//DEBUG("[SocketReadTillEnd] There is nothing to read\n");
					//return bs;
				}
			} // while
		}

		//
		// Read in a non-SSL way
		//

		else
		{
			int retries = 0, res = 0;

			while( 1 )
			{
				res = recv( sock->fd, locbuffer, locbuffersize, MSG_DONTWAIT );

				if( res > 0 )
				{
					read += res;
					retries = 0;

					FULONG *rdat = (FULONG *)locbuffer;
					if( ID_FCRE == rdat[ 0 ] )
					{
						fullPackageSize = rdat[ 1 ];
						DEBUG("[SocketReadTillEnd] package size %d  - long %lu\n", fullPackageSize, rdat[ 1 ] );
					}

					BufStringAddSize( bs, locbuffer, res );

					if( fullPackageSize > 0 && read >= (unsigned int)fullPackageSize )
					{
						DEBUG("[SocketReadTillEnd] got full package\n");

						return bs;
					}
				}
				else if( res == 0 )
				{
					DEBUG("[SocketReadTillEnd] Timeout\n");
					return bs;
				}
				// Error
				else if( res < 0 )
				{
					if( errno == EAGAIN && retries++ < 2500 )
					{
						usleep( 500 );
						//DEBUG("RETR\n");
						// Approx successful header
						//FERROR( "[SocketReadTillEnd] Resource temporarily unavailable.. Read %d/ (retries %d)\n", read, retries );
						continue;
					}
					DEBUG( "[SocketReadTillEnd] Read %d  res < 0/\n", read );
					return bs;
				}
				DEBUG( "[SocketReadTillEnd] Read %d/\n", read );
			}
			DEBUG( "[SocketReadTillEnd] Done reading %d/ (errno: %d)\n", read, errno );
		}
	}	// QUIT != TRUE
	return NULL;
}

/**
 * Write data to socket
 *
 * @param sock pointer to Socket on which write function will be called
 * @param data pointer to char table which will be send
 * @param length length of data which will be send
 * @return number of bytes writen to socket
 */
FLONG SocketWrite( Socket* sock, char* data, FLONG length )
{
	if( sock == NULL || length < 1 )
	{
		//FERROR("Socket is NULL or length < 1: %lu\n", length );
		return -1;
	}
	if( sock->s_SSLEnabled == TRUE )
	{
		//INFO( "SSL Write length: %d (sock: %p)\n", length, sock );

		FLONG left = length;
		FLONG written = 0;
		int res = 0;
		int errors = 0;

		// int retries = 0; // TODO: For select?

		FLONG bsize = left;

		int err = 0;		
		// Prepare to get fd state
		//struct timeval timeoutValue = { 1, 0 }; // TODO: For select?
		// int sResult = 0;  // TODO: For select?
		// fd_set fdstate;  // TODO: For select?
		int counter = 0;

		while( written < length )
		{
			if( (bsize + written) > length ) bsize = length - written;

			if( sock->s_Ssl == NULL )
			{
				FERROR( "[ERROR] The ssl connection was dropped on this file descriptor!\n" );
				break;
			}

			res = SSL_write( sock->s_Ssl, data + written, bsize );

			if( res < 0 )
			{
				// TODO: For select?
				/*if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
				{
					FD_ZERO( &fdstate );
					FD_SET( sock->fd, &fdstate );

					FRIEND_MUTEX_UNLOCK( &sock->mutex );
				}*/

				err = SSL_get_error( sock->s_Ssl, res );

				switch( err )
				{
				// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
				{
					// TODO: For select?
					/*sResult = select( sock->fd + 1, NULL, &fdstate, NULL, &timeoutValue );
						int ch = FD_ISSET( sock->fd, &fdstate );
						// We're not gonna write now..
						if( ch == 0 )
						{
							//DEBUG("CH = 0\n");
							usleep( 2000 );
							//counter++;
						}*/
					break;
				}
				default:
					FERROR("Cannot write %d stringerr: %s size: %ld\n", err, strerror( err ), length );
					return 0;
				}

				// TODO: For select?
				/*if( counter > 1200 )
				{
					DEBUG("Cannot send message\n");
					break;
				}*/
			}
			else
			{	
				//retries = 0;  // TODO: For select?
				written += res;
			}
		}
		return written;
	}
	else
	{
		unsigned int written = 0, bufLength = length;
		int retries = 0, res = 0;

		do
		{
			if( bufLength > length - written ) bufLength = length - written;
			res = send( sock->fd, data + written, bufLength, MSG_DONTWAIT );

			if( res > 0 ) 
			{
				written += res;
				retries = 0;
			}
			else if( res < 0 )
			{
				// Error, temporarily unavailable..
				if( errno == 11 )
				{
					usleep( 400 ); // Perhaps allow full throttle?
					if( ++retries > 10 ) usleep( 20000 );
					continue;
				}
				FERROR( "Failed to write: %d, %s\n", errno, strerror( errno ) );
				//socket can not be closed here, because http.c:1504 will fail
				//we have to rely on the reaper thread to release stale sockets
				break;
			}
		}
		while( written < length );

		DEBUG("end write %d/%ld (had %d retries)\n", written, length, retries );
		return written;
	}
}


/**
 * Abort write function
 *
 * @param sock pointer to Socket
 */

void SocketAbortWrite( Socket* sock )
{
	if( sock == NULL )
	{
		return;
	}

}

/**
 * Forcefully close a socket and free the socket object.
 *
 * @param sock pointer to Socket
 */
void SocketFree( Socket *sock )
{
	if( !sock )
	{
		FERROR("Passed socket structure is empty\n");
		return;
	}
	if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
	{
		if( sock->s_SSLEnabled == TRUE )
		{
			if( sock->s_Ssl )
			{
				SSL_free( sock->s_Ssl );
				sock->s_Ssl = NULL;
			}
			if( sock->s_Ctx )
			{
				SSL_CTX_free( sock->s_Ctx );
				sock->s_Ctx = NULL;
			}
		}

		_socket_remove_from_reaper(sock);

		FRIEND_MUTEX_UNLOCK( &sock->mutex );
	}

	pthread_mutex_destroy( &sock->mutex );

	FFree( sock );
}

/**
 * Close socket and release it
 *
 * @param sock pointer to Socket
 */
void SocketClose( Socket* sock )
{
	if( sock == NULL || sock->fd <= 0 )
	{
		FERROR("Socket: sock == NULL!\n");
		return;
	}

	//DEBUG("[SocketClose] before lock\n");
	//if( FRIEND_MUTEX_LOCK( &sock->mutex ) == 0 )
	{
		//DEBUG("[SocketClose] locked\n");
		if( sock->s_SSLEnabled == TRUE )
		{
			//DEBUG("[SocketClose] ssl\n");
			if( sock->s_Ssl )
			{
				/*
				int stat = SSL_shutdown( sock->s_Ssl );
				if( stat == 0 )
				{
					stat = SSL_shutdown( sock->s_Ssl );
					if( stat <= 0 )
					{
						FERROR("Stat <= 0\n" );
					}
				}
				 */
				int ret, ssl_r;
				unsigned long err;
				ERR_clear_error();
				switch( ( ret = SSL_shutdown( sock->s_Ssl ) ) )
				{
				case 1:
					DEBUG("Ret 1\n");
					// ok 
					break;
				case 0:
					DEBUG("Ret 0\n");
					ERR_clear_error();
					/*
						if( -1 != ( ret = SSL_shutdown( sock->s_Ssl ) ) )
						{
							DEBUG("another shutdown completed\n");
							break;
						}
					 */
					break;
				default:
					switch( ( ssl_r = SSL_get_error( sock->s_Ssl, ret) ) )
					{
					case SSL_ERROR_ZERO_RETURN:
						break;
					case SSL_ERROR_WANT_WRITE:
					case SSL_ERROR_WANT_READ:
						break;
					case SSL_ERROR_SYSCALL:
						if( 0 != (err = ERR_get_error() ) )
						{
							do
							{
								//log_error_write(srv, __FILE__, __LINE__, "sdds",  "SSL:", ssl_r, ret, ERR_error_string(err, NULL));
							}while( ( err = ERR_get_error() ) );
						}
						else if( errno != 0 )
						{
							switch( errno )
							{
							case EPIPE:
							case ECONNRESET:
								break;
							default:
								//log_error_write(srv, __FILE__, __LINE__, "sddds", "SSL (error):", ssl_r, ret, errno, strerror(errno));
								break;
							}
						}
						break;
					default:
						while( ( err = ERR_get_error() ) )
						{
							//					log_error_write(srv, __FILE__, __LINE__, "sdds","SSL:", ssl_r, ret, ERR_error_string(err, NULL));
						}
						break;
					}
				}
				//int ret;
				//SSL_shutdown( sock->s_Ssl );
				/*
				while( ( ret = SSL_shutdown( sock->s_Ssl ) ) == 0 )
				{
					usleep( 1000 );
					DEBUG("[SocketClose] shutdown in progress\n");
					if( ret == -1 )
					{
						int error = SSL_get_error( sock->s_Ssl, ret );
						FERROR("SSL_ERROR: %d\n", error );
					}
				}*/

				//DEBUG("[SocketClose] before ssl clear\n");
				SSL_clear( sock->s_Ssl );
				SSL_free( sock->s_Ssl );
				sock->s_Ssl = NULL;
				//DEBUG("[SocketClose] ssl released\n");
			}

			if( sock->s_BIO )
			{
				//DEBUG("[SocketClose] BIO free\n");
				BIO_free( sock->s_BIO );;
			}
			sock->s_BIO = NULL;
		}
		// default
		if( sock->fd )
		{
			fcntl( sock->fd, F_SETFD, FD_CLOEXEC );
			
			int optval;
			socklen_t optlen = sizeof(optval);
			optval = 0;
   optlen = sizeof(optval);
   if(setsockopt(sock->fd, SOL_SOCKET, SO_KEEPALIVE, &optval, optlen) < 0) {
   }
			
			//FERROR( "Closing socket %d\n", sock->fd );
			//DEBUG("shutdown socket\n");
			int e = 0;//shutdown( sock->fd, SHUT_RDWR );
			//DEBUG("socked erased: %d\n", e );
			e = close( sock->fd );
			DEBUG("socked closed: %d\n", sock->fd );
			sock->fd = 0;
		}
		//DEBUG("[SocketClose] before unlock\n");
		//FRIEND_MUTEX_UNLOCK( &sock->mutex );
		//DEBUG("[SocketClose] mutex unlocked\n");
		SocketFree( sock );
		sock = NULL;
	}
}

