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
 *  Calendar Entry body
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */


#include <core/types.h>
#include <core/nodes.h>

#include "calendar_entry.h"

/**
 * Create new CalendarEntry
 *
 * @return new CalendarEntry structure when success, otherwise NULL
 */
CalendarEntry *CalendarEntryNew( )
{
	CalendarEntry *ce;
	if( ( ce = FCalloc( 1, sizeof(CalendarEntry) ) ) != NULL )
	{

	}
	return ce;
}

/**
 * Initialize CalendarEntry structure
 *
 * @param ce pointer to CalendarEntry structure which will be initialized
 */
int CalendarEntryInit( CalendarEntry *ce )
{
	return 0;
}

/**
 * Remove CalendarEntry structure
 *
 * @param ce pointer to CalendarEntry structure which will be deleted
 */
void CalendarEntryDelete( CalendarEntry *ce )
{
	if( ce != NULL )
	{
		if( ce->ce_Title != NULL )
		{
			FFree( ce->ce_Title );
		}
		
		if( ce->ce_Type != NULL )
		{
			FFree( ce->ce_Type );
		}
		
		if( ce->ce_Description != NULL )
		{
			FFree( ce->ce_Description );
		}
		
		if( ce->ce_Source != NULL )
		{
			FFree( ce->ce_Source );
		}
		
		if( ce->ce_MetaData != NULL )
		{
			FFree( ce->ce_MetaData );
		}
		FFree( ce );
	}
}

/**
 * Remove CalendarEntry structure list
 *
 * @param ce pointer to CalendarEntry structure root list which will be deleted
 */
void CalendarEntryDeleteAll( CalendarEntry *ce )
{
	while( ce != NULL )
	{
		CalendarEntry *r = ce;
		
		ce = (CalendarEntry *)ce->node.mln_Succ;
		
		CalendarEntryDelete( r );
	}
}

