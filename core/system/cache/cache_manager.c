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
				
				//DEBUG("Create cache id %d ptr %p\n", cm->cm_CacheFileGroup[ i ].cg_EntryId, cm->cm_CacheFileGroup[ i ].cg_File );
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
				LocFileFree( rf );
			}
		}
		
		if( cm->cm_CacheFileGroup != NULL )
		{
			FFree( cm->cm_CacheFileGroup );
		}
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
				
				LocFileFree( rf );
			}
			
			cm->cm_CacheFileGroup[ i ].cg_File = NULL;
		}
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
		INFO(" cache size %lld file size %lld cache max %lld\n",  cm->cm_CacheSize ,(FQUAD)lf->filesize, (FQUAD)cm->cm_CacheMax );
		if( (cm->cm_CacheSize + lf->filesize) > cm->cm_CacheMax )
		{
			FERROR("Cannot add file to cache, cache is FULL\n");
			return 1;
		}
		else
		{
			if( lf != NULL &&  lf->lf_Filename != NULL )
			{
				int id = lf->lf_Filename[ 0 ];		//we sort data by name
				if( id < 0 && id >= CACHE_GROUP_MAX )
				{
					id = 0;
				}
				if( cm->cm_CacheFileGroup[ id ].cg_File == NULL )
				{
					cm->cm_CacheFileGroup[ id ].cg_File = lf;
				}
				else
				{
					lf->node.mln_Succ = (MinNode *)cm->cm_CacheFileGroup[ id ].cg_File;
					cm->cm_CacheFileGroup[ id ].cg_File = lf;
				}
			
				lf->lf_FileUsed++;
			
				cm->cm_CacheSize += lf->filesize;
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
		INFO("Cache meananger do not handle NULL file\n");
		return NULL;
	}
	
	if( cm != NULL )
	{
		char *fname = NULL;
		
		if( checkByPath == FALSE )
		{
			fname = GetFileNamePtr( path, strlen(path ) );
		}
		else
		{
			fname = path;
		}
		
		DEBUG("FNAME %s -- id %d\n", fname, fname[ 0 ] );
		int id = fname[ 0 ];
		if( id < 0 || id > 255 )
		{
			id = 0;
		}
		LocFile *lf = NULL;

		CacheFileGroup *cg = &(cm->cm_CacheFileGroup[ id ]);
		lf = cg->cg_File;

		while( lf != NULL )
		{
			if( lf->lf_Path != NULL && strcmp( lf->lf_Path, path ) == 0 )
			{
				lf->lf_FileUsed++;
				return lf;
			}
			
			lf = (LocFile *)lf->node.mln_Succ;
		}
	}
	
	return ret;
}

