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
 * Friend Workers definitions
 *
 * @author TW (Thomas Wollburg)
 * @author PS (Pawel Stefansky)
 * @author HT (Hogne Tildstad)
 * @date first push by PS (31/05/2015)
 * 
 * \ingroup FriendCoreWorker
 * @{
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
	W_STATE_LOCKED    = 2,				///
	W_STATE_RUNNING   = 3,				///< running
	W_STATE_WAITING   = 4,				///< waiting for message or mutex
	W_STATE_TO_REMOVE = 5,				///< has received interrupt message
	W_STATE_COMMAND_CALLED				///< waiting for response from message handler
};

#define WORKER_FUNCTION_STRING_SIZE 64
#define WORKER_FUNCTION_STRING_SIZE_MIN1 WORKER_FUNCTION_STRING_SIZE-1

/**
 * Worker structure
 */
typedef struct Worker
{
	MinNode						node;                               ///< "pointer" to next Worker
	void						(*w_Function)( void *data );        ///< function which will be called in thread
	int							w_State;                            ///< state of worker
	void						*w_Data;                            ///< pointer to data used in worker
	FBOOL						w_Quit;                             ///< if worker should quit
	int							w_Nr;                               ///< number of worker
	FThread						*w_Thread;                          ///< worker thread
	pthread_cond_t				w_Cond;                             ///< condition
	pthread_mutex_t				w_Mut;                              ///< mutex
	uint64_t					w_ThreadPTR;						///< thread pointer
	
	double 						w_WorkMicros;						///< frequency microseconds
	float						w_WorkSeconds;						///< frequency seconds
	void						*w_Request;							// pointer to http request (used to debug)
	char						w_FunctionString[ WORKER_FUNCTION_STRING_SIZE ];				// name of function
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

//extern static inline int WorkerRunCommand( Worker *wrk, void (*foo)( void *), void *d );

#endif // __CORE_THREAD_H__

/**@}*/
