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
 *  HttpClient functions body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>
#include "http_client.h"
#include <util/buffered_string.h>

/**
 * Function create HttpClient call
 *
 * @param post set to TRUE if you want to use POST to send messages, otherwise FALSE
 * @param http2 set to http2 if true
 * @param param pointer to additional http tags (as string)
 * @param headers additional headers
 * @param content content of message
 * @return new HttpClient structure or NULL when problem appear
 */
HttpClient *HttpClientNew( FBOOL post, FBOOL http2, char *param, char *headers, char *content )
{
	HttpClient *c = NULL;
	
	if( ( c = FCalloc( 1, sizeof(HttpClient) ) ) != NULL )
	{
		char temp[ 2048 ];
		int size = 0;
		
		//POST /oauth/token HTTP/1.1
		if( http2 == TRUE )
		{
			if( post == TRUE )
			{
				size = snprintf( temp, 2048, "POST %s HTTP/2\n", param );
			}
			else
			{
				size = snprintf( temp, 2048, "GET %s HTTP/2\n", param );
			}
		}
		else
		{
			if( post == TRUE )
			{
				size = snprintf( temp, 2048, "POST %s HTTP/1.1\n", param );
			}
			else
			{
				size = snprintf( temp, 2048, "GET %s HTTP/1.1\n", param );
			}
		}
		
		c->hc_MainLine = StringDuplicateN( temp, size );
		c->hc_Headers = StringDuplicate( headers );
		if( content != NULL )
		{
			c->hc_Content = StringDuplicate( content );
		}
	}
	
	return c;
}

/**
 * Function delete HttpClient
 *
 * @param c pointer to HttpClient which will be deleted
 */
void HttpClientDelete( HttpClient *c )
{
	if( c != NULL )
	{
		int i;
		/*
		for( i=0 ; i < HTTP_HEADER_END ; i++ )
		{
			if( c->hc_Headers[ i ] != NULL )
			{
				FFree( c->hc_Headers[ i ] );
			}
		}*/
		
		if( c->hc_Content != NULL )
		{
			FFree( c->hc_Content );
		}
		
		if( c->hc_Headers != NULL )
		{
			FFree( c->hc_Headers );
		}
		
		if( c->hc_MainLine != NULL )
		{
			FFree( c->hc_MainLine );
		}
		FFree( c );
	}
}

#define h_addr h_addr_list[0]
#define HTTP_CLIENT_TIMEOUT 3

/**
 * Function calls other server by using HTTP call
 *
 * @param c pointer to HttpClient
 * @param host pointer to server name
 * @param port internet port number
 * @param secured set to TRUE if you want to use SSL
 * @return new BufferedString structure when success, otherwise NULL
 */
