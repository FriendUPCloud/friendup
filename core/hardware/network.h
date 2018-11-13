/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __HARDWARE_NETWORK_H__
#define __HARDWARE_NETWORK_H__

#include <unistd.h>
#include <netinet/in.h>
#include <string.h>
#include <signal.h>
#include <fcntl.h>

//
//
//

int getMacAddress( char *maddr );

//
//
//

int getPrimaryIp( char* buffer, size_t buflen );

//
//
//

int getLocalIP( char* buffer, size_t buflen );

#endif // __HARDWARE_NETWORK_H__
