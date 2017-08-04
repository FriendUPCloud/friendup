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

/**
 * @file
 *
 *  Simple linked list with key/value
 *
 *  @author PS  (Pawel Stefanski)
 *  @date created on 22/03/2017
 */

#include "key_value_list.h"
#include "string.h"

/**
 * Create new KeyValueList
 *
 * @return pointer to new created KeyValueList
 */

KeyValueList *KeyValueListNew( )
{
	KeyValueList *ne = FCalloc( 1, sizeof( KeyValueList ) );
	if( ne != NULL )
	{
	}
	return ne;
}

/**
 * Create new KeyValueList with data
 *
 * @param key
 * @param value
 * @return pointer to new created KeyValueList
 */

KeyValueList *KeyValueListNewWithEntry( char *key, char *value )
{
	KeyValueList *ne = FCalloc( 1, sizeof( KeyValueList ) );
	if( ne != NULL )
	{
		ne->key = StringDuplicate( key );
		ne->value = StringDuplicate( value );
	}
	return ne;
}

/**
 * Delete KeyValueList entry
 *
 * @param list pointer to KeyValueList
 * @return 0 if success, otherwise error number
 */

int KeyValueListDelete( KeyValueList *list )
{
	if( list != NULL )
	{
		if( list->key != NULL )
		{
			FFree( list->key );
		}
		
		if( list->value != NULL )
		{
			FFree( list->value );
		}
		
		FFree( list );
	}
	return 0;
}

/**
 * Delete all KeyValueList
 *
 * @param list pointer to KeyValueList
 * @return 0 if success, otherwise error number
 */

int KeyValueListDeleteAll( KeyValueList *list )
{
	KeyValueList *rem = list;
	while( list != NULL )
	{
		rem = list;
		
		list = (KeyValueList *)list->node.mln_Succ;
		
		KeyValueListDelete( rem );
	}
	
	return 0;
}

/**
 * Set key and value on KeyValueList
 *
 * @param list pointer to KeyValueList
 * @param key
 * @param value
 * @return 0 if success, otherwise error number
 */

int KeyValueListSetValues( KeyValueList *list, char *key, char *value )
{
	if( list != NULL )
	{
		if( list->key != NULL )
		{
			FFree( list->key );
		}
		
		if( list->value != NULL )
		{
			FFree( list->value );
		}
		
		list->key = StringDuplicate( key );
		list->value = StringDuplicate( value );
	}
	return 0;
}

