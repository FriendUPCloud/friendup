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
 *  Calendar Entry definitions
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */

#ifndef __SYSTEM_CALENDAR_CALENDAR_ENTRY_H__
#define __SYSTEM_CALENDAR_CALENDAR_ENTRY_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>

//
// user structure
//

typedef struct CalendarEntry
{
	MinNode						node;
	FULONG						ce_ID;
	FULONG						ce_CalendarID;
	FULONG						ce_UserID;
	char						*ce_Title;
	char						*ce_Type;
	char						*ce_Description;

	time_t						ce_TimeFrom;
	time_t						ce_TimeTo;
	time_t						ce_Date;
	
	char						*ce_Source;
	FULONG						ce_RemoteID;
	char						*ce_MetaData;
	
	FLONG						*ce_RepeatTime;	// -1 never ends, >= number of times, 0- delete
	time_t						ce_RepeatDelay;	// in seconds. How much time is between next same event
} CalendarEntry;

//
//
//

CalendarEntry *CalendarEntryNew( );

//
//
//

int CalendarEntryInit( CalendarEntry *ce );

//
//
//

void CalendarEntryDelete( CalendarEntry *ce );

//
//
//

void CalendarEntryDeleteAll( CalendarEntry *ce );

/*
CREATE TABLE IF NOT EXISTS `FCalendar` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `CalendarID` bigint(20) NOT NULL DEFAULT '0',
  `UserID` bigint(20) NOT NULL DEFAULT '0',
  `Title` varchar(255) DEFAULT NULL,
  `Type` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `TimeFrom` DATETIME,
  `TimeTo` DATETIME,
  `Date` DATETIME,
  `Source` varchar(255) NOT NULL,
  `RemoteID` varchar(255) NOT NULL,
  `MetaData` text NOT NULL,
  `RepeatTime` bigint(20) NOT NULL DEFAULT '0',
  `RepeatDelay` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
*/

//
// SQL structure
//

static FULONG FCalendarEntryDesc[] = { 
    SQLT_TABNAME, (FULONG)"FCalendar",       
    SQLT_STRUCTSIZE, sizeof( struct CalendarEntry ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct CalendarEntry, ce_ID ), 
	SQLT_INT,     (FULONG)"CalendarID",        offsetof( struct CalendarEntry, ce_CalendarID ),
	SQLT_INT,     (FULONG)"UserID",    offsetof( struct CalendarEntry, ce_UserID ),
	SQLT_STR,     (FULONG)"Title",    offsetof( struct CalendarEntry, ce_Title ),
	SQLT_STR,     (FULONG)"Type",       offsetof( struct CalendarEntry, ce_Type ),
	SQLT_STR,     (FULONG)"Description",   offsetof( struct CalendarEntry, ce_Description ),
	SQLT_DATETIME,     (FULONG)"TimeFrom",  offsetof( struct CalendarEntry, ce_TimeFrom ),
	SQLT_DATETIME,     (FULONG)"TimeTo", offsetof( struct CalendarEntry, ce_TimeTo ),
	SQLT_DATETIME,     (FULONG)"Date", offsetof( struct CalendarEntry, ce_Date ),
	SQLT_STR,     (FULONG)"Source", offsetof( struct CalendarEntry, ce_Source ),
	SQLT_INT,     (FULONG)"RemoteID", offsetof( struct CalendarEntry, ce_RemoteID ),
	SQLT_STR,     (FULONG)"MetaData",    offsetof( struct CalendarEntry, ce_MetaData ),
	SQLT_INT,     (FULONG)"RepeatTime",    offsetof( struct CalendarEntry, ce_RepeatTime ),
	SQLT_INT,     (FULONG)"RepeatDelay",    offsetof( struct CalendarEntry, ce_RepeatDelay ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&CalendarEntryInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct CalendarEntry, node ),
	SQLT_END 
};


#endif // __SYSTEM_CALENDAR_CALENDAR_ENTRY_H__

