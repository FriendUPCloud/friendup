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



#ifndef __CORE_EVENT_H__
#define __CORE_EVENT_H__

#include <core/types.h>
#include <util/hooks.h>
#include <core/thread.h>
#include <time.h>
#ifdef _WIN32

#else
#include <sys/time.h>
#include <unistd.h>
#endif
#include <core/thread.h>

//
//
//

typedef enum EventPriority
{
	PRIORITY_FREE,    // Used for unused events in pools, do not use!
	PRIORITY_LOW,     // Will be appended to the event queue
	PRIORITY_NORMAL,  // Will be placed after high and before low in the event queue
	PRIORITY_HIGH,    // Will be prepended to the event queue
	PRIORITY_CRITICAL // This skips the entire event loop, and executes immediatly. Use sparingly.
} EventPriority;

//
// OO event
//

typedef struct Event
{
	struct MinNode	node;		// pointer to next event

	struct _Object *e_Src;                // pointer to source object
    FULONG e_AttributeCheck;       // check argument set
    FLONG e_Value;                // if value is set do something

    struct _Object *e_Dst;
    FULONG e_DstMethodID;
    void *e_Data;
}Event;

//
// core system Event
//

typedef struct CoreEvent
{
	struct MinNode	node;
	time_t					ce_Time;
	time_t					ce_TimeDelta;
	int 						ce_RepeatTime;		// -1 repeat everytime, 0 - last repeat, n - number of repeats
	FUQUAD 				ce_ID;
	
	FThread 				*ce_Thread;
	int						(*ce_Function)( void *sb );
	void						*ce_Data;
}CoreEvent;



#endif
