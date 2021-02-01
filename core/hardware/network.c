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
 *  Network
 * 
 *  Additional network functions
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 19/10/2016
 */

#include "network.h"
#include <util/log/log.h>
#include <sys/ioctl.h>

#define __USE_MISC
#include <net/if.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include<stdio.h> //printf
#include<string.h>    //memset
#include<errno.h> //errno
#include<sys/socket.h>
#include<netdb.h>
#include<ifaddrs.h>
#include<stdlib.h>
#include<unistd.h>

/**
 * Get mac address
 *
 * @param maddr pointer to string when mac address will be stored
 * @return 0 when success, otherwise error number
 */
int getMacAddress( char *maddr )
{
	struct ifreq ifr;
	struct ifconf ifc;
	char buf[1024];
	int success = 0;

	int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
	if( sock == -1 )
	{
		FERROR("Cannot create socket!\n");
		return 1;
	}

	ifc.ifc_len = sizeof(buf);
	ifc.ifc_buf = buf;
	if( ioctl( sock, SIOCGIFCONF, &ifc ) == -1 )
	{
		FERROR("IO Fail!\n");
		return 2;
	}

	struct ifreq* it = ifc.ifc_req;
	const struct ifreq* const end = it + (ifc.ifc_len / sizeof(struct ifreq));

	for( ; it != end; ++it )
	{
		strcpy(ifr.ifr_name, it->ifr_name);
		if( ioctl( sock, SIOCGIFFLAGS, &ifr ) == 0 ) 
		{
			if( ! ( ifr.ifr_flags & IFF_LOOPBACK ) ) 
			{ // don't count loopback
				if( ioctl( sock, SIOCGIFHWADDR, &ifr ) == 0 ) 
				{
					success = 1;
					break;
				}
			}
		}
		else 
		{ /* handle error */ 
			
		}
	}
	
	// Close socket
	close( sock );

	//unsigned char mac_address[6];
	if( success )
	{
		sprintf( maddr, "%02x%02x%02x%02x%02x%02x",
				 (char)ifr.ifr_hwaddr.sa_data[0], (char)ifr.ifr_hwaddr.sa_data[1], (char)ifr.ifr_hwaddr.sa_data[2],
				 (char)ifr.ifr_hwaddr.sa_data[3], (char)ifr.ifr_hwaddr.sa_data[4], (char)ifr.ifr_hwaddr.sa_data[5] );
		//memcpy( maddr, ifr.ifr_hwaddr.sa_data, 6);
		return 0;
	}
	return 3;
}

/**
 * Get primary IP address
 *
 * @param buffer buffer where IP will be stored
 * @param buflen buffer size where data will be stored
 * @return 0 when success, otherwise error number
 */
int getPrimaryIp( char* buffer, size_t buflen )
{
    if( buflen < 16 )
	{
		return 1;
	}

	int sock = socket( AF_INET, SOCK_DGRAM, 0 );
	if( sock > 0 )
	{
		struct sockaddr_in serv;
		memset( &serv, 0, sizeof(serv) );
		serv.sin_family = AF_INET;
		serv.sin_addr.s_addr = inet_addr( "8.8.8.8" );
		serv.sin_port = htons( 53 );

		int err = connect( sock, (const struct sockaddr*) &serv, sizeof(serv) );
		if( err != -1 )
		{
			struct sockaddr_in name;
			socklen_t namelen = sizeof( name );
			err = getsockname( sock, (struct sockaddr*) &name, &namelen );
			if( err != -1 )
			{
				const char* p = inet_ntop( AF_INET, &name.sin_addr, buffer, buflen );
				if( p != NULL )
				{
					close( sock );
					return 0;
				}
				else
				{
					close( sock );
					return 1;
				}
			}
			else
			{
				close( sock );
				return 1;
			}
		}
		else
		{
			close( sock );
			return 1;
		}
		close( sock );
	}
	return 0;
}

/**
 * Get local IP address
 *
 * @param buffer buffer where IP will be stored
 * @param buflen buffer size where data will be stored
 * @return 0 when success, otherwise error number
 */
int getLocalIP( char* buffer, size_t buflen )
{
	FILE *f;
	char line[100] , *p = NULL, *c;
     
	f = fopen("/proc/net/route" , "r");
	if( f == NULL )
	{
		return 3;
	}
	
    while( fgets(line , 100 , f ) )
	{
		p = strtok(line , " \t");
		c = strtok(NULL , " \t");
         
		if(p!=NULL && c!=NULL)
		{
			if(strcmp(c , "00000000") == 0)
			{
				printf("Default interface is : %s \n" , p);
				break;
			}
		}
	}
     
	//which family do we require , AF_INET or AF_INET6
	int fm = AF_INET;
	struct ifaddrs *ifaddr, *ifa;
	int family;
 
	if( getifaddrs(&ifaddr) == -1 )
	{
		fclose( f );
		return 1;
	}
 
	//Walk through linked list, maintaining head pointer so we can free list later
	for (ifa = ifaddr; ifa != NULL; ifa = ifa->ifa_next) 
	{
		if (ifa->ifa_addr == NULL)
		{
			continue;
		}
 
		family = ifa->ifa_addr->sa_family;
 
		if( p != NULL && strcmp( ifa->ifa_name , p ) == 0)
		{
			if (family == fm) 
			{
				int s = getnameinfo( ifa->ifa_addr, (family == AF_INET) ? sizeof(struct sockaddr_in) : sizeof(struct sockaddr_in6) , buffer , buflen , NULL , 0 , NI_NUMERICHOST );
				if( s != 0 ) 
				{
					DEBUG("getnameinfo() failed: %s\n", gai_strerror(s));
					fclose( f );
					return 2;
				}
				printf("address: %s", buffer );
			}
		}
	}
	freeifaddrs(ifaddr);
	fclose( f );
	return 0;
}
