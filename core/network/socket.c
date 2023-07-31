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
 *  @author Pawel Stefanski
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

#include <zlib.h>

//#undef __DEBUG
//#define DEBUG( ...)
//#undef DEBUG1
//#define DEBUG1( ...)

void SocketFree( Socket *sock );

#define SOCKET_STATE_MAX_ACCEPTED_TIME_s 15 //socket has N seconds to send the first byte
#define READ_TILL_END_BUFFER_SIZE 4096*8	//8192
#define READ_TILL_END_SOCKET_TIMEOUT (10000)
#define READ_PACKAGE_BUFFER_SIZE 128000

static int ssl_session_ctx_id = 1;
static int ssl_sockopt_on = 1;

/**
 * Open new socket on specified port
 *
 * @param sb pointer to SystemBase
 * @param ssl ctionset to TRUE if you want to setup secured conne
 * @param port number on which connection will be set
 * @param type of connection, for server :SOCKET_TYPE_SERVER, for client: SOCKET_TYPE_CLIENT
 * @return Socket structure when success, otherwise NULL
 */

Socket* SocketNew( void *sb, FBOOL ssl, unsigned short port, int type )
{
	Socket *sock = NULL;
	int fd = socket( AF_INET6, SOCK_STREAM | SOCK_NONBLOCK, 0 );
	if( fd == -1 )
	{
		FERROR( "[SocketNew] ERROR socket failed\n" );
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
			FERROR("[SocketNew] Cannot allocate memory for socket!\n");
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
			sock->s_Interface = &(lsb->l_SocketISSL);
			sock->s_VerifyClient = TRUE;

			INFO("[SocketNew] SSL Connection enabled\n");

			// Create a SSL_METHOD structure (choose a SSL/TLS protocol version)
			//sock->s_Meth = SSLv3_method();
			//sock->s_Meth =  TLSv1_2_method();
			sock->s_Meth = SSLv23_server_method();
			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );

			if ( sock->s_Ctx == NULL )
			{
				FERROR( "[SocketNew] SSLContext error %s\n", (char *)stderr );
				close( fd );
				sock->s_Interface->SocketDelete( sock );
				return NULL;
			}

			if( sock->s_VerifyClient == TRUE )
			{
				// Load the RSA CA certificate into the SSL_CTX structure 
				if ( !SSL_CTX_load_verify_locations( sock->s_Ctx, lsb->RSA_SERVER_CA_CERT, lsb->RSA_SERVER_CA_PATH )) 
				{
					FERROR( "[SocketNew] Could not verify cert CA: %s CA_PATH: %s", lsb->RSA_SERVER_CA_CERT, lsb->RSA_SERVER_CA_PATH );
					close( fd );
					sock->s_Interface->SocketDelete( sock );
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
				FERROR("[SocketNew] UseCertyficate file fail : %s\n", lsb->RSA_SERVER_CERT );
				sock->s_Interface->SocketDelete( sock );
				close( fd );
				return NULL;
			}

			// Load the private-key corresponding to the server certificate 
			if( SSL_CTX_use_PrivateKey_file( sock->s_Ctx, lsb->RSA_SERVER_KEY, SSL_FILETYPE_PEM ) <= 0 ) 
			{
				FERROR( "[SocketNew] SSLuseprivatekeyfile fail %s\n", (char *)stderr);
				close( fd );
				sock->s_Interface->SocketDelete( sock );
				return NULL;
			}


			// Check if the server certificate and private-key matches
			if( !SSL_CTX_check_private_key( sock->s_Ctx ) ) 
			{
				FERROR("[SocketNew] Private key does not match the certificate public key\n");
				close( fd );
				sock->s_Interface->SocketDelete( sock );
				return NULL;
			}

			// Lets not block and lets allow retries!
			SocketSetBlocking( sock, FALSE );

			SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
			SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
			SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv3 | SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET | SSL_OP_ALL );
			SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
			SSL_CTX_set_cipher_list( sock->s_Ctx, "HIGH:!aNULL:!MD5:!RC4" );
		}
		else	// SSL not used
		{
			sock->s_Interface = &(lsb->l_SocketINOSSL);
		}

		if( setsockopt( fd, SOL_SOCKET, SO_REUSEADDR, (char*)&ssl_sockopt_on, sizeof(ssl_sockopt_on) ) < 0 )
		{
			FERROR( "[SocketNew] ERROR setsockopt(SO_REUSEADDR) failed\n");
			close( fd );
			sock->s_Interface->SocketDelete( sock );
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
			FERROR( "[SocketNew] ERROR bind failed on port %d\n", port );
			sock->s_Interface->SocketDelete( sock );
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
			FERROR("[SocketNew] Cannot allocate memory for socket!\n");
			//sock->s_Interface->SocketDelete( sock );
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
			sock->s_Interface = &(lsb->l_SocketISSL);

			sock->s_BIO = BIO_new(BIO_s_mem());

			sock->s_Meth = SSLv23_client_method();
			if( sock->s_Meth  == NULL )
			{
				FERROR("[SocketNew] Cannot create SSL client method!\n");
				sock->s_Interface->SocketDelete( sock );
				return NULL;
			}

			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
			if( sock->s_Ctx  == NULL )
			{
				FERROR("[SocketNew] Cannot create SSL context!\n");
				sock->s_Interface->SocketDelete( sock );
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
				FERROR("[SocketNew] Cannot create new SSL connection\n");
				sock->s_Interface->SocketDelete( sock );
				return NULL;
			}
			SSL_set_fd( sock->s_Ssl, sock->fd );

			//SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH );
			int cache = SSL_CTX_get_session_cache_mode( sock->s_Ctx );
			INFO("[SocketNew] Cache mode set to: ");
			switch( cache )
			{
			case SSL_SESS_CACHE_OFF:
				INFO("[SocketNew] off\n");
				break;
			case SSL_SESS_CACHE_CLIENT:
				INFO("[SocketNew] client only\n");
				break;
			case SSL_SESS_CACHE_SERVER:
				INFO("[SocketNew] server only\n" );
				break;
			case SSL_SESS_CACHE_BOTH:
				INFO("[SocketNew] server and client\n");
				break;
			default:
				INFO("[SocketNew] undefined\n");
			}
		}
		else
		{
			sock->s_Interface = &(lsb->l_SocketINOSSL);
		}
	}
	return sock;
}

/**
 * Make the socket listen for incoming connections
 *
 * @param sock whitch will listen  incoming connections
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
		FERROR( "[SocketListen] ERROR listen failed\n" );
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
	// set the local certificate from CertFile
	if ( SSL_CTX_use_certificate_file(ctx, CertFile, SSL_FILETYPE_PEM) <= 0 )
	{
		ERR_print_errors_fp(stderr);
		return 1;
	}
	// set the private key from KeyFile (may be the same as CertFile) 
	if ( SSL_CTX_use_PrivateKey_file(ctx, KeyFile, SSL_FILETYPE_PEM) <= 0 )
	{
		ERR_print_errors_fp(stderr);
		return 2;
	}
	// verify private key 
	if ( !SSL_CTX_check_private_key(ctx) )
	{
		FERROR( "[LoadCertificates] Private key does not match the public certificate\n");
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
		FERROR("[SocketConnectClient] there should be a hostname!\n");
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
			FERROR( "[SocketConnectClient] could not get host=[%s]\n", hostname);
			return -1;
		}
	}

	/*
	if ((ppe = getprotobyname(protocol)) == 0) 
	{
		FERROR( "[SocketConnectClient] could not get protocol=[%s]\n", protocol);
		return -1;
	}
	 */

	if( (sockfd = socket(PF_INET, socktype, 0 ) ) < 0 )
	{  
		FERROR( "[SocketConnectClient] could not open socket\n");
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
		FERROR("[SocketConnectClient] Error: %s\n", strerror(errno));
		close( sockfd );
		return -1;
	}

	if( rc == 0 )
	{
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
			DEBUG("[SocketConnectClient] socket connected. It took %.5f seconds\n",
					(((double)tend.tv_sec + 1.0e-9*tend.tv_nsec) - ((double)tstart.tv_sec + 1.0e-9*tstart.tv_nsec)));
			return sockfd;
		}
		else
		{ // error
			DEBUG( "[SocketConnectClient] socket NOT connected: %s\n", strerror(so_error) );
			close( sockfd );
			return -1;
		}
		break;
	case 0: //timeout
		DEBUG( "[SocketConnectClient] connection timeout trying to connect\n");
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
 * Setup connection with another server (NO SSL)
 *
 * @param sock pointer to socket which will setup connection with another server
 * @param host internet address
 * @return socket descriptor
 */

