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

struct addrinfo
{
  int ai_flags;			/* Input flags.  */
  int ai_family;		/* Protocol family for socket.  */
  int ai_socktype;		/* Socket type.  */
  int ai_protocol;		/* Protocol for socket.  */
  socklen_t ai_addrlen;		/* Length of socket address.  */
  struct sockaddr *ai_addr;	/* Socket address for socket.  */
  char *ai_canonname;		/* Canonical name for service location.  */
  struct addrinfo *ai_next;	/* Pointer to next in list.  */
};

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

	DEBUG("openfile\n");

	if (!(f = fopen(file, "w")))
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

	DEBUG("sprintf done connecting to host: %s\n", host );

	char *sp = strchr(host, '/');
	sprintf(buf, "GET %s HTTP/1.1\r\n", sp );	
	*sp = 0;

	if ( (i = getaddrinfo(host, "80", &hints, &ai) ) != 0 )
	{
		ERROR("Cannot find site : %s\n", webpath );
		return -2;
	}

	sprintf(buf + strlen(buf), "Host: %s\r\n\r\n", host);
	DEBUG("check whats sent %s\n", buf );
	sock = socket(ai->ai_family, ai->ai_socktype, ai->ai_protocol);
	if (connect(sock, ai->ai_addr, ai->ai_addrlen))
	{
		ERROR("Error. Failed to connect to host.\n");
	}

	freeaddrinfo(ai);
	i = send(sock, buf, strlen(buf), 0);
	if ( i < strlen(buf) || (i == -1) )
	{
		ERROR("Error. Failed to send GET request!\n");
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
			//if (strcmp(strchr(buf, ' ') + 1, "200 OK\r\n"))
			{
				DEBUG("FOUND\n");
				break;
				//return -4;
			}
		}
		
		if (strstr(buf, "Content-Length:") == buf) 
		{
			*strchr(buf, '\r') = ' ';
			j = atoi(strchr(buf, ' ') + 1);
			l = j / 100;
		}
		DEBUG("checking response\n");
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
