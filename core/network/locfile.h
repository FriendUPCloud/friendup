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
 * file contain functiton definitions related to local files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef FILE_H_
#define FILE_H_

#include <sys/stat.h>
#include <stdbool.h>
#include <core/nodes.h>
#include <util/buffered_string.h>

#define FILE_CACHEABLE 0x00000001
#define FILE_READ_NOW  0x00000002
#define FILE_EXISTS    0x00000004

//
//
//

typedef struct LocFile
{
	char			*lf_Filename; // Filename with extension
	FULONG			lf_FilenameLength; // Filename length
	char			*lf_Path;     // Absolute path
	FULONG			lf_PathLength; // Path length

	//unsigned long   filesize;
	char			*lf_Buffer;
	unsigned long   lf_FileSize;

	FILE*           lf_Fp;       // File pointer
	int             lf_Fd;       // File descriptor
	struct stat     lf_Info;
	time_t			lf_ModificationTimestamp;
	
	FUQUAD          lf_FileUsed;
	struct MinNode  node;
	uint64_t		hash[ 2 ];
} LocFile;

//
//
//

LocFile* LocFileNew( char* path, unsigned int flags ); // Can be relative, or absolute.

//
//
//

int LocFileRead( LocFile* file, long long offset, long long size );

//
//
//

void LocFileDelete( LocFile* file );

//
//
//

int LocFileReload( LocFile *file,  char *path );

//
//
//

int LocFileDeleteWithSubs( const char *path );

//
//
//

FLONG LocFileAvaiableSpace( const char *path );

//
//
//

LocFile* LocFileNewFromBuf( char* path, BufString *bs );

#endif
