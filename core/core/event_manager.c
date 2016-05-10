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
#include <core/thread.h>
#include <time.h>
#include <unistd.h>

void f( FThread *ptr );

//
// EventManager constructor
//

EventManager *EventManagerNew()
{
	EventManager *em = FCalloc( sizeof( EventManager) , 1 );
	DEBUG("EventManager start\n");
	if( em != NULL )
	{
		em->lastID = 0xf;
		em->em_EventThread = ThreadNew( f, em, TRUE );
	}
	else
	{
		ERROR("Cannot allocate memory for EventManager!\n");
	}

	return em;
}

//
// EventManager destructor
//

void EventManagerDelete( EventManager *em )
{
	DEBUG("EventManagerDelete\n");
	// remove long time events
	if( em != NULL )
	{
		if( em->em_EventThread )
		{
			ThreadDelete( em->em_EventThread );
		}
		DEBUG("EventManager thread removed\n");
		
		CoreEvent *locnce = em->em_EventList;
		while( locnce != NULL )
		{
			CoreEvent *rem = locnce;
			locnce = (CoreEvent *)locnce->node.mln_Succ;

			FFree( rem );
		}
		
		FFree( em );
	}
	DEBUG("EventManagerDelete end\n");
}

//
// get new ID for event
//

UQUAD EventGetNewID( EventManager *em )
{
	DEBUG("EVENT: new event created %ld\n", em->lastID+1 );
	return em->lastID++;
}

//
//
//

void EventLaunch( FThread *ptr )
{
	ptr->t_Launched = TRUE;
	CoreEvent *ce = (CoreEvent *) ptr->t_Data;
	if( ce != NULL )
	{
		//ce->ce_Thread->t_Function
	}
	
	ptr->t_Launched = FALSE;
	pthread_exit( 0 );
}

//
// wait thread
//

#define WAIT_SECOND 10

void f( FThread *ptr )
{
	EventManager *ce = (EventManager *)ptr->t_Data;
	//const unsigned long long nano = 1000000000;
	//unsigned long long t1, t2, lasttime;
	//struct timespec tm;
	
	time_t stime = time( NULL );
	time_t etime = stime;

	do
	{
		time_t dtime = etime - stime;
		
		CoreEvent *locnce = ce->em_EventList;
		while( locnce != NULL )
		{
			if( locnce->ce_Time >= stime && locnce->ce_Time < ( stime + dtime ) )
			{
				if( locnce->ce_RepeatTime == -1 )		// never ending loop
				{
					
				}
				else if( locnce->ce_RepeatTime == 0 )	// last call, must be removed
				{
					
					
				}
				else
				{
					locnce->ce_RepeatTime--;
				}
			}
			
			locnce = (CoreEvent *) locnce->node.mln_Succ;
		}
		
		time_t end_time = (WAIT_SECOND * 1000000  ) - dtime;
		usleep( end_time );
		//printf("witing..... %d\n", end_time );
		
		stime = etime;
		etime = time( NULL );
	}while( ptr->t_Quit != TRUE );
	
	ptr->t_Launched = FALSE;
	/*
	clock_t time = clock();

	while( ptr->t_Quit != TRUE )
	{
		clock_t dtime = clock() - time;
		
		CoreEvent *locnce = em->em_EventList;
		while( locnce != NULL )
		{
//			if( locnce->ce_Time.
			
			locnce = (CoreEvent *) locnce->node.mln_Succ;
		}
		
		clock_t end_time = (WAIT_SECOND * CLOCKS_PER_SEC  ) - dtime;
		usleep( end_time );
		//printf("witing..... %d\n", end_time );
		
		time = clock();
	}*/
		
		/*
	{
		//clock_gettime( CLOCK_REALTIME, &tm );
		t1 = tm.tv_nsec + tm.tv_sec * nano;

		long long tmp = lasttime+20000-now;
		if( tmp > 0 )
		{
			usleep( tmp );
		}

		//clock_gettime( CLOCK_REALTIME, &tm );
		t2 = tm.tv_nsec + tm.tv_sec * nano;
		
		clock_t start_time = clock();
	clock_t end_time = sec * 1000 + start_time;

		printf( "delay: %ld\n", ( t2 - t1 ) / 1000 );

	}*/
}

//
// add new event
//

CoreEvent *EventAdd( EventManager *em, UQUAD id, FThread *thread, time_t nextCall, int repeat )
{


	CoreEvent *nce = FCalloc( sizeof( CoreEvent ), 1 );
	if( nce != NULL )
	{
		//CoreEvent *retEv = NULL;
		nce->ce_Thread = thread;
		nce->ce_ID = id;
		nce->ce_Time = nextCall;
		nce->ce_RepeatTime = repeat;

		DEBUG("ADD NEW EVENT %ld\n", id );

		nce->node.mln_Succ = (MinNode *) em->em_EventList;
		em->em_EventList = nce;
	}
	else
	{
		ERROR("Cannot allocate memory for new Event\n");
	}

	return nce;
}

//
// check event
//

CoreEvent *EventCheck( EventManager *em, ULONG id )
{
	/*
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
	*/
	//return retEv;
	return NULL;
}

