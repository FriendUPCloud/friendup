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
 * Threading management definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/2015
 * 
 * \ingroup FriendCoreThreads
 * @{
 */

#ifndef __CORE_THREAD_H__
#define __CORE_THREAD_H__

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>

//#ifdef __LINUX__
#include <pthread.h>
//#include <uuid/uuid.h>
//#else

//#endif



//
// Mutex
//

typedef struct FMutex
{
	pthread_mutex_t mutex;
}FMutex;

//
// Thread
//

typedef struct FThread
{
	pthread_t			t_Thread;
	FBOOL				t_Quit;
	void				*( *t_Function)( void * );
	void				*t_Data;
	FBOOL				t_Launched;
	uint64_t			t_PID;
}FThread;

//
//
//

FThread *ThreadNew( void *func, void *data, FBOOL autos, pthread_attr_t *attr );

//
//
//

void ThreadDelete( FThread *t );

//
//
//

FThread *ThreadStart( FThread *ft );

//
//
//

void ThreadCancel( FThread *ft, FBOOL wait );

#endif // __CORE_THREAD_H__

/**@}*/
