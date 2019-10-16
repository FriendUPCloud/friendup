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
 *  Machine Info
 *
 *  Get information about working machine
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 19/10/2016
 */

#include "machine_info.h"
 
#include <core/types.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include <netinet/in_systm.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <limits.h>
 
#include <sys/types.h>
#include <sys/ioctl.h>
#include <sys/select.h>

#include <dirent.h>
#include <fcntl.h>
 
#ifdef DARWIN
#include <sys/types.h>
#include <sys/socket.h>
#include <net/if_dl.h>
#include <ifaddrs.h>
#include <net/if_types.h>
#else //!DARWIN
#ifdef __linux__
#include <linux/if.h>
#include <linux/sockios.h>
#endif
#endif //!DARWIN
 
#include <sys/resource.h>
#include <sys/utsname.h>

#include <util/simple_hash.h>
 
/**
 * Function is hashing mac address
 *
 * @param mac pointer to mac address
 * @return hashed mac address
 */

FUWORD HashMacAddress( FBYTE *mac )
{
	FUWORD hash = 0;
 
	for ( unsigned int i = 0; i < 6; i++ )
	{
		hash += ( SHIFT_LEFT( mac[i], (( i & 1 ) * 8 ) ) );
	}
	return hash;
}

/**
 * Get machine name
 *
 * @return pointer to machine name
 */

const char* GetMachineName()
{
	static struct utsname u;
 
	if ( uname( &u ) < 0 )
	{
		return "unknown";
	}
 
	return u.nodename;
}

/**
 * Get hashed mac address
 *
 * @param mac1 pointer to memory where hashed mac address will be stored
 * @param mac2 pointer to memory where hashed mac (of second interface if exist) will be stored
 */

void GetMacHash( FUWORD *mac1, FUWORD *mac2 )
{
   *mac1 = 0;
   *mac2 = 0;
 
#ifdef DARWIN
 
   struct ifaddrs* ifaphead;
   if ( getifaddrs( &ifaphead ) != 0 )
      return;
 
   // iterate over the net interfaces
   bool foundMac1 = false;
   struct ifaddrs* ifap;
   for ( ifap = ifaphead; ifap; ifap = ifap->ifa_next )
   {
      struct sockaddr_dl* sdl = (struct sockaddr_dl*)ifap->ifa_addr;
      if ( sdl && ( sdl->sdl_family == AF_LINK ) && ( sdl->sdl_type == IFT_ETHER ))
      {
          if ( !foundMac1 )
          {
             foundMac1 = true;
             mac1 = hashMacAddress( (u8*)(LLADDR(sdl))); //sdl->sdl_data) + 
                                    sdl->sdl_nlen) );
          } else {
             mac2 = hashMacAddress( (u8*)(LLADDR(sdl))); //sdl->sdl_data) + 
                                    sdl->sdl_nlen) );
             break;
          }
      }
   }
   
   freeifaddrs( ifaphead );
 
#else // !DARWIN
 
	int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP );
	if ( sock < 0 ) return;
    
	// enumerate all IP addresses of the system
	struct ifconf conf;
	char ifconfbuf[ 128 * sizeof(struct ifreq)  ];
	memset( ifconfbuf, 0, sizeof( ifconfbuf ));
	conf.ifc_buf = ifconfbuf;
	conf.ifc_len = sizeof( ifconfbuf );
	if ( ioctl( sock, SIOCGIFCONF, &conf ))
	{
		FERROR("IOCTRL error!\n");
		return;
	}
    
	// get MAC address
	FBOOL foundMac1 = FALSE;
	struct ifreq* ifr;
	for ( ifr = conf.ifc_req; (FBYTE*)ifr < (FBYTE*)conf.ifc_req + conf.ifc_len; ifr++ ) 
	{
		if ( ifr->ifr_addr.sa_data == (ifr+1)->ifr_addr.sa_data )
		{
			continue;  // duplicate, skip it
		}
      
		if ( ioctl( sock, SIOCGIFFLAGS, ifr ))
		{
			continue;  // failed to get flags, skip it
		}
		if ( ioctl( sock, SIOCGIFHWADDR, ifr ) == 0 ) 
		{
			if ( !foundMac1 )
			{
				foundMac1 = TRUE;
				*mac1 = HashMacAddress( (FUBYTE*)&(ifr->ifr_addr.sa_data));
			} 
			else 
			{
				*mac2 = HashMacAddress( (FUBYTE*)&(ifr->ifr_addr.sa_data));
				break;
			}
		}
	}
    
	close( sock );
 
