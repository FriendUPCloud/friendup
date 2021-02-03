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
 * File Download
 *
 * @author PS (Pawel Stefanski)
 * @date 
 */

#include <core/types.h>

#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <util/log/log.h>

#include "file_download.h"

//
//
//

int DownloadFile( const char *file, char *webpath )
{
	int sock;
	
	char c;
	int i, j, k, l, m;
	FILE* f;
	char* host = webpath;
	struct addrinfo* ai;
	struct addrinfo hints;
	char buf[512];

	DEBUG("[DownloadFile] openfile: %s\n", file );

	if( ( f = fopen(file, "w") ) == NULL )
	{
		return -1;
	}
	
	if (strstr( webpath, "http://") == webpath)
	{
		host += 7;
	}
	
	memset(&hints, 0, sizeof(struct addrinfo));
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;

	DEBUG("[DownloadFile] sprintf done connecting to host: %s\n", host );

	char *sp = strchr(host, '/');
	sprintf(buf, "GET %s HTTP/1.1\r\n", sp );	
	*sp = 0;

	if ( (i = getaddrinfo(host, "80", &hints, &ai) ) != 0 )
	{
		FERROR("Cannot find site : %s\n", webpath );
		fclose( f );
		return -2;
	}

	sprintf(buf + strlen(buf), "Host: %s\r\n\r\n", host);
	sock = socket(ai->ai_family, ai->ai_socktype, ai->ai_protocol);
	if (connect(sock, ai->ai_addr, ai->ai_addrlen))
	{
		FERROR("Error. Failed to connect to host.\n");
	}

	freeaddrinfo(ai);
	i = send(sock, buf, strlen(buf), 0);
	if ( i < (int) strlen(buf) || (i == -1) )
	{
		FERROR("Error. Failed to send GET request!\n");
		fclose( f );
		return -3;
	}
	
	while (strcmp(buf, "\r\n")) 
	{
		for (i = 0; strcmp(buf + i - 2, "\r\n"); i++) 
		{ 
			recv(sock, buf + i, 1, 0); buf[i + 1] = 0; 
		}
		
		if (strstr(buf, "HTTP/") == buf) 
		{
			fputs(strchr(buf, ' ') + 1, stdout);
			if( ( strncmp( buf, "200 OK", 6 ) ) != 0 )
			{
				break;
			}
		}
		
		if (strstr(buf, "Content-Length:") == buf) 
		{
			*strchr(buf, '\r') = ' ';
			j = atoi(strchr(buf, ' ') + 1);
			l = j / 100;
		}
	}
	
#define BUF_SIZE 2048
	char buffer[ BUF_SIZE ];
	
	while ( TRUE )
	{
		int len = 0;
		
		if ( (len = recv( sock, buffer, BUF_SIZE, 0 ) ) < 1 )
		{
			break;
		}
		
		fwrite( buffer, len, 1, f );
	}

	fclose(f);
	close(sock);

	return 0;
}
