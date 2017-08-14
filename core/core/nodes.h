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

#ifndef __EXEC_NODES_H__
#define __EXEC_NODES_H__

#include <core/types.h>

typedef struct Node
{
    struct Node *ln_Succ, *ln_Pred;
    FUBYTE	ln_Type;
    FBYTE	ln_Pri;
    char	*ln_Name;
}Node;

typedef struct MinNode
{
    struct MinNode *mln_Succ, *mln_Pred;
}MinNode;


//
//		 Defines
//
// ln_Type
#define NT_UNKNOWN	0	// Unknown node 			    

#define NT_USER 	254	// User node types work down from here	   
#define NT_EXTENDED	255

//
//    Macros
//

#define SetNodeName(node,name) (((struct Node *)(node))->ln_Name = (char *)(name))
#define GetNodeName(node) (((struct Node *)(node))->ln_Name)

#endif
