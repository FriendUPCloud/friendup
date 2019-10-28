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
 *  Worker body
 *
 * file contain all functitons related to workers
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/2015
 * 
 * \ingroup FriendCoreWorker
 * @{
 */

#include "worker.h"
#include "worker_manager.h"
#include <util/log/log.h>
#include <sys/time.h>
#include <time.h>
#include <mutex/mutex_manager.h>

/**
 * Create new worker
 *
 * @param nr id of new worker
 * @return pointer to new Worker structure when success, otherwise NULL
 */
Worker *WorkerNew( int nr )
{
	Worker *wrk = ( Worker *)FCalloc( 1, sizeof( Worker ) );
	
	if( wrk != NULL )
	{
		//DEBUG("[WorkerThread] Worker CREATED %d\n", nr );
		
		wrk->w_State = W_STATE_CREATED;
		wrk->w_Nr = nr;
		
		pthread_mutex_init( &(wrk->w_Mut), NULL );
		pthread_cond_init( &(wrk->w_Cond), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for worker\n");
		return NULL;
	}

	return wrk;
}

/**
 * Create new worker
 *
 * @param w pointer to worker
 */
void WorkerDelete( Worker *w )
{
	if( w != NULL )
	{
		if( w->w_Thread )
		{
			int count = 0;
			w->w_Quit = TRUE;

			while( w->w_State != W_STATE_TO_REMOVE )
			{
				if( FRIEND_MUTEX_LOCK( &(w->w_Mut) ) == 0 )
				{
					pthread_cond_signal( &(w->w_Cond) ); // <- wake up!!
					FRIEND_MUTEX_UNLOCK( &(w->w_Mut) );
				}
				
				//DEBUG("[WorkerThread] State %d quit %d WRKID %d\n", w->w_State, w->w_Quit, w->w_Nr );
				if( count++ > 1 )
				{
					usleep( 10000 );
				}
			}
			ThreadDelete( w->w_Thread );
		}
		
		// Free up the mutex elements
		if( w->w_State )
		{
			pthread_cond_destroy( &(w->w_Cond) );
			pthread_mutex_destroy( &(w->w_Mut) );
		}
		
		//DEBUG("[WorkerThread] Worker deleted: %d\n", w->w_Nr );
		FFree( w );
	}
}

//
// definition
//

void WorkerThread( void *w );

/**
 * Run Worker
 *
 * @param wrk pointer to Worker
 * @return 0 when success, otherwise error number
 */
int WorkerRun( Worker *wrk )
{
	if( wrk == NULL )
	{
		FERROR("[WorkerRun] Cannot run worker, worker is NULL\n");
		return 1;
	}
	
	clock_t start, end;

	start = clock();
	
	size_t stacksize = 16777216; //16 * 1024 * 1024;
	pthread_attr_t attr;
	pthread_attr_init( &attr );
	pthread_attr_setstacksize( &attr, stacksize );

	wrk->w_Thread = ThreadNew( WorkerThread, wrk, TRUE, &attr );
	if( wrk->w_Thread == NULL )
	{
		FERROR("[WorkerRun] Cannot create thread!\n");
		WorkerDelete( wrk );
		return -1;
	}
	
	end = clock();
    wrk->w_WorkMicros = end - start;
    wrk->w_WorkSeconds = wrk->w_WorkMicros / 1000000;
	
	return 0;
}

/**
 * Worker thread
 *
 * @param w pointer to Worker FThread
 */
void WorkerThread( void *w )
{
	FThread *thread = (FThread *)w;
	Worker *wrk = (Worker *)thread->t_Data;
	wrk->w_State = W_STATE_RUNNING;
	
	wrk->w_ThreadPTR = pthread_self();

	// Run until quit
	while( TRUE )
	{
		if( wrk->w_Quit == TRUE )
		{
			break;
		}

		if( FRIEND_MUTEX_LOCK( &(wrk->w_Mut) ) == 0 )
		{
			DEBUG("W_STATE_WAITING\n");
			wrk->w_State = W_STATE_WAITING;
			FRIEND_MUTEX_UNLOCK( &(wrk->w_Mut) );
		}

		if( FRIEND_MUTEX_LOCK( &(wrk->w_Mut) ) == 0 )
		{
			DEBUG("Before condition\n");
			pthread_cond_wait( &(wrk->w_Cond), &(wrk->w_Mut) );
			DEBUG("Got cond call\n");
			FRIEND_MUTEX_UNLOCK( &(wrk->w_Mut) );
			
			if( wrk->w_Function != NULL && wrk->w_Data != NULL )
			{
				wrk->w_Function( wrk->w_Data );
				DEBUG("Function finished\n");

				if( FRIEND_MUTEX_LOCK( &(wrk->w_Mut) ) == 0 )
				{
					wrk->w_State = W_STATE_COMMAND_CALLED;
					wrk->w_Data = NULL;
					wrk->w_Function = NULL;
					
 					DEBUG("W_STATE_COMMAND_CALLED\n");
					FRIEND_MUTEX_UNLOCK( &(wrk->w_Mut) );				
				}
			}
			else
			{
				if( FRIEND_MUTEX_LOCK( &(wrk->w_Mut) ) == 0 )
				{
					wrk->w_State = W_STATE_COMMAND_CALLED;
					DEBUG("W_STATE_COMMAND_CALLED\n");
					FRIEND_MUTEX_UNLOCK( &(wrk->w_Mut) );				
				}
			}
		}
		else
		{
			FERROR("[WorkerThread] Cannot lock!\n");
		}

		if( wrk->w_Quit == TRUE ) 
		{
			break;
		}

		// Let others come to..
		usleep( 100 );
	}
	
	wrk->w_Function = NULL;
	wrk->w_Data = NULL;
	wrk->w_State = W_STATE_TO_REMOVE;
	thread->t_Launched = FALSE;
}

/**@}*/
