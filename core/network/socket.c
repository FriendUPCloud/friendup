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

#include "network/socket.h"
#include <valgrind/memcheck.h>

//
// certificate paths
//

extern char RSA_SERVER_CERT[  ];
extern char RSA_SERVER_KEY[  ];
extern char RSA_SERVER_CA_CERT[  ];
extern char RSA_SERVER_CA_PATH[  ];

// Enable/disabled SSL

//BOOL SSLEnabled;

extern pthread_mutex_t sslmut;

//
// Open a new socket on the specified port.
// Returns structure on success and NULL on failure.
//

static int ssl_session_ctx_id = 1;
static int ssl_sockopt_on = 1;

Socket* SocketOpen( BOOL ssl, unsigned short port, int type )
{
	Socket *sock = NULL;
	int fd = socket( AF_INET6, SOCK_STREAM | SOCK_NONBLOCK, 0 );
	if( fd == -1 )
	{
		ERROR( "[SOCKET] ERROR socket failed\n" );
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
			ERROR("Cannot allocate memory for socket!\n");
			return NULL;
		}
		sock->s_SSLEnabled = ssl;
		
		if( sock->s_SSLEnabled == TRUE )
		{	
			sock->s_VerifyClient = TRUE;
			
			INFO("SSL Connection enabled\n");
			
			// Create a SSL_METHOD structure (choose a SSL/TLS protocol version)
			//sock->s_Meth = SSLv3_method();
			sock->s_Meth = SSLv23_server_method();
 
			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
 
			if ( sock->s_Ctx == NULL )
			{
				ERROR( "SSLContext error %s\n", (char *)stderr );
				close( fd );
				SocketFree( sock );
				return NULL;
			}
 
			if( sock->s_VerifyClient == TRUE )
			{
				// Load the RSA CA certificate into the SSL_CTX structure 
				if ( !SSL_CTX_load_verify_locations( sock->s_Ctx, RSA_SERVER_CA_CERT, RSA_SERVER_CA_PATH )) 
				{
					ERROR( "Could not verify cert CA: %s CA_PATH: %s", RSA_SERVER_CA_CERT, RSA_SERVER_CA_PATH );
					close( fd );
					SocketFree( sock );
					return NULL;
				}
				
				// Set to require peer (client) certificate verification 
				SSL_CTX_set_verify( sock->s_Ctx, SSL_VERIFY_NONE, NULL );
				
				// Set the verification depth to 1 
				SSL_CTX_set_verify_depth( sock->s_Ctx ,1);
			}
			
			// Load the server certificate into the SSL_CTX structure 
			if( SSL_CTX_use_certificate_file( sock->s_Ctx, RSA_SERVER_CERT, SSL_FILETYPE_PEM ) <= 0 ) 
			{
				ERROR("UseCertyficate file fail : %s\n", RSA_SERVER_CERT );
				SocketFree( sock );
				close( fd );
				return NULL;
			}
 
			// Load the private-key corresponding to the server certificate 
			if( SSL_CTX_use_PrivateKey_file( sock->s_Ctx, RSA_SERVER_KEY, SSL_FILETYPE_PEM ) <= 0 ) 
			{
				ERROR( "SSLuseprivatekeyfile fail %s\n", (char *)stderr);
				close( fd );
				SocketFree( sock );
				return NULL;
			}
			
 
			// Check if the server certificate and private-key matches
			if( !SSL_CTX_check_private_key( sock->s_Ctx ) ) 
			{
				ERROR("Private key does not match the certificate public key\n");
				close( fd );
				SocketFree( sock );
				return NULL;
			}
			
			// Lets not block and lets allow retries!
			SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
			SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
			SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET );
		    SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
		}
		
		if( setsockopt( fd, SOL_SOCKET, SO_REUSEADDR, (char*)&ssl_sockopt_on, sizeof(ssl_sockopt_on) ) < 0 )
		{
			ERROR( "[SOCKET] ERROR setsockopt(SO_REUSEADDR) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}
		
		struct timeval t = { 60, 0 };
		
		if( setsockopt( fd, SOL_SOCKET, SO_SNDTIMEO, ( void *)&t, sizeof( t ) ) < 0 )
		{
			ERROR( "[SOCKET] ERROR setsockopt(SO_SNDTIMEO) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}
		
		if( setsockopt( fd, SOL_SOCKET, SO_RCVTIMEO, ( void *)&t, sizeof( t ) ) < 0 )
		{
			ERROR( "[SOCKET] ERROR setsockopt(SO_RCVTIMEO) failed\n");
			close( fd );
			SocketFree( sock );
			return NULL;
		}

		struct sockaddr_in6 server;
		memset( &server, 0, sizeof( server ) );
		//server.sin6_len = sizeof( server );
		server.sin6_family = AF_INET6;
		server.sin6_addr = in6addr_any;//inet_addr("0.0.0.0");//inet_pton("0.0.0.0");//in6addr_any;
		server.sin6_port = ntohs( port );

		if( bind( fd, (struct sockaddr*)&server, sizeof( server ) ) == -1 )
		{
			ERROR( "[SOCKET] ERROR bind failed\n" );
			SocketClose( sock );
			return NULL;
		}
		
		sock->fd = fd;
		//SSL_set_fd( sock->s_Ssl, sock->fd );
		
	}
	else
	{	// connect to server socket
		if( ( sock = (Socket*) calloc( 1, sizeof( Socket ) ) ) != NULL )
		{
			sock->fd = fd;
			sock->port = port;
		}
		else
		{
			SocketClose( sock );
			ERROR("Cannot allocate memory for socket!\n");
			return NULL;
		}
		
		if( sock->s_SSLEnabled == TRUE )
		{
			sock->s_Meth = SSLv23_client_method();
			if( sock->s_Meth  == NULL )
			{
				ERROR("Cannot create SSL client method!\n");
				SocketClose( sock );
				return NULL;
			}
 
			// Create a SSL_CTX structure 
			sock->s_Ctx = SSL_CTX_new( sock->s_Meth );
			if( sock->s_Ctx  == NULL )
			{
				ERROR("Cannot create SSL context!\n");
				SocketClose( sock );
				return NULL;
			}
			
			SSL_CTX_set_mode( sock->s_Ctx, SSL_MODE_ENABLE_PARTIAL_WRITE | SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER | SSL_MODE_AUTO_RETRY );
			SSL_CTX_set_session_cache_mode( sock->s_Ctx, SSL_SESS_CACHE_BOTH ); // for now
			SSL_CTX_set_options( sock->s_Ctx, SSL_OP_NO_SSLv2 | SSL_OP_NO_TICKET );
		    SSL_CTX_set_session_id_context( sock->s_Ctx, (void *)&ssl_session_ctx_id, sizeof(ssl_session_ctx_id) );
						
			sock->s_Ssl = SSL_new( sock->s_Ctx );
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

	DEBUG( "Create mutex\n" );
	pthread_mutex_init( &sock->mutex, NULL );

	return sock;
}

//
// Make the socket listen for incoming connections
// Returns true on success and false on failure.
//

int SocketListen( Socket *sock )
{
	if( sock == NULL )
	{
		return 0;
	}

	if( listen( sock->fd, SOMAXCONN ) < 0 )
	{
		ERROR( "[SOCKET] ERROR listen failed\n" );
		close( sock->fd );
		return 0;
	}
	sock->listen = TRUE;
	return 1;
}

//
//
//

inline int LoadCertificates(SSL_CTX* ctx, char* CertFile, char* KeyFile)
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
        DEBUG( "Private key does not match the public certificate\n");
		return 3;
    }
    return 0;
}

//
// connect to server
//

#define h_addr h_addr_list[0] // for backward compatibility 

int SocketConnect( Socket* sock, const char *host )
{
	if( sock == NULL )
	{
		ERROR("[SocketConnect] Socket is NULL..\n");
		return 0;
	}
	
	if( sock->s_SSLEnabled == TRUE )
	{
		LoadCertificates( sock->s_Ctx, RSA_SERVER_CERT, RSA_SERVER_KEY );
	}

	int    sd=-1, rc, bytesReceived=0;
	char   servport[ 10 ] = "0";
	struct in6_addr serveraddr;
	struct addrinfo hints, *res=NULL;

	memset( &hints, 0x00, sizeof( hints ) );
	hints.ai_flags    = AI_NUMERICSERV;
	hints.ai_family   = AF_INET6;
	hints.ai_socktype = SOCK_STREAM;

	sprintf( servport, "%d", sock->port );

	rc = inet_pton(AF_INET, host, &serveraddr);
	if (rc == 1)    /* valid IPv4 text address? */
	{
		hints.ai_family = AF_INET;
		hints.ai_flags |= AI_NUMERICHOST;
	}
	else
	{
		rc = inet_pton(AF_INET6, host, &serveraddr);
		if ( rc == 1 ) 
		{
			hints.ai_family = AF_INET6;
			hints.ai_flags |= AI_NUMERICHOST;
		}
	}
	
	DEBUG("ServiceClient: connect to %s on port %s\n", host, servport );

	// Get the address information for the server using getaddrinfo()
	rc = getaddrinfo( host, servport, &hints, &res);
	if (rc != 0)
	{
		ERROR("Host not found --> %s\n", gai_strerror(rc));
		if (rc == EAI_SYSTEM)
		{
			ERROR("getaddrinfo() failed");
		}
		return 2;
	}

	// Use the connect function to establish a connection
	rc = connect( sock->fd, res->ai_addr, res->ai_addrlen );
	if( rc == -1 )
	{
		ERROR("connect() to host '%s' failed\n", host );
		return -1;
	}
	
	if( sock->s_SSLEnabled == TRUE )
	{
		X509                *cert = NULL;
		X509_NAME       *certname = NULL;
		
		if ( SSL_connect( sock->s_Ssl ) != 1 )
		{
			ERROR("Cannot create SSL connection!\n");
			return -1;
		}
		
		cert = SSL_get_peer_certificate( sock->s_Ssl );
		if (cert == NULL)
		{
			printf( "Error: Could not get a certificate from: \n" );
		}
		else
		{
			printf( "Retrieved the server's certificate from: .\n");
		}
		// ---------------------------------------------------------- *
		// extract various certificate information                    *
		// -----------------------------------------------------------
		certname = X509_NAME_new( );
		certname = X509_get_subject_name( cert );

		// ---------------------------------------------------------- *
		// display the cert subject here                              *
		// -----------------------------------------------------------
		printf( "Displaying the certificate subject data:\n");
		//X509_NAME_print_ex(outbio, certname, 0, 0);
		printf( "\n" );
	}
	
	return 0;
}

//
// Make a socket blocking/non-blocking
// Returns true on success and false on failure.
//

int SocketSetBlocking( Socket* sock, BOOL block )
{
 	int flags, s;
	
	if( sock == NULL )
	{
		ERROR("Cannot set socket as blocking, socket = NULL!!\n");
		return 0;
	}

	
	flags = fcntl( sock->fd, F_GETFL, 0 );
	if( flags < 0 )
	{
		ERROR( "[SOCKET] ERROR fcntl\n" );
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

	sock->nonBlocking = !block;
	
	s = fcntl( sock->fd, F_SETFL, flags );
	if( s < 0 )
	{
		ERROR( "[SOCKET] ERROR fcntl\n" );
		return 0;
	}
	return 1;
}


//
// Accepts an incoming connection
// Returns a new Socket_t object if the connection was accepted.
// Returns NULL if the connection was rejected, or an error occured.
//

Socket* SocketAccept( Socket* sock )
{
	// Don't bother with non-listening sockets
	if( !sock )
	{
		ERROR("[SocketAccept] Cannot accept socket set as NULL\n");
		return NULL;
	}
	
	if( sock->s_SSLEnabled )
	{
		if( !sock->s_Ctx )
		{
			ERROR( "[SocketAccept] SSL not properly setup on socket!\n" );
			return NULL;
		}
	}
	
	// Accept
	struct sockaddr_in6 client;
	socklen_t clientLen = sizeof( client );
               
	DEBUG( "[SocketAccept] Accepting on socket\n" );
	int fd = accept( sock->fd, ( struct sockaddr* )&client, &clientLen );
	DEBUG( "[SocketAccept] Done accepting file descriptor (%d, %s)\n", errno, strerror( errno ) );

	Socket* incoming = (Socket*)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		incoming->fd = fd;
		incoming->port = ntohs( client.sin6_port );
		incoming->ip = client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
	}
	else
	{
		ERROR("[SocketAccept] Cannot allocate memory for socket!\n");
		return NULL;
	}
	
	if( sock->s_SSLEnabled == TRUE )
	{
		//DEBUG( "Going into SSL\n" );
		incoming->s_Ssl = SSL_new( sock->s_Ctx ); 
		//DEBUG( "We are into SSL\n" );
		if( incoming->s_Ssl == NULL )
		{
			ERROR("[SocketAccept] Cannot accept SSL connection\n");
			shutdown( fd, SHUT_RDWR );
			close( fd );
			free( incoming );
			return NULL;
		}

		// Make a unique session id here
		/*const unsigned char *unique = FCalloc( 255, sizeof( const unsigned char ) );
		sprintf( unique, "friendcore_%p%d", incoming, rand()%999+rand()%999 );
		SSL_set_session_id_context( sock->s_Ssl, unique, strlen( unique ) );
		FFree( unique );*/

		//DEBUG( "Further\n" );
		int srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
		if( srl != 1 )
		{
			ERROR( "[SocketAccept] Could not set fd\n" );
			shutdown( fd, SHUT_RDWR );
			close( fd );
			SSL_free( incoming->s_Ssl );
			free( incoming );
			return NULL;
		}
		
		int err = 0;
		while( 1 )
		{
			if( pthread_mutex_lock( &incoming->mutex ) == 0 )
			{
				err = SSL_accept( incoming->s_Ssl );
				pthread_mutex_unlock( &incoming->mutex );
			
				if( err <= 0 )
				{
					int error = SSL_get_error( incoming->s_Ssl, err );
				
					ERROR( "[SocketAccept] We experienced an error %d.\n", error );
				
					switch( error )
					{
						case SSL_ERROR_NONE:
							// NO error..
							ERROR( "[SocketAccept] No error\n" );
							return incoming;
						case SSL_ERROR_ZERO_RETURN:
							ERROR("[SocketAccept] SSL_ACCEPT error: Socket closed.\n" );
							shutdown( fd, SHUT_RDWR );
							close( fd );
							SSL_free( incoming->s_Ssl );
							free( incoming );
							return NULL;
						case SSL_ERROR_WANT_READ:
							ERROR( "[SocketAccept] Error want read, retrying\n" );
							shutdown( fd, SHUT_RDWR );
							close( fd );
							SSL_free( incoming->s_Ssl );
							free( incoming );
							return NULL;
						case SSL_ERROR_WANT_WRITE:
							ERROR( "[SocketAccept] Error want write, retrying\n" );
							break;
						case SSL_ERROR_WANT_ACCEPT:
							ERROR( "[SocketAccept] Want accept\n" );
							break;
						case SSL_ERROR_WANT_X509_LOOKUP:
							ERROR( "[SocketAccept] Want 509 lookup\n" );
							break;
						case SSL_ERROR_SYSCALL:
							ERROR( "[SocketAccept] Error syscall!\n" );
							shutdown( fd, SHUT_RDWR );
							close( fd );
							SSL_free( incoming->s_Ssl );
							free( incoming );
							return NULL;
						default:
							ERROR( "[SocketAccept] Other error.\n" );
							shutdown( fd, SHUT_RDWR );
							close( fd );
							SSL_free( incoming->s_Ssl );
							free( incoming );
							return NULL;
					}
				}
				else break;
			}
		}
	}

	DEBUG( "[SocketAccept] Accepting incoming!\n" );
	return incoming;
}

//
// Accepts an incoming connection
// Returns a new Socket_t object if the connection was accepted.
// Returns NULL if the connection was rejected, or an error occured.
//

Socket* SocketAcceptPair( Socket* sock, struct AcceptPair *p )
{
	// Don't bother with non-listening sockets
	if( !sock )
	{
		ERROR("[SocketAcceptPair] Cannot accept socket set as NULL\n");
		return NULL;
	}
	
	if( sock->s_SSLEnabled )
	{
		if( !sock->s_Ctx )
		{
			ERROR( "[SocketAcceptPair] SSL not properly setup on socket!\n" );
			return NULL;
		}
	}
	
	int fd = p->fd;
	
	Socket* incoming = (Socket*)FCalloc( 1, sizeof( Socket ) );
	if( incoming != NULL )
	{
		incoming->fd = fd;
		incoming->port = ntohs( p->client.sin6_port );
		incoming->ip = p->client.sin6_addr;
		incoming->s_SSLEnabled = sock->s_SSLEnabled;
	}
	else
	{
		ERROR("[SocketAcceptPair] Cannot allocate memory for socket!\n");
	}
	
	if( sock->s_SSLEnabled == TRUE )
	{
		incoming->s_Ssl = SSL_new( sock->s_Ctx );
		 
		if( incoming->s_Ssl == NULL )
		{
			ERROR("[SocketAcceptPair] Cannot accept SSL connection\n");
			shutdown( fd, SHUT_RDWR );
			close( fd );
			free( incoming );
			return NULL;
		}

		//DEBUG( "Further\n" );
		int srl = SSL_set_fd( incoming->s_Ssl, incoming->fd );
		if( srl != 1 )
		{
			ERROR( "[SocketAcceptPair] Could not set fd\n" );
			shutdown( fd, SHUT_RDWR );
			close( fd );
			SSL_free( incoming->s_Ssl );
			free( incoming );
			return NULL;
		}
		
		 // setup SSL session 
		int err = 0;
		while( 1 )
		{
			//DEBUG( "Readying ssl incoming\n" );
			if( pthread_mutex_lock( &incoming->mutex ) == 0 )
			{
				SSL_set_accept_state( incoming->s_Ssl );
				err = SSL_accept( incoming->s_Ssl );
				pthread_mutex_unlock( &incoming->mutex );
			}
			else
			{
				shutdown( fd, SHUT_RDWR );
				close( fd );
				SSL_free( incoming->s_Ssl );
				free( incoming );
				return NULL;
			}
			
			if( err <= 0 )
			{
				int error = SSL_get_error( incoming->s_Ssl, err );
				
				switch( error )
				{
					case SSL_ERROR_NONE:
						// NO error..
						ERROR( "[SocketAcceptPair] No error\n" );
						break;
					case SSL_ERROR_ZERO_RETURN:
						ERROR("[SocketAcceptPair] SSL_ACCEPT error: Socket closed.\n" );
						SocketClose( incoming );
						return NULL;
					case SSL_ERROR_WANT_READ:
						ERROR( "[SocketAcceptPair] Error want read.\n" );
						SocketClose( incoming );
						return NULL;
					case SSL_ERROR_WANT_WRITE:
						ERROR( "[SocketAcceptPair] Error want write, retrying\n" );
						break;
					case SSL_ERROR_WANT_ACCEPT:
						ERROR( "[SocketAcceptPair] Want accept\n" );
						SocketClose( incoming );
						return NULL;
					case SSL_ERROR_WANT_X509_LOOKUP:
						ERROR( "[SocketAcceptPair] Want 509 lookup\n" );
						break;
					case SSL_ERROR_SYSCALL:
						ERROR( "[SocketAcceptPair] Error syscall.\n" ); //. Goodbye! %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
						SocketClose( incoming );
						return NULL;
					case SSL_ERROR_SSL:
						ERROR( "[SocketAcceptPair] SSL_ERROR_SSL: %s.\n", ERR_error_string( ERR_get_error(), NULL ) );
						SocketClose( incoming );
						return NULL;
				}
			}
			else break;
		}
	}

	DEBUG( "[SocketAcceptPair] Accepting incoming!\n" );
	return incoming;
}

//
// Read data to the socket
// Returns 0 if ok
//

int SocketRead( Socket* sock, char* data, unsigned int length, unsigned int pass )
{
	if( sock == NULL )
	{
		ERROR("Cannot read from socket, socket = NULL!\n");
		return 0;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		unsigned int read = 0;
		int res = 0, err = 0, buf = length;
		
		do
		{
			//INFO( "[SocketRead] Start of the voyage.. %p\n", sock );
			if( pthread_mutex_lock( &sock->mutex ) == 0 )
			{
				if( read + buf > length ) buf = length - read;
				if( ( res = SSL_read( sock->s_Ssl, data + read, buf ) ) >= 0 )
				{
					read += res;
				}
				//INFO( "[SocketRead] Tried to read %d bytes (%d total read, %d pending).\n%.*s\n", res, read, SSL_pending( sock->s_Ssl ), read, data );
				//INFO( "[SocketRead] Read %d/%d\n", read, length );
				pthread_mutex_unlock( &sock->mutex );	
			}
			else
			{
				//DEBUG( "[SocketRead] Could not read mutex!\n" );
				return 0;
			}
			
			if( res <= 0 )
			{
				err = SSL_get_error( sock->s_Ssl, res );
				switch( err )
				{
					// The TLS/SSL I/O operation completed. 
					case SSL_ERROR_NONE:
						//ERROR( "[SocketRead] Completed successfully.\n" );
						return read;
					// The TLS/SSL connection has been closed. Goodbye!
					case SSL_ERROR_ZERO_RETURN:
						//ERROR( "[SocketRead] The connection was closed.\n" );
						return read;
					// The operation did not complete. Call again.
					case SSL_ERROR_WANT_READ:
						if( read > 0 ) return read;
						usleep( 0 );
						continue;
					// The operation did not complete. Call again.
					case SSL_ERROR_WANT_WRITE:
						//ERROR( "[SocketRead] Want write.\n" );
						return read;
					case SSL_ERROR_SYSCALL:
						return read;
					default:
						usleep( 0 );
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
				if( read >= length )
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
				if( errno == 11 && retries++ < 25 )
				{
					// Approx successful header
					usleep( 0 );
					ERROR( "[SocketRead] Resource temporarily unavailable.. Read %d/%d (retries %d)\n", read, length, retries );
					continue;
				}
				DEBUG( "[SocketRead] Read %d/%d\n", read, length );
				return read;
			}
			DEBUG( "[SocketRead] Read %d/%d\n", read, length );
		}
	    DEBUG( "[SocketRead] Done reading %d/%d (errno: %d)\n", read, length, errno );
		return read;
	}
}

//
// Write data to the socket
// Returns true on success and false on failure.
//

int SocketWrite( Socket_t* sock, char* data, unsigned int length )
{
	if( sock->s_SSLEnabled == TRUE )
	{
		//INFO( "SSL Write length: %d (sock: %p)\n", length, sock );
		
		int left = length;
		unsigned int written = 0;
		int res = 0;
		int errors = 0;
		
		int retries = 0;
		
		unsigned int bsize = 1024;
		
		int err = 0;		
		// Prepare to get fd state
		struct timeval timeoutValue = { 1, 0 };
		int sResult = 0; 
		fd_set fdstate;
		
		while( written < length )
		{
			if( bsize + written > length ) bsize = length - written;
			
			if( pthread_mutex_lock( &sock->mutex ) == 0 )
			{
				res = SSL_write( sock->s_Ssl, data + written, bsize );
				pthread_mutex_unlock( &sock->mutex );
				
				if( res < 0 )
				{
					FD_ZERO( &fdstate );
					FD_SET( sock->fd, &fdstate );
					
					err = SSL_get_error( sock->s_Ssl, res );
					switch( err )
					{
						// The operation did not complete. Call again.
						case SSL_ERROR_WANT_WRITE:
						{
							sResult = select( sock->fd + 1, NULL, &fdstate, NULL, &timeoutValue );
							int ch = FD_ISSET( sock->fd, &fdstate );
							// We're not gonna write now..
							if( ch == 0 ) usleep( 20000 );
							break;
						}
						default: return 0;
					}
				}
				else
				{
					retries = 0;
					written += res;
					DEBUG( "[SocketWrite] Wrote %d/%d\n", written, length );
				}	
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
				DEBUG( "Failed to write: %d, %s\n", errno, strerror( errno ) );
				break;
			}
		}
		while( written < length );
		
		DEBUG("end write %d/%d (had %d retries)\n", written, length, retries );
		return written;
	}
}

//
// Free the entire write buffer queue
//

void SocketAbortWrite( Socket* sock )
{
	if( sock == NULL )
	{
		return;
	}

}

//
// Forcefully close a socket and free the socket object.
//

void SocketFree( Socket *sock )
{
	if( !sock )
	{
		ERROR("Passed socket structure is empty\n");
		return;
	}
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
	
	pthread_mutex_destroy( &sock->mutex );
	
	if( sock )
	{
		free( sock );
	}
}

//
//
//

void SocketClose( Socket* sock )
{
	if( sock == NULL )
	{
		ERROR("Socket: sock == NULL!\n");
		return;
	}

	if( sock->s_SSLEnabled == TRUE )
	{
		if( pthread_mutex_lock( &sock->mutex ) == 0 )
		{
			if( sock->s_Ssl )
			{
				int err;
				while( SSL_shutdown( sock->s_Ssl ) == 0 )
				{
					usleep( 0 );
				}
				SSL_clear( sock->s_Ssl );
			}

			if( sock->fd ) 
			{
				shutdown( sock->fd, SHUT_RDWR );
				close( sock->fd );
				DEBUG( "[SocketClose] Closed socket fd.\n" );
			}
	
			// Finally free socket
			pthread_mutex_unlock( &sock->mutex );
			SocketFree( sock );
		}
	}
	// default
	else
	{
	    if( sock->fd )
	    {
	        shutdown( sock->fd, SHUT_RDWR );
    		close( sock->fd );
	    }
	    SocketFree( sock );
	}
	DEBUG( "[SocketClose] Freed socket.\n" );
}

//
// websocket close
//

void SocketWSClose( Socket* sock )
{
	if( sock == NULL )
	{
		ERROR("SocketWS: sock == NULL!\n");
		return;
	}
	FFree( sock );
}