int SocketConnectNOSSL( Socket* sock, const char *host )
{
	struct addrinfo hints, *res, *p;
	int n;

	bzero( &hints, sizeof(struct addrinfo ) );
	hints.ai_family =AF_UNSPEC;//  AF_INET6;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;
	//hints.ai_flags  =  AI_NUMERICHOST;

	if( ( n = SocketConnectClient( host, sock->port, AF_UNSPEC, SOCK_STREAM ) ) < 0 )
	{
		FERROR("[SocketConnectNOSSL] Cannot setup connection with : %s\n", host );
		return -1;
	}

	return 0;
}

/**
 * Setup connection with another server (SSL)
 *
 * @param sock pointer to socket which will setup connection with another server
 * @param host internet address
 * @return socket descriptor
 */

int SocketConnectSSL( Socket* sock, const char *host )
{
	SystemBase *lsb = (SystemBase *)sock->s_SB;
	LoadCertificates( sock->s_Ctx, lsb->RSA_SERVER_CERT, lsb->RSA_SERVER_KEY );

	struct addrinfo hints, *res, *p;
	int n;

	bzero( &hints, sizeof(struct addrinfo ) );
	hints.ai_family =AF_UNSPEC;//  AF_INET6;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;
	//hints.ai_flags  =  AI_NUMERICHOST;

	if( ( n = SocketConnectClient( host, sock->port, AF_UNSPEC, SOCK_STREAM ) ) < 0 )
	{
		FERROR("[SocketConnectSSL] Cannot setup connection with : %s\n", host );
		return -1;
	}

	X509                *cert = NULL;
	X509_NAME       *certname = NULL;

	sock->s_Interface->SocketSetBlocking( sock, TRUE );
	
	while( TRUE )
	{
		if ( ( n = SSL_connect( sock->s_Ssl ) ) != 1 )
		{
			FERROR("[SocketConnectSSL] Cannot create SSL connection %d!\n", SSL_get_error( sock->s_Ssl, n ));
			{
				int error = SSL_get_error( sock->s_Ssl, n );
				FERROR( "[SocketConnectSSL] We experienced an error %d.\n", error );
				switch( error )
				{
					case SSL_ERROR_NONE:
					{
						// NO error..
						FERROR( "[SocketConnectSSL] No error\n" );
						break;
					}
					case SSL_ERROR_ZERO_RETURN:
					{
						FERROR("[SocketConnectSSL] SSL_ACCEPT error: Socket closed.\n" );
						break;
					}
					case SSL_ERROR_WANT_READ:
					{
						FERROR( "[SocketConnectSSL] Error want read, retrying\n" );
						break;
					}
					case SSL_ERROR_WANT_WRITE:
					{
						FERROR( "[SocketConnectSSL] Error want write, retrying\n" );
						break;
					}
					case SSL_ERROR_WANT_ACCEPT:
					{
						FERROR( "[SocketConnectSSL] Want accept\n" );
						break;
					}
					case SSL_ERROR_WANT_X509_LOOKUP:
					{
						FERROR( "[SocketConnectSSL] Want 509 lookup\n" );
						break;
					}
					case SSL_ERROR_SYSCALL:
					{
						FERROR( "[SocketConnectSSL] Error syscall!\n" );
						return -2;
					}
					default:
					{
						FERROR( "[SocketConnectSSL] Other error.\n" );
						return -3;
					}
				}
			}
			return -1;
		}
		else
		{
			break;
		}
	}

	/*
	cert = SSL_get_peer_certificate( sock->s_Ssl );
	if (cert == NULL)
	{
		FERROR( "[SocketConnectSSL] Error: Could not get a certificate from: \n" );
	}
	else
	{
		DEBUG( "[SocketConnectSSL] Retrieved the server's certificate from: .\n");
		char *line;
		line  = X509_NAME_oneline( X509_get_subject_name( cert ), 0, 0 );
		DEBUG("[SocketConnectSSL] %s\n", line );
		free( line );
		line = X509_NAME_oneline( X509_get_issuer_name( cert ), 0, 0 );
		DEBUG("[SocketConnectSSL] %s\n", line );
		free( line );
		X509_free( cert );
	}
	*/
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

	return 0;
}

/**
 * Setup connection with another server
 *
 * @param sb pointer to SystemBase
 * @param ssl set to TRUE if you want to setup secured conne
 * @param host internet address
 * @param port internet port number
 * @param blocked set connection to blocked
 * @return pointer to new Socket object or NULL when error appear
 */

Socket* SocketConnectHost( void *sb, FBOOL ssl, char *host, unsigned short port, FBOOL blocked )
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
		sock->s_Interface = &(lsb->l_SocketISSL);

		DEBUG("All algo and ciphers added\n");
		//sock->s_BIO = BIO_new(BIO_s_mem());

		sock->s_Meth = SSLv23_client_method();
		if( sock->s_Meth  == NULL )
		{
			FERROR("Cannot create SSL client method!\n");
			sock->s_Interface->SocketDelete( sock );
			return NULL;
		}

		DEBUG("Before context is created\n");
		// Create a SSL_CTX structure 
		sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
		if( sock->s_Ctx  == NULL )
		{
			FERROR("Cannot create SSL context!\n");
			sock->s_Interface->SocketDelete( sock );
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
			sock->s_Interface->SocketDelete( sock );
			FERROR("Cannot create new SSL connection\n");
			return NULL;
		}

		SSL_set_fd( sock->s_Ssl, sock->fd );

		//X509                *cert = NULL;
		//X509_NAME       *certname = NULL;

		//FBOOL blocked = sock->s_Blocked;
		SocketSetBlocking( sock, blocked );
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
						char bufy[ 256 ];
						recv( sock->fd, bufy, 256, MSG_DONTWAIT );
						sleep( 1 );
						errTime++;
						if( errTime > 10 )
						{
							sock->s_Interface->SocketDelete( sock );
							return NULL;
						}
					}
					//FERROR( "[SocketConnect] Error want read, retrying\n" );
					case SSL_ERROR_WANT_WRITE:
						break;
					case SSL_ERROR_WANT_ACCEPT:
						FERROR( "[SocketConnect] Want accept\n" );
						break;
					case SSL_ERROR_WANT_X509_LOOKUP:
						FERROR( "[SocketConnect] Want 509 lookup\n" );
						break;
					case SSL_ERROR_SYSCALL:
						FERROR( "[SocketConnect] Error syscall!\n" );
						sock->s_Interface->SocketDelete( sock );
						return NULL;
					default:
						FERROR( "[SocketConnect] Other error.\n" );
						sock->s_Interface->SocketDelete( sock );
						return NULL;
					}
				}
			}
			else
			{
				INFO("[SocketConnectHost] Socket connected to: %s\n", host );
				break;
			}
		}
		
		DEBUG("[SocketConnectHost] SSLConnect SSL before block\n");

		//SocketSetBlocking( sock, blocked );
		/*
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
		*/
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
	else
	{
		sock->s_Interface = &(lsb->l_SocketINOSSL);
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

	sock->s_Blocked = block;
	s = fcntl( sock->fd, F_SETFL, flags );

	if( s < 0 )
	{
		FERROR( "[SocketSetBlocking] ERROR fcntl\n" );
		return 0;
	}

	return 1;
}

static int serverAuthSessionIdContext;

