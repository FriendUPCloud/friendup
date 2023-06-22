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
 * file contain functiton definitions related to local files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef FILE_H_
#define FILE_H_

#define LOCFILE_USE_MMAP 0 //TK-704

#include <sys/stat.h>
#include <stdbool.h>
#include <core/nodes.h>
#include <util/buffered_string.h>

#define FILE_CACHEABLE 0x00000001
#define FILE_READ_NOW  0x00000002
#define FILE_EXISTS    0x00000004

#ifndef LOCFILE_USE_MMAP
#error "LOCFILE_USE_MMAP must be defined to 0 or 1"
#endif

//
//
//

typedef struct LocFile
{
	char					*lf_Filename; // Filename with extension
	FULONG					lf_FilenameLength; // Filename length
	char					*lf_Path;     // Absolute path
	FULONG					lf_PathLength; // Path length

	char					*lf_Buffer;
	FULONG					lf_FileSize;

	struct stat				lf_Info;
	time_t					lf_ModificationTimestamp;
	
	FUQUAD          		lf_FileUsed;
	struct MinNode  		node;
	uint64_t				hash[ 2 ];
	
	char					*lf_Mime;
	int						lf_InUse;
} LocFile;

//
//
//

LocFile* LocFileNew( char* path, unsigned int flags ); // Can be relative, or absolute.


//
//
//

void LocFileDelete( LocFile* file );

//
//
//

#if LOCFILE_USE_MMAP == 1
#define LocFileReload(a,b ) //empty macro - reloading of a file is not needed because mmap will automatically carry out all the changes
#else
int LocFileReload( LocFile *file,  char *path );
#endif
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

//
//
//

char *GetExtension( char *name );

//
//
//

char *GetExtensionPtr( char* name );

#endif
