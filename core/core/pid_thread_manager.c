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
 *  PIDThreadManager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include <network/http.h>
#include "pid_thread_manager.h"

/**
 * Create new PIDThreadManager
 *
 * @param sb pointer to SystemBase
 * @return pointer to new PIDThreadManager
 */
PIDThreadManager *PIDThreadManagerNew( void *sb )
{
	DEBUG("PIDThreadManagerNew, pointer to SB %p\n", sb );
	PIDThreadManager *ptm;
	
	if( ( ptm = FCalloc( 1, sizeof( PIDThreadManager ) ) ) != NULL )
	{
		ptm->ptm_SB = sb;
		
		pthread_mutex_init( &ptm->ptm_Mutex, NULL );
	}
	return ptm;
}

/**
 * Delete PIDThreadManager
 *
 * @param ptm pointer to PIDThreadManager
 */
void PIDThreadManagerDelete( PIDThreadManager *ptm )
{
	DEBUG("PIDThreadManagerDelete\n");
	if( ptm != NULL )
	{
		PIDThread *thr = ptm->ptm_Threads;
		PIDThread *thrdel;
		
		pthread_mutex_lock( &ptm->ptm_Mutex );
		
		while( thr != NULL )
		{
			thrdel = thr;
			thr = (PIDThread *)thr->node.mln_Succ;
			
			PIDThreadDelete( thrdel );
		}
		
		pthread_mutex_unlock( &ptm->ptm_Mutex );
		
		pthread_mutex_destroy( &ptm->ptm_Mutex );
		
		FFree( ptm );
	}
}

/**
 * Remove old PIDThreads
 *
 * @param ptm pointer to PIDThreadManager
 * @return 0 when success, otherwise error number
 */
int PIDThreadManagerRemoveThreads( PIDThreadManager *ptm )
{
	//pthread_detach( pthread_self() );

	PIDThread *thr = ptm->ptm_Threads;
	PIDThread *thrdel;
	
	DEBUG("PIDThreadManagerRemoteThreads\n");
	
	pthread_mutex_lock( &ptm->ptm_Mutex );
	
	while( thr != NULL )
	{
		thrdel = thr;
		thr = (PIDThread *)thr->node.mln_Succ;
		
		if( thrdel->pt_Status == PID_THREAD_STOPPED )
		{
			PIDThread *prev = (PIDThread *)thrdel->node.mln_Pred;
			PIDThread *next = (PIDThread *)thrdel->node.mln_Succ;
			if( prev == NULL )
			{
				ptm->ptm_Threads = next;
			}
			if( next != NULL )
			{
				next->node.mln_Pred = (MinNode *)prev;
			}
			
			DEBUG("PIDThread remove\n");
			
			PIDThreadDelete( thrdel );
		}
	}
	
	pthread_mutex_unlock( &ptm->ptm_Mutex );
	
	DEBUG("PIDThreadManagerRemoteThreads end\n");
	
	return 0;
}

//
// PIDThread
//

void PIDThreadThread( FThread *t )
{
	DEBUG("PIDThreadThread\n");
	PIDThread *pidt = (PIDThread *)t->t_Data;
	if( pidt != NULL )
	{
		int result = 0;
	
		pidt->pt_Status = PID_THREAD_STARTED;
		
		FERROR("Run thread pointers sb %p urlpath %p request %p, usersession %p\n", pidt->pt_SB, pidt->pt_Url, pidt->pt_Request, pidt->pt_UserSession );
	
		//Http *FSMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
		Http *resp = pidt->pt_Function( pidt->pt_SB, pidt->pt_Url, pidt->pt_Request, pidt->pt_UserSession, &result );
		if( resp != NULL )
		{
			HttpFree( resp );
		}
	
		HttpFreeRequest( pidt->pt_Request );
	
		pidt->pt_Status = PID_THREAD_STOPPED;
	
		//PIDThreadDelete( pidt );
	}
	DEBUG("PIDThreadThreadEND\n");
	t->t_Launched = FALSE;
	
	pthread_exit( 0 );
}

/**
 * Create and run PID Thread
 *
 * @param ptm pointer to PIDThreadManager
 * @param func pointer to function which will be called
 * @param request http request
 * @param url pointer to parsed path
 * @param us pointer to UserSession
 * @return 0 if fail, otherwise TID number
 */
