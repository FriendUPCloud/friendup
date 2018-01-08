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
#ifndef __UTIL_HASHMAP_H__
#define __UTIL_HASHMAP_H__
 
#include <core/types.h>

//
 // TODO:
 //     Case-insensitive keys

//
// We need to keep keys and values
//

typedef struct HashmapElement{
	char* key;
	FBOOL inUse;
	void* data;
} HashmapElement;

//
// The hashmap
//

typedef struct Hashmap{
	unsigned int table_size;
	unsigned int size;
	HashmapElement *data;
} Hashmap;

//
// Return an empty hashmap. Returns NULL on faliure
//

Hashmap* HashmapNew();

//
// Takes the iterator value and runs with it.
// Any change to the hashmap (adding/removing) will invalidate the iterator.

HashmapElement* HashmapIterate( Hashmap* in, unsigned int* iterator );

//
// Add an element to the hashmap. Returns false on faliure
// 'key' MUST BE PERMANENTLY ALLOCATED AND NOT FREED AFTER CALLING THIS FUNCTION

FBOOL HashmapPut( Hashmap* in, char* key, void* value );

//
// Get an element from the hashmap. Return NULL if none found
//

HashmapElement* HashmapGet( Hashmap* in, char* key );

//
// Get pointer to data from Hashmap
//

void* HashmapGetData( Hashmap* in, const char* key );

//
// Hashmap clone
//

Hashmap *HashmapClone( Hashmap *hm );

//
// Hashmap add
//

int HashmapAdd( Hashmap *src, Hashmap *hm );

//
// UNIMPLEMENTED!!!
//

FBOOL HashmapRemove( Hashmap* in, char* key );

//
// Free the hashmap
//

void HashmapFree( Hashmap* in );

//
// Get the current size of a hashmap
//

int HashmapLength( Hashmap* in );

#endif
