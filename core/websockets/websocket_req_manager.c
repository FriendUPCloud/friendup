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
 * file contain functions related to websocket request manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 16/08/2017
 */

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "websocket_req.h"
#include "websocket_req_manager.h"
#include <util/string.h>
#include <mutex/mutex_manager.h>

/**
 * Create new WebsocketReqManager structure
 *
 * @return pointer to new WebsocketReqManager when success, otherwise NULL
 */
WebsocketReqManager *WebsocketReqManagerNew( )
{
	WebsocketReqManager *wrm;
	
	DEBUG("[WebsocketReqManagerNew] start\n");
	
	if( ( wrm = FCalloc( 1, sizeof(WebsocketReqManager) ) ) != NULL )
	{
		pthread_mutex_init( &(wrm->wrm_Mutex), NULL );
	}
	
	return wrm;
}

/**
 * Delete WebsocketReqManager structure
 *
 * @param wrm to WebsocketReqManager which will be deleted
 */
void WebsocketReqManagerDelete( WebsocketReqManager *wrm )
{
	DEBUG("[WebsocketReqManagerDelete] start\n");
	if( wrm != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(wrm->wrm_Mutex) ) == 0 )
		{
			WebsocketReqDeleteAll( wrm->wrm_WRWaiting );
			WebsocketReqDeleteAll( wrm->wrm_WRQueue );
			FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
		}
		pthread_mutex_destroy( &(wrm->wrm_Mutex) );
		
		DEBUG("[WebsocketReqManagerDelete] released\n");
		
		FFree( wrm );
	}
}

/**
 * Put chunk of message to stack
 *
 * @param wrm to WebsocketReqManager
 * @param id message id
 * @param chunk chunk number
 * @param total total number of chunks
 * @param data part of message as string
 * @param datasize size of provided message
 * @return WebsocketReq new structure when success, otherwise NULL
 */
WebsocketReq *WebsocketReqManagerPutChunk( WebsocketReqManager *wrm, char *id, int chunk, int total, char *data, int datasize )
{
	if( data == NULL )
	{
		return NULL;
	}
	if( wrm != NULL )
	{
		WebsocketReq *req = NULL;
		WebsocketReq *prevreq = NULL;
		// we must find first if request with provided ID exist
		if( FRIEND_MUTEX_LOCK( &(wrm->wrm_Mutex) ) == 0 )
		{
			req = wrm->wrm_WRWaiting;
			while( req != NULL )
			{
				if( strcmp( id, req->wr_ID ) == 0 )
				{
					break;
				}
				prevreq = req;
				req = (WebsocketReq *)req->node.mln_Succ;
			}
			//FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
		}
		//DEBUG("[WebsocketReqPutData] req pointer %p chunk %d/%d , datasize %d\n", req, chunk, total, datasize );
		
		// request exist, we are adding new part to it
		if( req != NULL )
		{
			WebsocketReq *oreq = WebsocketReqAddChunk( req, chunk, data, datasize );
			DEBUG("[WebsocketReqPutData] pointer to last chunk %p\n", oreq );
			if( oreq != NULL )
			{
				if( oreq == wrm->wrm_WRWaiting )
				{
					wrm->wrm_WRWaiting = (WebsocketReq *)oreq->node.mln_Succ;
				}
				else if( prevreq != NULL )	// avoid crash if prevreq = NULL
				{
					prevreq->node.mln_Succ = oreq->node.mln_Succ;
				}

				FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );

				return oreq;
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
			}
		}
		else // request was not send to FC before, we must create it
		{
			WebsocketReq *nreq = WebsocketReqNew( id, chunk, total, data, datasize );
			
			//FRIEND_MUTEX_LOCK( &(wrm->wrm_Mutex) );
			
			// We must remove old WebsocketReqests
			time_t currTime = time( NULL );
			
			WebsocketReq *newlist = NULL;
			WebsocketReq *newlast = NULL;
			
			WebsocketReq *prev = wrm->wrm_WRWaiting;
			
			while( prev != NULL )
			{
				WebsocketReq *next = (WebsocketReq *) prev->node.mln_Succ;
				
				// 300 = 5 minutes
				if( (currTime - prev->wr_CreatedTime) > 300 )
				{
					WebsocketReqDelete( prev );
				}
				else
				{
					if( newlist == NULL )
					{
						newlist = prev;
						newlast = newlist;
					}
					else
					{
						newlast->node.mln_Succ = (MinNode *)prev;
						newlast = prev;
					}
				}
				prev = next;
			}
			
			wrm->wrm_WRWaiting = newlist;
			
			nreq->node.mln_Succ = (MinNode *)wrm->wrm_WRWaiting;
			wrm->wrm_WRWaiting = nreq;
			FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
		}
	}
	return NULL;
}

/**
 * Put message to stack
 *
 * @param wrm to WebsocketReqManager
 * @param data part of message as string
 * @param datasize size of provided message
 * @return WebsocketReq new structure when success, otherwise NULL
 */
WebsocketReq *WebsocketReqManagerPutRawData( WebsocketReqManager *wrm, char *data, int datasize )
{
	if( wrm != NULL )
	{
		WebsocketReq *oreq = WebsocketReqRawNew( data, datasize );
		DEBUG("[WebsocketReqPutRawData] pointer to last chunk %p\n", oreq );
		if( oreq != NULL )
		{
			FRIEND_MUTEX_LOCK( &(wrm->wrm_Mutex) );
			
			// add to queue, to last place
			if( wrm->wrm_WRLastInQueue != NULL )
			{
				wrm->wrm_WRLastInQueue->node.mln_Succ = (MinNode *)oreq;
			}
			else
			{
				wrm->wrm_WRQueue = oreq;
			}
			wrm->wrm_WRLastInQueue = oreq;
			
			FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
		}
		return oreq;
	}
	return NULL;
}

/**
 * Get message from queue
 *
 * @param wrm to WebsocketReqManager
 */
WebsocketReq *WebsocketReqManagerGetFromQueue( WebsocketReqManager *wrm )
{
	WebsocketReq *req = NULL;
	if( wrm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(wrm->wrm_Mutex) );
		
		req = wrm->wrm_WRQueue;
		if( req != NULL )
		{
			if( req->node.mln_Succ == NULL )
			{
				wrm->wrm_WRQueue = NULL;
				wrm->wrm_WRLastInQueue = NULL;
			}
			else
			{
				wrm->wrm_WRQueue = (WebsocketReq *)req->node.mln_Succ;
			}
		}
		
		FRIEND_MUTEX_UNLOCK( &(wrm->wrm_Mutex) );
	}
	return req;
}
