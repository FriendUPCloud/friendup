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
 *  PIDThreadManager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 * 
 * \defgroup FriendCoreThreads Threads Management
 * \ingroup FriendCore
 * @{
 */


#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include <network/http.h>
#include "pid_thread_manager.h"
#include <mutex/mutex_manager.h>

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
	DEBUG("[PIDThreadManager] Delete\n");
	if( ptm != NULL )
	{
		PIDThread *thr = ptm->ptm_Threads;
		PIDThread *thrdel;
		
		FRIEND_MUTEX_LOCK( &ptm->ptm_Mutex );
		
		while( thr != NULL )
		{
			thrdel = thr;
			thr = (PIDThread *)thr->node.mln_Succ;
			
			PIDThreadDelete( thrdel );
		}
		
		FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
		
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
	
	DEBUG("[PIDThreadManager] RemoteThreads\n");
	
	FRIEND_MUTEX_LOCK( &ptm->ptm_Mutex );
	
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

			PIDThreadDelete( thrdel );
		}
	}
	
	FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
	
	DEBUG("[PIDThreadManager] RemoteThreads end\n");
	
	return 0;
}

//
// PIDThread
//

void PIDThreadThread( FThread *t )
{
	DEBUG("[PIDThreadManager] thread start\n");
	PIDThread *pidt = (PIDThread *)t->t_Data;
	if( pidt != NULL )
	{
		int result = 0;
	
		pidt->pt_Status = PID_THREAD_STARTED;
		
		FERROR("[PIDThreadManager] Run thread pointers sb %p urlpath %p request %p, usersession %p\n", pidt->pt_SB, pidt->pt_Url, pidt->pt_Request, pidt->pt_UserSession );

		Http *resp = pidt->pt_Function( pidt->pt_SB, pidt->pt_Url, pidt->pt_Request, pidt->pt_UserSession, &result );
		if( resp != NULL )
		{
			HttpFree( resp );
		}
	
		HttpFreeRequest( pidt->pt_Request );
	
		pidt->pt_Status = PID_THREAD_STOPPED;
	
		//PIDThreadDelete( pidt );
	}
	DEBUG("[PIDThreadManager] thread end\n");
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
	DEBUG("[PIDThreadManager] RunThread\n");
	PIDThread *pidt = PIDThreadNew( ptm->ptm_SB );
	if( pidt != NULL )
	{
		int i;
		
		pidt->pt_Function = func;
		pidt->pt_Request = request;
		pidt->pt_UserSession = us;
		pidt->pt_Status = PID_THREAD_NEW;
		pidt->pt_PTM = ptm;
		
		DEBUG("[PIDThreadManager] runThread ptr sb %p uurl %p func ptr %p reqptr %p usersession %p\n", pidt->pt_SB, pidt->pt_Url, pidt->pt_Function, pidt->pt_Request , pidt->pt_UserSession );
		
		request->http_RequestSource = HTTP_SOURCE_HTTP_TO_WS;
		request->http_PIDThread = pidt;
		
		for( i=0 ; i < PID_URL_MAX_DEPTH ; i++ )
		{
			if( url[ i ] != NULL )
			{
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
			FRIEND_MUTEX_LOCK( &ptm->ptm_Mutex );
			
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
			
			FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
		}
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
	
	DEBUG("[PIDThreadManager] GetThreadList\n");
	
	BufStringAdd( bs, "{\"result\":[" );
	
	FRIEND_MUTEX_LOCK( &ptm->ptm_Mutex );
	int pos = 0;
	
	while( thr != NULL )
	{
		char temp[ 1024 ];
		int size = 0;
		
		if( pos == 0 )
		{
			size = snprintf( temp, sizeof( temp ), "\"pid\":\"%lu\",\"status\":\"%d\"", thr->pt_PID, thr->pt_Status );
		}
		else
		{
			size = snprintf( temp, sizeof( temp ), ",\"pid\":\"%lu\",\"status\":\"%d\"", thr->pt_PID, thr->pt_Status );
		}
		
		thr = (PIDThread *)thr->node.mln_Succ;
		pos++;
	}
	
	FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
	
	BufStringAddSize( bs, "]", 1 );
	
	DEBUG("[PIDThreadManager] GetThreadList end\n");
	
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
	
	DEBUG("[PIDThreadManager] KillPID\n");
	
	FRIEND_MUTEX_LOCK( &ptm->ptm_Mutex );
	
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
			
			DEBUG("[PIDThreadManager] kill\n");
			
			PIDThreadDelete( thrdel );
			
			FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
			return 0;
		}
	}
	
	FRIEND_MUTEX_UNLOCK( &ptm->ptm_Mutex );
	
	DEBUG("[PIDThreadManager] KillPID end\n");
	return 1;
}

/**@}*/
