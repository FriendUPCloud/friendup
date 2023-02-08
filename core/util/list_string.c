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
 *  String based on list body
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */

#include <core/types.h>
#include "list_string.h"
#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include <string.h>

#ifndef NULL
#define NULL 0
#endif

//
// create new ListString
//

ListString *ListStringNew()
{
	ListString *ls = FCalloc( 1, sizeof( ListString ) );
	if( ls != NULL )
	{
		ls->ls_Last = ls;
		return ls;
	}
	return NULL;
}

//
// remove list and all entries
//

void ListStringDelete( ListString *ls )
{
	if( ls != NULL )
	{
		ListString *cur = ls->ls_Next;
		ListString *rm = NULL;
		while( cur != NULL )
		{
			rm = cur;
			cur = cur->ls_Next;

			if( rm->ls_Data != NULL )
			{
				FFree( rm->ls_Data );
			}
			FFree( rm );
		}
		
		if( ls->ls_Data != NULL )
		{
			FFree( ls->ls_Data );
		}
		FFree( ls );
	}
}

//
// add entry to list
//

FLONG ListStringAdd( ListString *ls, char *data, FLONG size )
{
	ListString *nls = FCalloc( 1, sizeof( ListString ) );
	if( ls != NULL && size > 0 && nls != NULL && data != NULL )
	{
		if( ( nls->ls_Data = FCalloc( size + 1, sizeof( char ) ) ) != NULL )
		{
			memcpy( nls->ls_Data, data, size );
			nls->ls_Size = size; // Remember to set the size

			ls->ls_Last->ls_Next = nls;
			ls->ls_Last = nls;
			ls->ls_Size += size;
		}
		else
		{
			FFree( nls );
			return -1;
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

int ListStringJoin( ListString *ls )
{
	ls->ls_Data = FCalloc( (ls->ls_Size + 1), sizeof(char));
	if( ls->ls_Data != NULL )
	{
		ListString *cur = ls->ls_Next;
		ListString *rem = cur;
		char *pos = ls->ls_Data;

		while( cur != NULL )
		{
			memcpy( pos, cur->ls_Data, cur->ls_Size );

			pos += cur->ls_Size;
			rem = cur;
			cur = cur->ls_Next;

			if( rem != NULL )
			{
				if( rem->ls_Data != NULL )
				{
					FFree( rem->ls_Data );
				}
				FFree( rem );
			}
		}
		ls->ls_Next = NULL;
		ls->ls_Last = NULL;
		
		ls->ls_Data[ ls->ls_Size ] = 0;

		return 0;
	}
	FERROR("Cannot allocate memory %ld\n", ls->ls_Size );
	
	return 1;
}

