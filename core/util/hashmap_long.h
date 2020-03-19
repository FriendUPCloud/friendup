/*
 * Generic hashmap manipulation functions
 *
 * Originally by Elliot C Back - http://elliottback.com/wp/hashmap-implementation-in-c/
 *
 * Modified by Pete Warden to fix a serious performance problem, support strings as keys
 * and removed thread synchronization - http://petewarden.typepad.com
 *
 * Further modified for inclusion in the Friend project
 */
#ifndef __UTIL_HASHMAP_LONG_H__
#define __UTIL_HASHMAP_LONG_H__
 
#include <core/types.h>

#ifndef MAP_ENUMS
#define MAP_ENUMS

#define MAP_MISSING -3 // No such element
#define MAP_FULL -2    // Hashmap is full
#define MAP_OMEM -1    // Out of Memory
#define MAP_OK 0       // OK

#endif

//
// We need to keep keys and values
//

typedef struct HashmapElementLong
{
	char		*hel_Key;			// key
	FBOOL		hel_InUse;			// is field in use
	FLONG		hel_Data;			// entry data
	time_t		hel_LastUpdate;		// laste update time
} HashmapElementLong;

//
// The hashmap
//

typedef struct HashmapLong
{
	unsigned int hl_TableSize;			// max table size
	unsigned int hl_Size;				// current table size
	HashmapElementLong *hl_Data;		// data
} HashmapLong;

//
// Return an empty hashmap. Returns NULL on faliure
//

HashmapLong* HashmapLongNew();

//
// Takes the iterator value and runs with it.
// Any change to the hashmap (adding/removing) will invalidate the iterator.

HashmapElementLong* HashmapLongIterate( HashmapLong* in, unsigned int* iterator );

//
// Add an element to the hashmap. Returns false on faliure
// 'key' MUST BE PERMANENTLY ALLOCATED AND NOT FREED AFTER CALLING THIS FUNCTION

int HashmapLongPut( HashmapLong* in, char* key, FLONG value );

//
// Get an element from the hashmap. Return NULL if none found
//

HashmapElementLong* HashmapLongGet( HashmapLong* in, char* key );

//
// Get pointer to data from HashmapLong
//

FLONG HashmapLongGetData( HashmapLong* in, const char* key );

//
// HashmapLong clone
//

HashmapLong *HashmapLongClone( HashmapLong *hm );

//
// HashmapLong add
//

int HashmapLongAdd( HashmapLong *src, HashmapLong *hm );

//
// Remove
//

int HashmapLongRemove( HashmapLong* in, char* key );

//
// Free the hashmap
//

void HashmapLongFree( HashmapLong* in );

//
// Get the current size of a hashmap
//

int HashmapLongLength( HashmapLong* in );

//
//
//

void HashmapDeleteOldEntries( HashmapLong* in, int timeout );

#endif

// #ifdef __UTIL_HASHMAP_LONG_H__
