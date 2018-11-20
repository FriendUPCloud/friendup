/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __NETWORK_PATH_H__
#define __NETWORK_PATH_H__

#include <core/types.h>

#define PATH_MAX_PARTS 256		// We dont think there will be more then 256 parts

//
//
//

typedef struct Path
{
	char*        		raw;        // The raw, resolved path
	unsigned int 	rawSize;    // Size of the raw path
	//char**       		parts;      // The segments
	unsigned int 	size;       // Number of segments
	char*				file;       // Last segment, if not empty ("path/" == empty last segment)
	char*		 		extension;  // Extension, if any ("path/file.some" gives "some")
	FBOOL					isAbsolute;
	FBOOL					resolved;   // Are ../'s resolved completely?
	
	char 				*p_CopyRaw;	// copy of path, used by parts[]
	
	char 				*parts[ PATH_MAX_PARTS ];
} Path;

//
//
//

Path* PathNew( const char* path );                 // Parse a path

//void    PathSplit( Path* p );                      // All paths get split by default. Just use path->parts[n]

Path* PathJoin( Path* path1, Path* path2 );    // Combines two paths

void    PathResolve( Path* p );                    // "/somewhere/../elsewhere/oops/../here" -> "/elsewhere/here"

char*   PathExtension( Path* path );               // Returns extension, if any, otherwise null. (TODO)

void    PathMake( Path* path );                    // Overwrites raw path with parts

void    PathFree( Path* path );                    // Free the memory.

int     PathCheckExtension( Path* path, const char* ext );

#endif
