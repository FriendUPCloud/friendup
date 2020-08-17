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
 * Threading managemen t
 *
 * file contain all functitons related to threads
 *
 * @author PS (Pawel Stefanski)
 * @date created 02/2015
 * 
 * \defgroup FriendCoreThreadsLinux Linux
 * \ingroup FriendCoreThreads
 * @{
 */

#include <core/thread.h>
#include <util/log/log.h>
#include <pthread.h>

/**
 * Create new thread
 *
 * @param func pointer to function which will be called
 * @param data pointer to data which will be passed to function as parameter
 * @param autos TRUE if function must be launched immidiatly
 * @param attr pointer to thread attributes (pthread_attr_t)
 * @return pointer to new FThread structure when success, otherwise NULL
 */
FThread *ThreadNew( void *func, void *data, FBOOL autos, pthread_attr_t *attr )
{
	if( !func || !data ) return NULL;
	
	FThread *nt = (FThread *)FCalloc( 1, sizeof( FThread ) );
	if( nt == NULL )
	{
		FERROR("[ThreadNew] Cannot allocate memory for Thread\n");
		return NULL;
	}
	int error = 0;

	nt->t_Function = func;
	nt->t_Data = data;
	nt->t_Launched = FALSE;
	
	//uuid_generate( nt->t_uuid );
	nt->t_PID = (FUQUAD)nt;
	
	if( autos == TRUE )
	{
		nt->t_Quit = FALSE;
		
		if( ( error = pthread_create( &(nt->t_Thread), attr, func, nt ) ) == 0 )
		{
			nt->t_Launched = TRUE;
			// WE ALWAYS PASS POINTER TO THREAD AND ALLOW DEVELOPER TO HANDLE  quit
			//DEBUG("[ThreadNew] STARTED\n" );
		}
		else
		{
			FFree( nt );
			FERROR("[ThreadNew] error: %d\n", error );
			return NULL;
		}
	}
	else
	{
		Log( FLOG_INFO, "Thread start delayed\n");
	}

	return nt;
}

/**
 * Start thread
 *
 * @param ft pointer to FThread structure
 * @return pointer to FThread structure when success, otherwise NULL
 */
FThread *ThreadStart( FThread *ft )
{
	if( ft != NULL && ft->t_Launched == FALSE )
	{
		int error;
		
		ft->t_Quit = FALSE;
		
		if( ( error = pthread_create( &(ft->t_Thread), NULL, ft->t_Function, ft->t_Data ) ) == 0 )
		{
			ft->t_Launched = TRUE;
		}
		else
		{
			//free( ft );
			FERROR("[ThreadNew] error: %d\n", error );
			return NULL;
		}
	}
	return ft;
}

/**
 * Stop working thread
 *
 * @param ft pointer to FThread structure (thread which will be stopped)
 * @param wait set to TRUE if you want to wait till thread will stop
 */
void ThreadCancel( FThread *ft, FBOOL wait )
{
	pthread_cancel( ft->t_Thread );
	
	//if( wait == TRUE && ft->t_Launched != FALSE )
	//{
		//pthread_join( ft->t_Thread, NULL);
	//}
}

/**
 * Stop and delete working thread
 *
 * @param t pointer to FThread structure (thread which will be stopped/deleted)
 */
void ThreadDelete( FThread *t )
{
	if( t->t_Thread )
	{
		t->t_Quit = TRUE;
		
		//if( t->t_Launched == TRUE )
		//{
			//pthread_join( t->t_Thread, NULL );
		//}
		
		DEBUG("[ThreadDelete] Thread finished work (%p)..\n", t );
		
		FFree( t );
	}
}

/**@}*/
