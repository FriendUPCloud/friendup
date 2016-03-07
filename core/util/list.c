/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

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
		ERROR("Cannot allocate memory in CreateList\n");
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
			ERROR("Cannot allocate memory in Addtolist\n");
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
		free ( tmp );
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
		ERROR("Cannot allocate memory in ListNew\n");
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
