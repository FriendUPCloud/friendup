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

#include "network.h"
#include <util/log/log.h>
#include <sys/ioctl.h>

#define __USE_MISC
#include <net/if.h>

//
// get mac address of current machine
//

int getMacAddress( char *maddr )
{
	struct ifreq ifr;
	struct ifconf ifc;
	char buf[1024];
	int success = 0;

	int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
	if( sock == -1 )
	{
		ERROR("Cannot create socket!\n");
		return 1;
	}

	ifc.ifc_len = sizeof(buf);
	ifc.ifc_buf = buf;
	if( ioctl( sock, SIOCGIFCONF, &ifc ) == -1 )
	{
		ERROR("IO Fail!\n");
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
		//DEBUG("MACADDRESS %6s\n", maddr );
		return 0;
	}
	
	return 3;
}
