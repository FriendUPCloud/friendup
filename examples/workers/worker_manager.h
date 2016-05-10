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

#ifndef __CORE_WORKER_MANAGER_H__
#define __CORE_WORKER_MANAGER_H__

#include "worker.h"
//#include "network/socket.h"

//#define MAX_WORKERS 	64
//#define MIN_WORKERS 5
#define MAX_WORKERS 	1
#define MIN_WORKERS 1

struct SocketThreadData {
	struct epoll_event *ce;
	//Socket                *sock;

	pthread_t             thread;
	BOOL	                  doFree;
	int                   workerIndex;
};

typedef struct WorkerManager
{
	
	Worker							**wm_Workers;			// array of  workers
	int 								wm_MaxWorkers;
	int 								wm_LastWorker;
	
	float								w_AverageWorkSeconds;
} WorkerManager;

//
// Create worker manager
//

WorkerManager *WorkerManagerNew( int nr );

//
// Delete worker manager
//

void WorkerManagerDelete( WorkerManager *wm );

//
// add worker to list
//

int WorkerManagerRun( WorkerManager *wm,  void (*foo)( void *), void *d );


#endif // __CORE_WORKER_MANAGER_H__
