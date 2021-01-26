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
	char					*p_Raw;        // The raw, resolved path
	unsigned int 			p_RawSize;    // Size of the raw path
	//char**       			p_Parts;      // The segments
	unsigned int 			p_Size;       // Number of segments
	char					*p_File;       // Last segment, if not empty ("path/" == empty last segment)
	char					*p_Extension;  // Extension, if any ("path/file.some" gives "some")
	FBOOL					p_IsAbsolute;
	FBOOL					p_Resolved;   // Are ../'s resolved completely?
	
	char 					*p_CopyRaw;	// copy of path, used by parts[]
	
	char 					*p_Parts[ PATH_MAX_PARTS ];
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
