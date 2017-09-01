
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
 * file contain functiton body related to cache drives
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 24/08/2017
 */

#include "cache_drive.h"
#include <util/string.h>
#include <util/murmurhash3.h>

/**
 * Create new CacheDrive structure
 *
 * @param did Device ID
 * @param cacheSize size of cache in bytes
 * @return new CacheDrive structure when success, otherwise NULL
 */
CacheDrive* CacheDriveNew( FULONG did, FQUAD cacheSize )
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
		pthread_mutex_lock( &(dr->cd_Mutex) );
		if( dr->cd_File != NULL )
		{
			CacheFileDeleteAll( dr->cd_File );
			dr->cd_File = NULL;
		}
		pthread_mutex_unlock( &(dr->cd_Mutex) );
		
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
