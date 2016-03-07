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

#include <sys/types.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <util/log/log.h>

#include <network/file.h>
#include <util/string.h>

//
//
//

inline char *GetFileNamePtr( char *path, int len )
{
	int i = len;
	while( i != 0 )
	{
		if( path[ i ] == '/' )
		{
			return &path[ i+1 ];
		}
		i--;
	}
	return path;
}

//
//
//

LocFile* LocFileNew( char* path, unsigned int flags )
{
	FILE* fp = fopen( path, "rb" );
	if( fp == NULL )
	{
		INFO("Cannot open file %s (file does not exist?)..\n", path );
		return NULL;
	}
	
	struct stat st;
	if( stat( path, &st ) < 0 )
	{
		INFO( "Cannot stat file.\n" );
		fclose( fp );
		return NULL;
	}
	
	if( S_ISDIR( st.st_mode ) )
	{
		INFO( "Is a directory. Can not open.\n" );
		fclose( fp );
		return NULL;
	}
	
	LocFile* fo = (LocFile*) calloc( 1, sizeof(LocFile) );
	if( fo != NULL )
	{
		int len = strlen( path );
		fo->lf_Path = StringDuplicateN( path, len );
		fo->lf_Filename = GetFileNamePtr( path, len );
	
		fo->fp = fp;
		fseek( fp, 0L, SEEK_END );
		fo->filesize = ftell( fp );

		if( flags & FILE_READ_NOW )
		{
			LocFileRead( fo, 0, fo->filesize );
		}
	}
	else
	{
		ERROR("Cannot allocate memory for LocFile\n");
	}

	return fo;
}

//
// Read a block of memory from the file
//

int LocFileRead( LocFile* file, long long offset, long long size )
{
	if( file == NULL )
	{
		ERROR("Cannot read file which doesnt exist!\n");
		return -1;
	}

	file->buffer = (char *)calloc( size + 1, sizeof( char ) );
	file->bufferSize = size;
	FILE* fp = file->fp;
	fseek( fp, offset, SEEK_SET );
	int result = fread( file->buffer, 1, size, fp );
	if( result < size )
	{
		return result; 
	}
	return 0;
}

//
//
//

void LocFileFree( LocFile* file )
{
	if( file == NULL )
	{
		ERROR("Cannot free file which doesnt exist\n");
	}
	
	if( file->fp )
	{
		fclose( file->fp );
		file->fp = NULL;
	}
	if( file->lf_Path )
	{
		free( file->lf_Path );
		file->lf_Path = NULL;
	}
	if( file->buffer )
	{
		free( file->buffer );
		file->buffer = NULL;
	}

	free( file );	
}