/**
 * Accepts an incoming connection (NOSSL)
 *
 * @param sock pointer to Socket
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

Socket* SocketAcceptNOSSL( Socket* sock )
{
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
			DEBUG( "[SocketAcceptNOSSL] We have processed all incoming connections OR O_NONBLOCK is set for the socket file descriptor and no connections are present to be accepted.\n" );
			break;
		case EBADF:
			DEBUG( "[SocketAcceptNOSSL] The socket argument is not a valid file descriptor.\n" );
			break;
		case ECONNABORTED:
			DEBUG( "[SocketAcceptNOSSL] A connection has been aborted.\n" );
			break;
		case EINTR:
			DEBUG( "[SocketAcceptNOSSL] The accept() function was interrupted by a signal that was caught before a valid connection arrived.\n" );
			break;
		case EINVAL:
			DEBUG( "[SocketAcceptNOSSL] The socket is not accepting connections.\n" );
			break;
		case ENFILE:
			DEBUG( "[SocketAcceptNOSSL] The maximum number of file descriptors in the system are already open.\n" );
			break;
		case ENOTSOCK:
			DEBUG( "[SocketAcceptNOSSL] The socket argument does not refer to a socket.\n" );
			break;
		case EOPNOTSUPP:
			DEBUG( "[SocketAcceptNOSSL] The socket type of the specified socket does not support accepting connections.\n" );
			break;
		default:
			DEBUG("[SocketAcceptNOSSL] Accept return bad fd\n");
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
		incoming->s_Interface = sock->s_Interface;

		SocketSetBlocking( incoming, FALSE );
	}
	else
	{
		FERROR("[SocketAcceptNOSSL] Cannot allocate memory for socket!\n");
		return NULL;
	}

	DEBUG( "[SocketAcceptNOSSL] Accepting incoming!\n" );
	return incoming;
}

/**
 * Accepts an incoming connection (SSL)
 *
 * @param sock pointer to Socket
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

Socket* SocketAcceptSSL( Socket* sock )
{
	if( sock->s_Ctx == NULL )
	{
		FERROR( "[SocketAcceptSSL] SSL not properly setup on socket!\n" );
		return NULL;
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
			DEBUG( "[SocketAcceptSSL] We have processed all incoming connections OR O_NONBLOCK is set for the socket file descriptor and no connections are present to be accepted.\n" );
			break;
		case EBADF:
			DEBUG( "[SocketAcceptSSL] The socket argument is not a valid file descriptor.\n" );
			break;
		case ECONNABORTED:
			DEBUG( "[SocketAcceptSSL] A connection has been aborted.\n" );
			break;
		case EINTR:
			DEBUG( "[SocketAcceptSSL] The accept() function was interrupted by a signal that was caught before a valid connection arrived.\n" );
			break;
		case EINVAL:
			DEBUG( "[SocketAcceptSSL] The socket is not accepting connections.\n" );
			break;
		case ENFILE:
			DEBUG( "[SocketAcceptSSL] The maximum number of file descriptors in the system are already open.\n" );
			break;
		case ENOTSOCK:
			DEBUG( "[SocketAcceptSSL] The socket argument does not refer to a socket.\n" );
			break;
		case EOPNOTSUPP:
			DEBUG( "[SocketAcceptSSL] The socket type of the specified socket does not support accepting connections.\n" );
			break;
		default:
			DEBUG("[SocketAcceptSSL] Accept return bad fd\n");
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
	}
	else
	{
		FERROR("[SocketAcceptSSL] Cannot allocate memory for socket!\n");
		return NULL;
	}
	
	incoming->s_Interface = sock->s_Interface;

	DEBUG("[SocketAcceptSSL] SSL: %d\n", sock->s_SSLEnabled );

	incoming->s_Ssl = SSL_new( sock->s_Ctx ); 
	if( incoming->s_Ssl == NULL )
	{
		FERROR("[SocketAcceptSSL] Cannot accept SSL connection\n");
		shutdown( fd, SHUT_RDWR );
		close( fd );
		FFree( incoming );
		return NULL;
	}

	SSL_set_ex_data( incoming->s_Ssl, 0, sock->s_SB );
	SSL_set_verify( incoming->s_Ssl, sock->s_AcceptFlags, sock->VerifyPeer );
	SSL_set_session_id_context( incoming->s_Ssl, (void *)&serverAuthSessionIdContext, sizeof(serverAuthSessionIdContext) );
	SSL_set_accept_state( incoming->s_Ssl );
		
	int srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
	if( srl != 1 )
	{
		FERROR( "[SocketAcceptSSL] Could not set fd\n" );
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
			DEBUG("[SocketAcceptSSL] Connection accepted\n");
			break;
		}

		if( err <= 0 || err == 2 )
		{
			ERR_print_errors_fp( stderr );
			int error = SSL_get_error( incoming->s_Ssl, err );
			//DEBUG("[SocketAcceptSSL] SSL error %d\n", error );
			switch( error )
			{
			case SSL_ERROR_NONE:
				// NO error..
				FERROR( "[SocketAcceptSSL] No error\n" );
				return incoming;
			case SSL_ERROR_ZERO_RETURN:
				FERROR("[SocketAcceptSSL] SSL_ACCEPT error: Socket closed.\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_WANT_READ:
				//return incoming;
				break;
			case SSL_ERROR_WANT_WRITE:
				//return incoming;
				break;
			case SSL_ERROR_WANT_ACCEPT:
				FERROR( "[SocketAcceptSSL] Want accept\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_WANT_X509_LOOKUP:
				FERROR( "[SocketAcceptSSL] Want 509 lookup\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_SYSCALL:
				FERROR( "[SocketAcceptSSL] Error syscall.\n" ); //. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_SSL:
				FERROR( "[SocketAcceptSSL] SSL_ERROR_SSL: %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
				sock->s_Interface->SocketDelete( incoming );
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
		INFO( "[SocketAcceptSSL] Error: Could not get a certificate from: \n" );
	}
	else
	{
		X509_free( cert );
	}
	
	DEBUG( "[SocketAcceptSSL] Accepting incoming!\n" );
	return incoming;
}

/**
 * Accepts an incoming connection (NOSSL)
 *
 * @param sock pointer to Socket
 * @param p AcceptPair structure
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

Socket* SocketAcceptPairNOSSL( Socket* sock, struct AcceptPair *p )
{
	if( p == NULL )
	{
		FERROR("[SocketAcceptPairNOSSL] AcceptPair is NULL\n");
		return NULL;
	}

	// We need a valid file descriptor
	if( !p->fd )
	{
		FERROR( "[SocketAcceptPairNOSSL] NULL fd\n" );
		return NULL;
	}

	int fd = p->fd;

	Socket* incoming = ( Socket *)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		incoming->fd = fd;
		incoming->port = ntohs( p->client.sin6_port );
		incoming->ip = p->client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
		incoming->s_SB = sock->s_SB;
		incoming->s_Interface = sock->s_Interface;
		DEBUG("[SocketAcceptPairNOSSL] We managed to create an incoming socket. fd %d port %d\n", incoming->fd, incoming->port);

		// Not blocking
		SocketSetBlocking( incoming, FALSE );
	}
	else
	{
		FERROR("[SocketAcceptPairNOSSL] Cannot allocate memory for socket!\n");
		shutdown( fd, SHUT_RDWR );
		close( fd );
		return NULL;
	}
	
	// Return socket
	return incoming;
}

/**
 * Accepts an incoming connection (SSL)
 *
 * @param sock pointer to Socket
 * @param p AcceptPair structure
 * @return Returns a new Socket_t object if the connection was accepted. Returns NULL if the connection was rejected, or an error occured.
 */

