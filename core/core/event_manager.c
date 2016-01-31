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

#include <core/types.h>
#include <core/event_manager.h>
#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include <unistd.h>

//
// EventManager constructor
//


EventManager *EventManagerNew()
{
	EventManager *em = calloc( sizeof( EventManager) , 1 );
	em->lastID = 0xf;

	em->eventTList = ListNew();

	return em;
}

//
// EventManager destructor
//

void EventManagerDelete( EventManager *em )
{
	// remove simple events

	List *tmp = em->eventTList;
	while( tmp != NULL )
	{
		CoreEvent *locce = (CoreEvent *) tmp->data;

		while( locce != NULL )
		{

			locce = (CoreEvent *)locce->node.mln_Succ;
		}

		tmp = tmp->next;
	}

	// remove long time events

	CoreLTEvent *locnce = em->eventLT;
	while( locnce->node.mln_Succ != NULL )
	{
		CoreLTEvent *rem = locnce;
		locnce = (CoreLTEvent *)locnce->node.mln_Succ;

		free( rem );
	}


	ListFree( em->eventTList );

	if( em != NULL )
	{
		free( em );
	}
}

//
// get new ID for event
//

ULONG EventGetNewID( EventManager *em )
{
	DEBUG("EVENT: new event created %ld\n", em->lastID+1 );
	return em->lastID++;
}

//
// add new event
//

CoreEvent *EventAdd( EventManager *em, ULONG id, ULONG *h_Function )
{
	List *tmp = em->eventTList;

	// first we must check list if kind of event already exist
	// if yes, then our new event should be added on the end
	// if no, then we create new entry in list

	CoreEvent *nce = calloc( sizeof( CoreEvent ), 1 );
	CoreEvent *retEv = NULL;
	nce->hook.h_Function = (void *)h_Function;
	nce->eventId = id;

	DEBUG("ADD NEW EVENT %ld\n", id );

	while( tmp != NULL )
	{
		CoreEvent *locce = (CoreEvent *) tmp->data;
		if( locce != NULL && locce->eventId == id )
		{
			// we found interested position for us
			retEv = locce;
			DEBUG("EVET: id found!\n");

			break;
		}

		tmp = tmp->next;
	}

	if( retEv == NULL )
	{
		DEBUG("EVENT didnt found root event %ld adding it to list\n", id );

		ListAdd( em->eventTList, (void *)nce );
	}else{
		// put our event on the end
		while( retEv->node.mln_Succ != NULL )
		{
			retEv = (CoreEvent *)retEv->node.mln_Succ;
		}

		retEv->node.mln_Succ = (struct MinNode *)nce;
		nce->node.mln_Pred = (struct MinNode *)retEv;
	}

	return nce;
}

//
// add new long time event
//

CoreLTEvent *EventLTEAdd( EventManager *em, ULONG id, struct timeval t, BOOL repeat, ULONG *h_Function )
{
	CoreLTEvent *nce = calloc( sizeof( CoreLTEvent ), 1 );
	nce->eventId = id;
	nce->repeat = repeat;
	nce->hook.h_Function = (void *)h_Function;
	nce->hook.h_Entry = (APTR)nce;

	nce->time.tv_sec = t.tv_sec;
	nce->time.tv_usec = t.tv_sec;

	nce->thread = ThreadNew( h_Function, nce );
	CoreLTEvent *locnce = em->eventLT;

	if( em->eventLT == NULL )
	{
		em->eventLT = nce;
	}else{

		while( locnce != NULL )
		{
			locnce = (CoreLTEvent *)locnce->node.mln_Succ;
		}

		locnce->node.mln_Succ = (struct MinNode *)nce;
		nce->node.mln_Pred = (struct MinNode *)locnce;
	}

	return nce;
}

//
// check event
//

CoreEvent *EventCheck( EventManager *em, ULONG id )
{
	List *tmp = em->eventTList;
	CoreEvent *retEv = NULL;

	DEBUG("EVENT: check");

	while( tmp != NULL )
	{
		CoreEvent *locce = (CoreEvent *) tmp->data;
		if( locce != NULL && locce->eventId == id )
		{
			// we found interested position for us
			retEv = locce;

			break;
		}

		tmp = tmp->next;
	}

	if( retEv != NULL )
	{
		while( retEv != NULL )
		{
			// we call function with interesting arguments for us
			DEBUG("EVENT: check, calling function %p\n", retEv->hook.h_Function );

			retEv->hook.h_Function( retEv->hook.h_Entry, retEv->hook.h_SubEntry, retEv->hook.h_Data );

			retEv = (CoreEvent *)retEv->node.mln_Succ;
		}
	}
	return retEv;
}

//
// wait thread
//

// declaration
void usleep( long );

void f( void *args )
{
	struct FThread *ft = (FThread *)args;
	CoreLTEvent *ce = (CoreLTEvent *)ft->t_Data;

	while( ft->t_Quit != TRUE )
	{
		//...do something
		gettimeofday( &(ce->time), NULL);

		long seconds  = ce->time.tv_sec  - ce->waitTime.tv_sec;
	    long useconds = ce->time.tv_usec - ce->waitTime.tv_usec;

	    long mtime = ((seconds) * 1000 + useconds/1000.0) + 0.5;

	    DEBUG( "Eventmanager: wait thread %ld\n", mtime );

	    usleep( mtime );

	    ce->hook.h_Function( ce->hook.h_Entry, ce->hook.h_SubEntry, ce->hook.h_Data );

	}

}
