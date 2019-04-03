/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __UTIL_INT_LIST_H__
#define __UTIL_INT_LIST_H__
 
#include <core/types.h>
#include <core/nodes.h>

//
// Element List entry (int)
//

typedef struct IntListEl
{
	int64_t		i_Data;
	MinNode		node;
}IntListEl;

//
// Element List entry (int)
//

typedef struct UIntListEl
{
	uint64_t	i_Data;
	MinNode		node;
}UIntListEl;

//
// Element List entry
//

typedef struct StringListEl
{
	char		*s_Data;
	MinNode		node;
}StringListEl;

//
//
//

IntListEl *ILEParseString( char *str );

UIntListEl *UILEParseString( char *str );

StringListEl *SLEParseString( char *str );

#endif // __UTIL_INT_LIST_H__
