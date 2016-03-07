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

#ifndef FILE_H_
#define FILE_H_

#include <sys/stat.h>
#include <stdbool.h>
#include <core/nodes.h>

#define FILE_CACHEABLE 0x00000001
#define FILE_READ_NOW  0x00000002
#define FILE_EXISTS    0x00000004

//
//
//

typedef struct LocFile
{
// "public":
	char						*lf_Filename; // Filename with extension
	char						*lf_Path;     // Absolute path

	unsigned long filesize;
	char*         buffer;
	unsigned long bufferSize;

// "private":
	FILE* fp;       // File pointer
	int   fd;       // File descriptor
	struct stat 				info;
	
	UQUAD					lf_FileUsed;
	struct MinNode		node;
} LocFile;

//
//
//

LocFile* LocFileNew( char* path, unsigned int flags ); // Can be relative, or absolute.

int    LocFileRead( LocFile* file, long long offset, long long size );

void    LocFileFree( LocFile* file );

#endif
