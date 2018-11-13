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
 * file contain functitons related to cache user files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/08/2017
 */

#include "cache_uf_manager.h"
#include <util/murmurhash3.h>
#include <system/user/user.h>
#include <mutex/mutex_manager.h>

/**
 * create new CacheUFManager
 *
 * @param fileBufSize maximum buffer size for stored files on disks
 * @param ramBufSize maxiumum buffer size for stored files in ram
 * @return new CacheUFManager structure or NULL if error appear
 */
CacheUFManager *CacheUFManagerNew( FULONG fileBufSize, FULONG ramBufSize __attribute__((unused)) )
{
	DEBUG( "[CacheUFManagerNew] Setting up cache manager.\n" );
	CacheUFManager *cm = FCalloc( 1, sizeof( CacheUFManager ) );
	if( cm != NULL )
	{
		int i = 0;
		cm->cufm_CacheMax = fileBufSize;
		pthread_mutex_init( &(cm->cufm_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for CacheUFManager\n");
	}
	return cm;
}

/**
 * delete new CacheUFManager
 *
 * @param cm pointer to CacheUFManager which will be deleted
 */
void CacheUFManagerDelete( CacheUFManager *cm )
{
	if( cm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
		CacheUserFilesDeleteAll( cm->cufm_CacheUserFiles );
		FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
		
		pthread_mutex_destroy( &(cm->cufm_Mutex) );
	
		FFree( cm );
	}
}

/**
 * function store CacheFile inside cache
 *
 * @param cm pointer to CacheUFManager which will store file
 * @param uid User ID
 * @param did Device ID
 * @param lf pointer to CacheFile structure which will be stored in cache
 * @return 0 when success, otherwise error number
 */
int CacheUFManagerFilePut( CacheUFManager *cm, FULONG uid, FULONG did, CacheFile *lf )
{
	if( cm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
		CacheUserFiles *cuf =  cm->cufm_CacheUserFiles;
		while( cuf != NULL )
		{
			if( cuf->cuf_UsrID == uid )
			{
				break;
			}
			cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
		
		// cache for user exist, there is no need to create one
		if( cuf == NULL )
		{
			cuf = CacheUserFilesNew( uid, cm->cufm_CacheMax );
			FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
			cuf->node.mln_Succ = (MinNode *)cm->cufm_CacheUserFiles;
			cm->cufm_CacheUserFiles = cuf;
			FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
			DEBUG("[CacheUFManagerFilePut] new cache for user %lu created\n", cuf->cuf_UsrID );
		}
		
		if( cuf != NULL )
		{
			// trying to find cached drive
			CacheDrive *cdev = cuf->cuf_Drive;
			while( cdev != NULL )
			{
				if( cdev->cd_DeviceId == did )
				{
					break;
				}
				cdev = (CacheDrive *)cdev->node.mln_Succ;
			}
			
			// drive wasnt cached before, we must create new one
			if( cdev == NULL )
			{
				cdev = CacheDriveNew( did, cm->cufm_CacheMax );
				FRIEND_MUTEX_LOCK( &(cuf->cuf_Mutex) );
				cdev->node.mln_Succ = (MinNode *)cuf->cuf_Drive;
				cuf->cuf_Drive = cdev;
				FRIEND_MUTEX_UNLOCK( &(cuf->cuf_Mutex) );
				DEBUG("[CacheUFManagerFilePut] new cache drive (id %lu) for user created\n", did );
			}
		
			INFO(" cache size %ld file size %ld cache max %ld\n",  cdev->cd_CacheSize ,(FLONG)lf->cf_FileSize, (FLONG)cdev->cd_MaxCacheSize );
			if( cdev == NULL || (cdev->cd_CacheSize + lf->cf_FileSize) > cdev->cd_MaxCacheSize )
			{
				FERROR("Cannot add file to cache, cache is FULL or cannot be created\n");
				return 1;
			}
			else
			{
				if( lf != NULL )
				{
					FRIEND_MUTEX_LOCK( &(cdev->cd_Mutex) );
					lf->node.mln_Succ = (MinNode *)cdev->cd_File;
					cdev->cd_File = lf;
					FRIEND_MUTEX_UNLOCK( &(cdev->cd_Mutex) );
				
					lf->cf_FileUsed++;
			
					cuf->cuf_CacheSize += lf->cf_FileSize;
				}
				else
				{
					FERROR("Cannot store file in cache without filename!\n");
					return -1;
				}
			}
		} // cuf != NULL
	}
	return 0;
}

/**
 * get CacheFile from cache
 *
 * @param cm pointer to CacheUFManager
 * @param uid User ID
 * @param did Drive ID
 * @param path path to file which we want to get from cache
 * @return pointer to CacheFile when structure is stored in CacheUFManager, otherwise NULL
 */
CacheFile *CacheUFManagerFileGet( CacheUFManager *cm, FULONG uid, FULONG did, char *path )
{
	CacheFile *ret = NULL;
	
	if( path == NULL )
	{
		FERROR("[CacheManagerFileGet] Cache meananger do not handle NULL file\n");
		return NULL;
	}
	
	if( cm != NULL )
	{
		uint64_t hash[ 2 ];
		MURMURHASH3( path, strlen(path), hash );
		
		FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
		CacheUserFiles *cuf =  cm->cufm_CacheUserFiles;
		while( cuf != NULL )
		{
			DEBUG("[CacheManagerFileGet] cufid %lu provided id %lu\n", cuf->cuf_UsrID, uid );
			if( cuf->cuf_UsrID == uid )
			{
				DEBUG("[CacheManagerFileGet] User found!\n");
				break;
			}
			cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
		
		if( cuf != NULL )
		{
			CacheDrive *cd = cuf->cuf_Drive;
			while( cd != NULL )
			{
				if( cd->cd_DeviceId == did )
				{
					FRIEND_MUTEX_LOCK( &(cd->cd_Mutex) );
					CacheFile *cf = cd->cd_File;
					while( cf != NULL )
					{
						//DEBUG("[CacheManagerFileGet] hash check %c %c - %c %c\n", hash[0], hash[1], cf->hash[0], cf->hash[1] );
						if( memcmp( hash, cf->hash, sizeof(hash) ) == 0 )
						{
							cf->cf_FileUsed++;
							DEBUG("[CacheManagerFileGet] File returned\n");
							FRIEND_MUTEX_UNLOCK( &(cd->cd_Mutex) );
							return cf;
						}
						cf = (CacheFile *)cf->node.mln_Succ;
					}	// find file
					FRIEND_MUTEX_UNLOCK( &(cd->cd_Mutex) );
				}
				cd = (CacheDrive *)cd->node.mln_Succ;
			}	// find device
		}
	}
	return ret;
}

/**
 * delete CacheFile from cache
 *
 * @param cm pointer to CacheUFManager
 * @param uid User ID
 * @param did Drive ID
 * @param path path to file which we want to get from cache
 * @return 0 when success, otherwise error number
 */
int CacheUFManagerFileDelete( CacheUFManager *cm, FULONG uid, FULONG did, char *path )
{
	CacheFile *ret = NULL;
	
	if( path == NULL )
	{
		FERROR("[CacheUFManagerFileDelete] Cache meananger do not handle NULL file\n");
		return -1;
	}
	
	if( cm != NULL )
	{
		uint64_t hash[ 2 ];
		MURMURHASH3( path, strlen(path), hash );
		
		FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
		CacheUserFiles *cuf =  cm->cufm_CacheUserFiles;
		while( cuf != NULL )
		{
			DEBUG("[CacheUFManagerFileDelete] cufid %lu provided id %lu\n", cuf->cuf_UsrID, uid );
			if( cuf->cuf_UsrID == uid )
			{
				DEBUG("[CacheUFManagerFileDelete] User found!\n");
				break;
			}
			cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
		
		if( cuf != NULL )
		{
			CacheDrive *cd = cuf->cuf_Drive;
			while( cd != NULL )
			{
				if( cd->cd_DeviceId == did )
				{
					FRIEND_MUTEX_LOCK( &(cd->cd_Mutex) );
					CacheFile *cf = cd->cd_File;
					CacheFile *prevcf = cd->cd_File;
					while( cf != NULL )
					{
						//DEBUG("[CacheUFManagerFileDelete] hash check %c %c - %c %c\n", hash[0], hash[1], cf->hash[0], cf->hash[1] );
						if( memcmp( hash, cf->hash, sizeof(hash) ) == 0 )
						{
							if( cf == cd->cd_File )
							{
								cd->cd_File = (CacheFile *) cd->cd_File->node.mln_Succ;
							}
							else
							{
								prevcf->node.mln_Succ = cd->node.mln_Succ;
							}
							
							CacheFileDelete( cf );
								
							DEBUG("[CacheUFManagerFileDelete] File returned\n");
							FRIEND_MUTEX_UNLOCK( &(cd->cd_Mutex) );
							return 0;
						}
						prevcf = cf;
						cf = (CacheFile *)cf->node.mln_Succ;
					}	// find file
					FRIEND_MUTEX_UNLOCK( &(cd->cd_Mutex) );
				}
				cd = (CacheDrive *)cd->node.mln_Succ;
			}	// find device
		}
	}
	return -1;
}

/**
 * refresh cache
 *
 * @param cm pointer to CacheUFManager
 */
void CacheUFManagerRefresh( CacheUFManager *cm )
{
	if( cm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(cm->cufm_Mutex) );
		CacheUserFiles *cuf =  cm->cufm_CacheUserFiles;
		while( cuf != NULL )
		{
			CacheDrive *cd = cuf->cuf_Drive;
			while( cd != NULL )
			{
				// first we must count how often files are used from cached device
				// and remove rarely used ones (used less then x times from last call)
				
				CacheFile *cf = cd->cd_File;
				CacheFile *newcf = NULL;
				CacheFile *newcfnp = NULL;
				
				while( cf != NULL )
				{
					CacheFile *remme = NULL;
					
					if( cf->cf_FileUsed < 10 )
					{
						remme = cf;
					}
					else
					{
						if( newcf == NULL )
						{
							newcf = cf;
							newcfnp = cf;
						}
						else
						{
							newcfnp->node.mln_Succ = (MinNode *)cf;
							newcfnp = cf;
						}
					}
					cf->cf_FileUsed = 0;
					
					cf = (CacheFile *)cf->node.mln_Succ;
					
					if( remme != NULL )
					{
						CacheFileDelete( remme );
					}
				}
				cd->cd_File = newcf;
				
				cd = (CacheDrive *)cd->node.mln_Succ;
			}
			
			cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(cm->cufm_Mutex) );
	}
}
