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
 * Cache User Files body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include "cache_user_files.h"

/**
 * create new CacheUserFiles
 * 
 * @param uid User ID
 * @param cacheSize size of cache per disk
 * @return pointer to new CacheUserFiles when success, otherwise NULL
 */
CacheUserFiles *CacheUserFilesNew( FULONG uid, FLONG cacheSize )
{
	CacheUserFiles *cuf = FCalloc( 1, sizeof(CacheUserFiles) );
	if( cuf != NULL )
	{
		cuf->cuf_UsrID = uid;
		cuf->cuf_MaxCacheSize = cacheSize;	// 5000000 bytes/ 5MB
	}
	return cuf;
}

/**
 * delete CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles structure which will be deleted
 */
void CacheUserFilesDelete( CacheUserFiles *cuf )
{
	if( cuf != NULL )
	{
		CacheDriveDeleteAll( cuf->cuf_Drive );
		FFree( cuf );
	}
}

/**
 * delete whole list of CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles list which will be deleted
 */
void CacheUserFilesDeleteAll( CacheUserFiles *cuf )
{
	while( cuf != NULL )
	{
		CacheUserFiles * dcuf = cuf;
		cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		
		CacheUserFilesDelete( dcuf );
	}
}

/**
 * add File to CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles structure
 * @param devid device id
 * @param lf pointer to CacheFile which will be stored inside cache list
 * @return 0 when success, otherwise error number
 */
int CacheUserFilesAddFile( CacheUserFiles *cuf, FULONG devid __attribute__((unused)), CacheFile *lf )
{
	if( (cuf->cuf_CacheSize + lf->cf_FileSize) > cuf->cuf_MaxCacheSize )
	{
		INFO("Cannot add file to cache, cache is FULL\n");
		return 1;
	}
	
	return 0;
}
