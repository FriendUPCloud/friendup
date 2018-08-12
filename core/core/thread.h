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
