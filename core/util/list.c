/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/*



*/

#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include <core/types.h>
#include "util/list.h"

//
//
//

List* CreateList()
{
	List *l = FCalloc( 1, sizeof( List ) );
	if( l == NULL )
	{
		FERROR("Cannot allocate memory in CreateList\n");
		return NULL;
	}
	//l->data = NULL;
	//l->next = NULL;
	return l;
}

void FreeList( List* list )
{
	List* l;
	while( list )
	{
		l = list;
		list = list->next;
		FFree( l );
	}
}

//
//
//

void AddToList( List *list, void *data )
{
	if( data == NULL )
	{
		return;
	}
	
	// First data
	if( list->l_Data == NULL )
	{
		list->l_Data = data;
		list->next = NULL;
	}
	// More data
	else
	{
		List *tmp = list;
	
		// Go to end of list
		while( tmp->next )
		{
			tmp = tmp->next;
		}

		// Make new data
		tmp->next = FCalloc( 1, sizeof( List ) );
		if( tmp->next == NULL )
		{
			FERROR("Cannot allocate memory in Addtolist\n");
			return;
		}
	
		// add data and set terminator
		tmp->next->l_Data = data;
		//tmp->next->next = NULL;
	}
}

/**
 * Create new list
 * 
 * @return new List structure entry
 */

List* ListNew()
{
	List *l = FCalloc( 1, sizeof( List ) );
	if( l == NULL )
	{
		FERROR("Cannot allocate memory in ListNew\n");
		return NULL;
	}
	l->l_Data = NULL;
	l->last = l;
	return l;
}

/**
 * Add entry to the list
 * 
 * @param list pointer to root of list
 * @param data data which will be stored in list
 * @return pointer to added entry list
 */

List* ListAdd( List** list, void* data )
{
	if( !(*list)->l_Data )
	{
		(*list)->l_Data = data;
		return (*list);
	}
	List *l = ListNew();
	l->next = (*list);
	(*list) = l;
	l->l_Data = data;
	return l;
}

/**
 * Delete list
 * 
 * @param list pointer to root of list
 */

void ListFree( List* list )
{
	List* l;
	while( list )
	{
		l = list;
		list = list->next;
		FFree( l );
	}
}

/**
 * Delete list with data
 * 
 * @param list pointer to root of list
 */

void ListFreeWithData( List* list )
{
	List* l;
	while( list )
	{
		l = list;
		list = list->next;
		if( l->l_Data != NULL )
		{
			FFree( l->l_Data );
		}
		FFree( l );
	}
}
