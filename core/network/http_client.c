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
/**
 * Function calls other server by using HTTP call
 *
 * @param c pointer to HttpClient
 * @param host pointer to server name
 * @return new BufferedString structure when success, otherwise NULL
 */
BufString *HttpClientCall( HttpClient *c, char *host )
{
	BufString *bs = BufStringNew();
	if( bs != NULL )
	{
		struct hostent *server;
		struct sockaddr_in serv_addr;
		int sockfd, bytes, sent, received, total;

		sockfd = socket(AF_INET, SOCK_STREAM, 0);
		if( sockfd < 0 )
		{
			BufStringDelete( bs );
			return NULL;
		}

		server = gethostbyname( host );
		if( server == NULL )
		{
			FERROR("[HttpClientCall] Cannot reach server: %s\n", host );
			BufStringDelete( bs );
			return NULL;
		}

		memset( &serv_addr, 0, sizeof(serv_addr) );
		serv_addr.sin_family = AF_INET;
		serv_addr.sin_port = htons( 80 );	// default http port
		memcpy( &serv_addr.sin_addr.s_addr, server->h_addr, server->h_length );

		if( connect( sockfd,(struct sockaddr *)&serv_addr,sizeof(serv_addr) ) < 0 )
		{
			FERROR("ERROR connecting");
		}
		
		total = strlen( c->hc_MainLine );
		// temporary solution
		char message[ 512 ];
		int addsize = snprintf( message, sizeof(message), "%sHost: %s\nAccept: */*\nUser-Agent: Friend/1.0.0\r\n\r\n", c->hc_MainLine, host );
		//int addsize = snprintf( message, sizeof(message), "GET /xml/ HTTP/1.1\nHost: freegeoip.net\nUser-Agent: curl/7.52.1\nAccept: */*\r\n\r\n" );

		DEBUG("[HttpClientCall] request: %s\n", message );
		
		bytes = send( sockfd, message, addsize, 0 );
		
		DEBUG("[HttpClientCall] sent bytes: %d\n", bytes );

		char response[ 2048 ];
		memset( response, 0, sizeof(response) );
		received = 0;
		
		struct timeval timeout;      
		timeout.tv_sec = 1;
		timeout.tv_usec = 0;

		if( setsockopt( sockfd, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof(timeout) ) < 0 )
		{
			
		}
		
		while( TRUE ) 
		{
			bytes = read( sockfd, response, sizeof(response) );
			if( bytes < 0 )
			{
				FERROR("ERROR reading response from socket");
				break;
			}
			if( bytes == 0 )
			{
				break;
			}
			received += bytes;
			BufStringAddSize( bs, response, bytes );
		}

		close( sockfd );

		DEBUG("HttpClientCall response:\n%s\n", bs->bs_Buffer );
	}
	return bs;
}

