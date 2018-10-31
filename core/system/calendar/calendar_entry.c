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

