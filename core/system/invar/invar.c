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
 *  INVAR body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */
#include "invar.h"
#include <core/functions.h>

/**
 * Create new INVAREntry structure
 *
 * @param id of new created INVAREntry
 * @param name of INVAREntry
 * @param data which will be stored in INVAREntry under provided name
 * @return new INVAREntry structure or NULL when error will happen
 */
INVAREntry *INVAREntryNew( FULONG id, char *name, char *data )
{
	INVAREntry *ne;
	
	if( ( ne = FCalloc( 1, sizeof(INVAREntry) ) ) != NULL )
	{
		if( id != 0 )
		{
			ne->ne_ID = id;
		}
		ne->ne_Pointer = (FULONG) ne;
		if( name != NULL )
		{
			ne->ne_Name = StringDuplicate( name );
		}
		if( data != NULL )
		{
			ne->ne_Data = StringDuplicate( data );
		}
	}
	
	return ne;
}

/**
 * Delete INVAREntry structure
 *
 * @param ne of new created INVAREntry
 */
void INVAREntryDelete( INVAREntry *ne )
{
	if( ne != NULL )
	{
		if( ne->ne_Name != NULL )
		{
			FFree( ne->ne_Name );
		}
		
		if( ne->ne_Data != NULL )
		{
			FFree( ne->ne_Data );
		}
		
		FFree( ne );
	}
}

/**
 * Convert full INVAREntry to json
 *
 * @param ne of new created INVAREntry
 * @param buffer where string will be stored
 * @param len length of the buffer
 */
int INVAREntryToJSON( INVAREntry *ne, char *buffer, int len )
{
	return snprintf( buffer, len, "{ \"Name\":\"%s\", \"Pointer\":\"%p\", \"Data\":\"%s\"}", \
		ne->ne_Name, ne, ne->ne_Data );
}

/**
 * Convert INVAREntry to json
 *
 * @param ne of new created INVAREntry
 * @param buffer where string will be stored
 * @param len length of the buffer
 */
int INVAREntryJSONPTR( INVAREntry *ne, char *buffer, int len )
{
	return snprintf( buffer, len, "{ \"Name\":\"%s\", \"Pointer\":\"%p\"}", \
		ne->ne_Name, ne );
}

/**
 * Create new INVARGroup structure
 *
 * @param id of new created INVARGroup
 * @param name of INVARGroup
 * @return new INVARGroup structure or NULL when error will happen
 */
INVARGroup *INVARGroupNew( FULONG id, char *name )
{
	INVARGroup *ne;
	
	if( ( ne = FCalloc( 1, sizeof(INVARGroup) ) ) != NULL )
	{
		if( id != 0 )
		{
			ne->ng_ID = id;
		}
		ne->ng_Pointer = (FULONG)ne;
		ne->ng_Name = StringDuplicate( name );
		
		DEBUG("INVARGroupNew created: name %s ptr %p\n", ne->ng_Name, (void *)ne->ng_Pointer );
	}
	
	return ne;
}

/**
 * Delete INVARGroup structure
 *
 * @param ne pointer to INVARGroup
 */
void INVARGroupDelete( INVARGroup *ne )
{
	if( ne != NULL )
	{
		if( ne->ng_Name != NULL )
		{
			FFree( ne->ng_Name );
		}
		
		FFree( ne );
	}
}

/**
 * Convert INVARGroup to json
 *
 * @param ne of new created INVARGroup
 * @param buffer where string will be stored
 * @param len length of the buffer
 */
int INVARGroupToJSON( INVARGroup *ne, char *buffer, int len )
{
		return snprintf( buffer, len, "{ \"Name\":\"%s\", \"Pointer\":\"%p\"}", \
		ne->ng_Name, ne );
}

/**
 * Convert INVARGroup to json
 *
 * @param ne of new created INVARGroup
 * @param buffer where string will be stored
 * @param len length of the buffer
 */
int INVARGroupJSONPTR( INVARGroup *ne, char *buffer, int len )
{
		return snprintf( buffer, len, "{ \"Name\":\"%s\", \"Pointer\":\"%p\"}", \
		ne->ng_Name, ne );
}
