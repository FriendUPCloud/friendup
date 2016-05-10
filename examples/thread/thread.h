
/*

	Threads

*/

#ifndef __CORE_THREAD_H__
#define __CORE_THREAD_H__

#include <stdio.h>
#include <stdlib.h>

#include <pthread.h>
#include "types.h"

//
// Mutex
//

typedef struct FMutex
{
#ifdef __LINUX__
	pthread_mutex_t mutex;
#endif
}FMutex;

//
// Thread
//

typedef struct FThread
{

	pthread_t	t_Thread;
	BOOL 		t_Quit;
	void 		( *t_Function)( void * );
	void 		*t_Data;
}FThread;

//
//
//

FThread *ThreadNew( void *func, void *data );

//
//
//

void ThreadDelete( FThread *t );

#endif // __CORE_THREAD_H__


