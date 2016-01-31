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

#ifndef __EXEC_NODES_H__
#define __EXEC_NODES_H__

#include <core/types.h>

typedef struct Node
{
    struct Node *ln_Succ, *ln_Pred;
    UBYTE	ln_Type;
    BYTE	ln_Pri;
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
