/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  CalendarEvent definitions
 *
 * All functions related to CalendarEvent structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */

#ifndef __SYSTEM_CALENDAR_CALENDAR_EVENT__
#define __SYSTEM_CALENDAR_CALENDAR_EVENT__

#ifndef CALENDAR_ENTRY_FIRST_NOTICE
#define CALENDAR_ENTRY_FIRST_NOTICE (60*15)
#endif

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include "calendar_entry.h"

//
// CalendarEvent structure
//

typedef struct CalendarEvent
{
	MinNode					node;
	time_t					ce_ActionTime;
	CalendarEntry			*ce_CalEntry;
	FBOOL					ce_RemoveEntry;
} CalendarEvent;

//
//
//

CalendarEvent *CalendarEventNew( CalendarEntry *ce );

//
//
//

void CalendarEventDelete( CalendarEvent *ce );

//
//
//

void CalendarEventDeleteAll( CalendarEvent *u );

#endif // __SYSTEM_CALENDAR_CALENDAR_EVENT__


