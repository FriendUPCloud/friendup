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
 *  CalendarEvent body
 *
 * All functions related to CalendarEvent structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include "calendar_event.h"


/**
 * Create new CalendarEvent
 *
 * @param ce pointer to CalendarEntry
 * @return new CalendarEvent structure when success, otherwise NULL
 */
CalendarEvent *CalendarEventNew( CalendarEntry *pce )
{
	CalendarEvent *ce;
	if( ( ce = FCalloc( 1, sizeof(CalendarEvent) ) ) != NULL )
	{
		ce->ce_CalEntry = pce;
		ce->ce_ActionTime = pce->ce_TimeFrom - CALENDAR_ENTRY_FIRST_NOTICE;	// make first call 15 minutes before event
		DEBUG("New Event created, action will be taken at: %lu\n", ce->ce_ActionTime );
	}
	return ce;
}

/**
 * Init CalendarEvent structure
 *
 * @param u pointer to CalendarEvent structure which will be initialized
 */
int CalendarEventInit( CalendarEvent *u )
{
	return 0;
}

/**
 * Remove CalendarEvent structure
 *
 * @param u pointer to CalendarEvent structure which will be deleted
 */
void CalendarEventDelete( CalendarEvent *u )
{
	if( u != NULL )
	{
		FFree( u );
	}
}

/**
 * Remove CalendarEvent structure list
 *
 * @param u pointer to CalendarEvent structure which will be deleted
 */
void CalendarEventDeleteAll( CalendarEvent *u )
{
	while( u != NULL )
	{
		CalendarEvent *r = u;
		
		u = (CalendarEvent *)u->node.mln_Succ;
		
		CalendarEventDelete( r );
	}
}
