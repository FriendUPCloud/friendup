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
	if( list->data == NULL )
	{
		list->data = data;
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
		tmp->next->data = data;
		//tmp->next->next = NULL;
	}
}

//
//
//

void FreeList( List *list )
{
	List *tmp = NULL;
	do
	{
		tmp = list;
		list = list->next;
		FFree ( tmp );
	}
	while ( list != NULL );
}

//
//
//

List* ListNew()
{
	List *l = FCalloc( 1, sizeof( List ) );
	if( l == NULL )
	{
		FERROR("Cannot allocate memory in ListNew\n");
		return NULL;
	}
	l->data = NULL;
	//l->next = NULL;
	return l;
}

//
// Add to the list, returns the new list element, which can be used for appending
//

List* ListAdd( List* list, void* data )
{
	if( !list->data )
	{
		list->data = data;
		return list;
	}
	List *l = ListNew();
	list->next = l;
	l->data = data;
	return l;
}

//
//void    ListAppend( List* list, void* data ); // Add to the end of the list
//

void ListFree( List* list )
{
	List* l;
	while( list )
	{
		l = list;
		list = list->next;
		free( l );
	}
}
