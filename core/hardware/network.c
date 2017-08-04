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
