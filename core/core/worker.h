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

#ifndef __CORE_WORKER_H__
#define __CORE_WORKER_H__

#include "thread.h"
#include "network/socket.h"
#include <core/nodes.h>
#include <time.h>

enum {
	W_STATE_CREATED   = 1,
	W_STATE_RUNNING   = 2,
	W_STATE_WAITING   = 3,
	W_STATE_TO_REMOVE = 3
};

typedef struct Worker
{
	MinNode                 node;                               // "pointer" to next Worker
	void                    (*w_Function)( void *data );        // function which will be called in thread
	int                     w_State;                            // state of worker
	void                    *w_Data;                            // pointer to data used in worker
	BOOL                    w_Quit;                             // if worker should quit
	int                     w_Nr;                               // number of worker
	FThread                 *w_Thread;                          // worker thread
	pthread_cond_t          w_Cond;                             // condition
	pthread_mutex_t         w_Mut;                              // mutex
	
	double 							w_WorkMicros;
	float								w_WorkSeconds;
} Worker;

//
// Create worker
//

Worker *WorkerNew( );

//
// Start worker
//

void WorkerStart( Worker *w );

//
// Remove worker
//

void WorkerDelete( Worker *w );

//
//
//

int WorkerRun( Worker *w );

//
// Run function in thread
//

int WorkerRunCommand( Worker *wrk, void (*foo)( void *), void *d );

#endif // __CORE_THREAD_H__
