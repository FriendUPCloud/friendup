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
			
		}
		FFree( ls );
	}
}

//
// add entry to list
//

FLONG ListStringDiskAdd( ListStringDisk *ls, char *data, FLONG size )
{
	ListStringDisk *nls = FCalloc( 1, sizeof( ListStringDisk ) );
	if( ls != NULL && size > 0 && nls != NULL )
	{
		if( (ls->lsd_Size + size ) > LIST_STRING_DISK_MAX_IN_MEM )
		{
			if( ls->lsd_FileHandler <= 0 )	// file was not created, lets create it
			{
				
			}
			else
			{
				
			}
		}
		else	// we can do everything in old way (in memory)
		{
			if( ( nls->lsd_Data = FCalloc( size + 1, sizeof( char ) ) ) != NULL )
			{
				memcpy( nls->lsd_Data, data, size );
				nls->lsd_Size = size; // Remember to set the size

				ls->lsd_Last->lsd_Next = nls;
				ls->lsd_Last = nls;
				ls->lsd_Size += size;
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
		return -2;
	}
	return 0;
}

//
// join all lists to one string
//

ListStringDisk *ListStringDiskJoin( ListStringDisk *ls )
{
	ls->lsd_Data = FCalloc( ls->lsd_Size + 1, sizeof(char));
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

		return ls;
	}
	FERROR("Cannot allocate memory %ld\n", ls->lsd_Size );
	
	return NULL;
}


