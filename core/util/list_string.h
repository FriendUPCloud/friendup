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
 *  String based on list definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */

#ifndef __UTIL_STRINGLIST_H__
#define __UTIL_STRINGLIST_H__

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>

typedef struct ListString
{
	char					*ls_Data;
	FQUAD					ls_Size;					// size == 0, first element without data
	
	FILE					*ls_File;			// poitner to file
	char					*ls_FName;		// pointer to file name
	struct ListString		*ls_Next;
	struct ListString		*ls_Last;		// we always hold pointer to last structure
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

FLONG ListStringAdd(ListString *add, char *data, FLONG size);

//
// join all lists to one string
//

int ListStringJoin(ListString *ls);

#endif
