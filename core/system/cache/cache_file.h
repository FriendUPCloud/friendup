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
 * file contain functiton definitions related to cache files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/08/2017
 */

#ifndef __SYSTEM_CACHE_CACHE_FILE_H_
#define __SYSTEM_CACHE_CACHE_FILE_H_

#include <sys/stat.h>
#include <stdbool.h>
#include <core/nodes.h>
#include <util/buffered_string.h>

#define CACHE_NOT_SUPPORTED 0
#define CACHE_FILE_REQUIRE_REFRESH 1
#define CACHE_FILE_CAN_BE_USED 2
#define CACHE_FILE_MUST_BE_CREATED 3

//
//
//

typedef struct CacheFile
{
	char			*cf_StorePath; // path where file was stored
	FULONG			cf_StorePathLength; // path size
	char			*cf_Path;     // original path
	FULONG			cf_PathLength; // original path length

	unsigned long   cf_FileSize;
	unsigned long	cf_FileUsed;	// how many times file was used
	time_t			cf_ModificationTimestamp;

	FILE			*cf_Fp;       // File pointer
	char			*cf_FileBuffer;

	struct MinNode  node;
	uint64_t		hash[ 2 ];
}CacheFile;

//
//
//

CacheFile* CacheFileNew( char* path );

//
//
//

int CacheFileRead( CacheFile* file );

//
//
//

int CacheFileStore( CacheFile* file );

//
//
//

void CacheFileDelete( CacheFile* file );

//
//
//

void CacheFileDeleteAll( CacheFile* file );


#endif // __SYSTEM_CACHE_CACHE_FILE_H_

