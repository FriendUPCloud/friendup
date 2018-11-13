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


