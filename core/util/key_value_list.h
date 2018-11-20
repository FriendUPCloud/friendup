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
 *  Simple linked list with key/value
 *
 *  @author PS  (Pawel Stefanski)
 *  @date created on 22/03/2017
 */

#ifndef __UTIL_KEY_VALUE_LIST_H__
#define __UTIL_KEY_VALUE_LIST_H__

#include <core/types.h>
#include <core/nodes.h>

typedef struct KeyValueList
{
	MinNode          node;
	char                 *key;
	char                 *value;
}KeyValueList;

//
//
//

KeyValueList *KeyValueListNew( );

//
//
//

KeyValueList *KeyValueListNewWithEntry( char *key, char *value );

//
//
//

int KeyValueListDelete( KeyValueList *list );

//
//
//

int KeyValueListDeleteAll( KeyValueList *list );

//
//
//

int KeyValueListSetValues( KeyValueList *list, char *key, char *value );

#endif // __UTIL_KEY_VALUE_LIST_H__
