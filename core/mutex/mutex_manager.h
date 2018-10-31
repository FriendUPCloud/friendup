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
 * file contain definitions for MutexManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 05/06/2018
 */

#ifndef __MUTEX_MUTEX_MANAGER_H__
#define __MUTEX_MUTEX_MANAGER_H__

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#include <core/nodes.h>

//
//
//

typedef struct MutexEntry
{
	MinNode				node;
	void				*me_MutPointer;
	char				me_MutPlace[ 256 ];		//should be enough to hold filename + code line
}MutexEntry;

//
//
//

typedef struct MutexManager
{
	void			*mm_SB;
	MutexEntry		*mm_MutexList;
}MutexManager;

//
//
//

MutexManager *MutexManagerNew( void *sb );

//
//
//

void MutexManagerDelete( MutexManager *km );

//
//
//

int PthreadTimedLock( pthread_mutex_t *mut, char *file, int line );

//#define LOCK_TIMER

//
//
//

inline int MutexManagerAcquire( MutexManager *mm __attribute__((unused)), void *mutPointer, char *inCode __attribute__((unused)) )
{
#ifdef LOCK_TIMER
	struct timespec MUTEX_TIMEOUT;
    clock_gettime( CLOCK_REALTIME, &MUTEX_TIMEOUT );
    MUTEX_TIMEOUT.tv_sec += 15;
	
	int rc = pthread_mutex_timedlock( mutPointer, &MUTEX_TIMEOUT );
	
	// if (rc != EBUSY) {
#else
	return pthread_mutex_lock( mutPointer );
#endif
}

inline void MutexManagerRelease( MutexManager *mm __attribute__((unused)), void *mutPointer __attribute__((unused)) )
{

}

/*
#ifndef FRIEND_MUTEX_LOCK
#define FRIEND_MUTEX_LOCK( lck ) \
	({ \
	struct timespec MUTEX_TIMEOUT; clock_gettime( CLOCK_REALTIME, &MUTEX_TIMEOUT ); MUTEX_TIMEOUT.tv_sec += 15; \
	int rc = pthread_mutex_timedlock_np( mutPointer, &MUTEX_TIMEOUT ); \
	if (rc != EBUSY) { LOG( FLOG_ERRROR, "Cannot lock mutex" ); } rc; })
#endif
*/

#ifndef FRIEND_MUTEX_LOCK
#define FRIEND_MUTEX_LOCK( mutPointer ) \
	pthread_mutex_lock( mutPointer )
#endif

/*
#ifndef FRIEND_MUTEX_LOCK
#define FRIEND_MUTEX_LOCK( mutPointer ) \
	PthreadTimedLock( mutPointer, __FILE__, __LINE__ )
#endif
*/
//if (rc != EBUSY) { LOG( FLOG_ERRROR, "Cannot lock mutex" ); } rc; })

#ifndef FRIEND_MUTEX_UNLOCK
#define FRIEND_MUTEX_UNLOCK( mutPointer ) \
pthread_mutex_unlock( mutPointer )
#endif

#endif //__MUTEX_MUTEX_MANAGER_H__

