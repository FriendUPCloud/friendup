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

#include "worker_manager.h"

//
// Create worker manager
//

WorkerManager *WorkerManagerNew( int number )
{
	WorkerManager *wm = NULL;
	
	DEBUG( "[WorkerManager] Starting worker manager!\n" );
	
	// Fallback to default...
	if( number < 1 )
		number = WORKERS;
	
	if( ( wm = FCalloc( 1, sizeof( WorkerManager ) ) ) != NULL )
	{
		int i = 0;
		
		wm->wm_LastWorker = 0;
		wm->wm_MaxWorkers = number;
		
		if( ( wm->wm_Workers = FCalloc( wm->wm_MaxWorkers, sizeof(Worker *) ) ) != NULL )
		{
			for( ; i < wm->wm_MaxWorkers; i++ )
			{
				wm->wm_Workers[ i ] = WorkerNew( i ); 
				WorkerRun( wm->wm_Workers[ i ]  ); 
				//DEBUG( "[WorkerManager] Worker Started (#%d)\n", i );
			}
		}
		else
		{
 			ERROR( "[WorkerManager] Cannot allocate memory for workers\n" );
			FFree( wm );
			return NULL;
		}
	}
	else
	{
		ERROR( "[WorkerManager] Cannot allocate memory for WorkerManager\n" );
		return NULL;
	}
	
	INFO("Worker manager started %d threads\n", wm->wm_MaxWorkers );
	
	return wm;
}

//
// Delete worker manager
//

void WorkerManagerDelete( WorkerManager *wm )
{
	if( wm != NULL )
	{
		int i = 0;
		
		if( wm->wm_Workers )
		{
			for( ; i < wm->wm_MaxWorkers ; i++ )
			{
				DEBUG( "Trying to delete worker %d\n", i );
				WorkerDelete( wm->wm_Workers[ i ] );
				DEBUG( "Finished deleting worker %d\n", i );
			}
			FFree( wm->wm_Workers );
		}
		FFree( wm );
	}
}

//
// add worker to list
//

void usleep( int );

int WorkerManagerRun( WorkerManager *wm,  void (*foo)( void *), void *d )
{
	int i = 0;
	int max = 0;
	
	if( wm == NULL )
	{
		ERROR("Work manager is NULL!\n");
	}
	
	while( TRUE )
	{
		Worker *wrk = NULL;
		
		DEBUG("[WorkManagerRun] WORKER %d\n", wm->wm_LastWorker );
		
		max++; wm->wm_LastWorker++;
		if( wm->wm_LastWorker >= wm->wm_MaxWorkers )
		{ 
			wm->wm_LastWorker = 0; 
		}
		
		if( wm->wm_Workers[ wm->wm_LastWorker ]->w_State == W_STATE_WAITING )
		{
			wrk = wm->wm_Workers[ wm->wm_LastWorker ];
			
			// Register worker index..
			DEBUG( "[WorkManagerRun] Registering thread data\n" );
			struct SocketThreadData *td = ( struct SocketThreadData *)d;
			td->workerIndex = wm->wm_LastWorker;
			DEBUG( "[WorkManagerRun] Done registering.\n" );
		}
	
		if( wrk != NULL )
		{	
			DEBUG( "[WorkManagerRun] Running worker %d with function and data\n", wrk->w_Nr );
			if( wm->w_AverageWorkSeconds == 0 )
			{
				wm->w_AverageWorkSeconds = wrk->w_WorkSeconds;
			}
			else
			{
				wm->w_AverageWorkSeconds += wrk->w_WorkSeconds;
				wm->w_AverageWorkSeconds /= 2;
			}
			WorkerRunCommand( wrk, foo, d );
			break;
		}
		else
		{
			INFO("[WorkManagerRun] Worker is busy, waiting\n");
			usleep( 1000 );
		}
		
		if( max > wm->wm_MaxWorkers )
		{
			INFO("[WorkManagerRun] All workers are busy, waiting\n");
			usleep( 50000 );
		}
	}
	
	DEBUG("[WorkManagerRun] WorkerManager: AddWorker END\n");
	return 0;
}