Socket* SocketAcceptPairSSL( Socket* sock, struct AcceptPair *p )
{
	if( p == NULL )
	{
		FERROR("[SocketAcceptPairSSL] AcceptPair is NULL\n");
		return NULL;
	}

	if( !sock->s_Ctx )
	{
		FERROR( "[SocketAcceptPairSSL] SSL not properly setup on socket!\n" );
		return NULL;
	}

	// We need a valid file descriptor
	if( !p->fd )
	{
		FERROR( "[SocketAcceptPairSSL] NULL fd\n" );
		return NULL;
	}

	int fd = p->fd;
	int srl = 0;

	Socket* incoming = ( Socket *)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		incoming->fd = fd;
		incoming->port = ntohs( p->client.sin6_port );
		incoming->ip = p->client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
		incoming->s_SB = sock->s_SB;
		incoming->s_Interface = sock->s_Interface;
		DEBUG("[SocketAcceptPairSSL] We managed to create an incoming socket. fd %d port %d\n", incoming->fd, incoming->port);

		// Not blocking
		SocketSetBlocking( incoming, FALSE );
	}
	else
	{
		FERROR("[SocketAcceptPairSSL] Cannot allocate memory for socket!\n");
		shutdown( fd, SHUT_RDWR );
		close( fd );
		return NULL;
	}

	incoming->s_Ssl = SSL_new( sock->s_Ctx );

	if( incoming->s_Ssl == NULL )
	{
		FERROR("[SocketAcceptPairSSL] Cannot accept SSL connection\n");
		shutdown( fd, SHUT_RDWR );
		close( fd );
		FFree( incoming );
		return NULL;
	}

	srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
	SSL_set_accept_state( incoming->s_Ssl );

	if( srl != 1 )
	{
		int error = SSL_get_error( incoming->s_Ssl, srl );

		FERROR( "[SocketAcceptPairSSL] Could not set fd, error: %d fd: %d\n", error, incoming->fd );
		shutdown( fd, SHUT_RDWR );
		close( fd );
		SSL_free( incoming->s_Ssl );
		FFree( incoming );
		return NULL;
	}

	// setup SSL session
	int err = 0;
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
				FERROR( "[SocketAcceptPairSSL] No error\n" );
				return incoming;
			case SSL_ERROR_ZERO_RETURN:
				FERROR("[SocketAcceptPairSSL] SSL_ACCEPT error: Socket closed.\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_WANT_READ:
				return incoming;
			case SSL_ERROR_WANT_WRITE:
				return incoming;
			case SSL_ERROR_WANT_ACCEPT:
				FERROR( "[SocketAcceptPairSSL] Want accept\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_WANT_X509_LOOKUP:
				FERROR( "[SocketAcceptPairSSL] Want 509 lookup\n" );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_SYSCALL:
				FERROR( "[SocketAcceptPairSSL] Error syscall.\n" ); //. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			case SSL_ERROR_SSL:
				FERROR( "[SocketAcceptPairSSL] SSL_ERROR_SSL: %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
				sock->s_Interface->SocketDelete( incoming );
				return NULL;
			}
		}
		usleep( 0 );
	}

	// Return socket
	return incoming;
}

/**
 * Read data from socket (NOSSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param expectedLength tells us how much exactly we know we need until we can stop reading (0 if unknown)
 * @return number of bytes read from socket
 */

int SocketReadNOSSL( Socket* sock, char* data, unsigned int length, unsigned int expectedLength )
{
	if( data == NULL )
	{
		FERROR( "[SocketReadNOSSL] Can not read into empty buffer.\n" );
		return 0;
	}

	unsigned int bufLength = length, read = 0;
	int retries = 0, res = 0;

	while( 1 )
	{
		res = recv( sock->fd, data + read, bufLength - read, 0 ); //, MSG_DONTWAIT );
		if( res > 0 )
		{ 
			read += res;
			retries = 0;
			// TODO: What is this
			//if( read >= length )
			{
				DEBUG( "[SocketReadNOSSL] Done reading %d/%d\n", read, length );
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
					FERROR( "[SocketReadNOSSL] Resource temporarily unavailable.. Read %d/%d (retries %d)\n", read, length, retries );
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


/**
 * Read data from socket (SSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param expectedLength tells us how much exactly we know we need until we can stop reading (0 if unknown)
 * @return number of bytes read from socket
 */

int SocketReadSSL( Socket* sock, char* data, unsigned int length, unsigned int expectedLength )
{
	if( data == NULL )
	{
		FERROR( "Can not read into empty buffer.\n" );
		return 0;
	}

	if( !sock->s_Ssl )
	{
		FERROR( "Problem with SSL!\n" );
		return 0;
	}
	
	unsigned int read = 0;
	int res = 0, err = 0, buf = length;
	int retries = 0;
	int read_retries = 0;
	struct timeval timeout;

#define MINIMUMRETRY 30000
	if( expectedLength > 0 && length > expectedLength ) length = expectedLength;

	while( TRUE )
	{
		if( (read + buf) > length )
		{
			buf = length - read;
		}
		DEBUG("[SocketReadSSL] socket read %d\n", sock->fd );
		
		if( ( res = SSL_read( sock->s_Ssl, data + read, buf ) ) > 0 )
		{
			read += res;
			read_retries = retries = 0;
			if( read >= length )
			{
				break;
			}
			DEBUG("[SocketReadSSL] Bytes read: %d\n", res );
		}
		else
		{
			err = SSL_get_error( sock->s_Ssl, res );
			DEBUG("[SocketReadSSL] Error: %d\n", err );
			
			switch( err )
			{
				// The TLS/SSL I/O operation completed.
				case SSL_ERROR_NONE:
					FERROR( "[SocketReadSSL] Completed successfully.\n" );
					return read;
					// The TLS/SSL connection has been closed. Goodbye!
				case SSL_ERROR_ZERO_RETURN:
					FERROR( "[SocketReadSSL] The connection was closed.\n" );
					//return SOCKET_CLOSED_STATE;
					return -1;
					// The operation did not complete. Call again.
				case SSL_ERROR_WANT_READ:
					// NB: We used to retry 10000 times!
				{
					struct pollfd fds;
					int len = 0;

					// watch stdin for input 
					fds.fd = sock->fd;// STDIN_FILENO;
					fds.events = POLLIN;

					int err = poll( &fds, 1, 50 );
					if( err <= 0 )
					{
						DEBUG("[SocketReadSSL] Timeout or there is no data in socket\n");
						return read;
					}
					if( fds.revents & POLLIN )
					{
						DEBUG("[SocketReadSSL] Got data!! Calling SSL_Read\n");
	
						continue;
					}
					else if( fds.revents & POLLHUP )
					{
						DEBUG("[SocketReadSSL] Disconnected!\n");
					}
				}
					/*
					// this works fine for all cases
					if( read == 0 && read_retries++ < retryCount )
					{
						// We are downloading a big file
						// TODO: This usleep is the old code (before usleep(1))
						usleep( read_retries < 100 ? 0 : ( read_retries < 200 ? 1 : ( retryCount << 1 ) ) );

						continue;
					}
					*/
					return read;
				case SSL_ERROR_WANT_WRITE:
					{
						struct pollfd fds[2];

						// watch stdin for input 
						fds[0].fd = sock->fd;// STDIN_FILENO;
						fds[0].events = POLLIN;

						// watch stdout for ability to write
						fds[1].fd = STDOUT_FILENO;
						fds[1].events = POLLOUT;

						int timeout = 0;
						switch( read_retries )
						{
							case 0: break;
							case 1: timeout = 50; break;
							case 2: timeout = 150; break;
							default: timeout = 250; break;
						}

						int err = poll( fds, 1, timeout );

						if( err > 0 )
						{
							read_retries++;
							usleep( 1 ); // 50000
							FERROR("[SocketReadSSL] want write\n");
							continue; // more data to read...
						}
						else if( err == 0 )
						{
							FERROR("[SocketReadSSL] want write TIMEOUT....\n");
							return read;
						}
						FERROR("[SocketReadSSL] want write everything read....\n");
						return read;
					}
				case SSL_ERROR_SYSCALL:

					//DEBUG("SSLERR : err : %d res: %d\n", err, res );
				
					FERROR("[SocketReadSSL] Error syscall, bufsize = %d.\n", buf );
					if( err > 0 )
					{
						if( errno == 0 )
						{
							FERROR(" [SocketReadSSL] Connection reset by peer.\n" );
							return -1;
							//return SOCKET_CLOSED_STATE;
						}
						else 
						{
							FERROR( "[SocketReadSSL] Error syscall error: %s\n", strerror( errno ) );
						}
					}
					else if( err == 0 )
					{
						FERROR( "[SocketReadSSL] Error syscall no error? return.\n" );
						return read;
					}
				
					FERROR( "[SocketReadSSL] Error syscall other error. return.\n" );
					return read;
					// Don't retry, just return read
				default:
					return read;
			}	// err switch
		}	// SSL_Read else
	}	// while( TRUE );
	return read;
}

/**
 * Read data from socket (blocked) (NOSSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @return number of bytes read from socket
 */

int SocketReadBlockedNOSSL( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)))
{
	if( data == NULL )
	{
		FERROR( "[SocketReadBlockedNOSSL] Can not read into empty buffer.\n" );
		return 0;
	}

	int count;
	ioctl( sock->fd, FIONREAD, &count);
	DEBUG("[SocketReadBlockedNOSSL] recv %d\n", count );
	if( count == 0 )
	{
		return 0;
	}
	
	struct pollfd fds;
	
	// watch stdin for input 
	fds.fd = sock->fd;
	fds.events = POLLIN;

	int err = poll( &fds, 1, 500 );
	if( err <= 0 )
	{
		DEBUG("[SocketReadBlockedNOSSL] Timeout or there is no data in socket\n");
		return err;
	}
	
	unsigned int bufLength = length, read = 0;
	return (int)recv( sock->fd, data + read, bufLength - read, 0 ); //, MSG_DONTWAIT );
}

/**
 * Read data from socket (blocked SSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @return number of bytes read from socket
 */

int SocketReadBlockedSSL( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)))
{
	struct pollfd fds;
	int len = 0;

	// watch stdin for input 
	fds.fd = sock->fd;// STDIN_FILENO;
	fds.events = POLLIN;

	int err = poll( &fds, 1, sock->s_SocketBlockTimeout > 0 ? sock->s_SocketBlockTimeout : 0 );
	
	if( err <= 0 )
	{
		DEBUG("[SocketReadBlockedSSL] Timeout or there is no data in socket\n");
		return err;
	}
	
	if( fds.revents & POLLIN )
	{
		DEBUG("[SocketReadBlockedSSL] Got data!!\n");
		len = SSL_read( sock->s_Ssl, data, length );
	
		DEBUG("[SocketReadBlockedSSL] %p, read: %d\n", sock, len );
		
		if( len <= 0 )
		{
			err = SSL_get_error( sock->s_Ssl, len );
			DEBUG("[SocketReadBlockedSSL] SocketBlocked Error: %d\n", err );
		}
	}
	else if( fds.revents & POLLHUP )
	{
		DEBUG("[SocketReadBlockedSSL] Disconnected!\n");
		return 0;
	}
	
	DEBUG("[SocketReadBlockedSSL] pointer to sock %p\n", sock );

	return len;
}

