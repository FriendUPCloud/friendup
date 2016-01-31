
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
