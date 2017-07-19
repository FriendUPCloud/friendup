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


#include "worker.h"
#include "worker_manager.h"
#include <util/log/log.h>
#include <sys/time.h>
#include <time.h>

//
// Create worker
//

Worker *WorkerNew( int nr )
{
	Worker *wrk = ( Worker *)FCalloc( 1, sizeof( Worker ) );
	
	if( wrk != NULL )
	{
		DEBUG("Worker CREATED %d\n", nr );
		
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
	
	//DEBUG("WORKER created NR  %d\n", nr );
	
	return wrk;
}

//
// Remove worker
//

void WorkerDelete( Worker *w )
{
	if( w != NULL )
	{
		if( w->w_Thread )
		{
			w->w_Quit = TRUE;
			DEBUG( "Trying to delete worker!\n" );
			
			while( w->w_State != W_STATE_TO_REMOVE )
			{
				if( pthread_mutex_lock( &(w->w_Mut) ) == 0 )
				{
					pthread_cond_signal( &(w->w_Cond) ); // <- wake up!!
					pthread_mutex_unlock( &(w->w_Mut) );
				}
				
				DEBUG("State %d quit %d WRKID %d\n", w->w_State, w->w_Quit, w->w_Nr );
				usleep( 100000 );
			}
			ThreadDelete( w->w_Thread );
		}
		
		// Free up the mutex elements
		if( w->w_State )
		{
			pthread_cond_destroy( &(w->w_Cond) );
			pthread_mutex_destroy( &(w->w_Mut) );
		}
		
		DEBUG("Worker deleted: %d\n", w->w_Nr );
		FFree( w );
	}
}

//
// Thread
//

/*

void WorkerThread( void *w )
{
	FThread *thread = (FThread *)w;
	Worker *wrk = (Worker *)thread->t_Data;
	wrk->w_State = W_STATE_RUNNING;
	
	//DEBUG("Worker thread started %p\n", wrk);
	
	// Run until quit
	while( !wrk->w_Quit )
	{		
		//if( pthread_mutex_trylock( &(wrk->w_Mut) ) == 0 )
		{
			if( wrk->w_Quit )
			{
				DEBUG("[WorkerThread] Worker %d is quitting\n", wrk->w_Nr );
				//pthread_mutex_unlock( &(wrk->w_Mut) );
				break;
			}
			
			//pthread_mutex_lock( &(wrk->w_Mut) );
				//DEBUG("Condition reached\n");
			if( pthread_mutex_lock( &(wrk->w_Mut) ) == 0 )
			{
				wrk->w_State = W_STATE_WAITING;
			
				DEBUG("[WorkerThread] Worker %d is waiting\n", wrk->w_Nr );
				pthread_cond_wait( &(wrk->w_Cond), &(wrk->w_Mut) );
			
				pthread_mutex_unlock( &(wrk->w_Mut) );
			}
			
			DEBUG("[WorkerThread] Worker %d has waited\n", wrk->w_Nr );
			
			if( wrk->w_Quit ) 
			{
			
			*/
			
				/*
				DEBUG( "[WorkerThread] We got QUIT signal.\n" );
				if( wrk->w_Data )
				{
					
					// Abort and free up
					struct SocketThreadData *t = ( struct SocketThreadData *)wrk->w_Data;
					if( t )
					{
						if( t->sock )
						{
							SocketClose( ( struct Socket * )t->sock );
						}
						FFree( t );
					}
					
					DEBUG( "[WorkerThread] Closed socket on quit.\n" );
				}*/
				
				
				/*
				
				//pthread_mutex_unlock( &(wrk->w_Mut) );
				break;
			}
			else
			{
				//pthread_mutex_lock( &(wrk->w_Mut) );
				if( pthread_mutex_lock( &(wrk->w_Mut) ) == 0 )
				{
					wrk->w_State = W_STATE_RUNNING;
					pthread_mutex_unlock( &(wrk->w_Mut) );
				}
				
				if( wrk->w_Function != NULL && wrk->w_Data != NULL )
				{
					//struct SocketThreadData *t = ( struct SocketThreadData *)wrk->w_Data;
					//if( t != NULL )
					//{
					//	Socket *s = ( struct Socket *)t->sock;
					
						//INFO( "Testing ssl structures: SSL: %p CTX: %p Sock: %p\n", s->s_Ssl, s->s_Ctx, s );
					
						//DEBUG( "Running function on worker %d\n", wrk->w_Nr );
						wrk->w_Function( wrk->w_Data );
						if( pthread_mutex_lock( &(wrk->w_Mut) ) == 0 )
						{
							wrk->w_Data = NULL;
							wrk->w_Function = NULL;
							pthread_mutex_unlock( &(wrk->w_Mut) );
						}
						//DEBUG( "Function done %d.\n", wrk->w_Nr );
					//}
				
					//INFO( "Now closing socket and freeing memory\n" );
					
					
					DEBUG( "[WorkerThread] Closed socket normally.\n" );
				}
				else
				{
					FERROR("[WorkerThread] Cannot launch task via worker, function is empty!\n");
				}
			}
			
			//wrk->w_State = W_STATE_WAITING;
			DEBUG( "[WorkerThread] Unlocking mutex\n" );
			//pthread_mutex_unlock( &(wrk->w_Mut) );
			DEBUG( "[WorkerThread] Mutex unlocked.\n" );
		}
		// Let others come to..
		usleep( 100 );
	}
	
	wrk->w_Function = NULL;
	wrk->w_Data = NULL;
	wrk->w_State = W_STATE_TO_REMOVE;
	DEBUG( "We (%d) left the building\n", wrk->w_Nr );
}

//
// worker launcher
//

int WorkerRun( Worker *wrk )
{
	if( wrk == NULL )
	{
		FERROR("[WorkerRun] Cannot run worker, worker is NULL\n");
		return 1;
	}
	
	clock_t start, end;

	start = clock();
	
	//DEBUG("[WorkerRun] STARTING thread %p\n", wrk);
	wrk->w_Thread = ThreadNew( WorkerThread, wrk );
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

//
// Start worker
//

int WorkerRunCommand( Worker *w, void (*foo)( void *), void *d )
{
	DEBUG( "[WorkerRunCommand] Trying to lock mutex to run command\n" );
	//
	{
		if( w != NULL )
		{
			if( w->w_Thread != NULL )
			{
				if( pthread_mutex_lock( &(w->w_Mut) ) == 0 )
				{
					w->w_Function = foo;
					w->w_Data = d;
					pthread_mutex_unlock( &(w->w_Mut) );
					DEBUG( "[WorkerRunCommand] Sending the signal with cond (worker %d)!\n", w->w_Nr );
				//}
				pthread_cond_signal( &(w->w_Cond) );
				DEBUG("[WorkerRunCommand] Signal sent\n");
				}
				//
			}
			else
			{
				//pthread_mutex_unlock( &(w->w_Mut) );
				FERROR("[WorkerRunCommand] Thread not initalized\n");
				return 1;
			}
		}
		//
	}
	DEBUG( "[WorkerRunCommand] Successfully ran command\n" );
	return 0;
}
*/
				

void WorkerThread( void *w );

//
// worker launcher
//

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
	
	//DEBUG("[WorkerRun] STARTING thread %p\n", wrk);
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

//
// Thread
//

void WorkerThread( void *w )
{
	FThread *thread = (FThread *)w;
	Worker *wrk = (Worker *)thread->t_Data;
	wrk->w_State = W_STATE_RUNNING;

	// Run until quit
	while( TRUE )
	{
		//pthread_mutex_lock( &(wrk->w_Mut) );
		if( wrk->w_Quit == TRUE )
		{
			//DEBUG("[WorkerThread] Worker %d is quitting\n", wrk->w_Nr );
			//pthread_mutex_unlock( &(wrk->w_Mut) );
			break;
		}
		//pthread_mutex_unlock( &(wrk->w_Mut) );
			
		//pthread_mutex_lock( &(wrk->w_Mut) );
		//DEBUG("[WorkerThread] Condition reached\n");
		if( pthread_mutex_lock( &(wrk->w_Mut) ) == 0 )
		{
			wrk->w_State = W_STATE_WAITING;
			
			//DEBUG("[WorkerThread] Worker %d is waiting\n", wrk->w_Nr );
			pthread_cond_wait( &(wrk->w_Cond), &(wrk->w_Mut) );
			//DEBUG("[WorkerThread] Worker %d is GOT MESSAGE\n", wrk->w_Nr );
			wrk->w_State = W_STATE_COMMAND_CALLED;
			pthread_mutex_unlock( &(wrk->w_Mut) );
			
			if( wrk->w_Function != NULL && wrk->w_Data != NULL )
			{
				DEBUG( "Running function on worker %d\n", wrk->w_Nr );
				wrk->w_Function( wrk->w_Data );

				if( pthread_mutex_lock( &(wrk->w_Mut) ) == 0 )
				{
					wrk->w_Data = NULL;
					wrk->w_Function = NULL;
					
					pthread_mutex_unlock( &(wrk->w_Mut) );				
				}
			}
			else
			{
				FERROR("Function is not set\n");
			}
		}
		else
		{
			FERROR("[WorkerThread] Cannot lock!\n");
		}
			
		//DEBUG("[WorkerThread] Worker %d has waited\n", wrk->w_Nr );
			
		if( wrk->w_Quit == TRUE ) 
		{
			DEBUG( "[WorkerThread] We got QUIT signal.\n" );
			break;
		}

		// Let others come to..
		usleep( 100 );
	}
	
	wrk->w_Function = NULL;
	wrk->w_Data = NULL;
	wrk->w_State = W_STATE_TO_REMOVE;
	thread->t_Launched = FALSE;
	DEBUG( "Worker thread quit: %d\n", wrk->w_Nr );
}

