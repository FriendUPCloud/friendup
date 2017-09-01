/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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

