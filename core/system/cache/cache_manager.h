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
