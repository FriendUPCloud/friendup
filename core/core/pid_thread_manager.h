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
 *  Filesystem manager    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#ifndef __CORE_PID_THREAD_MANAGER_H__
#define __CORE_PID_THREAD_MANAGER_H__

/**
 * \defgroup FriendCoreThreads Friend Core Threads Management
 * \ingroup FriendCore
 * @{
 */

#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include "pid_thread.h"
#include <network/http.h>

//
//
//

typedef  struct PIDThreadManager
{
	void                          *ptm_SB;
	PIDThread                *ptm_Threads;
	pthread_mutex_t      ptm_Mutex;
}PIDThreadManager;

//
//
//

PIDThread *PIDThreadNew( void *sb );

//
//
//

void PIDThreadDelete( PIDThread *t );

//
//
//

PIDThreadManager *PIDThreadManagerNew( void *sb );

//
//
//

void PIDThreadManagerDelete( PIDThreadManager *ptm );

//
//
//

int PIDThreadManagerRemoveThreads( PIDThreadManager *ptm );

//
//
//

FUQUAD PIDThreadManagerRunThread( PIDThreadManager *ptm, Http *request, char **url, void *us, void *func );

//
//
//

BufString *PIDThreadManagerGetThreadList( PIDThreadManager *ptm );

//
//
//

int PIDThreadManagerKillPID( PIDThreadManager *ptm, FUQUAD pid );

#endif // __CORE_PID_THREAD_MANAGER_H__
