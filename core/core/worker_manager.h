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
 * Worker-Manager definitions
 *
 * @author TW (Thomas Wollburg)
 * @author HT (Hogne Tildstad)
 * @author PS (Pawel Stefansky)
 * @date first push by PS (10/02/2015)
 * @sa worker.c worker.h
 * 
 * \ingroup FriendCoreWorker
 * @{
 */

#ifndef __CORE_WORKER_MANAGER_H__
#define __CORE_WORKER_MANAGER_H__

#include "worker.h"
#include "network/socket.h"

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

int WorkerManagerRun( WorkerManager *wm,  void (*foo)( void *), void *d, void *wrkinfo );

//
//
//

void WorkerManagerDebug( void *sb );


#endif // __CORE_WORKER_MANAGER_H__

/**@}*/
