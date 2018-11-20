/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
