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
/**
 * @file
 *
 * Friend Workers definitions
 *
 * @author TW (Thomas Wollburg)
 * @author PS (Pawel Stefansky)
 * @author HT (Hogne Tildstad)
 * @date first push by PS (31/05/2015)
 */

#ifndef __CORE_WORKER_H__
#define __CORE_WORKER_H__

#include "thread.h"
#include "network/socket.h"
#include <core/nodes.h>
#include <time.h>

/**
 * Worker state enumeration
 */
enum {
	W_STATE_CREATED   = 1,				///< created yet not initialized
	W_STATE_RUNNING   = 2,				///< running
	W_STATE_WAITING   = 3,				///< waiting for message or mutex
	W_STATE_TO_REMOVE = 4,				///< has received interrupt message
	W_STATE_COMMAND_CALLED				///< waiting for response from message handler
};

/**
 * Worker structure
 */
typedef struct Worker
{
	MinNode                 node;                               ///< "pointer" to next Worker
	void                    (*w_Function)( void *data );        ///< function which will be called in thread
	int                     w_State;                            ///< state of worker
	void                    *w_Data;                            ///< pointer to data used in worker
	FBOOL                    w_Quit;                             ///< if worker should quit
	int                     w_Nr;                               ///< number of worker
	FThread                 *w_Thread;                          ///< worker thread
	pthread_cond_t          w_Cond;                             ///< condition
	pthread_mutex_t         w_Mut;                              ///< mutex
	
	double 					w_WorkMicros;						///< frequency microseconds
	float					w_WorkSeconds;						///< frequency seconds
	void					*w_Request;						// pointer to http request (used to debug)
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
