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
 *  BufferedStringDisk
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/08/2020
 */

#include "buffered_string_disk.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <core/types.h>
#include <unistd.h>
#include <errno.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/mman.h>

BufStringDisk *BufStringDiskNew(void)
{
	BufStringDisk *str = NULL;
	if( (str = FCalloc(sizeof(BufStringDisk), 1 )) != NULL)
	{
		//str->bsd_Size = 0;
		str->bsd_Bufsize = BUF_STRING_DISK_MAX;
		str->bsd_Buffer = FCalloc( (str->bsd_Bufsize+1), sizeof(char) );
		str->bsd_BufferIncrements = 0;
	}
	return str;
}

BufStringDisk *BufStringDiskNewSize(unsigned int initial_size)
{
	BufStringDisk *str = NULL;
		
	if( ( str = FCalloc( sizeof( BufStringDisk ), 1 ) ) != NULL )
	{
		str->bsd_Size = 0;
		str->bsd_Bufsize = initial_size;
		str->bsd_Buffer = FMalloc( str->bsd_Bufsize + 1 );
		if (str->bsd_Buffer)
		{
			str->bsd_Buffer[ 0 ] = 0;
			return str;
		}
		FFree( str );
	}
	return NULL;
}

void BufStringDiskDelete( BufStringDisk *bs)
{
	if( bs != NULL )
	{
		if( bs->bsd_FileHandler > 0 )
		{
			munmap( bs->bsd_Buffer, bs->bsd_Size );

			close( bs->bsd_FileHandler );
			unlink( bs->bsd_FileName );
		}
		else
		{
			if( bs->bsd_Buffer )
			{
				FFree( bs->bsd_Buffer );
				bs->bsd_Buffer = NULL;
			}
		}
		FFree( bs );
	}
}




unsigned int BufStringDiskAdd( BufStringDisk *bs, const char *string_to_append)
{
    if(string_to_append == NULL )
    {
        return 1;
    }
    unsigned int appendix_length = strlen(string_to_append);

    return BufStringDiskAddSize(bs, string_to_append, appendix_length);
}




