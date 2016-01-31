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


#ifndef __CORE_EVENT_H__
#define __CORE_EVENT_H__

#include <core/types.h>
#include <util/hooks.h>
#include <core/thread.h>
#include <time.h>
#include <sys/time.h>
#include <unistd.h>

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
} EventPriority_t;

//
// OO event
//

typedef struct Event
{
	struct MinNode	node;		// pointer to next event

	struct _Object *e_Src;                // pointer to source object
    ULONG e_AttributeCheck;       // check argument set
    LONG e_Value;                // if value is set do something

    struct _Object *e_Dst;
    ULONG e_DstMethodID;
    void *e_Data;
}Event;

//
// core system Event
//

typedef struct CoreEvent
{
	struct MinNode	node;
	ULONG			eventId;	// special ID, there will be possibility to find it and remove from queue for example
	struct Hook 	hook;		// by hook we can pass many values and pointers, even call OO objects
}CoreEvent;

//
// Long time events (cron)
//

typedef struct CoreLTEvent
{
	struct MinNode	node;
	ULONG			eventId;	// special ID, there will be possibility to find it and remove from queue for example
	struct Hook 	hook;		// by hook we can pass many values and pointers, even call OO objects
	struct timeval			time;
	struct timeval			waitTime;
	FThread			*thread;
	BOOL			repeat;
}CoreLTEvent;


#endif
