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

/**
 * @file
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
