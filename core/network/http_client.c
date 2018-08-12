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
 * @param param pointer to additional http tags (as string)
 * @return new HttpClient structure or NULL when problem appear
 */
HttpClient *HttpClientNew( FBOOL post, char *param )
{
	HttpClient *c = NULL;
	
	if( ( c = FCalloc( 1, sizeof(HttpClient) ) ) != NULL )
	{
		char temp[ 2048 ];
		int size = 0;
		
		//POST /oauth/token HTTP/1.1
		if( post == TRUE )
		{
			size = snprintf( temp, 2048, "POST %s HTTP/1.1\n", param );
		}
		else
		{
			size = snprintf( temp, 2048, "GET %s HTTP/1.1\n", param );
		}
		
		c->hc_MainLine = StringDuplicateN( temp, size );
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
		
		for( i=0 ; i < HTTP_HEADER_END ; i++ )
		{
			if( c->hc_Headers[ i ] != NULL )
			{
				FFree( c->hc_Headers[ i ] );
			}
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
	int sockfd = 0, bytes, sent, received, total;
	
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
		if( secured == TRUE )
		{
			certbio = BIO_new(BIO_s_file());
			outbio  = BIO_new_fp(stdout, BIO_NOCLOSE);
			
			method = SSLv23_client_method();
			if ( (ctx = SSL_CTX_new(method)) == NULL)
			{
				BIO_destroy_bio_pair( certbio );
				return bs;
			}
			
			SSL_CTX_set_options(ctx, SSL_OP_NO_SSLv2);
			ssl = SSL_new(ctx);
		}

		sockfd = socket(AF_INET, SOCK_STREAM, 0);
		if( sockfd < 0 )
		{
			goto client_error;
		}

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
			char message[ 512 ];
			int addsize = snprintf( message, sizeof(message), "%sHost: %s\nAccept: */*\nUser-Agent: Friend/1.0.0\r\n\r\n", c->hc_MainLine, host );
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

				certname = X509_NAME_new();
				certname = X509_get_subject_name(cert);

				DEBUG("Displaying the certificate subject data:\n");
				X509_NAME_print_ex(outbio, certname, 0, 0);
				DEBUG( "\n");
				
				bytes = SSL_write( ssl, message, addsize );
				
				DEBUG("[HttpClientCall] sent bytes: %d\n", bytes );

				char response[ 2048 ];
				memset( response, 0, sizeof(response) );
				received = 0;

				while( TRUE ) 
				{
					bytes = SSL_read( ssl, response, sizeof(response) );
					if( bytes < 0 )
					{
						FERROR("ERROR reading response from socket\n");
						break;
					}
					if( bytes == 0 )
					{
						FERROR("ERROR reading response from socket 0\n");
						break;
					}
					received += bytes;
					BufStringAddSize( bs, response, bytes );
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

			
		} // connect()
		close( sockfd );

		//DEBUG("HttpClientCall response:\n%s\n", bs->bs_Buffer );
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
	}

	if( sockfd != 0 )
	{
		close( sockfd );
	}
	
	if( bs != NULL )
	{
		BufStringDelete( bs );
		bs = NULL;
	}
	return bs;
}