#endif // !DARWIN
 
	// sort the mac addresses. We don't want to invalidate
	// both macs if they just change order.
	if ( *mac1 > *mac2 )
	{
		FUWORD tmp = *mac2;
		*mac2 = *mac1;
		*mac1 = tmp;
	}
}

/**
 * Hash information about disks
 *
 * @return Hashed disk variable (FUWORD)
 */

FUWORD GetVolumeHash()
{
	// we don't have a 'volume serial number' like on windows. 
	// Lets hash the system name instead.
	FUBYTE* sysname = (FUBYTE*)GetMachineName();
	FUWORD hash = 0;
 
	for ( unsigned int i = 0; sysname[i]; i++ )
	{
		hash += SHIFT_LEFT( sysname[i], (( i & 1 ) * 8 ));
	}
 
	return hash;
}

//
//
//
 
#ifdef DARWIN   
 #include <mach-o/arch.h>
 FUWORD GetCpuHash()
 { 
     const NXArchInfo* info = NXGetLocalArchInfo();
     FUWORD val = 0;
     val += (FUWORD)info->cputype;
     val += (FUWORD)info->cpusubtype;
     return val;
 }
 
#else // !DARWIN

/**
 * Static locking function.
 *
 * @param p pointer to memory where CPUID will be stored
 * @param ax ax register value
 */

 static void GetCpuid( FUINT* p, FUINT ax __attribute__((unused)))
 {
	char *ptr = (char *)p;
	ptr[ 0 ] = 'u';
	ptr[ 1 ] = 'n';
	ptr[ 2 ] = 'k';
/*
	#if defined( __arm__ ) || defined( __arm64__ )
	char *ptr = (char *)p;
	ptr[ 0 ] = 'a';
	ptr[ 1 ] = 'r';
	ptr[ 2 ] = 'm';
	#else
    __asm __volatile
    (   "movl %%ebx, %%esi\n\t"
        "cpuid\n\t"
        "xchgl %%ebx, %%esi"
        : "=a" (p[0]), "=S" (p[1]),
          "=c" (p[2]), "=d" (p[3])
        : "0" (ax)
    );
	#endif
*/
 }
 
/**
 * Get CPUID as hashed information
 *
 * @return CPUID hash as FUBYTE
 */

 FUWORD GetCpuHash()
 {  
	FUINT cpuinfo[4] = { 0, 0, 0, 0 };
	GetCpuid( cpuinfo, 0 );
	FUWORD hash = 0;
	FUINT* ptr = (&cpuinfo[0]);
    
	for ( unsigned int i = 0; i < 4; i++ )
	{
		hash += (ptr[i] & 0xFFFF) + ( ptr[i] >> 16 ); 
	}
 
	return hash;
 }
#endif // !DARWIN

static FUWORD id[5];

/**
 * Compute Unique System ID
 *
 * @return pointer to FUWORD table with computed ID (4bytes)
 */

static FUWORD* ComputeSystemUniqueId()
{
	static FBOOL computed = FALSE;
 
	if ( computed )
	{
		return id;
	}
	memset( id, 0, sizeof(id ) );
 
	// produce a number that uniquely identifies this system.
	id[0] = GetCpuHash(); 
	id[1] = GetVolumeHash(); 
	GetMacHash( &id[2], &id[3] );
 
	// fifth block is some checkdigits
	id[4] = 0; 
	for ( unsigned int i = 0; i < 4; i++ )
	{
		id[4] += id[i];
	}

	Smear( id );
    
	computed = TRUE;
	return id;
}

