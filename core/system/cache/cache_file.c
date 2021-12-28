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
 * file contain functiton body related to cache files
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/08/2017
 */

#include "cache_file.h"
#include <util/string.h>
#include <util/murmurhash3.h>

/**
 * Create new CacheFile structure
 *
 * @param path path to File in friend which we want to cache
 * @return new CacheFile structure when success, otherwise NULL
 */
CacheFile* CacheFileNew( char* path )
{
	CacheFile *cf = FCalloc( 1, sizeof( CacheFile ) );
	if( cf != NULL )
	{
		char tmpPath[ 128 ];
		
		cf->cf_PathLength = strlen( path );
		cf->cf_Path = StringDuplicateN( path, cf->cf_PathLength );
		
		snprintf( tmpPath, sizeof( tmpPath ), "%s%ld%p%d", DEFAULT_TMP_DIRECTORY, time(NULL), cf, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );

		cf->cf_StorePathLength = strlen( tmpPath );
		cf->cf_StorePath = StringDuplicateN( tmpPath, cf->cf_StorePathLength );
		
		DEBUG("[CacheFileNew] path %s storepath %s\n", path, cf->cf_StorePath );

		MURMURHASH3( cf->cf_Path, cf->cf_PathLength, cf->hash );
	}
	return cf;
}

/**
 * Read cache file to internal buffer
 *
 * @param file pointer to cashed file which we want to read
 * @return 0 when success, otherwise error number
 */
int CacheFileRead( CacheFile* file )
{
	if( file != NULL )
	{
		if( file->cf_Fp != NULL )
		{
			fclose( file->cf_Fp );
		}
		
		file->cf_Fp = fopen( file->cf_StorePath, "rb" );
		if( file->cf_Fp == 0 )
		{
			FERROR("Cannot open file %s (file does not exist?)..\n", file->cf_StorePath );
			return -1;
		}
		
		if( file->cf_FileBuffer != NULL )
		{
			FFree( file->cf_FileBuffer );
		}
		
		fseek( file->cf_Fp, 0, SEEK_END );
		file->cf_FileSize = ftell( file->cf_Fp );
		fseek( file->cf_Fp, 0, SEEK_SET );  //same as rewind(f);
		
		file->cf_FileBuffer = (char *)FCalloc( file->cf_FileSize, sizeof( char ) );
		if( file->cf_FileBuffer != NULL )
		{
			fseek( file->cf_Fp, 0, SEEK_SET );
			unsigned int result = fread( file->cf_FileBuffer, 1, file->cf_FileSize, file->cf_Fp );
		
			if( result < file->cf_FileSize )
			{
				FFree( file->cf_FileBuffer );
				file->cf_FileBuffer = NULL;
				fclose( file->cf_Fp );
				file->cf_Fp = 0;
				return -3;
			}
		}
		else
		{
			DEBUG("Cannot allocate memory for file\n");
			fclose( file->cf_Fp );
			file->cf_Fp = 0;
			return -2;
		}
		fclose( file->cf_Fp );
		file->cf_Fp = 0;
	}
	return 0;
}

/**
 * Store cached file from buffer
 *
 * @param file pointer to cashed file which we want to store
 * @return 0 when success, otherwise error number
 */

int CacheFileStore( CacheFile* file )
{
	if( file != NULL )
	{
		if( file->cf_Fp != NULL )
		{
			fclose( file->cf_Fp );
		}
		
		file->cf_Fp = fopen( file->cf_StorePath, "wb" );
		if( file->cf_Fp == NULL )
		{
			FERROR("Cannot write file %s\n", file->cf_StorePath );
			return -2;
		}
		
		if( file->cf_FileBuffer != NULL )
		{
			fwrite( file->cf_FileBuffer, 1, file->cf_FileSize, file->cf_Fp );
			if( file->cf_FileBuffer != NULL )
			{
				FFree( file->cf_FileBuffer );
				file->cf_FileBuffer = NULL;
			}
		}
		
		fclose( file->cf_Fp );
		file->cf_Fp = NULL;
	}
	else
	{
		return -1;
	}
	return 0;
}

/**
 * Delete CacheFile structure
 *
 * @param file pointer to cashed file which we want to delete
 */
void CacheFileDelete( CacheFile* file )
{
	if( file != NULL )
	{
		if( file->cf_FileBuffer != NULL )
		{
			FFree( file->cf_FileBuffer );
		}
		
		if( file->cf_StorePath != NULL )
		{
			remove( file->cf_StorePath );
			FFree( file->cf_StorePath );
			file->cf_StorePath = NULL;
		}
		
		if( file->cf_Path != NULL )
		{
			FFree( file->cf_Path );
		}
		
		FFree( file );
	}
}

/**
 * Delete CacheFile linked list
 *
 * @param file pointer to first cashed file in linked list which we want to delete
 */
void CacheFileDeleteAll( CacheFile* file )
{
	while( file != NULL )
	{
		CacheFile *rm = file;
		file = (CacheFile *) file->node.mln_Succ;
		
		CacheFileDelete( rm );
	}
}
