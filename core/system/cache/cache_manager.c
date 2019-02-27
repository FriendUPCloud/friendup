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
 * file contain functitons related to cache
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include "cache_manager.h"
#include <util/murmurhash3.h>
#include <system/user/user.h>
#include <mutex/mutex_manager.h>

/**
 * create new CacheManager
 *
 * @param size size of maxiumum buffer size (in bytes)
 * @return new CacheManager structure or NULL if error appear
 */
CacheManager *CacheManagerNew( FULONG size )
{
	DEBUG( "[CacheManagerNew] Setting up cache manager.\n" );
	CacheManager *cm = FCalloc( 1, sizeof( CacheManager ) );
	if( cm != NULL )
	{
		int i = 0;
		
		pthread_mutex_init( &(cm->cm_Mutex), NULL );
		
		cm->cm_CacheMax = size;
		
		cm->cm_CacheFileGroup = FCalloc( CACHE_GROUP_MAX, sizeof(CacheFileGroup) );
		if( cm->cm_CacheFileGroup != NULL )
		{
			for( i = 0; i < CACHE_GROUP_MAX; i++ )
			{
				cm->cm_CacheFileGroup[ i ].cg_EntryId = i;
				cm->cm_CacheFileGroup[ i ].cg_File = NULL;
			}
		}
	}
	else
	{
		FERROR("Cannot allocate memory for CacheManager\n");
	}
	return cm;
}

/**
 * delete new CacheManager
 *
 * @param cm pointer to CacheManager which will be deleted
 */
void CacheManagerDelete( CacheManager *cm )
{
	if( cm != NULL )
	{
		int i = 0;
		
		FRIEND_MUTEX_LOCK( &(cm->cm_Mutex) );
		
		for( ; i < CACHE_GROUP_MAX; i++ )
		{
			LocFile *lf = cm->cm_CacheFileGroup[ i ].cg_File;
			while( lf != NULL )
			{
				LocFile *rf = lf;
				lf = (LocFile *)lf->node.mln_Succ;
				LocFileDelete( rf );
			}
		}
		
		if( cm->cm_CacheFileGroup != NULL )
		{
			FFree( cm->cm_CacheFileGroup );
		}
		
		FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
		
		pthread_mutex_destroy( &(cm->cm_Mutex) );
		/*
		LocFile *lf = cm->cm_LocFileCache;
		while( lf != NULL )
		{
			LocFile *rf = lf;
			lf = (LocFile *)lf->node.mln_Succ;
			LocFileDelete( rf );
		}
		*/
		FFree( cm );
	}
}

/**
 * Remove all data from cache
 *
 * @param cm pointer to CacheManager which will be flushed
 */
void CacheManagerClearCache( CacheManager *cm )
{
	if( cm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(cm->cm_Mutex) );
		int i = 0;
		
		for( ; i < CACHE_GROUP_MAX; i++ )
		{
			LocFile *lf = cm->cm_CacheFileGroup[ i ].cg_File;
			while( lf != NULL )
			{
				LocFile *rf = lf;
				lf = (LocFile *)lf->node.mln_Succ;
				
				LocFileDelete( rf );
			}
			
			cm->cm_CacheFileGroup[ i ].cg_File = NULL;
		}
		
		/*
		disabled for now
		LocFile *lf = cm->cm_LocFileCache;
		while( lf != NULL )
		{
			LocFile *rf = lf;
			lf = (LocFile *)lf->node.mln_Succ;
			
			LocFileDelete( rf );
		}
		*/
			
		cm->cm_LocFileCache = NULL;
		
		FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
	}
}

// we need task which will check if file was or not used too often

/**
 * function store LocFile inside cache
 *
 * @param cm pointer to CacheManager which will store file
 * @param lf pointer to LocFile structure which will be stored in cache
 * @return 0 when success, otherwise error number
 */
int CacheManagerFilePut( CacheManager *cm, LocFile *lf )
{
	if( cm != NULL )
	{
		INFO(" cache size %ld file size %ld cache max %ld\n",  cm->cm_CacheSize ,(FLONG)lf->lf_FileSize, (FLONG)cm->cm_CacheMax );
		if( (cm->cm_CacheSize + lf->lf_FileSize) > cm->cm_CacheMax )
		{
			INFO("Cannot add file to cache, cache is FULL\n");
			return -3;
		}
		else
		{
			if( lf != NULL )
			{
				char *hfirstChar = (char *)lf->hash;
				unsigned char id = (unsigned char)hfirstChar[0];		//we sort data by name
				/*
				if( id < 0 && id > 255 )
				{
					id = 0;
				}
				*/
				
				FRIEND_MUTEX_LOCK( &(cm->cm_Mutex) );
				
				if( cm->cm_CacheFileGroup != NULL )
				{
					DEBUG("ID %d\n", id );
					if( cm->cm_CacheFileGroup[ id ].cg_File == NULL )
					{
						cm->cm_CacheFileGroup[ id ].cg_File = lf;
					}
					else
					{
						lf->node.mln_Succ = (MinNode *)cm->cm_CacheFileGroup[ id ].cg_File;
						cm->cm_CacheFileGroup[ id ].cg_File = lf;
					}
				
					//lf->node.mln_Succ = (MinNode *)cm->cm_LocFileCache;
					//cm->cm_LocFileCache = lf;
			
					lf->lf_FileUsed++;
			
					cm->cm_CacheSize += lf->lf_FileSize;
				}
				else
				{
					FERROR("[CacheManagerFilePut] No file provided\n");
					FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
					return -2;
				}
				FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
			}
			else
			{
				FERROR("Cannot store file in cache without filename!\n");
				return -1;
			}
		}
	}
	return 0;
}

