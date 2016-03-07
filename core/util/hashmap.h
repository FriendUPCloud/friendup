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
 
#include <stdbool.h>
#include <core/types.h>

//
 // TODO:
 //     Case-insensitive keys

//
// We need to keep keys and values
//

typedef struct HashmapElement{
	char* key;
	BOOL inUse;
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

// Return an empty hashmap. Returns NULL on faliure
Hashmap* HashmapNew();

// Takes the iterator value and runs with it.
// Any change to the hashmap (adding/removing) will invalidate the iterator.
HashmapElement* HashmapIterate( Hashmap* in, unsigned int* iterator );

// Add an element to the hashmap. Returns false on faliure
BOOL HashmapPut( Hashmap* in, char* key, void* value );

// Get an element from the hashmap. Return NULL if none found
HashmapElement* HashmapGet( Hashmap* in, char* key );

// UNIMPLEMENTED!!!
BOOL HashmapRemove( Hashmap* in, char* key );

// Free the hashmap
void HashmapFree( Hashmap* in );

// Get the current size of a hashmap
int HashmapLength( Hashmap* in );

#endif
