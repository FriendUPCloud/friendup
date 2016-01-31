/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

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
	ULONG lastID;
	struct List *eventTList;	// list of events , by types
	CoreLTEvent *eventLT;
}EventManager;

//
// functions
//


EventManager *EventManagerNew();

//
// EventManager destructor
//

void EventManagerDelete( EventManager *e );

//
// get new ID for event
//

ULONG EventGetNewID( EventManager *em );

//
// add new event
//

CoreEvent *EventAdd( EventManager *em, ULONG id, ULONG *h_Function );

//
// Long Time Event Add
//

CoreLTEvent *EventLTEAdd( EventManager *em, ULONG id, struct timeval t, BOOL repeat, ULONG *h_Function );

//
// check event
//

CoreEvent *EventCheck( EventManager *em, ULONG id );



#endif //__CORE_EVENT_MANAGER_H__