/**
 * Get system unique ID
 *
 * @return FC Node unique ID as string
 */

char* GetSystemUniqueId()
{
   // get the name of the computer
	char *uniqueID = FCalloc( 128, sizeof(char) );
	if( uniqueID == NULL )
	{
		FERROR("Cannot allocate memory for systemuniqueid!\n");
		return NULL;
	}
	const char *mname = GetMachineName();
	if( mname != NULL )
	{
		strcat( uniqueID, mname );
	}

#ifndef CYGWIN_BUILD
	FUWORD *id = ComputeSystemUniqueId();
	if( id != NULL )
	{
		unsigned int i = 0;
		
		for ( i = 0; i < 5; i++ )
		{
			char num[17];
			memset( num, 0, sizeof(num) );
			snprintf( num, 16, "%x", id[i] );

			strcat( uniqueID, "-" );
      
			switch( strlen( num ))
			{
				case 1: strcat( uniqueID, "000"); break;
				case 2: strcat( uniqueID, "00");  break;
				case 3: strcat( uniqueID, "0");   break;
			}
			strcat( uniqueID, num );
		}
	}
#endif
	return uniqueID;
}


char *fcntl_flags( int flags )
{
	static char output[128];
	*output = 0;

	if (flags & O_RDONLY)
		strcat(output, "O_RDONLY ");
	if (flags & O_WRONLY)
		strcat(output, "O_WRONLY ");
	if (flags & O_RDWR)
		strcat(output, "O_RDWR ");
	if (flags & O_CREAT)
		strcat(output, "O_CREAT ");
	if (flags & O_EXCL)
		strcat(output, "O_EXCL ");
	if (flags & O_NOCTTY)
		strcat(output, "O_NOCTTY ");
	if (flags & O_TRUNC)
		strcat(output, "O_TRUNC ");
	if (flags & O_APPEND)
		strcat(output, "O_APPEND ");
	if (flags & O_NONBLOCK)
		strcat(output, "O_NONBLOCK ");
	if (flags & O_SYNC)
		strcat(output, "O_SYNC ");
	if (flags & O_ASYNC)
		strcat(output, "O_ASYNC ");

	return output;
}

char *fd_info(int fd)
{
	if( fd < 0 || fd >= FD_SETSIZE )
	{
		return FALSE;
	}
	// if (fcntl(fd, F_GETFL) == -1 && errno == EBADF)
	int rv = fcntl(fd, F_GETFL);
	return (rv == -1) ? strerror(errno) : fcntl_flags(rv);
}

/* check whether a file-descriptor is valid */
int pth_util_fd_valid( int fd )
{
	if (fd < 3 || fd >= FD_SETSIZE)
	{
		return FALSE;
	}
	if( fcntl(fd, F_GETFL) == -1 && errno == EBADF )
	{
		return FALSE;
	}
	return TRUE;
}

/**
 * Put all information about FD's to log
 *
 */
/* implementation of Donal Fellows method */ 
void debugFD()
{
	int fd_count;
	char buf[ 64 ];
	struct dirent *dp;

	snprintf( buf, 64, "/proc/%i/fd/", getpid() );

	fd_count = 0;
	DIR *dir = opendir(buf);
	Log( FLOG_INFO, "--------------------------------\n \
					-------File descriptors---------\n \
					--------------------------------\n"
	);
	while( ( dp = readdir( dir ) ) != NULL )
	{
		char buffer[ 512 ];
		char *endptr;
		errno = 0;
		long result = strtol( dp->d_name, &endptr, 10);
		if( endptr == dp->d_name )
		{
			// nothing parsed from the string, handle errors or exit
		}
		if( ( result == LONG_MAX || result == LONG_MIN) && errno == ERANGE )
		{
			// out of range, handle or exit
			result = 0;
		}
		
		snprintf( buffer, sizeof(buffer), "fd: %lu valid: %d info: %s\n", result, pth_util_fd_valid( (int)result ), fd_info( (int)result ) );
		Log( FLOG_INFO, buffer );
		 
		fd_count++;
	}
	closedir(dir);
}