/**
 * Read data from socket with timeout option (NOSSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @param sec number of timeout seconds
 * @return number of bytes read from socket
 */

int SocketWaitReadNOSSL( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)), int sec __attribute__((unused)))
{
	DEBUG2("[SocketWaitReadNOSSL] Socket wait for message\n");
	
	int n;
	
	SocketSetBlocking( sock, TRUE );
	
	struct pollfd fds;
	
	// watch stdin for input 
	fds.fd = sock->fd;
	fds.events = POLLIN;
	
	if( ( n = poll( &fds, 1, READ_TILL_END_SOCKET_TIMEOUT ) ) == 0 )
	{
		FERROR("[SocketWaitReadNOSSL] Connection timeout\n");
		SocketSetBlocking( sock, FALSE );
		return 0;
	}
	else if( n < 0 )
	{
		FERROR("[SocketWaitReadNOSSL] Select error\n");
	}
	
	SocketSetBlocking( sock, FALSE );
	
	DEBUG2("[SocketWaitReadNOSSL] Socket message appear %d\n", n);
	
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
				DEBUG( "[SocketWaitReadNOSSL] Done reading %d/%d\n", read, length );
				return read;
			}
		}
		else if( res == 0 )
		{
			return read;
		}
		// Error
		else if( res < 0 )
		{
			// Resource temporarily unavailable...
			//if( errno == EAGAIN )
			if( errno == EAGAIN && retries++ < 25 )
			{
				// Approx successful header
				usleep( 0 );
				FERROR( "[SocketWaitReadNOSSL] Resource temporarily unavailable.. Read %d/%d (retries %d)\n", read, length, retries );
				continue;
			}
			DEBUG( "[SocketWaitReadNOSSL] Read %d/%d\n", read, length );
			return read;
		}
		DEBUG( "[SocketWaitReadNOSSL] Read %d/%d\n", read, length );
	}
	DEBUG( "[SocketWaitReadNOSSL] Done reading %d/%d (errno: %d)\n", read, length, errno );
	return read;
}

/**
 * Read data from socket with timeout option (SSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param data pointer to char table where data will be stored
 * @param length size of char table
 * @param pass (obsolete?)
 * @param sec number of timeout seconds
 * @return number of bytes read from socket
 */

