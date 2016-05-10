

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