/**
 * function store LocFile inside cache (User cache)
 *
 * @param locusr pointer to User structure
 * @param lf pointer to LocFile structure which will be stored in cache
 * @return 0 when success, otherwise error number
 */
int CacheManagerUserFilePut( void *locusr, LocFile *lf __attribute__((unused)) )
{
	if( locusr != NULL )
	{
		// trying to find user assigned to CacheUserFiles, on the end we should assign cache to user
		User *usr = (User *)locusr;

		//CacheUserFilesAddFile( &(usr->u_FileCache), lf );

	}
	return 0;
}


/**
 * function get LocFile from cache (User cache)
 *
 * @param locusr pointer to User structure
 * @param path full path to file (include device name)
 * @return LocFile structure when success, otherwise NULL
 */
LocFile *CacheManagerUserFileGet( void *locusr, char *path )
{
	if( locusr != NULL )
	{
		// trying to find user assigned to CacheUserFiles, on the end we should assign cache to user
		User *usr = (User *)locusr;
		
		uint64_t hash[ 2 ];
		MURMURHASH3( path, strlen(path), hash );
		
		char *hfirstChar = (char *)hash;
		unsigned char id = (unsigned char)hfirstChar[0];
		
		// if CacheUserFiles exist, we are trying to find file

		/*
		LocFile *lf = usr->u_FileCache->cuf_File;
		while( lf != NULL )
		{
			if( memcmp( hash, lf->hash, sizeof(hash) ) == 0 )
			{
				lf->lf_FileUsed++;
				return lf;
			}
			lf = (LocFile *)lf->node.mln_Succ;
		}
		*/
	}
	return 0;
}

/**
 * get LocFile from cache
 *
 * @param cm pointer to CacheManager
 * @param path path to file
 * @param checkByPath find file by compareing paths
 * @return pointer to LocFile when structure is stored in CacheManager, otherwise NULL
 */
LocFile *CacheManagerFileGet( CacheManager *cm, char *path, FBOOL checkByPath __attribute__((unused)) )
{
	LocFile *ret = NULL;
	
	if( path == NULL )
	{
		FERROR("[CacheManagerFileGet] Cache meananger do not handle NULL file\n");
		return NULL;
	}
	
	if( cm != NULL )
	{
		uint64_t hash[ 2 ];
		MURMURHASH3( path, strlen(path), hash );
		
		char *hfirstChar = (char *)hash;
		unsigned char id = (unsigned char)hfirstChar[0];
		/*
		if( id < 0 || id > 255 )
		{
			id = 0;
		}
		*/
		
		LocFile *lf = NULL;

		if( FRIEND_MUTEX_LOCK( &(cm->cm_Mutex) ) == 0 )
		{
			//if( cm->cm_LocFileCache != NULL )
			{
				CacheFileGroup *cg = &(cm->cm_CacheFileGroup[ id ]);
				lf = cg->cg_File;

				while( lf != NULL )
				{
					if( memcmp( hash, lf->hash, sizeof(hash) ) == 0 )
					{
						//DEBUG("\n\n\n\n\n======================================got file\n\n\n\n\n\n\n\n\n");
						lf->lf_FileUsed++;
						FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
						return lf;
					}
			
					lf = (LocFile *)lf->node.mln_Succ;
				}
			}
		
			FRIEND_MUTEX_UNLOCK( &(cm->cm_Mutex) );
		}
		
		/*
		LocFile *lf = cm->cm_LocFileCache;
		while( lf != NULL )
		{
			char *s = (char *)hash;
			char *d = (char *)lf->hash;
			
			int i;
			FERROR("COMPARE %x-%x %x-%x\n", hash[0], lf->hash[0], hash[1], lf->hash[1] );
			
			if( memcmp( hash, lf->hash, sizeof(hash) ) == 0 )
			{
				return lf;
			}
			lf = (LocFile *)lf->node.mln_Succ;
		}
		*/
	}
	
	return ret;
}

