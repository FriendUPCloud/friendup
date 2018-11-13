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
 * file contain function definitions related to cached user files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/08/2017
 */

#ifndef __FILE_CACHE_UF_MANAGER_H__
#define __FILE_CACHE_UF_MANAGER_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cache_user_files.h"
#include <pthread.h>

//
//
//

typedef struct CacheUFManager
{
	CacheUserFiles		*cufm_CacheUserFiles;
	FUQUAD				cufm_CacheSize;
	FUQUAD 				cufm_CacheMax;
	pthread_mutex_t		cufm_Mutex;
}CacheUFManager;

//
//
//

CacheUFManager *CacheUFManagerNew( FULONG fileBufSize, FULONG ramBufSize );

//
//
//

void CacheUFManagerDelete( CacheUFManager *cm );

//
//
//

int CacheUFManagerFilePut( CacheUFManager *cm, FULONG uid, FULONG did, CacheFile *lf );

//
//
//

CacheFile *CacheUFManagerFileGet( CacheUFManager *cm, FULONG uid, FULONG did, char *path );

//
//
//

int CacheUFManagerFileDelete( CacheUFManager *cm, FULONG uid, FULONG did, char *path );

//
//
//

void CacheUFManagerRefresh( CacheUFManager *cm );

#endif //__FILE_CACHE_UF_MANAGER_H__

