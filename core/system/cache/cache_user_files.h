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

