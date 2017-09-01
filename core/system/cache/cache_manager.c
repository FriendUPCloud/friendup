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
 * file contain functitons related to cache
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include "cache_manager.h"
#include <util/murmurhash3.h>
#include <system/user/user.h>

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
		
		/*
		LocFile *lf = cm->cm_LocFileCache;
		while( lf != NULL )
		{
			LocFile *rf = lf;
			lf = (LocFile *)lf->node.mln_Succ;
			LocFileDelete( rf );
		}
		*/
	}
	
	FFree( cm );
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
		INFO(" cache size %lld file size %lld cache max %lld\n",  cm->cm_CacheSize ,(FQUAD)lf->lf_FileSize, (FQUAD)cm->cm_CacheMax );
		if( (cm->cm_CacheSize + lf->lf_FileSize) > cm->cm_CacheMax )
		{
			FERROR("Cannot add file to cache, cache is FULL\n");
			return 1;
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
int CacheManagerUserFilePut( void *locusr, LocFile *lf )
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

//
// Internal function which gets pointer to char where filename is started
//

inline char *GetFileNamePtr( char *path, int len )
{
	int i = len;
	while( i != 0 )
	{
		if( path[ i ] == '/' )
		{
			return &path[ i+1 ];
		}
		i--;
	}
	return path;
}

/**
 * get LocFile from cache
 *
 * @param cm pointer to CacheManager
 * @param path path to file
 * @param checkByPath find file by compareing paths
 * @return pointer to LocFile when structure is stored in CacheManager, otherwise NULL
 */
LocFile *CacheManagerFileGet( CacheManager *cm, char *path, FBOOL checkByPath )
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

		CacheFileGroup *cg = &(cm->cm_CacheFileGroup[ id ]);
		lf = cg->cg_File;

		while( lf != NULL )
		{
			if( memcmp( hash, lf->hash, sizeof(hash) ) == 0 )
			{
				lf->lf_FileUsed++;
				return lf;
			}
			
			lf = (LocFile *)lf->node.mln_Succ;
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

