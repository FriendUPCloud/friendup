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
 *  String based on list body + store data on disk
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 19/05/2020
 */

#include <core/types.h>
#include "list_string_disk.h"
#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/mman.h>

#ifndef NULL
#define NULL 0
#endif

//
// create new ListStringDisk
//

ListStringDisk *ListStringDiskNew()
{
	ListStringDisk *ls = FCalloc( 1, sizeof( ListStringDisk ) );
	if( ls != NULL )
	{
		ls->lsd_Last = ls;
		return ls;
	}
	return NULL;
}

//
// remove list and all entries
//

void ListStringDiskDelete( ListStringDisk *ls )
{
	if( ls != NULL )
	{
		// looks like everything is in memory
		if( ls->lsd_FileHandler <= 0 )
		{
			ListStringDisk *cur = ls->lsd_Next;
			ListStringDisk *rm = NULL;
			while( cur != NULL )
			{
				rm = cur;
				cur = cur->lsd_Next;

				if( rm->lsd_Data != NULL )
				{
					FFree( rm->lsd_Data );
				}
				FFree( rm );
			}
		
			if( ls->lsd_Data != NULL )
			{
				FFree( ls->lsd_Data );
			}
		}
		else	// looks like everything is in file
		{
			// data stored on disk
			if( ls->lsd_ListJoined == TRUE )	// if string was joined = was mapped!
			{
				if( ls->lsd_Data != NULL )
				{
					munmap( ls->lsd_Data, ls->lsd_Size );
					ls->lsd_Data = NULL;
				}
			}
			
			close( ls->lsd_FileHandler );
			unlink( ls->lsd_TemFileName );
			
		}
		FFree( ls );
	}
}

//
// add entry to list
//

FQUAD ListStringDiskAdd( ListStringDisk *ls, char *data, FLONG size )
{
	ListStringDisk *nls = FCalloc( 1, sizeof( ListStringDisk ) );
	if( ls != NULL && size > 0 && nls != NULL )
	{
		if( (ls->lsd_Size + size ) > LIST_STRING_DISK_MAX_IN_MEM )
		{
			DEBUG("[ListStringDisk] handler: %d", ls->lsd_FileHandler );
			if( ls->lsd_FileHandler <= 0 )	// file was not created, lets create it
			{
				ls->lsd_Size = 0;
				
				strcpy( ls->lsd_TemFileName, LIST_STRING_TEMP_FILE_TEMPLATE );
				char *tfname = mktemp( ls->lsd_TemFileName );
				
				if( strlen( ls->lsd_TemFileName ) == 0 )
				{
					FERROR("[ListStringDisk] mktemp failed!");
					FFree( nls );
					return -1;
				}
				else
				{
					ls->lsd_FileHandler = open( ls->lsd_TemFileName, O_RDWR | O_CREAT | O_EXCL, 0600 );
					if( ls->lsd_FileHandler == -1 )
					{
						FERROR("[ListStringDisk] temporary file open failed!");
						FFree( nls );
						return -1;
					}
				}
				
				// now lets release buffer!
				ListStringDisk *cur = ls->lsd_Next;
				ListStringDisk *rem = cur;

				while( cur != NULL )
				{
					rem = cur;
					cur = cur->lsd_Next;

					if( rem != NULL )
					{
						if( rem->lsd_Data != NULL )
						{
							int wrote = write( ls->lsd_FileHandler, rem->lsd_Data, rem->lsd_Size );
							ls->lsd_Size += rem->lsd_Size;
							FFree( rem->lsd_Data );
						}
						FFree( rem );
					}
				}
				ls->lsd_Next = NULL;
				ls->lsd_Last = NULL;
			}
			
			// lets write data!
			int wrote = write( ls->lsd_FileHandler, data, size );
			ls->lsd_Size += size;
			
			FFree( nls );
			return size;
		}
		else	// we can do everything in old way (in memory)
		{
			DEBUG("[ListStringDisk] data added to memory: %ld\n", size );
			if( ( nls->lsd_Data = FCalloc( size + 1, sizeof( char ) ) ) != NULL )
			{
				memcpy( nls->lsd_Data, data, size );
				nls->lsd_Size = size; // Remember to set the size

				ls->lsd_Last->lsd_Next = nls;
				ls->lsd_Last = nls;
				ls->lsd_Size += size;
				
				return size;
			}
			else
			{
				FFree( nls );
				return -1;
			}
		}
	}
	else
	{
		if( nls != NULL )
		{
			FFree( nls );
		}
		return -2;
	}
	return 0;
}

//
// join all lists to one string
//

int ListStringDiskJoin( ListStringDisk *ls )
{
	if( ls->lsd_FileHandler <= 0 )
	{
		ls->lsd_Data = FCalloc( (ls->lsd_Size + 1), sizeof(char));
		if( ls->lsd_Data != NULL )
		{
			ListStringDisk *cur = ls->lsd_Next;
			ListStringDisk *rem = cur;
			char *pos = ls->lsd_Data;

			while( cur != NULL )
			{
				memcpy( pos, cur->lsd_Data, cur->lsd_Size );

				pos += cur->lsd_Size;
				rem = cur;
				cur = cur->lsd_Next;

				if( rem != NULL )
				{
					if( rem->lsd_Data != NULL )
					{
						FFree( rem->lsd_Data );
					}
					FFree( rem );
				}
			}
			ls->lsd_Next = NULL;
			ls->lsd_Last = NULL;
		
			ls->lsd_Data[ ls->lsd_Size ] = 0;
		}
		else
		{
			FERROR("[ListStringDisk] Cannot allocate memory %ld\n", ls->lsd_Size );
	
			return 0;
		}
	}
	else	// all data were stored on disk before
	{
		FQUAD incomingBufferLength = lseek( ls->lsd_FileHandler, 0, SEEK_END );
		ls->lsd_Data = mmap( 0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, ls->lsd_FileHandler, 0 );
		
		if( ls->lsd_Data == MAP_FAILED )
		{
			Log( FLOG_ERROR, "[ListStringDisk] Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
			return 0;
		}
	}
	
	ls->lsd_ListJoined = TRUE;
	
	return 0;
	
}


