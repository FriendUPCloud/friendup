/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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

CacheDrive* CacheDriveNew( FULONG id, FQUAD cacheSize );

//
//
//

void CacheDriveDelete( CacheDrive* dr );

//
//
//

void CacheDriveDeleteAll( CacheDrive* dr );


#endif // __SYSTEM_CACHE_CACHE_DRIVE_H_


