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
 * file contain functitons related to local files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include <sys/types.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <util/log/log.h>
#include <network/locfile.h>
#include <util/string.h>
#include <util/buffered_string.h>

//#define _XOPEN_SOURCE 500
#include <ftw.h>
#include <unistd.h>
#include <sys/statvfs.h>

/**
 * Get filename from path
 *
 * @param path pointer to char table with path
 * @param len length of provided path
 * @return function returns pointer to char from which filename is started
 */
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

/**
 * Read a block of memory from LocFile
 *
 * @param file pointer to LocFile from which data will be readed
 * @param offset number of bytes from which data will be readed
 * @param size number of bytes to read
 * @return number of bytes readed from file
 */
inline int LocFileRead( LocFile* file, long long offset, long long size )
{
	if( file == NULL )
	{
		FERROR("Cannot read file which doesnt exist!\n");
		return -1;
	}

	file->buffer = (char *)FCalloc( size + 1, sizeof( char ) );
	if( file->buffer == NULL )
	{
		DEBUG("Cannot allocate memory for file\n");
		return 0;
	}
	
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

/**
 * Create new LocFile structure and read file from provided path
 *
 * @param path pointer to char table with path
 * @param flags additional flags used to open file
 * @return pointer to new LocFile when success, otherwise NULL
 */
LocFile* LocFileNew( char* path, unsigned int flags )
{
	if( path == NULL )
	{
		FERROR("File path is null\n");
		return NULL;
	}
	FILE* fp = fopen( path, "rb" );
	if( fp == NULL )
	{
		FERROR("Cannot open file %s (file does not exist?)..\n", path );
		return NULL;
	}
	
	struct stat st;
	if( stat( path, &st ) < 0 )
	{
		FERROR( "Cannot stat file.\n" );
		fclose( fp );
		return NULL;
	}
	
	if( S_ISDIR( st.st_mode ) )
	{
		FERROR( "Is a directory. Can not open.\n" );
		fclose( fp );
		return NULL;
	}
	DEBUG("Read local file %s\n", path );
	
	LocFile* fo = (LocFile*) FCalloc( 1, sizeof(LocFile) );
	if( fo != NULL )
	{
		int len = strlen( path );
		fo->lf_Path = StringDuplicateN( path, len );
		fo->lf_Filename = StringDuplicate( GetFileNamePtr( path, len ) );
		
		DEBUG("PATH: %s FILENAME %s\n", fo->lf_Path, fo->lf_Filename );
		
		memcpy(  &(fo->info),  &st, sizeof( struct stat) );
		//fstat( fp, &(fo->info));
	
		fo->fp = fp;
		//fseek( fp, 0L, SEEK_END );
		
		fseek( fp, 0, SEEK_END );
		long fsize = ftell( fp );
		fseek( fp, 0, SEEK_SET );  //same as rewind(f);
		fo->filesize = fsize;// st.st_size; //ftell( fp );

		if( flags & FILE_READ_NOW )
		{
			LocFileRead( fo, 0, fo->filesize );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for LocFile\n");
	}

	return fo;
}

/**
 * Create new LocFile structure and read file data from BufString
 *
 * @param path pointer to char table with path
 * @param bs pointer to BufString with file data
 * @return pointer to new LocFile when success, otherwise NULL
 */
LocFile* LocFileNewFromBuf( char* path, BufString *bs )
{
	DEBUG("\n------------------------------\n\n");
	
	if( path == NULL )
	{
		FERROR("File path is null\n");
		return NULL;
	}
	if( bs == NULL )
	{
		FERROR("BufString is NULL\n" );
		return NULL;
	}
	
	LocFile* fo = (LocFile*) FCalloc( 1, sizeof(LocFile) );
	if( fo != NULL )
	{
		int len = strlen( path );
		fo->lf_Path = StringDuplicateN( path, len );
		fo->lf_Filename = StringDuplicateN( path, len );//StringDuplicate( GetFileNamePtr( path, len ) );
		
		DEBUG("PATH: %s FILENAME %s\n", fo->lf_Path, fo->lf_Filename );

		fo->filesize = bs->bs_Size;
		
		//DEBUG("Converted \n\n%s\n\n", bs->bs_Buffer );

		if( ( fo->buffer = FMalloc( fo->filesize ) ) != NULL )
		{
			memcpy( fo->buffer, bs->bs_Buffer, fo->filesize );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for LocFile\n");
	}
	
	return fo;
}

/**
 * Reload content from file
 *
 * @param file pointer to LocFile structure 
 * @param path pointer to path from which data will be reloaded
 * @return 0 when success, otherwise error number
 */
int LocFileReload( LocFile *file,  char *path )
{
	DEBUG("File %s will be reloaded\n", path );
	//char *tmpPath = NULL;
	
	if( file->fp )
	{
		fclose( file->fp );
		file->fp = NULL;
	}
	
	//if( file->lf_Path )
	{
	//	tmpPath =  file->lf_Path;
	}
	
	if( file->buffer )
	{
		FFree( file->buffer );
		file->buffer = NULL;
	}
	
	FILE* fp = fopen( path, "rb" );
	if( fp == NULL )
	{
		FERROR("Cannot open file %s (file does not exist?)..\n", path );
		return -1;
	}
	
	struct stat st;
	if( stat( path, &st ) < 0 )
	{
		FERROR("Cannot run stat on file: %s!\n", path);
		return -2;
	}
	memcpy(  &(file->info),  &st, sizeof(stat) );
	
	file->fp = fp;
	//file->filesize = file->info.st_size; //ftell( fp );
	fseek( fp, 0, SEEK_END );
	long fsize = ftell( fp );
	fseek( fp, 0, SEEK_SET );  //same as rewind(f);
	file->filesize = fsize;

	LocFileRead( file, 0, file->filesize );
	
	return 0;
}

/**
 * Delete LocFile structure
 *
 * @param file pointer to LocFile which will be deleted
 */
void LocFileFree( LocFile* file )
{
	if( file == NULL )
	{
		FERROR("Cannot free file which doesnt exist\n");
	}
	
	if( file->lf_Filename != NULL )
	{
		FFree( file->lf_Filename );
	}
	if( file->fp )
	{
		fclose( file->fp );
		file->fp = NULL;
	}
	if( file->lf_Path )
	{
		FFree( file->lf_Path );
		file->lf_Path = NULL;
	}
	if( file->buffer )
	{
		FFree( file->buffer );
		file->buffer = NULL;
	}

	FFree( file );	
}

//
// Delete file/directory from local disk
// internal function
//

int UnlinkCB( const char *fpath, const struct stat *sb, int typeflag, struct FTW *ftwbuf )
{
	int rv = remove( fpath );
	if( rv != 0 )
	{
		DEBUG("Cannot delete %s\n", fpath );
	}
	
	return rv;
}

/**
 * Delete file with subdirectories
 *
 * @param path pointer to char table with path
 * @return 0 when success, otherwise error number
 */
int LocFileDeleteWithSubs( const char *path )
{
	return nftw( path, UnlinkCB, 64, FTW_DEPTH | FTW_PHYS );
}

/**
 * Function returns avaiable memory on disk
 *
 * @param path pointer to file path which will be used to check avaiable disk space
 * @return avaiable memory in bytes
 */
FLONG LocFileAvaiableSpace( const char *path )
{
	struct statvfs stat;
	
	if( statvfs( path, &stat ) != 0 )
	{
		return -1;
	}
	return stat.f_bsize * stat.f_bavail;
}

