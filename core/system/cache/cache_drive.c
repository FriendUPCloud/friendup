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
 * file contain functiton body related to cache drives
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 24/08/2017
 */

#include "cache_drive.h"
#include <util/string.h>
#include <util/murmurhash3.h>
#include <mutex/mutex_manager.h>

/**
 * Create new CacheDrive structure
 *
 * @param did Device ID
 * @param cacheSize size of cache in bytes
 * @return new CacheDrive structure when success, otherwise NULL
 */
CacheDrive* CacheDriveNew( FULONG did, FLONG cacheSize )
{
	CacheDrive *cd = FCalloc( 1, sizeof( CacheDrive ) );
	if( cd != NULL )
	{
		cd->cd_DeviceId = did;
		cd->cd_MaxCacheSize = cacheSize;
		
		pthread_mutex_init( &(cd->cd_Mutex), NULL );
		
		DEBUG("[CacheDriveNew] ID %lu\n", did );
	}
	return cd;
}

/**
 * Delete CacheDrive structure
 *
 * @param dr pointer to cashed drive which we want to delete
 */
void CacheDriveDelete( CacheDrive* dr )
{
	if( dr != NULL )
	{
		FRIEND_MUTEX_LOCK( &(dr->cd_Mutex) );
		if( dr->cd_File != NULL )
		{
			CacheFileDeleteAll( dr->cd_File );
			dr->cd_File = NULL;
		}
		FRIEND_MUTEX_UNLOCK( &(dr->cd_Mutex) );
		
		pthread_mutex_destroy( &(dr->cd_Mutex) );
		
		FFree( dr );
	}
}

/**
 * Delete CacheDrive linked list
 *
 * @param dr pointer to first cashed drive in linked list which we want to delete
 */
void CacheDriveDeleteAll( CacheDrive* dr )
{
	while( dr != NULL )
	{
		CacheDrive *drrm = dr;
		dr = (CacheDrive *) dr->node.mln_Succ;
		
		CacheDriveDelete( drrm );
	}
}
