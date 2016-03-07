/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __NETWORK_PATH_H__
#define __NETWORK_PATH_H__

#include <stdbool.h>
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
	BOOL					isAbsolute;
	BOOL					resolved;   // Are ../'s resolved completely?
	
	char 				*p_CopyRaw;	// copy of path, used by parts[]
	
	char 				*parts[ PATH_MAX_PARTS ];
} Path;

//
//
//

Path* PathNew( const char* path );                 // Parse a path

char*   PathBasename( char* path );                  // Returns path->parts[partsSize] (TODO)

char*   PathDirectory( char* path );                 // Returns PathJoin( path->parts, 0, partsSize - 1 ) (TODO)

void    PathSplit( Path* p );                      // All paths get split by default. Just use path->parts[n]

Path* PathJoin( Path* path1, Path* path2 );    // Combines two paths

void    PathResolve( Path* p );                    // "/somewhere/../elsewhere/oops/../here" -> "/elsewhere/here"

char*   PathExtension( Path* path );               // Returns extension, if any, otherwise null. (TODO)

void    PathMake( Path* path );                    // Overwrites raw path with parts

void    PathFree( Path* path );                    // Free the memory.

int     PathCheckExtension( Path* path, const char* ext );

#endif
