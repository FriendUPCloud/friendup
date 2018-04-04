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
 * Worker-Manager: handles a set of workers
 *
 * @author TW (Thomas Wollburg)
 * @author HT (Hogne Tildstad)
 * @author PS (Pawel Stefansky)
 * @date first push by PS (10/02/2015)
 * @sa worker.c worker.h
 * 
 * \defgroup FriendCoreWorker Workers
 * \ingroup FriendCore
 * @{
 */

#include "worker_manager.h"
#include <system/systembase.h>

/**
 * Creates a new Worker-Manager
 *
 * This function does all the initialization and launches the workers.
 *
 * @param number maximum number of t workers handled byt the Worker-Manager
 * @return pointer to the Friend Worker-Manager structure
 * @return NULL in case of errors
 */
WorkerManager *WorkerManagerNew( int number )
{
	WorkerManager *wm = NULL;
	
	DEBUG( "[WorkerManager] Starting worker manager!\n" );
	
	if( ( wm = FCalloc( 1, sizeof( WorkerManager ) ) ) != NULL )
	{
		int i = 0;
		
		wm->wm_LastWorker = 0;
		wm->wm_MaxWorkers = number;
		pthread_mutex_init( &wm->wm_Mutex, NULL );
		
		if( ( wm->wm_Workers = FCalloc( wm->wm_MaxWorkers, sizeof(Worker *) ) ) != NULL )
		{
			for( ; i < wm->wm_MaxWorkers; i++ )
			{
				wm->wm_Workers[ i ] = WorkerNew( i ); 
				WorkerRun( wm->wm_Workers[ i ]  ); 
			}
		}
		else
		{
 			FERROR( "[WorkerManager] Cannot allocate memory for workers\n" );
			FFree( wm );
			return NULL;
		}
	}
	else
	{
		FERROR( "[WorkerManager] Cannot allocate memory for WorkerManager\n" );
		return NULL;
	}
	
	Log( FLOG_INFO, "[WorkerManager] started %d threads\n", wm->wm_MaxWorkers );
	
	return wm;
}

/**
 * Destroys a Worker-Manager and all associated workers.
 *
 * @param wm pointer to the WorkerManager structure to destroy
 */
void WorkerManagerDelete( WorkerManager *wm )
{
	if( wm != NULL )
	{
		int i = 0;
		
		if( wm->wm_Workers )
		{
			for( ; i < wm->wm_MaxWorkers ; i++ )
			{
				WorkerDelete( wm->wm_Workers[ i ] );
			}
			FFree( wm->wm_Workers );
		}
		pthread_mutex_destroy( &wm->wm_Mutex );
		
		FFree( wm );
	}
}



//
// Start worker
//

static inline int WorkerRunCommand( Worker *w, void (*foo)( void *), void *d )
{

	if( w != NULL )
	{
		if( w->w_Thread != NULL )
		{
			{
				w->w_Function = foo;
				w->w_Data = d;
				
				if( pthread_mutex_lock( &(w->w_Mut) ) == 0 )
				{
					pthread_cond_signal( &(w->w_Cond) );
					pthread_mutex_unlock( &(w->w_Mut) );
				}
				int wait = 0;
				
				while( TRUE )
				{
					if( w->w_State == W_STATE_WAITING || w->w_State == W_STATE_COMMAND_CALLED )
					{
						break;
					}
					DEBUG("[WorkerRunCommand] --------waiting for running state: %d\n", wait++ );
					usleep( 10 );
				}
			}
		}
		else
		{
			//pthread_mutex_unlock( &(w->w_Mut) );
			FERROR("[WorkerRunCommand] Thread not initalized\n");
			return 1;
		}
	}

	return 0;
}



static int testquit = 0;

/**
 * Adds a new worker to the list of workers and sends a first initial call
 *
 * If the average workers-manager w_AverageWorkSeconds filed is not defined,
 * the new worker will be added with its own frequency.
 * This function waits for all the workers in the list to be completed
 * or exits after a 25*1500 milliseconds.
 *
 * @param wm pointer to the Worker-Manager structure
 * @param foo pointer to the message-handler
 * @param d pointer to the data associated with the call
 * @return 0
 * @todo FL>PS debug code still present here, exits Friend Core if some workers
 * 		are stuck!
 */
int WorkerManagerRun( WorkerManager *wm,  void (*foo)( void *), void *d, void *wrkinfo )
{
	int i = 0;
	int max = 0;
	Worker *wrk = NULL;
	
	if( wm == NULL )
	{
		FERROR("Work manager is NULL!\n");
		return -1;
	}
	
	while( TRUE )
	{
		wrk = NULL;

		pthread_mutex_lock( &wm->wm_Mutex );
		max++; wm->wm_LastWorker++;
		if( wm->wm_LastWorker >= wm->wm_MaxWorkers )
		{ 
			wm->wm_LastWorker = 0; 
		}

		// Safely test the state of the worker
		//if( pthread_mutex_trylock( &wm->wm_Workers[ wm->wm_LastWorker ]->w_Mut ) == 0 )
		{
			int lw = wm->wm_LastWorker;
			Worker *w1 = wm->wm_Workers[ lw ];
			if( w1->w_State == W_STATE_WAITING )
			{
				wrk = wm->wm_Workers[ wm->wm_LastWorker ];
			
				// Register worker index..
				//struct SocketThreadData *td = ( struct SocketThreadData *)d;
				//td->workerIndex = wm->wm_LastWorker;
			}
			//pthread_mutex_unlock( &wm->wm_Workers[ wm->wm_LastWorker ]->w_Mut );
		}
	
		if( wrk != NULL )
		{
			if( wm->w_AverageWorkSeconds == 0 )
			{
				wm->w_AverageWorkSeconds = wrk->w_WorkSeconds;
			}
			else
			{
				wm->w_AverageWorkSeconds += wrk->w_WorkSeconds;
				wm->w_AverageWorkSeconds /= 2;
			}
			wrk->w_Request = wrkinfo;
			WorkerRunCommand( wrk, foo, d );
			testquit = 0;
			pthread_mutex_unlock( &wm->wm_Mutex );
			
			break;
		}
		else
		{
			pthread_mutex_unlock( &wm->wm_Mutex );
			Log( FLOG_INFO, "[WorkManagerRun] Worker is busy, waiting\n");
			usleep( 100 );
		}
		
		if( max > wm->wm_MaxWorkers )
		{
			//Log( FLOG_INFO, "[WorkManagerRun] All workers are busy, waiting\n");
			testquit++;
			if( testquit > 25 )
			{
				Log( FLOG_ERROR, "[WorkManagerRun] Worker dispatch timeout, dropping client\n");
				return -1;
				//exit( 0 ); // <- die! only for debug
				testquit = 0;
				usleep( 15000 );
				//sleep( 2 );
			}
			usleep( 100 );
			max = 0;
			return -1;
		}
	} //end of infinite loop
	
	return 0;
}

/**
* For debug
*
*/
void WorkerManagerDebug( void *sb )
{
	SystemBase *locsb = (SystemBase *)sb;
	WorkerManager *wm = (WorkerManager *)locsb->sl_WorkerManager;
	int i;
	
	for( i=0 ; i < wm->wm_MaxWorkers ; i++ )
	{
		if( wm->wm_Workers[ i ] != NULL )
		{
			Http *request = (Http *)wm->wm_Workers[ i ]->w_Request;
			if( request != NULL )
			{
				DEBUG("[WorkerManager] %s pointer to session %p\n", request->content, request->h_UserSession );
			}
		}
	}
}

/**@}*/