FUQUAD PIDThreadManagerRunThread( PIDThreadManager *ptm, Http *request, char **url, void *us, void *func )
{
	DEBUG("PIDThreadManagerRunThread\n");
	PIDThread *pidt = PIDThreadNew( ptm->ptm_SB );
	if( pidt != NULL )
	{
		int i;
		
		pidt->pt_Function = func;
		pidt->pt_Request = request;
		pidt->pt_UserSession = us;
		pidt->pt_Status = PID_THREAD_NEW;
		pidt->pt_PTM = ptm;
		
		DEBUG("PrunThread ptr sb %p uurl %p func ptr %p reqptr %p usersession %p\n", pidt->pt_SB, pidt->pt_Url, pidt->pt_Function, pidt->pt_Request , pidt->pt_UserSession );
		
		request->h_RequestSource = HTTP_SOURCE_HTTP_TO_WS;
		request->h_PIDThread = pidt;
		
		for( i=0 ; i < PID_URL_MAX_DEPTH ; i++ )
		{
			if( url[ i ] != NULL )
			{
				DEBUG("URL : %s\n", url[ i ] );
				pidt->pt_Url[ i ] = StringDuplicate( url[ i ] );
				pidt->pt_UrlDepth++;
			}
			else
			{
				break;
			}
		}
		
		pidt->pt_Thread = ThreadNew( PIDThreadThread, pidt, TRUE, NULL );
		
		if( pidt->pt_Thread != NULL )
		{
			pthread_mutex_lock( &ptm->ptm_Mutex );
			
			if( ptm->ptm_Threads != NULL )
			{
				ptm->ptm_Threads->node.mln_Pred = (MinNode *)pidt;
				pidt->node.mln_Succ = (MinNode *)ptm->ptm_Threads;
				
				ptm->ptm_Threads = pidt;
			}
			else
			{
				ptm->ptm_Threads = pidt;
			}
			
			pthread_mutex_unlock( &ptm->ptm_Mutex );
		}
		
		DEBUG("Thread launched\n");
		return pidt->pt_PID;
	}
	else
	{
		FERROR("Cannot allocate memory for PIDThread\n");
		return 0;
	}
	
	return 0;
}

/**
 * List all PIDThreads
 *
 * @param ptm pointer to PIDThreadManager
 * @return pointer to BufString with results
 */

BufString *PIDThreadManagerGetThreadList( PIDThreadManager *ptm )
{
	PIDThread *thr = ptm->ptm_Threads;
	BufString *bs = BufStringNew();
	
	DEBUG("PIDThreadManagerGetThreadList\n");
	
	BufStringAdd( bs, "{\"result\":[" );
	
	pthread_mutex_lock( &ptm->ptm_Mutex );
	int pos = 0;
	
	while( thr != NULL )
	{
		char temp[ 1024 ];
		int size = 0;
		
		if( pos == 0 )
		{
			size = snprintf( temp, sizeof( temp ), "\"pid\":\"%llu\",\"status\":\"%d\"", thr->pt_PID, thr->pt_Status );
		}
		else
		{
			size = snprintf( temp, sizeof( temp ), ",\"pid\":\"%llu\",\"status\":\"%d\"", thr->pt_PID, thr->pt_Status );
		}
		
		thr = (PIDThread *)thr->node.mln_Succ;
		pos++;
	}
	
	pthread_mutex_unlock( &ptm->ptm_Mutex );
	
	BufStringAddSize( bs, "]", 1 );
	
	DEBUG("PIDThreadManagerGetThreadList end\n");
	
	return bs;
}

/**
 * KILL PIDThread
 *
 * @param ptm pointer to PIDThreadManager
 * @param pid PID id which will be killed
 * @return 0 if success otherwise error number
 */

int PIDThreadManagerKillPID( PIDThreadManager *ptm, FUQUAD pid )
{
	PIDThread *thr = ptm->ptm_Threads;
	PIDThread *thrdel;
	
	DEBUG("PIDThreadManagerKillPID\n");
	
	pthread_mutex_lock( &ptm->ptm_Mutex );
	
	while( thr != NULL )
	{
		thrdel = thr;
		thr = (PIDThread *)thr->node.mln_Succ;
		
		if( thrdel->pt_PID == pid )
		{
			PIDThread *prev = (PIDThread *)thrdel->node.mln_Pred;
			PIDThread *next = (PIDThread *)thrdel->node.mln_Succ;
			if( prev == NULL )
			{
				ptm->ptm_Threads = next;
			}
			if( next != NULL )
			{
				next->node.mln_Pred = (MinNode *)prev;
			}
			
			DEBUG("PIDThread kill\n");
			
			PIDThreadDelete( thrdel );
			
			pthread_mutex_unlock( &ptm->ptm_Mutex );
			return 0;
		}
	}
	
	pthread_mutex_unlock( &ptm->ptm_Mutex );
	
	DEBUG("PIDThreadManagerKillPID end\n");
	return 1;
}
