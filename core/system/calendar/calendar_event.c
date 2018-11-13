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
