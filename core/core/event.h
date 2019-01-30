/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/** @file event.h
 * 
 *  Event structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/2016
 * 
 * \ingroup EventManager
 */

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
	struct MinNode			node;		// pointer to next event

	struct _Object			*e_Src;                // pointer to source object
    FULONG					e_AttributeCheck;       // check argument set
    FLONG					e_Value;                // if value is set do something

    struct _Object			*e_Dst;
    FULONG					e_DstMethodID;
    void					*e_Data;
	char					*e_Name;
}Event;

//
// core system Event
//

typedef struct CoreEvent
{
	struct MinNode			node;
	time_t					ce_Time;
	time_t					ce_TimeDelta;
	int 					ce_RepeatTime;		// -1 repeat everytime, 0 - last repeat, n - number of repeats
	FUQUAD 					ce_ID;
	
	pthread_t				ce_Thread;
	FBOOL					ce_Quit;
	FBOOL					ce_Launched;
	int						(*ce_Function)( void *sb );
	void					*ce_Data;
	char					*ce_Name;
}CoreEvent;



#endif

/**@}*/
