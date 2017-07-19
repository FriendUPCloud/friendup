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
 *  Definitions used by the Friend Core system of event
 *
 *  This system is not used in the current version of Friend Core.
 *
 *  @author PS (Pawel Stefanski)
 *  @date first pushed on 10/02/2015
 */

#ifndef __CORE_EVENT_MANAGER_H__
#define __CORE_EVENT_MANAGER_H__

#include <core/types.h>
#include <core/event.h>
#include <util/list.h>

//
// EventManager structure
//

typedef struct EventManager
{
	FUQUAD lastID;							///< last available event ID
	//struct List 			*eventTList;	// list of events , by types
	CoreEvent				*em_EventList;		///< pointer to the list of events
	FThread 				*em_EventThread;	///< pointer to the list of associated Friend threads
	FUQUAD				em_IDGenerator;		// ID generator
	void						*em_SB;
	void						*em_Function;
}EventManager;

//
// functions
//


EventManager *EventManagerNew( void *sb );

//
// EventManager destructor
//

void EventManagerDelete( EventManager *e );

//
// get new ID for event
//

FUQUAD EventGetNewID( EventManager *em );

//
// add new event
//

int EventAdd( EventManager *em, void *function, void *data, time_t nextCall, time_t deltaTime, int repeat );

//
// check event
//

CoreEvent *EventCheck( EventManager *em, CoreEvent *ev, time_t ti );



#endif //__CORE_EVENT_MANAGER_H__
