/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/*

	Hooks

*/

#ifndef __UTILITY_HOOKS_H__
#define __UTILITY_HOOKS_H__

#include <core/types.h>
#include <core/nodes.h>


// A callback Hook 

// I dont think wee need Hooks

struct Hook
{
    struct MinNode  h_MinNode;
    FULONG		(*h_Function)( APTR p1, APTR p2, APTR p3 );			// hook contain also pointer to funtion
    APTR	    h_Entry;												// and parameters like this one
    APTR	    h_SubEntry;												// Secondary 
    APTR	    h_Data;													// Whatever you want 
};

// You can use this if you want for casting function pointers. 


#endif //
