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

#ifndef __UTIL_LIST_H__
#define __UTIL_LIST_H__

//
// List structure
//

typedef struct List
{
	void* data;
	struct List* next;
} List;

//
// Create List
//

List* CreateList();

//
// Add to List
//

void AddToList( List *list, void *data );

//
// Remove List
//

void FreeList( List *list );

List* ListNew();

List* ListAdd( List* list, void* data );    // Add to the beginning of the list

void    ListAppend( List* list, void* data ); // Add to the end of the list

void    ListFree( List* list );

#endif	// __UTIL_LIST_H__

