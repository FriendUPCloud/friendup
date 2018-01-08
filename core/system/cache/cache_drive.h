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
 * file contain functiton definitions related to cache drives
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 24/08/2017
 */

#ifndef __SYSTEM_CACHE_CACHE_DRIVE_H_
#define __SYSTEM_CACHE_CACHE_DRIVE_H_

#include <sys/stat.h>
#include <stdbool.h>
#include <core/nodes.h>
#include <util/buffered_string.h>
#include "cache_file.h"
#include <pthread.h>

//
//
//

typedef struct CacheDrive
{
	FULONG				cd_DeviceId;
	FUQUAD				cd_CacheSize;
	FUQUAD				cd_MaxCacheSize;
	CacheFile			*cd_File;
	pthread_mutex_t		cd_Mutex;
	MinNode				node;
}CacheDrive;

//
//
//

CacheDrive* CacheDriveNew( FULONG id, FLONG cacheSize );

//
//
//

void CacheDriveDelete( CacheDrive* dr );

//
//
//

void CacheDriveDeleteAll( CacheDrive* dr );


#endif // __SYSTEM_CACHE_CACHE_DRIVE_H_


