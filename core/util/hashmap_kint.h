/*
 * Generic hashmap manipulation functions
 * SEE: http://elliottback.com/wp/hashmap-implementation-in-c/
 */

#ifndef __UTIL_HASHMAP_KINT_H__
#define __UTIL_HASHMAP_KINT_H__

#include <core/types.h>

#define MAP_MISSING -3  /* No such element */
#define MAP_FULL -2     /* Hashmap is full */
#define MAP_OMEM -1     /* Out of Memory */
#define MAP_OK 0    /* OK */

/*
 * any_t is a pointer.  This allows you to put arbitrary structures in
 * the hashmap.
 */
typedef void *any_t;

/*
 * PFany is a pointer to a function that can take two any_t arguments
 * and return an integer. Returns status code..
 */
typedef int (*PFany)(any_t, any_t);

/*
 * HMapKInt is a pointer to an internally maintained data structure.
 * Clients of this package do not need to know how hashmaps are
 * represented.  They see and manipulate only HMapKInt's.
 */
typedef any_t HMapKInt;

/*
 * Return an empty hashmap. Returns NULL if empty.
*/
extern HMapKInt HashmapKIntNew();

/*
 * Iteratively call f with argument (item, data) for
 * each element data in the hashmap. The function must
 * return a map status code. If it returns anything other
 * than MAP_OK the traversal is terminated. f must
 * not reenter any hashmap functions, or deadlock may arise.
 */
extern int HashmapKIntIterate( HMapKInt in, PFany f, any_t item );

/*
 * Add an element to the hashmap. Return MAP_OK or MAP_OMEM.
 */
extern int HashmapKIntPut( HMapKInt in, int key, any_t value );

/*
 * Get an element from the hashmap. Return MAP_OK or MAP_MISSING.
 */
extern int HashmapKIntGet( HMapKInt in, int key, any_t *arg );

/*
 * Remove an element from the hashmap. Return MAP_OK or MAP_MISSING.
 */
extern int HashmapKIntRemove( HMapKInt in, int key );

/*
 * Get any element. Return MAP_OK or MAP_MISSING.
 * remove - should the element be removed from the hashmap
 */
extern int HashmapKIntGetOne( HMapKInt in, any_t *arg, int remove );

/*
 * Free the hashmap
 */
extern void HashmapKIntFree( HMapKInt in );

/*
 * Get the current size of a hashmap
 */
extern int HashmapKIntLength( HMapKInt in );

#endif // __UTIL_HASHMAP_KINT_H__

