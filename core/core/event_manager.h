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
 *  Definitions used by the Friend Core system of event
 *
 *  This system is not used in the current version of Friend Core.
 *
 *  @author PS (Pawel Stefanski)
 *  @date first pushed on 10/02/2015
 * 
 * \ingroup EventManager Event manager
 * @{
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
	//struct List 				*eventTList;	// list of events , by types
	CoreEvent					*em_EventList;		///< pointer to the list of events
	FThread 					*em_EventThread;	///< pointer to the list of associated Friend threads
	FUQUAD						em_IDGenerator;		// ID generator
	void						*em_SB;
	void						*em_Function;
	pthread_mutex_t				em_Mutex;
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

int EventAdd( EventManager *em, char *name, void *function, void *data, time_t nextCall, time_t deltaTime, int repeat );

//
// check event
//

CoreEvent *EventCheck( EventManager *em, CoreEvent *ev, time_t ti );



#endif //__CORE_EVENT_MANAGER_H__

/**@}*/
// End of EventManager Doxygen group
