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
 * file contain function definitions related to cache
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __FILE_CACHE_MANAGER_H__
#define __FILE_CACHE_MANAGER_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cache_user_files.h"

#define CACHE_GROUP_MAX 256

//
//
//

typedef struct CacheFileGroup
{
	LocFile			*cg_File;				// poitner to file structure
	int				cg_EntryId;			// first char
}CacheFileGroup;

//
//
//

typedef struct CacheManager
{
	CacheFileGroup	*cm_CacheFileGroup;
	LocFile			*cm_LocFileCache;
	FUQUAD			cm_CacheSize;
	FUQUAD 			cm_CacheMax;
	pthread_mutex_t cm_Mutex;
}CacheManager;

//
//
//

CacheManager *CacheManagerNew( FULONG size );

//
//
//

void CacheManagerDelete( CacheManager *cm );

//
//
//

void CacheManagerClearCache( CacheManager *cm );

//
//
//

int CacheManagerFilePut( CacheManager *cm, LocFile *lf );

//
//
//

LocFile *CacheManagerFileGet( CacheManager *cm, char *path, FBOOL checkByPath );

#endif //__FILE_CACHE_MANAGER_H__
