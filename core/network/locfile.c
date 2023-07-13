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
#include <errno.h>

#include <hardware/machine_info.h>

#if LOCFILE_USE_MMAP == 0
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
 * @param file pointer to LocFile from which data will be read
 * @param offset number of bytes from which data will be read
 * @param size number of bytes to read
 * @return number of bytes read from file
 */
static inline int LocFileRead( LocFile* file, FILE *fp, long long offset, long long size )
{
	int result = 0;
	if( file != NULL )
	{
		file->lf_Buffer = (char *)FMalloc( (size + 1) );
		if( file->lf_Buffer != NULL )
		{
			file->lf_Buffer[ size ] = 0;
	
			file->lf_FileSize = size;
			fseeko( fp, offset, SEEK_SET );
			result = fread( file->lf_Buffer, size, 1, fp );
		}
		else
		{
			DEBUG("Cannot allocate memory for file\n");
		}
	}
	else
	{
		FERROR("Cannot read file which doesnt exist!\n");
		return -1;
	}
	return result;
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
	
	struct stat st;
	if( stat( path, &st ) < 0 )
	{
		FERROR( "Cannot stat file: '%s'.\n", path );
		return NULL;
	}
	
	if( S_ISDIR( st.st_mode ) )
	{
		FERROR( "'%s' is a directory. Can not open.\n", path );
		return NULL;
	}
	
	FILE* fp = fopen( path, "rb" );
	if( fp == NULL )
	{
		char *err = strerror( errno );
		
		Log( FLOG_ERROR, "Cannot open file %s, errno: %s\n", path, err );
		if( err != NULL && strncmp( err, "Too many open files", 19 ) == 0 )
		{
			system("netstat -ptan | awk '{print $6 " " $7 }' | sort | uniq -c > netstat_raport.txt");
			system("sudo lsof | grep FriendCo > lsof_report.txt");
		
			debugFD();
		}
		return NULL;
	}
	
	LocFile* fo = (LocFile*) FCalloc( 1, sizeof(LocFile) );
	if( fo != NULL )
	{
		fo->lf_PathLength = strlen( path );
		fo->lf_Path = StringDuplicateN( path, fo->lf_PathLength );

		//MURMURHASH3( fo->lf_Path, fo->lf_PathLength, fo->hash );
		
		memcpy(  &(fo->lf_Info),  &st, sizeof( struct stat) );

		// Use big file compliant seek/tell functions
		fseeko( fp, 0, SEEK_END );
		off_t fsize = ftello( fp );
		fseeko( fp, 0, SEEK_SET );  //same as rewind(f);
		fo->lf_FileSize = (FULONG)fsize;// st.st_size; //ftell( fp );

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
		//MURMURHASH3( fo->lf_Path, fo->lf_PathLength, fo->hash );
		
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
	//DEBUG("File %s will be reloaded\n", path );
	
	if( file->lf_Buffer )
	{
		FFree( file->lf_Buffer );
		file->lf_Buffer = NULL;
	}
	
	FILE* fp = fopen( path, "rb" );
	if( fp != NULL )
	{
		struct stat st;
		if( stat( path, &st ) < 0 )
		{
			FERROR("Cannot run stat on file: %s!\n", path);
			fclose( fp );
			return -2;
		}
		memcpy(  &(file->lf_Info),  &st, sizeof(stat) );
	
		fseek( fp, 0, SEEK_END );
		long fsize = ftell( fp );
		fseek( fp, 0, SEEK_SET );  //same as rewind(f);
		file->lf_FileSize = fsize;

		LocFileRead( file, fp, 0, file->lf_FileSize );
	
		fclose( fp );
	}
	else
	{
		FERROR("Cannot open file %s (file does not exist?)..\n", path );
		return -1;
	}
	
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
	/*
	if( file->lf_Filename != NULL )
	{
		FFree( file->lf_Filename );
		file->lf_Filename = NULL;
	}
	*/
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
char *GetExtension( char* name )
{
	char *extension = NULL;
	char *reverse = FCalloc( 1, 16 ); // 16 characters extension!
	if( reverse != NULL )
	{
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
		extension = FCalloc( 1, len + 1 );
		for( cz = 0; cz < len; cz++ )
		{
			extension[cz] = reverse[len-1-cz];
		}
		FFree( reverse );
	}
	return extension;
}

/**
 * Function returns file extension
 *
 * @param name pointer to file path
 * @return pointer where extension start
 */
char *GetExtensionPtr( char* name )
{
	int cmode = 0, cz = 0;
	int len = strlen( name ) - 1;
	for( cz = len; cz > 0 && cmode < 16; cz--, cmode++ )
	{
		if( name[ cz ] == '.' )
		{
			return &name[ cz+1 ];
			break;
		}
	}

	return NULL;
}

#ifndef LOCFILE_USE_MMAP
#error "LOCFILE_USE_MMAP must be defined to 0 or 1"
#endif
