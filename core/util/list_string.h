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

#ifndef __STRINGLIST_H__
#define __STRINGLIST_H__

#include <stdio.h>
#include <stdlib.h>

typedef struct ListString
{
	char *ls_Data;
	int ls_Size;					// size == 0, first element without data
	struct ListString *ls_Next;
	struct ListString *ls_Last;		// we always hold pointer to last structure
}ListString;

// create list

ListString *ListStringNew();

// remove list and all entries

void ListStringDelete(ListString *ls);

// add entry to list

int ListStringAdd(ListString *add, char *data, int size);

// join all lists to one string

ListString *ListStringJoin(ListString *ls);

#endif
