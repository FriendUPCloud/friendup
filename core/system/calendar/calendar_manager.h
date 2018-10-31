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
/** @file
 * 
 *  CalendarManager definitions
 *
 * All functions related to CalendarManager structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */

#ifndef __SYSTEM_CALENDAR_CALENDAR_MANAGER__
#define __SYSTEM_CALENDAR_CALENDAR_MANAGER__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include "calendar_entry.h"
#include "calendar_event.h"
#include <mutex/mutex_manager.h>

//
// CalendarManager structure
//

typedef struct CalendarManager
{
	CalendarEntry			*c_CalEntries;
	CalendarEvent			*c_CalEvents;
	void					*c_SB;
	pthread_mutex_t			c_Mutex;
	FBOOL					c_Quit;
	FThread					*c_Thread;
} CalendarManager;

//
//
//

CalendarManager *CalendarManagerNew( void *sb );

//
//
//

int CalendarManagerInit( CalendarManager *cmd );

//
//
//

void CalendarManagerDelete( CalendarManager *cmd );

//
//
//

void CalendarManagerSort( CalendarManager *cm );

//
//
//

inline static void CalendarManagerAddEventToList( CalendarManager *cm, CalendarEvent *newEvent )
{
	FRIEND_MUTEX_LOCK( &(cm->c_Mutex) );
	CalendarEvent *actEvent = cm->c_CalEvents;
	
	if( actEvent == NULL )
	{
		cm->c_CalEvents = newEvent;
		return;
	}

	if( newEvent->ce_ActionTime < actEvent->ce_ActionTime )
	{
		newEvent->node.mln_Pred = NULL;
		newEvent->node.mln_Succ = (MinNode *)cm->c_CalEvents;
		cm->c_CalEvents = newEvent;
	}
	else
	{
		while( actEvent != NULL )
		{
			if( actEvent->node.mln_Succ != NULL )
			{
				CalendarEvent *e = (CalendarEvent *)actEvent->node.mln_Succ;
				if( newEvent->ce_ActionTime < e->ce_ActionTime )
				{
					newEvent->node.mln_Succ = (MinNode *)e;   // actEvent  < -- > newEvent < -- > e
					if( e != NULL )
					{
						e->node.mln_Pred = (MinNode *)newEvent;
					}
					actEvent->node.mln_Succ = (MinNode *)newEvent;
					newEvent->node.mln_Pred = (MinNode *)actEvent;
					break;
				}
			}
			else	// last even and good place was not found. Adding entry to end of the list
			{
				actEvent->node.mln_Succ = (MinNode *)newEvent;
				newEvent->node.mln_Pred = (MinNode *)actEvent;
			}
			actEvent = (CalendarEvent *)actEvent->node.mln_Succ;
		}
	}
	
	FRIEND_MUTEX_UNLOCK( &(cm->c_Mutex) );
}

//
//
//

void CalendarManagerEventLoop( FThread *ptr );

#endif // __SYSTEM_CALENDAR_CALENDAR_MANAGER__