int SocketWaitReadSSL( Socket* sock, char* data, unsigned int length, unsigned int pass __attribute__((unused)), int sec __attribute__((unused)))
{
	DEBUG2("[SocketWaitReadSSL] Socket wait for message\n");
	
	int n;
	
	SocketSetBlocking( sock, TRUE );
	
	struct pollfd fds;
	
	// watch stdin for input 
	fds.fd = sock->fd;
	fds.events = POLLIN;

	if( ( n = poll( &fds, 1, READ_TILL_END_SOCKET_TIMEOUT ) ) == 0 )
	{
		FERROR("[SocketWaitReadSSL] Connection timeout\n");
		SocketSetBlocking( sock, FALSE );
		return 0;
	}
	else if( n < 0 )
	{
		FERROR("[SocketWaitReadSSL] Select error\n");
	}
	
	SocketSetBlocking( sock, FALSE );
	
	DEBUG2("[SocketWaitReadSSL] Socket message appear %d\n", n);
	
	unsigned int read = 0;
	int res = 0, err = 0, buf = length;
	int retries = 0;
	
	do
	{
		INFO( "[SocketWaitReadSSL] Start of the voyage.. %p\n", sock );
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
		
		if( res <= 0 )
		{
			err = SSL_get_error( sock->s_Ssl, res );
			switch( err )
			{
			// The TLS/SSL I/O operation completed.
			case SSL_ERROR_NONE:
				FERROR( "[SocketWaitReadSSL] Completed successfully.\n" );
				return read;
				// The TLS/SSL connection has been closed. Goodbye!
			case SSL_ERROR_ZERO_RETURN:
				FERROR( "[SocketWaitReadSSL] The connection was closed, return %d\n", read );
				return SOCKET_CLOSED_STATE;
				// The operation did not complete. Call again.
			case SSL_ERROR_WANT_READ:
			{
				// no data available right now, wait a few seconds in case new data arrives...
				struct pollfd lfds;
				// watch stdin for input 
				lfds.fd = sock->fd;
				lfds.events = POLLIN;

				int err = poll( &lfds, 1, sock->s_Timeouts > 0 ? sock->s_Timeouts : READ_TILL_END_SOCKET_TIMEOUT );
				if( err > 0 )
				{
					continue; // more data to read...
				}

				if( err == 0 )
				{
					FERROR("[SocketWaitReadSSL] want read TIMEOUT....\n");
					return read;
				}
				else
				{
					FERROR("[SocketWaitReadSSL] want read everything read....\n");
					return read;
				}
			}
				// The operation did not complete. Call again.
			case SSL_ERROR_WANT_WRITE:
			{
				FERROR( "[SocketWaitReadSSL] Want write.\n" );

				struct pollfd lfds;
				// watch stdin for input 
				lfds.fd = sock->fd;// STDIN_FILENO;
				lfds.events = POLLIN;

				int err = poll( &lfds, 1, sock->s_Timeouts > 0 ? sock->s_Timeouts : READ_TILL_END_SOCKET_TIMEOUT );
				if( err > 0 )
				{
					continue; // more data to read...
				}

				if( err == 0 )
				{
					FERROR("[SocketWaitReadSSL] want read TIMEOUT....\n");
					return read;
				}
				else
				{
					FERROR("[SocketWaitReadSSL] want read everything read....\n");
					return read;
				}
			}
			case SSL_ERROR_SYSCALL:
				return read;
			default:
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

	//INFO( "[SocketWaitReadSSL] Done reading (%d bytes of %d ).\n", read, length );
	return read;
}

/**
 * Read DataForm package from socket (NOSSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @return BufString structure
 */

BufString *SocketReadPackageNOSSL( Socket *sock )
{
	BufString *bs = BufStringNew();

	char *locbuffer = FMalloc( READ_PACKAGE_BUFFER_SIZE );
	if( locbuffer != NULL )
	{
		int fullPackageSize = 0;
		unsigned int read = 0;
	
		DEBUG2("[SocketReadPackageNOSSL] Socket message appear , sock ptr %p\n", sock );
		
		int retries = 0, res = 0;
	
		while( 1 )
		{
			res = recv( sock->fd, locbuffer, READ_PACKAGE_BUFFER_SIZE, MSG_DONTWAIT );

			if( res > 0 )
			{ 
				read += res;
				retries = 0;
				
				FULONG *rdat = (FULONG *)locbuffer;
				if( ID_FCRE == rdat[ 0 ] )
				{
					fullPackageSize = rdat[ 1 ];
					DEBUG("[SocketReadPackageNOSSL] package size %d\n", fullPackageSize );
				}
			
				BufStringAddSize( bs, locbuffer, res );
			
				if( fullPackageSize > 0 && read >= (unsigned int)fullPackageSize )
				{
					DEBUG("[SocketReadPackageNOSSL] got full package\n");
					FFree( locbuffer );
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
					FERROR( "[SocketReadPackageNOSSL] Resource temporarily unavailable.. Read %d/ (retries %d)\n", read, retries );
					continue;
				}
				DEBUG( "[SocketReadPackageNOSSL] Read %d  res < 0/\n", read );
				FFree( locbuffer );
				return bs;
			}
			DEBUG( "[SocketReadPackageNOSSL] Read %d/\n", read );
		}
		DEBUG( "[SocketReadPackageNOSSL] Done reading %d/ (errno: %d)\n", read, errno );
		FFree( locbuffer );
	}
	return bs;
}

/**
 * Read DataForm package from socket (SSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @return BufString structure
 */

BufString *SocketReadPackageSSL( Socket *sock )
{
	BufString *bs = BufStringNew();
	char *locbuffer = FMalloc( READ_PACKAGE_BUFFER_SIZE );
	if( locbuffer != NULL )
	{
		int fullPackageSize = 0;
		unsigned int read = 0;
		
		DEBUG2("[SocketReadPackageSSL] Socket message appear , sock ptr %p\n", sock );
		int res = 0, err = 0;//, buf = length;
		int retries = 0;
		
		do
		{
			INFO( "[SocketReadPackageSSL] Start of the voyage.. %p\n", sock );
			//if( read + buf > length ) buf = length - read;
			if( ( res = SSL_read( sock->s_Ssl, locbuffer, READ_PACKAGE_BUFFER_SIZE ) ) >= 0 )
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
					FFree( locbuffer );
					return bs;
				}
			}

			if( res <= 0 )
			{
				err = SSL_get_error( sock->s_Ssl, res );
				switch( err )
				{
				// The TLS/SSL I/O operation completed.
				case SSL_ERROR_NONE:
					FERROR( "[SocketReadPackageSSL] Completed successfully.\n" );
					return bs;
				// The TLS/SSL connection has been closed. Goodbye!
				case SSL_ERROR_ZERO_RETURN:
					FERROR( "[SocketReadPackageSSL] The connection was closed, return %d\n", read );
					return bs;
				// The operation did not complete. Call again.
				case SSL_ERROR_WANT_READ:
				{
					// no data available right now, wait a few seconds in case new data arrives...

					struct pollfd lfds;
					// watch stdin for input 
					lfds.fd = sock->fd;
					lfds.events = POLLIN;

					int err = poll( &lfds, 1, sock->s_Timeouts > 0 ? sock->s_Timeouts : READ_TILL_END_SOCKET_TIMEOUT );
					if( err > 0 )
					{
						FFree( locbuffer );
						return NULL; // more data to read...
					}
					
					if( err == 0 )
					{
						FERROR("[SocketReadPackageSSL] want read TIMEOUT....\n");
						FFree( locbuffer );
						return bs;
					}
					else
					{
						FERROR("[SocketReadPackageSSL] want read everything read....\n");
						FFree( locbuffer );
						return bs;
					}
				}
				// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
				{
					FERROR( "[SocketReadPackageSSL] Want write.\n" );
					struct pollfd lfds;
					// watch stdin for input 
					lfds.fd = sock->fd;// STDIN_FILENO;
					lfds.events = POLLIN;

					int err = poll( &lfds, 1, sock->s_Timeouts > 0 ? sock->s_Timeouts : READ_TILL_END_SOCKET_TIMEOUT );
					if( err > 0 )
					{
						FFree( locbuffer );
						return NULL; // more data to read...
					}
				
					if( err == 0 )
					{
						FERROR("[SocketReadPackageSSL] want read TIMEOUT....\n");
						FFree( locbuffer );
						return bs;
					}
					else
					{
						FERROR("[SocketReadPackageSSL] want read everything read....\n");
						FFree( locbuffer );
						return bs;
					}
				}
				case SSL_ERROR_SYSCALL:
					FFree( locbuffer );
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
		DEBUG("[SocketReadPackageSSL] read\n");
		FFree( locbuffer );
	}
	return bs;
}

/**
 * Read data from socket till end of stream (NOSSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param pass (obsolete?)
 * @param sec timeout value in seconds
 * @return BufString structure
 */

BufString *SocketReadTillEndNOSSL( Socket* sock, unsigned int pass __attribute__((unused)), int sec )
{
	if( sock == NULL )
	{
		FERROR("[SocketReadTillEndNOSSL] Cannot read from socket, socket = NULL!\n");
		return NULL;
	}

	DEBUG2("[SocketReadTillEndNOSSL] Socket wait for message, blocked %d\n", sock->s_Blocked );

	int n;
	struct timeval tv;

	struct pollfd fds[2];

	// watch stdin for input 
	fds[0].fd = sock->fd;// STDIN_FILENO;
	fds[0].events = POLLIN;

	// watch stdout for ability to write
	fds[1].fd = STDOUT_FILENO;
	fds[1].events = POLLOUT;

	tv.tv_sec = sec;
	tv.tv_usec = 0;
	FBOOL quit = FALSE;
	
	char *locbuffer = FMalloc( READ_TILL_END_BUFFER_SIZE );
	if( locbuffer != NULL )
	{
		int fullPackageSize = 0;
		FQUAD read = 0;
		int retries = 0;

		BufString *bs = BufStringNew();

		while( quit != TRUE )
		{
			int ret = poll( fds, 1, 50 );
		
			DEBUG("[SocketReadTillEndNOSSL] Before select, ret: %d\n", ret );
			if( ret == 0 )
			{
				DEBUG("[SocketReadTillEndNOSSL] Timeout!\n");
				BufStringDelete( bs );
				FFree( locbuffer );
				return NULL;
			}
			else if( ret < 0 )
			{
				DEBUG("[SocketReadTillEndNOSSL] Error\n");
				BufStringDelete( bs );
				FFree( locbuffer );
				return NULL;
			}
			int res = 0;

			while( 1 )
			{
				res = recv( sock->fd, locbuffer, READ_TILL_END_BUFFER_SIZE, MSG_DONTWAIT );

				if( res > 0 )
				{
					read += res;
					retries = 0;

					FULONG *rdat = (FULONG *)locbuffer;
					if( ID_FCRE == rdat[ 0 ] )
					{
						fullPackageSize = rdat[ 1 ];
						DEBUG("[SocketReadTillEndNOSSL] package size %d  - long %lu\n", fullPackageSize, rdat[ 1 ] );
					}

					BufStringAddSize( bs, locbuffer, res );

					if( fullPackageSize > 0 && read >= (unsigned int)fullPackageSize )
					{
						DEBUG("[SocketReadTillEndNOSSL] got full package\n");
						FFree( locbuffer );
						return bs;
					}
				}
				else if( res == 0 )
				{
					DEBUG("[SocketReadTillEndNOSSL] Timeout\n");
					FFree( locbuffer );
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
					DEBUG( "[SocketReadTillEndNOSSL] Read %ld  res < 0/\n", read );
					FFree( locbuffer );
					return bs;
				}
				DEBUG( "[SocketReadTillEndNOSSL] Read %ld fullpackagesize %d\n", read, fullPackageSize );
			}	// while( 1 )
			DEBUG( "[SocketReadTillEndNOSSL] Done reading %ld/ (errno: %d)\n", read, errno );
		}	// QUIT != TRUE
	}
	return NULL;
}

/**
 * Read data from socket till end of stream (SSL)
 *
 * @param sock pointer to Socket on which read function will be called
 * @param pass (obsolete?)
 * @param sec timeout value in seconds
 * @return BufString structure
 */

BufString *SocketReadTillEndSSL( Socket* sock, unsigned int pass __attribute__((unused)), int sec )
{
	if( sock == NULL )
	{
		FERROR("[SocketReadTillEndSSL] Cannot read from socket, socket = NULL!\n");
		return NULL;
	}

	DEBUG2("[SocketReadTillEndSSL] Socket wait for message, blocked %d\n", sock->s_Blocked );

	struct timeval tv;

	struct pollfd fds;

	// watch stdin for input 
	fds.fd = sock->fd;// STDIN_FILENO;
	fds.events = POLLIN;

	tv.tv_sec = sec;
	tv.tv_usec = 0;
	FBOOL quit = FALSE;
	
	char *locbuffer = FMalloc( READ_TILL_END_BUFFER_SIZE );
	if( locbuffer != NULL )
	{
		int fullPackageSize = 0;
		FQUAD read = 0;
		int retries = 0;
		
		BufString *bs = BufStringNew();
		
		DEBUG("[SocketReadTillEndSSL] Before quite != TRUE\n");
		
		while( quit != TRUE )
		{
			DEBUG("[SocketReadTillEndSSL] poll?\n");
			
			int ret = poll( &fds, 1, READ_TILL_END_SOCKET_TIMEOUT );
			
			DEBUG("[SocketReadTillEndSSL] Before select, ret: %d\n", ret );
			if( ret == 0 )
			{
				DEBUG("[SocketReadTillEndSSL] Timeout!\n");
				BufStringDelete( bs );
				FFree( locbuffer );
				return NULL;
			}
			else if( ret < 0 )
			{
				DEBUG("[SocketReadTillEndSSL] Error\n");
				BufStringDelete( bs );
				FFree( locbuffer );
				return NULL;
			}

			int res = 0, err = 0;//, buf = length;
		
			DEBUG("[SocketReadTillEndSSL] SSL enabled\n");

			if( fds.revents & EPOLLIN )
			{
				DEBUG("[SocketReadTillEndSSL] Before read\n");
				//if( read + buf > length ) buf = length - read;
				if( ( res = SSL_read( sock->s_Ssl, locbuffer, READ_TILL_END_BUFFER_SIZE ) ) >= 0 )
				{
					read += (FQUAD)res;
					
					DEBUG("[SocketReadTillEndSSL] Read: %d fullpackage: %d\n", res, fullPackageSize );
				
					FULONG *rdat = (FULONG *)locbuffer;
					if( ID_FCRE == rdat[ 0 ] )
					{
						fullPackageSize = rdat[ 1 ];
					}
					BufStringAddSize( bs, locbuffer, res );

					if( fullPackageSize > 0 && read >= (FQUAD) fullPackageSize )
					{
						FFree( locbuffer );
						return bs;
					}
				}
				DEBUG("[SocketReadTillEndSSL] res2 : %d fullpackagesize %d\n", res, fullPackageSize );

				if( res < 0 )
				{
					err = SSL_get_error( sock->s_Ssl, res );
					DEBUG("[SocketReadTillEndSSL] err: %d\n", err );
					switch( err )
					{
					// The TLS/SSL I/O operation completed.
					case SSL_ERROR_NONE:
						FERROR( "[SocketReadTillEndSSL] Completed successfully.\n" );
						return bs;
						// The TLS/SSL connection has been closed. Goodbye!
					case SSL_ERROR_ZERO_RETURN:
						FERROR( "[SocketReadTillEndSSL] The connection was closed, return %ld\n", read );
						return bs;
						// The operation did not complete. Call again.
					case SSL_ERROR_WANT_READ:
						break;
					case SSL_ERROR_WANT_WRITE:
						return bs;
					case SSL_ERROR_SYSCALL:
						return bs;
					default:
						DEBUG("[SocketReadTillEndSSL] default error\n");
						usleep( 50 );
						if( retries++ > 15 )
						{
							FFree( locbuffer );
							return bs;
						}
					}
				}
				else if( res == 0 )
				{
					DEBUG("[SocketReadTillEndSSL] res = 0\n");
					if( retries++ > 15 )
					{
						FFree( locbuffer );
						return bs;
					}
				}
			}	// if EPOLLIN
		}	// QUIT != TRUE
		FFree( locbuffer );
	}
	return NULL;
}

/**
 * Write data to socket (NOSSL)
 *
 * @param sock pointer to Socket on which write function will be called
 * @param data pointer to char table which will be send
 * @param length length of data which will be send
 * @return number of bytes writen to socket
 */
FLONG SocketWriteNOSSL( Socket* sock, char* data, FLONG length )
{
	if( length < 1 )
	{
		//FERROR("Socket is NULL or length < 1: %lu\n", length );
		return -1;
	}

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
				retries++;
				usleep( 400 ); // Perhaps allow full throttle?
				if( retries > 10 ) 
					usleep( 20000 );
				else if( retries > 250 )
					break;
				continue;
			}
			FERROR( "[SocketWriteNOSSL] Failed to write: %d, %s\n", errno, strerror( errno ) );
			//socket can not be closed here, because http.c:1504 will fail
			//we have to rely on the reaper thread to release stale sockets
			break;
		}
	}
	while( written < length );

	DEBUG("[SocketWriteNOSSL] end write %d/%ld (had %d retries)\n", written, length, retries );
	return written;
}

/**
 * Write data to socket (SSL)
 *
 * @param sock pointer to Socket on which write function will be called
 * @param data pointer to char table which will be send
 * @param length length of data which will be send
 * @return number of bytes writen to socket
 */
FLONG SocketWriteSSL( Socket* sock, char* data, FLONG length )
{
	if( length < 1 )
	{
		return -1;
	}

	FLONG left = length;
	FLONG written = 0;
	int res = 0;

	FLONG bsize = left;

	int err = 0;		
	int counter = 0;

	while( written < length )
	{
		if( (bsize + written) > length ) bsize = length - written;

		if( sock->s_Ssl == NULL )
		{
			FERROR( "[SocketWriteSSL] The ssl connection was dropped on this file descriptor!\n" );
			break;
		}

		res = SSL_write( sock->s_Ssl, data + written, bsize );

		if( res <= 0 )
		{
			err = SSL_get_error( sock->s_Ssl, res );

			switch( err )
			{
				// The operation did not complete. Call again.
				case SSL_ERROR_WANT_WRITE:
				{
					break;
				}
				case SSL_ERROR_SSL:
				{
					FERROR("[SocketWriteSSL] Cannot write. Error %d stringerr: %s wanted to sent: %ld fullsize: %ld\n", err, strerror( err ), bsize, length );
					if( counter++ > 3 )
					{
						return 0;
					}
					break;
				}
				default:
				{
					FERROR("[SocketWriteSSL] Cannot write. Error %d stringerr: %s wanted to sent: %ld fullsize: %ld\n", err, strerror( err ), bsize, length );
					return 0;
				}
			}
		}
		else
		{	
			written += res;
		}
	}
	return written;
}

//
// Deflate compression
//

#define windowBits 15
#define GZIP_ENCODING 16
//#define CHUNK_LEN 8096
#define CHUNK_LEN 0x4000

inline static void compressDataDeflate( char *source, FQUAD sourceLen, unsigned char *storePtr, FQUAD *outputLen )
{
	FQUAD compressedLength = 0;
	
	z_stream strm;
	strm.zalloc = Z_NULL;
	strm.zfree  = Z_NULL;
	strm.opaque = Z_NULL;
	
	deflateInit(&strm, Z_DEFAULT_COMPRESSION);
	
	//deflateInit2( &strm, Z_DEFAULT_COMPRESSION, Z_DEFLATED,
	//	windowBits , 8,	//| GZIP_ENCODING
	//	Z_DEFAULT_STRATEGY );
	
	//DEBUG("start compressDataDeflate\n");
	
	unsigned char *dataPtr = (unsigned char *) source;
	FQUAD dataLeft = sourceLen;

	int flushFlag = 0;
	strm.next_in  = (Bytef*)dataPtr;
    strm.next_out = storePtr;
	
	while( dataLeft > 0 )
	{
		int dataIn = 0;
		if( dataLeft < CHUNK_LEN )
		{
			//printf("finish will be used\n");
			flushFlag = Z_FULL_FLUSH;// Z_FINISH;
			dataIn = dataLeft;
		}
		else
		{
			//printf("flush\n");
			flushFlag = Z_PARTIAL_FLUSH;
			dataIn = CHUNK_LEN;
		}
		strm.avail_in = dataIn;
		strm.avail_out = CHUNK_LEN;
		
		int err = deflate(&strm, flushFlag );
		dataLeft -= dataIn;
		
		//unsigned long tin = (unsigned long) strm.total_in;
		//unsigned long tlen = (unsigned long)sourceLen;
		//DEBUG(" strm.total_in %ld <= http->http_SizeOfContent %ld  stored: %d\n", tin, tlen, (CHUNK_LEN - strm.avail_out) );
	}
	strm.avail_in = 0;
	int err = deflate(&strm, Z_FINISH );
	compressedLength = strm.total_out;
	
	deflateEnd( &strm );
	*outputLen = compressedLength;
}

/**
 * Write data to socket (NOSSL)
 *
 * @param sock pointer to Socket on which write function will be called
 * @param type type of compression
 * @param data pointer to char table which will be send
 * @param length length of data which will be send
 * @return number of bytes writen to socket
 */
FLONG SocketWriteCompressionNOSSL( Socket* sock, int type, char* data, FLONG length )
{
	if( length < 1 )
	{
		//FERROR("Socket is NULL or length < 1: %lu\n", length );
		return -1;
	}
	
	unsigned char outputBuf[ CHUNK_LEN ];
	
	z_stream strm;
	strm.zalloc = Z_NULL;
	strm.zfree  = Z_NULL;
	strm.opaque = Z_NULL;
	
	deflateInit(&strm, Z_DEFAULT_COMPRESSION);
	
	unsigned char *dataPtr = (unsigned char *) data;
	FQUAD dataLeft = length;

	int flushFlag = 0;
	strm.next_in  = (Bytef*)dataPtr;
	
	while( dataLeft > 0 )
	{
		int dataIn = 0;
		if( dataLeft < CHUNK_LEN )
		{
			//printf("finish will be used\n");
			flushFlag = Z_FULL_FLUSH;// Z_FINISH;
			dataIn = dataLeft;
		}
		else
		{
			//printf("flush\n");
			flushFlag = Z_PARTIAL_FLUSH;
			dataIn = CHUNK_LEN;
		}
		strm.next_out = outputBuf;
		strm.avail_in = dataIn;
		strm.avail_out = CHUNK_LEN;
		
		int err = deflate(&strm, flushFlag );
		dataLeft -= dataIn;
		int have = (CHUNK_LEN - strm.avail_out);
		
		if( have > 0 )
		{
			send( sock->fd, outputBuf, have, MSG_DONTWAIT );
		}
	}
	strm.avail_in = 0;
	int err = deflate(&strm, Z_FINISH );

	deflateEnd( &strm );

	DEBUG("[SocketWriteNOSSL] end write %ld\n", strm.total_in );
	return strm.total_in;
}

/**
 * Write data to socket (SSL)
 *
 * @param sock pointer to Socket on which write function will be called
 * @param type type of compression
 * @param data pointer to char table which will be send
 * @param length length of data which will be send
 * @return number of bytes writen to socket
 */
FLONG SocketWriteCompressionSSL( Socket* sock, int type, char* data, FLONG length )
{
	if( length < 1 )
	{
		return -1;
	}

	unsigned char outputBuf[ CHUNK_LEN ];
	
	z_stream strm;
	strm.zalloc = Z_NULL;
	strm.zfree  = Z_NULL;
	strm.opaque = Z_NULL;
	
	deflateInit(&strm, Z_DEFAULT_COMPRESSION);
	
	unsigned char *dataPtr = (unsigned char *) data;
	FQUAD dataLeft = length;

	int flushFlag = 0;
	strm.next_in  = (Bytef*)dataPtr;
	
	while( dataLeft > 0 )
	{
		int dataIn = 0;
		if( dataLeft < CHUNK_LEN )
		{
			//printf("finish will be used\n");
			flushFlag = Z_FULL_FLUSH;// Z_FINISH;
			dataIn = dataLeft;
		}
		else
		{
			//printf("flush\n");
			flushFlag = Z_PARTIAL_FLUSH;
			dataIn = CHUNK_LEN;
		}
		strm.next_out = outputBuf;
		strm.avail_in = dataIn;
		strm.avail_out = CHUNK_LEN;
		
		int err = deflate(&strm, flushFlag );
		dataLeft -= dataIn;
		int have = (CHUNK_LEN - strm.avail_out);
		
		if( have > 0 )
		{
			int counter = 0;
			int res = SSL_write( sock->s_Ssl, outputBuf, have );

			if( res <= 0 )
			{
				err = SSL_get_error( sock->s_Ssl, res );
				switch( err )
				{
					// The operation did not complete. Call again.
					case SSL_ERROR_WANT_WRITE:
					{
						break;
					}
					case SSL_ERROR_SSL:
					{
						FERROR("[SocketWriteSSL] Cannot write. Error %d stringerr: %s  fullsize: %ld\n", err, strerror( err ), length );
						if( counter++ > 3 )
						{
							return 0;
						}
						break;
					}
					default:
					{
						FERROR("[SocketWriteSSL] Cannot write. Error %d stringerr: %s fullsize: %ld\n", err, strerror( err ), length );
						return 0;
					}
				}
			}
		}
	}
	strm.avail_in = 0;
	int err = deflate(&strm, Z_FINISH );

	deflateEnd( &strm );
	
	return strm.total_in;
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
 * Close socket and release it (NOSSL)
 *
 * @param sock pointer to Socket
 */
void SocketDeleteNOSSL( Socket* sock )
{
	if( sock == NULL || sock->fd <= 0 )
	{
		FERROR("[SocketDeleteNOSSL] sock == NULL!\n");
		return;
	}

	// default
	if( sock->fd )
	{
		fcntl( sock->fd, F_SETFD, FD_CLOEXEC );
		
		int optval;
		socklen_t optlen = sizeof( optval );
		optval = 0;
		optlen = sizeof(optval);
		
		setsockopt( sock->fd, SOL_SOCKET, SO_KEEPALIVE, &optval, optlen );
		
		int e = 0;
		shutdown( sock->fd, SHUT_RDWR );

		e = close( sock->fd );
		DEBUG("[SocketDeleteNOSSL] socked closed: %d\n", sock->fd );
		sock->fd = 0;
	}
	FFree( sock );
}

/**
 * Close socket and release it
 *
 * @param sock pointer to Socket (SSL)
 */
void SocketDeleteSSL( Socket* sock )
{
	if( sock == NULL || sock->fd <= 0 )
	{
		FERROR("Socket: sock == NULL!\n");
		return;
	}

	DEBUG("[SocketDeleteSSL] ssl\n");
	if( sock->s_Ssl )
	{
		int ret, ssl_r;
		int err;
		ERR_clear_error();
		switch( ( ret = SSL_shutdown( sock->s_Ssl ) ) )
		{
			case 1:
				DEBUG("[SocketDeleteSSL] Ret 1\n");
				// ok 
				break;
			case 0:
				DEBUG("[SocketDeleteSSL] Ret 0\n");
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
							// TODO: Why have this?
							/*do
							{
								FERROR( "[SocketDeleteSSL] SSL_ERROR_SYSCALL err: %d error message: %s\n", err, ERR_error_string(err, NULL) );
							}
							while( ( err = ERR_get_error() ) );*/
							break;
						}
						else if( errno != 0 )
						{
							switch( errno )
							{
								case EPIPE:
								case ECONNRESET:
									break;
								default:
									FERROR( "[SocketDeleteSSL] SSL_ERROR_SYSCALL errno != 0 err: %d error message: %s\n", err, ERR_error_string(err, NULL) );
									break;
							}
						}
						break;
					default:
						// TODO: Why do we have this?
						/*while( ( err = ERR_get_error() ) )
						{
							FERROR( "[SocketDeleteSSL] default err: %d error message: %s\n", err, ERR_error_string(err, NULL) );
						}*/
						break;
				}
		}
		
		SSL_free( sock->s_Ssl );
		sock->s_Ssl = NULL;
	}

	if( sock->s_Ctx )
	{
		SSL_CTX_free( sock->s_Ctx );
	}
	
	if( sock->s_BIO )
	{
		//DEBUG("[SocketClose] BIO free\n");
		BIO_free( sock->s_BIO );;
	}
	sock->s_BIO = NULL;
	
	// default
	if( sock->fd )
	{
		fcntl( sock->fd, F_SETFD, FD_CLOEXEC );
		
		int optval;
		socklen_t optlen = sizeof( optval );
		optval = 0;
		optlen = sizeof( optval );
		setsockopt( sock->fd, SOL_SOCKET, SO_KEEPALIVE, &optval, optlen );
		
		int e = 0;
		shutdown( sock->fd, SHUT_RDWR );

		e = close( sock->fd );
		DEBUG("[SocketDeleteSSL] socked closed: %d\n", sock->fd );
		sock->fd = 0;
	}
	FFree( sock );
}

