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

#define _DEFAULT_SOURCE 1 //required for mmap flags

#include <sys/types.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <network/locfile.h>
#include <util/string.h>
#include <util/buffered_string.h>
#include <util/log/log.h>

#include <ftw.h>
#include <unistd.h>
#include <sys/statvfs.h>
#include <util/murmurhash3.h>

#if LOCFILE_USE_MMAP == 1
#include <sys/mman.h>
#endif

/**
 * Get filename from path
 *
 * @param path pointer to char table with path
 * @param len length of provided path
 * @return function returns pointer to char from which filename is started
 */
static inline char *GetFileNamePtr( char *path, int len )
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

#if LOCFILE_USE_MMAP == 0
/**
 * Read a block of memory from LocFile
 *
 * @param file pointer to LocFile from which data will be readed
 * @param offset number of bytes from which data will be readed
 * @param size number of bytes to read
 * @return number of bytes readed from file
 */
static inline int LocFileRead( LocFile* file, FILE *fp, long long offset, long long size )
{
	if( file == NULL )
	{
		FERROR("Cannot read file which doesnt exist!\n");
		return -1;
	}

	file->lf_Buffer = (char *)FCalloc( size + 1, sizeof( char ) );
	if( file->lf_Buffer == NULL )
	{
		DEBUG("Cannot allocate memory for file\n");
		return 0;
	}
	
	file->lf_FileSize = size;
	fseek( fp, offset, SEEK_SET );
	int result = fread( file->lf_Buffer, 1, size, fp );
	if( result < size )
	{
		return result; 
	}
	return 0;
}
#endif

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
		FERROR( "Cannot stat file: '%s'.\n", path );
		fclose( fp );
		return NULL;
	}
	
	if( S_ISDIR( st.st_mode ) )
	{
		FERROR( "'%s' is a directory. Can not open.\n", path );
		fclose( fp );
		return NULL;
	}
	DEBUG("Read local file %s\n", path );
	
	LocFile* fo = (LocFile*) FCalloc( 1, sizeof(LocFile) );
	if( fo != NULL )
	{
		fo->lf_PathLength = strlen( path );
		fo->lf_Path = StringDuplicateN( path, fo->lf_PathLength );
		fo->lf_Filename = StringDuplicate( GetFileNamePtr( path, fo->lf_PathLength ) );
		
		MURMURHASH3( fo->lf_Path, fo->lf_PathLength, fo->hash );
		
		DEBUG("PATH: %s\n", fo->lf_Path );
		
		memcpy(  &(fo->lf_Info),  &st, sizeof( struct stat) );

		fseek( fp, 0, SEEK_END );
		long fsize = ftell( fp );
		fseek( fp, 0, SEEK_SET );  //same as rewind(f);
		fo->lf_FileSize = fsize;// st.st_size; //ftell( fp );

		if( flags & FILE_READ_NOW )
		{
#if LOCFILE_USE_MMAP == 0
			LocFileRead( fo, fp, 0, fo->lf_FileSize );
#else

			fo->lf_Buffer = mmap(NULL/*address can be anywhere*/,
					fo->lf_FileSize/*map whole file*/,
					PROT_READ,
					MAP_SHARED | MAP_POPULATE,
					fileno(fp),
					0/*beginning of file*/);
			//DEBUG("***************** Mapping length: %d at %p\n", fo->lf_FileSize, fo->lf_Buffer);

#endif
		}
	}
	else
	{
		FERROR("Cannot allocate memory for LocFile\n");
	}
	
#if LOCFILE_USE_MMAP == 0
	fclose( fp );
#endif
	
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
		fo->lf_PathLength = strlen( path );
		fo->lf_Path = StringDuplicateN( path, fo->lf_PathLength );
		//fo->lf_Filename = StringDuplicateN( path, fo->lf_PathLength );//StringDuplicate( GetFileNamePtr( path, len ) );
		MURMURHASH3( fo->lf_Path, fo->lf_PathLength, fo->hash );
		
		DEBUG("PATH: %s \n", fo->lf_Path );

		fo->lf_FileSize = bs->bs_Size;
		
		if( ( fo->lf_Buffer = FMalloc( fo->lf_FileSize ) ) != NULL )
		{
			memcpy( fo->lf_Buffer, bs->bs_Buffer, fo->lf_FileSize );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for LocFile\n");
	}
	
	return fo;
}

#if LOCFILE_USE_MMAP == 0
/**
 * Reload content from file
 *
 * @param file pointer to LocFile structure 
 * @param path pointer to path from which data will be reloaded
 * @return 0 when success, otherwise error number
 */
int LocFileReload( LocFile *file, char *path )
{
	DEBUG("File %s will be reloaded\n", path );
	
	if( file->lf_Buffer )
	{
		FFree( file->lf_Buffer );
		file->lf_Buffer = NULL;
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
	memcpy(  &(file->lf_Info),  &st, sizeof(stat) );
	
	fseek( fp, 0, SEEK_END );
	long fsize = ftell( fp );
	fseek( fp, 0, SEEK_SET );  //same as rewind(f);
	file->lf_FileSize = fsize;

	LocFileRead( file, fp, 0, file->lf_FileSize );
	
	fclose( fp );
	
	return 0;
}
#endif

/**
 * Delete LocFile structure
 *
 * @param file pointer to LocFile which will be deleted
 */
void LocFileDelete( LocFile* file )
{
	if( file == NULL )
	{
		FERROR("Cannot free file which doesnt exist\n");
	}
	
	if( file->lf_Filename != NULL )
	{
		FFree( file->lf_Filename );
	}
	/*
	if( file->lf_Fp )
	{
		fclose( file->lf_Fp );
		file->lf_Fp = NULL;
	}
	*/
	if( file->lf_Path )
	{
		FFree( file->lf_Path );
		file->lf_Path = NULL;
	}
	if( file->lf_Buffer )
	{
#if LOCFILE_USE_MMAP == 0
		FFree( file->lf_Buffer );
#else
		munmap(file->lf_Buffer, file->lf_FileSize);
#endif
		file->lf_Buffer = NULL;
	}
	if( file->lf_Mime != NULL )
	{
		FFree( file->lf_Mime );
		file->lf_Mime = NULL;
	}

	FFree( file );	
}

//
// Delete file/directory from local disk
// internal function
//

int UnlinkCB( const char *fpath, const struct stat *sb __attribute__((unused)), int typeflag __attribute__((unused)), struct FTW *ftwbuf __attribute__((unused)))
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

/**
 * Function returns file extension
 *
 * @param name pointer to file path
 * @return extension as string
 */
char * GetExtension( char* name )
{
	char *reverse = FCalloc( 1, 16 ); // 16 characters extension!
	int cmode = 0, cz = 0;
	int len = strlen( name ) - 1;
	for( cz = len; cz > 0 && cmode < 16; cz--, cmode++ )
	{
		if( name[cz] == '.' )
		{
			break;
		}
		reverse[len-cz] = name[cz];
	}
	len = strlen( reverse );
	char *extension = FCalloc( 1, len + 1 );
	for( cz = 0; cz < len; cz++ )
	{
		extension[cz] = reverse[len-1-cz];
	}
	FFree( reverse );
	return extension;
}

#ifndef LOCFILE_USE_MMAP
#error "LOCFILE_USE_MMAP must be defined to 0 or 1"
#endif