unsigned int BufStringDiskAddSize( BufStringDisk *bs, const char *stringToAppend, unsigned int stringToAppendLength )
{
	if( bs == NULL || stringToAppend == NULL || stringToAppendLength < 1 )
	{
		FERROR("Cannot add NULL text!\n");
		return 1;
	}

	if ( (stringToAppendLength + bs->bsd_Size) >= bs->bsd_Bufsize )
	{ //not enough place in buffer - reallocate

		unsigned int increment = stringToAppendLength;

		if( bs->bsd_PreviousIncrement )
		{
			increment = bs->bsd_PreviousIncrement + stringToAppendLength;
		}
		//-------------------------------------------------

		bs->bsd_PreviousIncrement = increment;

		unsigned int newSize = bs->bsd_Bufsize + increment + 1;
		if( bs->bsd_FileHandler <= 0 )
		{
			// I must open file
			strcpy( bs->bsd_FileName, BUF_STRING_TEMP_FILE_TEMPLATE );
			char *tfname = mktemp( bs->bsd_FileName );
		
			if( strlen( bs->bsd_FileName ) == 0 )
			{
				FERROR("mktemp failed!");
				return -1;
			}
			else
			{
				bs->bsd_FileHandler = open( bs->bsd_FileName, O_RDWR | O_CREAT | O_EXCL, 0600 );
				if( bs->bsd_FileHandler == -1 )
				{
					FERROR("temporary file open failed: %s!", bs->bsd_FileName );
					return -1;
				}
			}
			// we must flush memory buffer
			int wrote = write( bs->bsd_FileHandler, bs->bsd_Buffer, bs->bsd_Size );
			// we must erase it, otherwise munmap will be called
			FFree( bs->bsd_Buffer );
			bs->bsd_Buffer = NULL;
		}
		else	// file is opened
		{
			
		}
		
		// now we can write 
		int wrote = write( bs->bsd_FileHandler, stringToAppend, stringToAppendLength );
		
		if( bs->bsd_Buffer != NULL )
		{
			munmap( bs->bsd_Buffer, bs->bsd_Size );
			bs->bsd_Buffer = NULL;
		}
		
		FQUAD incomingBufferLength = lseek( bs->bsd_FileHandler, 0, SEEK_END);
		bs->bsd_Buffer = mmap( 0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, bs->bsd_FileHandler, 0 );
		
		if( bs->bsd_Buffer == MAP_FAILED )
		{
			Log( FLOG_ERROR, "Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
			return -1;
		}
		bs->bsd_Size = incomingBufferLength;
		
		/*
		if( bs->bsd_FileHandler <= 0 )
		{
			

			char *tmp = mmap( 0, newSize, PROT_READ | PROT_WRITE, MAP_SHARED, bs->bsd_FileHandler, 0 );
		
			if( tmp != NULL ) //realloc succedeed and moved the data
			{
				int wrote = write( bs->bsd_FileHandler, bs->bsd_Buffer, bs->bsd_Bufsize );
				bs->bsd_Buffer = tmp;
				bs->bsd_Bufsize = newSize;
			}
			else
			{
				FERROR("Cannot allocate memory for buffer!\n");
				return -1;
			}
		}
		else	// file handler exist, we can write directly to file
		{
			if( bs->bsd_Buffer != NULL )
			{
				munmap( bs->bsd_Buffer, bs->bsd_Size );
				bs->bsd_Buffer = NULL;
			}
			
			FQUAD incomingBufferLength = bs->bsd_Size + stringToAppendLength;
			lseek( bs->bsd_FileHandler, 0, SEEK_END);
			DEBUG("->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ibl: %ld", incomingBufferLength );
			bs->bsd_Buffer = mmap( 0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, bs->bsd_FileHandler, 0 );
			
			if( bs->bsd_Buffer == MAP_FAILED )
			{
				Log( FLOG_ERROR, "Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
				return -1;
			}
			
			int wrote = write( bs->bsd_FileHandler, stringToAppend, stringToAppendLength );
			bs->bsd_Size = incomingBufferLength;
		}
		*/
	}
	else	// we can still store data in memory
	{
		DEBUG("[BufStringDiskAddSize]\n");
		// there is space in the buffer, we can put information there
		memcpy( bs->bsd_Buffer + bs->bsd_Size, stringToAppend, stringToAppendLength );
		bs->bsd_Size += stringToAppendLength;
		bs->bsd_Buffer[ bs->bsd_Size ] = '\0'; //force null termination
		DEBUG("[BufStringDiskAddSize] %ld\n", bs->bsd_Size );
	}
	
	return 0;
}

/**
 * Read file to buffered string
 * @param path path to file
 * @return BufStringDisk object in file inside or NULL when error appear
 */
BufStringDisk *BufStringDiskRead( const char *path )
{
	BufStringDisk *bs = NULL;
	FILE *fp = NULL;
	
	if( ( fp = fopen( path, "rb" ) ) != NULL )
	{
		fseek( fp, 0, SEEK_END );
		int fsize = ftell( fp );
		fseek( fp, 0, SEEK_SET );

		if( fsize > 0 )
		{
			bs = BufStringDiskNewSize( fsize+1 );
			if( bs != NULL )
			{
				fread( bs->bsd_Buffer, 1, fsize, fp );
				bs->bsd_Buffer[ fsize ] = 0;
			}
		}
		fclose( fp );
	}
	
	return bs;
}

/**
 * Write buffered string into file
 * @param bs pointer to BufStringDisk object
 * @param path path to file
 * @return 0 when success otherwise error number
 */
int BufStringDiskWrite( BufStringDisk *bs, const char *path )
{
	if( bs != NULL )
	{
		FILE *fp = NULL;
		if( ( fp = fopen( path, "wb" ) ) != NULL )
		{
			fwrite( bs->bsd_Buffer, 1 , bs->bsd_Size, fp );
			fclose( fp );
		}
	}
	else
	{
		DEBUG("Buffer is empty");
	}
	return 0;
}

