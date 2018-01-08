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
 * file contain function definitions related to user cache
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/08/2017
 */

#ifndef __FILE_CACHE_USER_FILES_H__
#define __FILE_CACHE_USER_FILES_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cache_file.h"
#include "cache_drive.h"

//
//
//

typedef struct CacheUserFiles
{
	FUQUAD				cuf_CacheSize;
	FUQUAD				cuf_MaxCacheSize;
	FUQUAD				cuf_CacheRamSize;
	FUQUAD				cuf_MaxCacheRamSize;
	FULONG				cuf_UsrID;
	CacheDrive			*cuf_Drive;
	MinNode				node;
	pthread_mutex_t 	cuf_Mutex;
}CacheUserFiles;

//
//
//

CacheUserFiles *CacheUserFilesNew( FULONG id, FLONG cacheSize );

//
//
//

void CacheUserFilesDelete( CacheUserFiles *cuf );

//
//
//

void CacheUserFilesDeleteAll( CacheUserFiles *cuf );

//
//
//

int CacheUserFilesAddFile( CacheUserFiles *cuf, FULONG devid, CacheFile *lf );

#endif //__FILE_CACHE_USER_FILES_H__

