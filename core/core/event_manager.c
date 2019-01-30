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
 *  System of events integrated into Friend Core
 *
 *  Events are the counterpart of workers. They provide a mechanism to send
 *  delayed or repeated messages to Friend Code elements.
 *  This system is not used in the current version of Friend Core.
 *
 *  @author PS (Pawel Stefanski)
 *  @date first pushed on 10/02/2015
 * 
 * \defgroup EventManager Event manager
 * \ingroup FriendCore
 * @{
 */


#include <core/types.h>
#include <core/event_manager.h>
#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include <unistd.h>
#include <core/thread.h>
#include <time.h>
#include <unistd.h>
#include <util/string.h>
#include <mutex/mutex_manager.h>

void *EventManagerLoopThread( FThread *ptr );


static int threadsNo = 0;

/**
 * Creates a new Event Manager structure and launches its thread
 *
 * @return pointer to the newly created event manager
 */
EventManager *EventManagerNew( void *sb )
{
	EventManager *em = FCalloc( sizeof( EventManager) , 1 );
	DEBUG("[EventManager] start\n");
	if( em != NULL )
	{
		em->lastID = 0xf;
		em->em_SB = sb;
		pthread_mutex_init( &(em->em_Mutex), NULL );
		em->em_EventThread = ThreadNew( EventManagerLoopThread, em, TRUE, NULL );
	}
	else
	{
		Log( FLOG_FATAL, "Cannot allocate memory for EventManager!\n");
	}

	return em;
}

/**
 * Destroys a running event manager and the associated list of events
 *
 * @param em pointer to the EventManager structure
 */
void EventManagerDelete( EventManager *em )
{
	DEBUG("[EventManager] Delete\n");
	// remove long time events
	if( em != NULL )
	{
		em->em_EventThread->t_Quit = TRUE;
		while( TRUE )
		{
			if( em->em_EventThread->t_Launched == FALSE )
			{
				break;
			}
			usleep( 5000 );
		}
		
		if( em->em_EventThread != NULL )
		{
			DEBUG("[EventManager] Delete thread\n");
			ThreadDelete( em->em_EventThread );
		}
		DEBUG("[EventManager] thread removed\n");
		
		// waiting till all functions died
		
		while( TRUE )
		{
			if( threadsNo <= 0 )
			{
				break;
			}
			DEBUG("[EventManager] Not all threads were closed properly, waiting. ThreadsNo: %d\n", threadsNo );
			usleep( 500 );
		}
		
		CoreEvent *locnce = em->em_EventList;
		while( locnce != NULL )
		{
			CoreEvent *rem = locnce;
			locnce = (CoreEvent *)locnce->node.mln_Succ;

			if( rem->ce_Name != NULL )
			{
				FFree( rem->ce_Name );
			}
			FFree( rem );
		}
		
		pthread_mutex_destroy( &(em->em_Mutex) );
		
		FFree( em );
	}
	DEBUG("[EventManager] Delete end\n");
}

/**
 * Returns a free ID for a new event
 *
 * @param em pointer to the EventManager structure
 * @return ID to use
 */
FUQUAD EventGetNewID( EventManager *em )
{
	DEBUG("[EventManager] new event created %lu\n", em->lastID+1 );
	return em->lastID++;
}

/**
 * Launches a new event
 *
 * @param ptr pointer to the FThread structure of the Friend thread to send the event to
 */
void EventLaunch( CoreEvent *ptr )
{
	pthread_detach( pthread_self() );
	ptr->ce_Launched = TRUE;
	threadsNo++;
	
	if( ptr->ce_Function != NULL )
	{
		ptr->ce_Function( ptr->ce_Data );
	}
	
	threadsNo--;
	ptr->ce_Launched = FALSE;
	
	pthread_exit( 0 );
}

//
// wait thread
//

#define WAIT_SECOND 1						 //< Maximum wait time
#define WAIT_SECOND_1m 1000000 //< one million!

/**
 * Event Manager thread entry function
 *
 * @param ptr pointer to the FThread structure of the event manager
 * @todo This function waits a maximum of 10 seconds for each event to be completed. FL>PS !!!
 */
void *EventManagerLoopThread( FThread *ptr )
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
			if( FRIEND_MUTEX_LOCK( &(ce->em_Mutex) ) == 0 )
			{
				EventCheck( ce, locnce, stime );
				FRIEND_MUTEX_UNLOCK( &(ce->em_Mutex) );
			}
			
			locnce = (CoreEvent *) locnce->node.mln_Succ;
		}
		
		time_t end_time = WAIT_SECOND_1m - dtime;
		usleep( end_time );
		//printf("waiting..... %d\n", end_time );
		
		stime = etime;
		etime = time( NULL );
	}
	while( ptr->t_Quit != TRUE );
	
	ptr->t_Launched = FALSE;
	
	//pthread_exit( 0 );
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
	return NULL;
}

