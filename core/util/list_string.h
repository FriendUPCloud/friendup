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
 *  String based on list definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */

#ifndef __UTIL_STRINGLIST_H__
#define __UTIL_STRINGLIST_H__

#include <stdio.h>
#include <stdlib.h>

typedef struct ListString
{
	char *ls_Data;
	long ls_Size;					// size == 0, first element without data
	
	FILE			*ls_File;			// poitner to file
	char			*ls_FName;		// pointer to file name
	struct ListString *ls_Next;
	struct ListString *ls_Last;		// we always hold pointer to last structure
}ListString;

//
// create list
//

ListString *ListStringNew();

//
// remove list and all entries
//

void ListStringDelete(ListString *ls);

//
// add entry to list
//

int ListStringAdd(ListString *add, char *data, int size);

//
// join all lists to one string
//

ListString *ListStringJoin(ListString *ls);

#endif