BufString *HttpClientCall( HttpClient *c, char *host, int port, FBOOL secured )
{
	struct hostent *server;
	struct sockaddr_in serv_addr;
	int sockfd = 0, bytes, sent, received = 0, total;
	
	BIO              *certbio = NULL;
	BIO               *outbio = NULL;
	X509                *cert = NULL;
	X509_NAME       *certname = NULL;
	const SSL_METHOD *method;
	SSL_CTX *ctx = 0;
	SSL *ssl = 0;
	
	BufString *bs = BufStringNew();
	if( bs != NULL )
	{
		DEBUG("Connection will be secured: %d\n", secured );
		if( secured == TRUE )
		{
			BIO_METHOD *biofile = BIO_s_file();
			certbio = BIO_new( biofile );
			outbio  = BIO_new_fp( stdout, BIO_NOCLOSE );
			
			//SSL_library_init();
			
			//OpenSSL_add_all_algorithms();  /* Load cryptos, et.al. */
			//SSL_load_error_strings();   /* Bring in and register error messages */
			method = TLSv1_2_client_method();  /* Create new client-method instance */

			if ( (ctx = SSL_CTX_new(method)) == NULL)
			{
				BIO_destroy_bio_pair( certbio );
				DEBUG("ssl context was not created\n");
				ERR_print_errors_fp(stderr);
				return bs;
			}
			
			SSL_CTX_set_options(ctx, SSL_OP_NO_SSLv2);
			ssl = SSL_new(ctx);
		}

		sockfd = socket(AF_INET, SOCK_STREAM, 0);
		if( sockfd < 0 )
		{
			DEBUG("Cannot create socket\n");
			goto client_error;
		}

		DEBUG("Do call: %s\n", host );
		server = gethostbyname( host );
		if( server == NULL )
		{
			FERROR("[HttpClientCall] Cannot reach server: %s\n", host );
			goto client_error;
		}

		memset( &serv_addr, 0, sizeof(serv_addr) );
		serv_addr.sin_family = AF_INET;
		serv_addr.sin_port = htons( port );	// default http port
		memcpy( &serv_addr.sin_addr.s_addr, server->h_addr, server->h_length );

		if( connect( sockfd,(struct sockaddr *)&serv_addr,sizeof(serv_addr) ) < 0 )
		{
			FERROR("ERROR connecting");
			goto client_error;
		}
		else
		{
			total = strlen( c->hc_MainLine );
			// temporary solution
			char *message = NULL;
			int messageSize = 512;
			int addsize = 0;
			
			DEBUG("Connected\n");
			
			/*
			POST /fcm/send HTTP/2
> Host: fcm.googleapis.com
> User-Agent: curl/7.63.0
> Accept: / * /
> Content-type: application/json
> Authorization: key=AAAAlbHMs9M:APA91bGlr6dtUg9USN_fEtT6x9HBtq2kAxuu8sZIMC7SlrXD4rUS9-6d3STODGJKunA08uWknKvwPotD2N-RK9aD9IKEhpbUJ7CwqkEmkW7Zp2qN9wUJKRy-cyivnvkOaq1XuDqNz21Q
> Content-Length: 600

request: POST /fcm/send HTTP/2
Host: fcm.googleapis.com
Accept: * / *
Content-type: application/json
Authorization: key=AAAAlbHMs9M:APA91bGlr6dtUg9USN_fEtT6x9HBtq2kAxuu8sZIMC7SlrXD4rUS9-6d3STODGJKunA08uWknKvwPotD2N-RK9aD9IKEhpbUJ7CwqkEmkW7Zp2qN9wUJKRy-cyivnvkOaq1XuDqNz21Q
Content-Length: 568
User-Agent: Friend/1.0.0

{   "registration_ids":["fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg"],     "notification": {   }, 		    "data": 	{"t":"notify","channel":"cont-65e9c8ad-1424-4c51-ad17-bde621feb283","content":"wfwefwef","title":"ztest50","extra":"{\\"roomId\\":\\"acc-b5de9510-8115-4ed6-bbf0-09a05c14645f\\",\\"msgId\\":\\"msg-0087bc36-3429-47b6-acc4-bf8f208f0d2c\\"}","application":"FriendChat","action":"register","id":740,"notifid":17824,"source":"notification"} 			      }

			 */
			
			if( c->hc_Headers == NULL && c->hc_Content == NULL )
			{
				message = FMalloc( messageSize );
				addsize = snprintf( message, messageSize, "%sHost: %s\nAccept: */*\nUser-Agent: Friend/1.0.0\r\n\r\n", c->hc_MainLine, host );
			}
			else if( c->hc_Headers == NULL )
			{
				int conlen = strlen( c->hc_Content );
				messageSize += conlen;
				message = FMalloc( messageSize );
				addsize = snprintf( message, messageSize, "%sHost: %s\nAccept: */*\nContent-Length: %d\nUser-Agent: Friend/1.0.0\r\n\r\n%s", c->hc_MainLine, host, conlen, c->hc_Content );
			}
			else if( c->hc_Content == NULL )
			{
				messageSize += strlen( c->hc_Headers );
				message = FMalloc( messageSize );
				addsize = snprintf( message, messageSize, "%sHost: %s\nAccept: */*\n%s\nUser-Agent: Friend/1.0.0\r\n\r\n", c->hc_MainLine, host, c->hc_Headers );
			}
			else
			{
				int conlen = strlen( c->hc_Content );
				messageSize += conlen + strlen( c->hc_Headers );
				message = FMalloc( messageSize );
				
				//conlen = 546;
				//printf("--->headerlen %lu conlen %lu\n\n\n\n\n\n", strlen( c->hc_Headers ), strlen( c->hc_Content ) );
				addsize = snprintf( message, messageSize, "%sHost: %s\nAccept: */*\nContent-Length: %d\nUser-Agent: curl/7.63.0\n%s\r\n\r\n%s", c->hc_MainLine, host, conlen, c->hc_Headers, c->hc_Content );
			}
			//int addsize = snprintf( message, sizeof(message), "GET /xml/ HTTP/1.1\nHost: freegeoip.net\nUser-Agent: curl/7.52.1\nAccept: */*\r\n\r\n" );

			DEBUG("[HttpClientCall] request: %s\n", message );
		
			if( secured == TRUE )
			{
				struct timeval timeout;      
				timeout.tv_sec = HTTP_CLIENT_TIMEOUT;
				timeout.tv_usec = 0;

				if( setsockopt( sockfd, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof(timeout) ) < 0 )
				{
			
				}
				
				SSL_set_fd( ssl, sockfd );
				
				DEBUG("[HttpClientCall] secured connect\n");

				if ( SSL_connect( ssl ) != 1 )
				{
					DEBUG("Error: Could not build a SSL session to: %s.\n", host );
					goto client_error;
				}
				else
				{
					DEBUG("Successfully enabled SSL/TLS session to: %s.\n", host );
				}
				
				DEBUG("[HttpClientCall] get cert\n");

				cert = SSL_get_peer_certificate( ssl );
				if( cert == NULL )
				{
					DEBUG( "Error: Could not get a certificate from: %s.\n", host);
				}
				else
				{
					DEBUG("Retrieved the server's certificate from: %s.\n", host);
				}

				//certname = X509_NAME_new();
				certname = X509_get_subject_name(cert);

				DEBUG("Displaying the certificate subject data:\n");
				X509_NAME_print_ex(outbio, certname, 0, 0);
				DEBUG( "WRITE MESSAGE VIA HTTP/S : %s\n", message );
				
				bytes = SSL_write( ssl, message, addsize );
				
				DEBUG("[HttpClientCall] sent bytes: %d\n", bytes );

				char response[ 2048 ];
				memset( response, 0, sizeof(response) );
				received = 0;

				while( TRUE ) 
				{
					bytes = SSL_read( ssl, response, sizeof(response) );
					if( bytes > 0 )
					{
						received += bytes;
						BufStringAddSize( bs, response, bytes );
						DEBUG("Bytes received: %d, response: %s\n", bytes, response );
						break;
					}
					else
					{
						int err = 0;
						err = SSL_get_error( ssl, bytes );

						switch( err )
						{
						
						// The TLS/SSL I/O operation completed.
						case SSL_ERROR_NONE:
							FERROR( "[SocketRead] Completed successfully.\n" );
							break;;
						
						// The TLS/SSL connection has been closed. Goodbye!
						case SSL_ERROR_ZERO_RETURN:
							FERROR( "[SocketRead] The connection was closed.\n" );
							//return SOCKET_CLOSED_STATE;
							break;
						
						// The operation did not complete. Call again.
						case SSL_ERROR_WANT_READ:
						// NB: We used to retry 10000 times!
							usleep( 100 );
							continue;

						// The operation did not complete. Call again.
						case SSL_ERROR_WANT_WRITE:
						//if( pthread_mutex_lock( &sock->mutex ) == 0 )
							FERROR( "[SocketRead] Want write.\n" );
							break;

						case SSL_ERROR_SYSCALL:
							if( err > 0 )
							{
								if( errno == 0 )
								{
									FERROR(" [SocketRead] Connection reset by peer.\n" );
									break;
								}
								else 
								{
									FERROR( "[SocketRead] Error syscall error: %s\n", strerror( errno ) );
								}
							}
							else if( err == 0 )
							{
								FERROR( "[SocketRead] Error syscall no error? return.\n" );
								break;
							}
					
							FERROR( "[SocketRead] Error syscall other error. return.\n" );

					// Don't retry, just return read
						default:
							break;
						}
					}
				}
			}
			else // no SSL
			{
				DEBUG("[HttpClientCall] not secured send\n");
				
				bytes = send( sockfd, message, addsize, 0 );
				
				DEBUG("[HttpClientCall] sent bytes: %d\n", bytes );

				char response[ 2048 ];
				memset( response, 0, sizeof(response) );
				received = 0;
		
				struct timeval timeout;      
				timeout.tv_sec = HTTP_CLIENT_TIMEOUT;
				timeout.tv_usec = 0;

				if( setsockopt( sockfd, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof(timeout) ) < 0 ) {}
		
				while( TRUE ) 
				{
					bytes = read( sockfd, response, sizeof(response) );
					if( bytes < 0 )
					{
						FERROR("ERROR reading response from socket\n");
						break;
					}
					if( bytes == 0 )
					{
						FERROR("ERROR received bytes 0\n");
						break;
					}
					received += bytes;
					BufStringAddSize( bs, response, bytes );
				}
			}
			if( message != NULL )
			{
				FFree( message );
			}
			
		} // connect()
		close( sockfd );

		//DEBUG("HttpClientCall response:\n%s\n", bs->bs_Buffer );
	}
	
	if( secured == TRUE )
	{
		if( ssl != NULL )
		{
			SSL_free( ssl );
		}
		if( cert != NULL )
		{
			X509_free( cert );
		}
		if( ctx != NULL )
		{
			SSL_CTX_free( ctx );
		}
		if( outbio != NULL )
		{
			BIO_free( outbio );
		}
		if( certbio != NULL )
		{
			BIO_destroy_bio_pair( certbio );
			BIO_free( certbio );
		}
	}

	if( sockfd != 0 )
	{
		close( sockfd );
	}
	return bs;
	
client_error:

	if( secured == TRUE )
	{
		if( ssl != NULL )
		{
			SSL_free( ssl );
		}
		if( cert != NULL )
		{
			X509_free( cert );
		}
		if( ctx != NULL )
		{
			SSL_CTX_free( ctx );
		}
		if( outbio != NULL )
		{
			BIO_free( outbio );
		}
		if( certbio != NULL )
		{
			BIO_destroy_bio_pair( certbio );
			BIO_free( certbio );
		}
	}

	if( sockfd != 0 )
	{
		close( sockfd );
	}
	
	if( bs != NULL )
	{
		DEBUG("------------Firebase response\n %s\n", bs->bs_Buffer );
		BufStringDelete( bs );
		bs = NULL;
	}
	return bs;
}

