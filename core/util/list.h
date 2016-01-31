/*

<LICENSE TEMPLATE>

*/
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

