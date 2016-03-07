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
    ULONG		(*h_Function)( APTR p1, APTR p2, APTR p3 );			// hook contain also pointer to funtion
    APTR	    h_Entry;												// and parameters like this one
    APTR	    h_SubEntry;												// Secondary 
    APTR	    h_Data;													// Whatever you want 
};

// You can use this if you want for casting function pointers. 

typedef IPTR (*HOOKFUNC)();
/*
	AROS_UFHA(struct Hook *,    hook, A0),
	AROS_UFHA(APTR,             object, A2),
	AROS_UFHA(APTR,             message, A1)
*/

#endif //
