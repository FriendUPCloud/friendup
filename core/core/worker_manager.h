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


#ifndef __CORE_WORKER_MANAGER_H__
#define __CORE_WORKER_MANAGER_H__

#include "worker.h"
#include "network/socket.h"

//#define MAX_WORKERS 	64
//#define MIN_WORKERS 5
#define MAX_WORKERS 	1
#define MIN_WORKERS 1

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
