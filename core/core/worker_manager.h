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
	pthread_mutex_t						wm_Mutex;
	
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

int WorkerManagerRun( WorkerManager *wm,  void (*foo)( void *), void *d, void *wrkinfo, char *path );

//
//
//

void WorkerManagerDebug( void *sb );


#endif // __CORE_WORKER_MANAGER_H__

/**@}*/
