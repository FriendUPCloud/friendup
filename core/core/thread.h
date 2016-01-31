/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __CORE_THREAD_H__
#define __CORE_THREAD_H__

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>

//#ifdef __LINUX__
#include <pthread.h>
//#else

//#endif



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

//#ifdef __LINUX__
	pthread_t	t_Thread;
//#endif
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


