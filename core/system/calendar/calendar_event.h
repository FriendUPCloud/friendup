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


