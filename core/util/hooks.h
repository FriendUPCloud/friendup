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