//
// add new event
//
/**
 * Add a new event to the list of events to handle
 *
 * @param em pointer to the event manager structure
 * @param name name of event
 * @param function pointer to function which will be called
 * @param data pointer to data which will be provided to function
 * @param nextCall delay before sending the message
 * @param repeat number of repetitions
 * @return 0 when success, otherwise error number
 */
int EventAdd( EventManager *em, char *name, void *function, void *data, time_t nextCall, time_t deltaTime, int repeat )
{
	CoreEvent *nce = FCalloc( sizeof( CoreEvent ), 1 );
	if( nce != NULL )
	{
		//FThread *nth = ThreadNew( function, em->em_SB, FALSE );
		//CoreEvent *retEv = NULL;
		//nce->ce_Thread = thread;
		nce->ce_Function = function;
		nce->ce_ID = ++em->em_IDGenerator;
		nce->ce_Time = nextCall;
		nce->ce_RepeatTime = repeat;
		nce->ce_TimeDelta = deltaTime;
		nce->ce_Data = data;
		nce->ce_Name = StringDuplicate( name );

		DEBUG("[EventManager] Add new event, ID: %lu\n", nce->ce_ID );

		nce->node.mln_Succ = (MinNode *) em->em_EventList;
		em->em_EventList = nce;
	}
	else
	{
		Log( FLOG_ERROR, "Cannot allocate memory for new Event\n");
		return -1;
	}

	return 0;
}

/**
 * Force call an event
 *
 * @param em pointer to the event manager structure
 * @param id ID of the event to call
 * @return NULL
 */
CoreEvent *EventCheck( EventManager *em, CoreEvent *ev, time_t ti )
{
	FBOOL removeEvent = FALSE;
	if( ev == NULL )
	{
		FERROR("Cannot do anything with empty event\n");
		return NULL;
	}
	//DEBUG("Check event: time %lu eventTime %lu\n", ti, ev->ce_Time );
	
	if( ti >= ev->ce_Time  )
	{
		ev->ce_Time += ev->ce_TimeDelta;		//we increse time amount after which call will be done
		
		if( ev->ce_RepeatTime == -1 )		// never ending loop
		{
			//ev->ce_Thread->t_Launched = FALSE;
		}
		else if( ev->ce_RepeatTime == 0 )	// last call, must be removed
		{
			removeEvent = TRUE;
		}
		else
		{
			//ev->ce_Thread->t_Launched = FALSE;
			ev->ce_RepeatTime--;
		}
		
		DEBUG("[EventManager] Start thread %p  SB ptr %p event name: %s\n", ev->ce_Function, em->em_SB, ev->ce_Name );
		//ThreadStart( ev->ce_Thread );
		//ev->ce_Data = em->em_SB;
		//ev->ce_Thread = ThreadNew( EventLaunch, ev, TRUE, NULL );
		pthread_create( &(ev->ce_Thread), NULL, (void *)( void * )EventLaunch, ev );
		//ThreadStart( ev->ce_Thread );
		DEBUG("[EventManager] Thread started\n");
	}
	
	if( removeEvent == TRUE )
	{
		
	}
	
	/*
	List *tmp = em->eventTList;
	CoreEvent *retEv = NULL;

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
			retEv->hook.h_Function( retEv->hook.h_Entry, retEv->hook.h_SubEntry, retEv->hook.h_Data );

			retEv = (CoreEvent *)retEv->node.mln_Succ;
		}
	}
	*/
	//return retEv;
	return NULL;
}

/**@}*/
