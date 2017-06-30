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

// code by Hogne Titlestad
// email: hogga@sub-ether.org

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

